-- ====================================================================
-- SCRIPT DE MIGRACIÓN: AGREGAR PENALES PARA PARTIDOS Y PRONÓSTICOS
-- ====================================================================
-- Instrucciones:
-- 1. Ve a tu panel de control de Supabase (https://supabase.com).
-- 2. Entra a tu proyecto de los Pronósticos SoftMedia.
-- 3. Ve a la sección "SQL Editor" en el menú izquierdo.
-- 4. Crea un nuevo query, pega este código completo y haz clic en "Run".
-- ====================================================================

-- 1. Agregar columnas a las tablas
ALTER TABLE public.partidos 
    ADD COLUMN IF NOT EXISTS ganador_penales VARCHAR(10) CHECK (ganador_penales IN ('gana_a', 'gana_b'));

ALTER TABLE public.pronosticos 
    ADD COLUMN IF NOT EXISTS prediccion_penales VARCHAR(10) CHECK (prediccion_penales IN ('gana_a', 'gana_b'));

-- 2. Recrear vistas para incluir la nueva columna 'ganador_penales'
DROP VIEW IF EXISTS public.view_partidos_proximos;
DROP VIEW IF EXISTS public.view_partidos_pasados;

CREATE VIEW public.view_partidos_proximos AS
    SELECT * FROM public.partidos
    WHERE fecha_hora > now() AND resultado IS NULL
    ORDER BY fecha_hora ASC;

CREATE VIEW public.view_partidos_pasados AS
    SELECT * FROM public.partidos
    WHERE fecha_hora <= now() OR resultado IS NOT NULL
    ORDER BY fecha_hora DESC;

-- 3. Actualizar la función del trigger para calcular puntos
CREATE OR REPLACE FUNCTION public.calcular_puntos_pronostico()
RETURNS TRIGGER AS $$
DECLARE
    r                 RECORD;
    puntos_nuevos     INT;
    puntos_anteriores INT;
BEGIN
    IF (
        OLD.resultado IS DISTINCT FROM NEW.resultado
        OR OLD.goles_a IS DISTINCT FROM NEW.goles_a
        OR OLD.goles_b IS DISTINCT FROM NEW.goles_b
        OR OLD.ganador_penales IS DISTINCT FROM NEW.ganador_penales
    ) THEN
        FOR r IN
            SELECT id, usuario_id, prediccion, goles_a, goles_b, prediccion_penales, puntos_ganados
            FROM public.pronosticos
            WHERE partido_id = NEW.id
        LOOP
            IF NEW.resultado IS NULL OR NEW.goles_a IS NULL OR NEW.goles_b IS NULL THEN
                puntos_nuevos := 0;
            ELSE
                -- Puntos base por acierto de ganador/empate
                IF r.prediccion = NEW.resultado THEN
                    puntos_nuevos := 1;
                    IF r.goles_a = NEW.goles_a AND r.goles_b = NEW.goles_b THEN
                        puntos_nuevos := 2;
                    END IF;
                ELSE
                    puntos_nuevos := 0;
                END IF;

                -- Bonificación por penales en caso de empate (+1 punto), independiente de si acertó el resultado principal o no
                IF NEW.resultado = 'empate' 
                   AND NEW.ganador_penales IS NOT NULL 
                   AND r.prediccion_penales = NEW.ganador_penales THEN
                    puntos_nuevos := puntos_nuevos + 1;
                END IF;
            END IF;

            puntos_anteriores := r.puntos_ganados;

            UPDATE public.pronosticos
            SET puntos_ganados = puntos_nuevos
            WHERE id = r.id;

            UPDATE public.usuarios
            SET puntos_totales = GREATEST(0, puntos_totales + (puntos_nuevos - puntos_anteriores))
            WHERE id = r.usuario_id;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Recrear el trigger en la tabla partidos para que incluya la columna 'ganador_penales'
DROP TRIGGER IF EXISTS trigger_actualizar_puntos_partido ON public.partidos;

CREATE TRIGGER trigger_actualizar_puntos_partido
    AFTER UPDATE OF resultado, goles_a, goles_b, ganador_penales ON public.partidos
    FOR EACH ROW EXECUTE FUNCTION public.calcular_puntos_pronostico();
