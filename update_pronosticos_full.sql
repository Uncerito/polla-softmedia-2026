/* ==============================================================
   update_pronosticos_full.sql
   --------------------------------------------------------------
   1️⃣  Borra **todos** los pronósticos existentes.
   2️⃣  Inserta los doce partidos (el listado completo) para **cada
       usuario** y asigna 2 puntos ganados a cada registro.
   3️⃣  Actualiza los puntos totales de todos los usuarios en base
       a los pronósticos insertados.
   --------------------------------------------------------------
   Partidos (numero_partido → resultado):
   1️⃣ México 2‑0 Sudáfrica            → gana_a
   2️⃣ República de Corea 2‑1 Chequia → gana_a
   3️⃣ Canadá 1‑1 Bosnia               → empate
   4️⃣ EE.UU. 4‑1 Paraguay             → gana_a
   5️⃣ Catar 1‑1 Suiza                 → empate
   6️⃣ Brasil 1‑1 Marruecos            → empate
   7️⃣ Haití 0‑1 Escocia               → gana_b
   8️⃣ Australia 2‑0 Turquía           → gana_a
   9️⃣ Alemania 7‑1 Curazao            → gana_a
   🔟 Países Bajos 2‑2 Japón          → empate
   1️⃣1️⃣ Costa de Marfil 1‑0 Ecuador    → gana_a
   1️⃣2️⃣ Suecia 5‑1 Túnez               → gana_a
   ==============================================================*/

BEGIN;

-----------------------------------------------------------------
-- 1️⃣  Elimina todo lo que había en la tabla de pronósticos.
-----------------------------------------------------------------
TRUNCATE TABLE public.pronosticos CASCADE;

-----------------------------------------------------------------
-- 2️⃣  Inserta los nuevos pronósticos para *todos* los usuarios.
-----------------------------------------------------------------
INSERT INTO public.pronosticos (
    usuario_id,
    partido_id,
    prediccion,
    goles_a,
    goles_b,
    puntos_ganados          -- fuerza 2 puntos para cada registro
)
SELECT
    u.id AS usuario_id,
    p.id AS partido_id,

    /* ---------- predicción (gana_a / empate / gana_b) ---------- */
    CASE p.numero_partido
        WHEN 1 THEN 'gana_a'   -- México vs Sudáfrica
        WHEN 2 THEN 'gana_a'   -- República de Corea vs Chequia
        WHEN 3 THEN 'empate'   -- Canadá vs Bosnia
        WHEN 4 THEN 'gana_a'   -- EE.UU. vs Paraguay
        WHEN 5 THEN 'empate'   -- Catar vs Suiza
        WHEN 6 THEN 'empate'   -- Brasil vs Marruecos
        WHEN 7 THEN 'gana_b'   -- Haití vs Escocia
        WHEN 8 THEN 'gana_a'   -- Australia vs Turquía
        WHEN 9 THEN 'gana_a'   -- Alemania vs Curazao
        WHEN 10 THEN 'empate'  -- Países Bajos vs Japón
        WHEN 11 THEN 'gana_a'  -- Costa de Marfil vs Ecuador
        WHEN 12 THEN 'gana_a'  -- Suecia vs Túnez
    END AS prediccion,

    /* ---------- goles del equipo A (local) ---------- */
    CASE p.numero_partido
        WHEN 1 THEN 2   -- México
        WHEN 2 THEN 2   -- República de Corea
        WHEN 3 THEN 1   -- Canadá
        WHEN 4 THEN 4   -- EE.UU.
        WHEN 5 THEN 1   -- Catar
        WHEN 6 THEN 1   -- Brasil
        WHEN 7 THEN 0   -- Haití
        WHEN 8 THEN 2   -- Australia
        WHEN 9 THEN 7   -- Alemania
        WHEN 10 THEN 2  -- Países Bajos
        WHEN 11 THEN 1  -- Costa de Marfil
        WHEN 12 THEN 5  -- Suecia
    END AS goles_a,

    /* ---------- goles del equipo B (visitante) ---------- */
    CASE p.numero_partido
        WHEN 1 THEN 0   -- Sudáfrica
        WHEN 2 THEN 1   -- Chequia
        WHEN 3 THEN 1   -- Bosnia
        WHEN 4 THEN 1   -- Paraguay
        WHEN 5 THEN 1   -- Suiza
        WHEN 6 THEN 1   -- Marruecos
        WHEN 7 THEN 1   -- Escocia
        WHEN 8 THEN 0   -- Turquía
        WHEN 9 THEN 1   -- Curazao
        WHEN 10 THEN 2  -- Japón
        WHEN 11 THEN 0  -- Ecuador
        WHEN 12 THEN 1  -- Túnez
    END AS goles_b,

    2 AS puntos_ganados                 -- ¡dos puntos para cada pronóstico!
FROM public.usuarios  u
JOIN public.partidos   p
  ON p.numero_partido IN (1,2,3,4,5,6,7,8,9,10,11,12);   -- los doce partidos

-----------------------------------------------------------------
-- 3️⃣  Actualiza los puntos totales de todos los usuarios
-----------------------------------------------------------------
UPDATE public.usuarios u
SET puntos_totales = (
    SELECT COALESCE(SUM(puntos_ganados), 0)
    FROM public.pronosticos p
    WHERE p.usuario_id = u.id
);

COMMIT;
