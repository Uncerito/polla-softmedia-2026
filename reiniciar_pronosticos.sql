-- ====================================================================
-- SCRIPT PARA REINICIAR LA TABLA DE PRONÓSTICOS Y PUNTOS DE USUARIOS
-- ====================================================================
-- Instrucciones: 
-- 1. Ve a tu panel de control de Supabase (https://supabase.com).
-- 2. Entra a tu proyecto de los Pronósticos SoftMedia.
-- 3. Ve a la sección "SQL Editor" en el menú izquierdo.
-- 4. Crea un nuevo query, pega el código de abajo y haz clic en "Run".
-- ====================================================================

-- Paso 1: Vaciar completamente la tabla de pronósticos
-- El uso de CASCADE asegura que se limpien las referencias de forma segura.
TRUNCATE TABLE public.pronosticos CASCADE;

-- Paso 2: Restablecer los puntos totales de todos los usuarios a 0
-- Como ya no hay pronósticos, todos los competidores deben volver a tener 0 puntos.
UPDATE public.usuarios 
SET puntos_totales = 0;

-- (Opcional) Paso 3: Restablecer los marcadores oficiales de los partidos a pendiente
-- Descomenta las siguientes líneas si también deseas borrar los resultados registrados de los partidos
-- UPDATE public.partidos 
-- SET goles_a = NULL, goles_b = NULL, resultado = NULL;
