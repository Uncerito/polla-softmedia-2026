-- ====================================================================
-- SCRIPT PARA ACTUALIZAR POLÍTICAS DE RLS EN PRONÓSTICOS
-- ====================================================================
-- Instrucciones:
-- 1. Ve a tu panel de control de Supabase (https://supabase.com).
-- 2. Entra a tu proyecto de los Pronósticos SoftMedia.
-- 3. Ve a la sección "SQL Editor" en el menú izquierdo.
-- 4. Crea un nuevo query, pega el código de abajo y haz clic en "Run".
-- ====================================================================

-- Eliminar la política anterior de lectura
DROP POLICY IF EXISTS "Usuarios leen sus propios pronósticos" ON public.pronosticos;

-- Crear la nueva política con visibilidad pública para partidos ya iniciados o terminados
CREATE POLICY "Usuarios leen sus propios pronósticos"
    ON public.pronosticos FOR SELECT TO authenticated
    USING (
        usuario_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.partidos
            WHERE id = partido_id AND fecha_hora <= now()
        )
    );
