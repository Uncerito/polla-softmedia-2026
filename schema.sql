-- ====================================================================
-- MUNDIAL 2026 - PLATAFORMA DE PRONÓSTICOS SOFTMEDIA
-- Horarios 100% Oficiales FIFA en hora Lima/Perú (UTC-5)
-- Versión 3.1 — Schema definitivo sin errores de DROP
-- ====================================================================

-- ====================================================================
-- 1. LIMPIEZA TOTAL CON ELIMINACIÓN EN CASCADA
-- ====================================================================
-- (Se eliminan los DROP TRIGGER sueltos para evitar el error 42P01)
DROP FUNCTION IF EXISTS public.calcular_puntos_pronostico() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.es_admin() CASCADE;

DROP VIEW IF EXISTS public.view_partidos_proximos;
DROP VIEW IF EXISTS public.view_partidos_pasados;
DROP TABLE IF EXISTS public.pronosticos CASCADE;
DROP TABLE IF EXISTS public.partidos CASCADE;
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.equipos CASCADE;

-- ====================================================================
-- 2. TABLA DE USUARIOS (Sincronizada con Supabase Auth)
-- ====================================================================
CREATE TABLE public.usuarios (
    id             UUID PRIMARY KEY,
    nombre         TEXT NOT NULL,
    apellido       TEXT NOT NULL,
    email          TEXT NOT NULL UNIQUE,
    rol_usuario    TEXT NOT NULL DEFAULT 'usuario' CHECK (rol_usuario IN ('usuario', 'admin')),
    puntos_totales INT  NOT NULL DEFAULT 0,
    creado_en      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.es_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        auth.jwt() ->> 'email' = 'jorge.aranda@softmediaconsultores.com'
        OR
        EXISTS (
            SELECT 1 FROM public.usuarios
            WHERE id = auth.uid() AND rol_usuario = 'admin'
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Permitir lectura general de usuarios"
    ON public.usuarios FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir actualización de su propio perfil"
    ON public.usuarios FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Permitir al trigger del sistema registrar perfiles"
    ON public.usuarios FOR INSERT WITH CHECK (true);

CREATE POLICY "Administradores pueden gestionar todos los usuarios"
    ON public.usuarios FOR ALL TO authenticated USING (public.es_admin());

-- ====================================================================
-- 3. TRIGGER DE VINCULACIÓN DE USUARIOS (Auth → public.usuarios)
-- ====================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.usuarios (id, email, nombre, apellido, rol_usuario, puntos_totales)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'nombre',      'Usuario'),
        COALESCE(NEW.raw_user_meta_data->>'apellido',    'SoftMedia'),
        COALESCE(NEW.raw_user_meta_data->>'rol_usuario', 'usuario'),
        0
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 4. TABLA DE PARTIDOS
-- ====================================================================
CREATE TABLE public.partidos (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_partido INT UNIQUE NOT NULL,
    equipo_a       VARCHAR(100) NOT NULL,
    equipo_b       VARCHAR(100) NOT NULL,
    fecha_hora     TIMESTAMP WITH TIME ZONE NOT NULL,
    fase           VARCHAR(50) NOT NULL CHECK (fase IN ('Grupos', '16avos', 'Octavos', 'Cuartos', 'Semifinal', 'Final')),
    jornada        INT CHECK (jornada IN (1, 2, 3)),
    grupo          VARCHAR(50),
    sede           VARCHAR(150),
    ciudad         VARCHAR(100),
    goles_a        INT,
    goles_b        INT,
    resultado      VARCHAR(10) CHECK (resultado IN ('gana_a', 'gana_b', 'empate')),
    creado_en      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

ALTER TABLE public.partidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir lectura de partidos a todos los autenticados"
    ON public.partidos FOR SELECT TO authenticated USING (true);

CREATE POLICY "Solo administradores pueden modificar partidos"
    ON public.partidos FOR ALL TO authenticated USING (public.es_admin());

-- ====================================================================
-- VISTAS PARA FILTRADO EN EL FRONTEND
-- ====================================================================
CREATE VIEW public.view_partidos_proximos AS
    SELECT * FROM public.partidos
    WHERE fecha_hora > now() AND resultado IS NULL
    ORDER BY fecha_hora ASC;

CREATE VIEW public.view_partidos_pasados AS
    SELECT * FROM public.partidos
    WHERE fecha_hora <= now() OR resultado IS NOT NULL
    ORDER BY fecha_hora DESC;

-- ====================================================================
-- 5. TABLA DE PRONÓSTICOS
-- ====================================================================
CREATE TABLE public.pronosticos (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id     UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    partido_id     UUID NOT NULL REFERENCES public.partidos(id) ON DELETE CASCADE,
    prediccion     VARCHAR(10) NOT NULL CHECK (prediccion IN ('gana_a', 'gana_b', 'empate')),
    goles_a        INT,
    goles_b        INT,
    puntos_ganados INT NOT NULL DEFAULT 0,
    creado_en      TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(usuario_id, partido_id)
);

ALTER TABLE public.pronosticos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios leen sus propios pronósticos"
    ON public.pronosticos FOR SELECT TO authenticated
    USING (usuario_id = auth.uid());

CREATE POLICY "Insertar pronósticos solo antes del partido"
    ON public.pronosticos FOR INSERT TO authenticated
    WITH CHECK (
        usuario_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.partidos
            WHERE id = partido_id AND fecha_hora > now()
        )
    );

CREATE POLICY "Actualizar pronósticos solo antes del partido"
    ON public.pronosticos FOR UPDATE TO authenticated
    USING (
        usuario_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.partidos
            WHERE id = partido_id AND fecha_hora > now()
        )
    )
    WITH CHECK (usuario_id = auth.uid());

-- ====================================================================
-- 6. TRIGGER: CÁLCULO EN VIVO DE PUNTOS Y RANKING
-- ====================================================================
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
    ) THEN
        FOR r IN
            SELECT id, usuario_id, prediccion, goles_a, goles_b, puntos_ganados
            FROM public.pronosticos
            WHERE partido_id = NEW.id
        LOOP
            IF NEW.resultado IS NULL OR NEW.goles_a IS NULL OR NEW.goles_b IS NULL THEN
                puntos_nuevos := 0;
            ELSIF r.prediccion = NEW.resultado THEN
                puntos_nuevos := 1;
                IF r.goles_a = NEW.goles_a AND r.goles_b = NEW.goles_b THEN
                    puntos_nuevos := 2;
                END IF;
            ELSE
                puntos_nuevos := 0;
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

CREATE TRIGGER trigger_actualizar_puntos_partido
    AFTER UPDATE OF resultado, goles_a, goles_b ON public.partidos
    FOR EACH ROW EXECUTE FUNCTION public.calcular_puntos_pronostico();

-- ====================================================================
-- 7. FIXTURE OFICIAL FIFA MUNDIAL 2026 — 72 PARTIDOS FASE DE GRUPOS
-- Horarios sincronizados y verificados en hora local de Lima (UTC-5)
-- ====================================================================
INSERT INTO public.partidos (numero_partido, equipo_a, equipo_b, fecha_hora, fase, jornada, grupo, sede, ciudad) VALUES
-- JORNADA 1
(1,  'México',               'Sudáfrica',            '2026-06-11 14:00:00-05', 'Grupos', 1, 'Grupo A',  'Estadio Azteca',               'Ciudad de México, MX 🇲🇽'),
(2,  'Corea del Sur',        'República Checa',      '2026-06-11 21:00:00-05', 'Grupos', 1, 'Grupo A',  'Estadio Akron',                'Guadalajara, MX 🇲🇽'),
(3,  'Canadá',               'Bosnia y Herzegovina', '2026-06-12 14:00:00-05', 'Grupos', 1, 'Grupo B',  'BMO Field',                    'Toronto, CA 🇨🇦'),
(4,  'Estados Unidos',       'Paraguay',             '2026-06-12 20:00:00-05', 'Grupos', 1, 'Grupo D',  'SoFi Stadium',                 'Los Ángeles, US 🇺🇸'),
(5,  'Catar',                'Suiza',                '2026-06-13 14:00:00-05', 'Grupos', 1, 'Grupo B',  'Levi''s Stadium',              'San Francisco, US 🇺🇸'),
(6,  'Brasil',               'Marruecos',            '2026-06-13 17:00:00-05', 'Grupos', 1, 'Grupo C',  'MetLife Stadium',              'Nueva York/Nueva Jersey, US 🇺🇸'),
(7,  'Haití',                'Escocia',              '2026-06-13 20:00:00-05', 'Grupos', 1, 'Grupo C',  'Gillette Stadium',             'Boston, US 🇺🇸'),
(8,  'Australia',            'Turquía',              '2026-06-13 23:00:00-05', 'Grupos', 1, 'Grupo D',  'BC Place',                     'Vancouver, CA 🇨🇦'),
(9,  'Alemania',             'Curazao',              '2026-06-14 12:00:00-05', 'Grupos', 1, 'Grupo E',  'NRG Stadium',                  'Houston, US 🇺🇸'),
(10, 'Países Bajos',         'Japón',                '2026-06-14 15:00:00-05', 'Grupos', 1, 'Grupo F',  'AT&T Stadium',                 'Dallas, US 🇺🇸'),
(11, 'Costa de Marfil',      'Ecuador',              '2026-06-14 18:00:00-05', 'Grupos', 1, 'Grupo E',  'Lincoln Financial Field',      'Filadelfia, US 🇺🇸'),
(12, 'Suecia',               'Túnez',                '2026-06-14 21:00:00-05', 'Grupos', 1, 'Grupo F',  'Estadio BBVA',                 'Monterrey, MX 🇲🇽'),
(13, 'España',               'Cabo Verde',           '2026-06-15 11:00:00-05', 'Grupos', 1, 'Grupo H',  'Mercedes-Benz Stadium',        'Atlanta, US 🇺🇸'),
(14, 'Bélgica',              'Egipto',               '2026-06-15 14:00:00-05', 'Grupos', 1, 'Grupo G',  'Lumen Field',                  'Seattle, US 🇺🇸'),
(15, 'Arabia Saudita',       'Uruguay',              '2026-06-15 17:00:00-05', 'Grupos', 1, 'Grupo H',  'Hard Rock Stadium',            'Miami, US 🇺🇸'),
(16, 'Irán',                 'Nueva Zelanda',        '2026-06-15 20:00:00-05', 'Grupos', 1, 'Grupo G',  'SoFi Stadium',                 'Los Ángeles, US 🇺🇸'),
(17, 'Francia',              'Senegal',              '2026-06-16 14:00:00-05', 'Grupos', 1, 'Grupo I',  'MetLife Stadium',              'Nueva York/Nueva Jersey, US 🇺🇸'),
(18, 'Irak',                 'Noruega',              '2026-06-16 17:00:00-05', 'Grupos', 1, 'Grupo I',  'Gillette Stadium',             'Boston, US 🇺🇸'),
(19, 'Argentina',            'Argelia',              '2026-06-16 20:00:00-05', 'Grupos', 1, 'Grupo J',  'Arrowhead Stadium',            'Kansas City, US 🇺🇸'),
(20, 'Austria',              'Jordania',             '2026-06-16 23:00:00-05', 'Grupos', 1, 'Grupo J',  'Levi''s Stadium',              'San Francisco, US 🇺🇸'),
(21, 'Portugal',             'RD Congo',             '2026-06-17 12:00:00-05', 'Grupos', 1, 'Grupo K',  'NRG Stadium',                  'Houston, US 🇺🇸'),
(22, 'Inglaterra',           'Croacia',              '2026-06-17 15:00:00-05', 'Grupos', 1, 'Grupo L',  'AT&T Stadium',                 'Dallas, US 🇺🇸'),
(23, 'Ghana',                'Panamá',               '2026-06-17 18:00:00-05', 'Grupos', 1, 'Grupo L',  'BMO Field',                    'Toronto, CA 🇨🇦'),
(24, 'Uzbekistán',           'Colombia',             '2026-06-17 21:00:00-05', 'Grupos', 1, 'Grupo K',  'Estadio Azteca',               'Ciudad de México, MX 🇲🇽'),

-- JORNADA 2
(25, 'República Checa',      'Sudáfrica',            '2026-06-18 11:00:00-05', 'Grupos', 2, 'Grupo A',  'Mercedes-Benz Stadium',        'Atlanta, US 🇺🇸'),
(26, 'Suiza',                'Bosnia y Herzegovina', '2026-06-18 14:00:00-05', 'Grupos', 2, 'Grupo B',  'SoFi Stadium',                 'Los Ángeles, US 🇺🇸'),
(27, 'Canadá',               'Catar',                '2026-06-18 17:00:00-05', 'Grupos', 2, 'Grupo B',  'BC Place',                     'Vancouver, CA 🇨🇦'),
(28, 'México',               'Corea del Sur',        '2026-06-18 20:00:00-05', 'Grupos', 2, 'Grupo A',  'Estadio Akron',                'Guadalajara, MX 🇲🇽'),
(29, 'Estados Unidos',       'Australia',            '2026-06-19 14:00:00-05', 'Grupos', 2, 'Grupo D',  'Lumen Field',                  'Seattle, US 🇺🇸'),
(30, 'Escocia',              'Marruecos',            '2026-06-19 17:00:00-05', 'Grupos', 2, 'Grupo C',  'Gillette Stadium',             'Boston, US 🇺🇸'),
(31, 'Brasil',               'Haití',                '2026-06-19 20:00:00-05', 'Grupos', 2, 'Grupo C',  'Lincoln Financial Field',      'Filadelfia, US 🇺🇸'),
(32, 'Turquía',              'Paraguay',             '2026-06-19 23:00:00-05', 'Grupos', 2, 'Grupo D',  'Levi''s Stadium',              'San Francisco, US 🇺🇸'),
(33, 'Países Bajos',         'Suecia',               '2026-06-20 12:00:00-05', 'Grupos', 2, 'Grupo F',  'AT&T Stadium',                 'Dallas, US 🇺🇸'),
(34, 'Alemania',             'Costa de Marfil',      '2026-06-20 15:00:00-05', 'Grupos', 2, 'Grupo E',  'BMO Field',                    'Toronto, CA 🇨🇦'),
(35, 'Ecuador',              'Curazao',              '2026-06-20 19:00:00-05', 'Grupos', 2, 'Grupo E',  'Arrowhead Stadium',            'Kansas City, US 🇺🇸'),
(36, 'Túnez',                'Japón',                '2026-06-20 21:00:00-05', 'Grupos', 2, 'Grupo F',  'Estadio BBVA',                 'Monterrey, MX 🇲🇽'),
(37, 'España',               'Arabia Saudita',       '2026-06-21 11:00:00-05', 'Grupos', 2, 'Grupo H',  'Mercedes-Benz Stadium',        'Atlanta, US 🇺🇸'),
(38, 'Bélgica',              'Irán',                 '2026-06-21 14:00:00-05', 'Grupos', 2, 'Grupo G',  'SoFi Stadium',                 'Los Ángeles, US 🇺🇸'),
(39, 'Uruguay',              'Cabo Verde',           '2026-06-21 17:00:00-05', 'Grupos', 2, 'Grupo H',  'Hard Rock Stadium',            'Miami, US 🇺🇸'),
(40, 'Nueva Zelanda',        'Egipto',               '2026-06-21 20:00:00-05', 'Grupos', 2, 'Grupo G',  'BC Place',                     'Vancouver, CA 🇨🇦'),
(41, 'Argentina',            'Austria',              '2026-06-22 12:00:00-05', 'Grupos', 2, 'Grupo J',  'AT&T Stadium',                 'Dallas, US 🇺🇸'),
(42, 'Francia',              'Irak',                 '2026-06-22 16:00:00-05', 'Grupos', 2, 'Grupo I',  'Lincoln Financial Field',      'Filadelfia, US 🇺🇸'),
(43, 'Noruega',              'Senegal',              '2026-06-22 19:00:00-05', 'Grupos', 2, 'Grupo I',  'MetLife Stadium',              'Nueva York/Nueva Jersey, US 🇺🇸'),
(44, 'Jordania',             'Argelia',              '2026-06-22 22:00:00-05', 'Grupos', 2, 'Grupo J',  'Levi''s Stadium',              'San Francisco, US 🇺🇸'),
(45, 'Portugal',             'Uzbekistán',           '2026-06-23 12:00:00-05', 'Grupos', 2, 'Grupo K',  'NRG Stadium',                  'Houston, US 🇺🇸'),
(46, 'Inglaterra',           'Ghana',                '2026-06-23 15:00:00-05', 'Grupos', 2, 'Grupo L',  'Gillette Stadium',             'Boston, US 🇺🇸'),
(47, 'Panamá',               'Croacia',              '2026-06-23 18:00:00-05', 'Grupos', 2, 'Grupo L',  'BMO Field',                    'Toronto, CA 🇨🇦'),
(48, 'Colombia',             'RD Congo',             '2026-06-23 21:00:00-05', 'Grupos', 2, 'Grupo K',  'Estadio Akron',                'Guadalajara, MX 🇲🇽'),

-- JORNADA 3 (Grupos Sincronizados)
(49, 'Brasil',               'Escocia',              '2026-06-24 16:00:00-05', 'Grupos', 3, 'Grupo C',  'Hard Rock Stadium',            'Miami, US 🇺🇸'),
(50, 'Marruecos',            'Haití',                '2026-06-24 16:00:00-05', 'Grupos', 3, 'Grupo C',  'Mercedes-Benz Stadium',        'Atlanta, US 🇺🇸'),
(51, 'Suiza',                'Canadá',               '2026-06-24 13:00:00-05', 'Grupos', 3, 'Grupo B',  'BC Place',                     'Vancouver, CA 🇨🇦'),
(52, 'Bosnia y Herzegovina', 'Catar',                '2026-06-24 13:00:00-05', 'Grupos', 3, 'Grupo B',  'Lumen Field',                  'Seattle, US 🇺🇸'),
(53, 'República Checa',      'México',               '2026-06-24 19:00:00-05', 'Grupos', 3, 'Grupo A',  'Estadio Azteca',               'Ciudad de México, MX 🇲🇽'),
(54, 'Sudáfrica',            'Corea del Sur',        '2026-06-24 19:00:00-05', 'Grupos', 3, 'Grupo A',  'Estadio BBVA',                 'Monterrey, MX 🇲🇽'),
(55, 'Curazao',              'Costa de Marfil',      '2026-06-25 15:00:00-05', 'Grupos', 3, 'Grupo E',  'Lincoln Financial Field',      'Filadelfia, US 🇺🇸'),
(56, 'Alemania',             'Ecuador',              '2026-06-25 15:00:00-05', 'Grupos', 3, 'Grupo E',  'MetLife Stadium',              'Nueva York/Nueva Jersey, US 🇺🇸'),
(57, 'Japón',                'Suecia',               '2026-06-25 18:00:00-05', 'Grupos', 3, 'Grupo F',  'AT&T Stadium',                 'Dallas, US 🇺🇸'),
(58, 'Países Bajos',         'Túnez',                '2026-06-25 18:00:00-05', 'Grupos', 3, 'Grupo F',  'Arrowhead Stadium',            'Kansas City, US 🇺🇸'),
(59, 'Estados Unidos',       'Turquía',              '2026-06-25 21:00:00-05', 'Grupos', 3, 'Grupo D',  'SoFi Stadium',                 'Los Ángeles, US 🇺🇸'),
(60, 'Paraguay',             'Australia',            '2026-06-25 21:00:00-05', 'Grupos', 3, 'Grupo D',  'Levi''s Stadium',              'San Francisco, US 🇺🇸'),
(61, 'Francia',              'Noruega',              '2026-06-26 13:00:00-05', 'Grupos', 3, 'Grupo I',  'Gillette Stadium',             'Boston, US 🇺🇸'),
(62, 'Senegal',              'Irak',                 '2026-06-26 13:00:00-05', 'Grupos', 3, 'Grupo I',  'BMO Field',                    'Toronto, CA 🇨🇦'),
(63, 'Egipto',               'Irán',                 '2026-06-26 16:00:00-05', 'Grupos', 3, 'Grupo G',  'Lumen Field',                  'Seattle, US 🇺🇸'),
(64, 'Bélgica',              'Nueva Zelanda',        '2026-06-26 16:00:00-05', 'Grupos', 3, 'Grupo G',  'BC Place',                     'Vancouver, CA 🇨🇦'),
(65, 'Cabo Verde',           'Arabia Saudita',       '2026-06-26 19:00:00-05', 'Grupos', 3, 'Grupo H',  'NRG Stadium',                  'Houston, US 🇺🇸'),
(66, 'España',               'Uruguay',              '2026-06-26 19:00:00-05', 'Grupos', 3, 'Grupo H',  'Estadio Akron',                'Guadalajara, MX 🇲🇽'),
(67, 'Inglaterra',           'Panamá',               '2026-06-27 16:00:00-05', 'Grupos', 3, 'Grupo L',  'MetLife Stadium',              'Nueva York/Nueva Jersey, US 🇺🇸'),
(68, 'Croacia',              'Ghana',                '2026-06-27 16:00:00-05', 'Grupos', 3, 'Grupo L',  'Lincoln Financial Field',      'Filadelfia, US 🇺🇸'),
(69, 'Argelia',              'Austria',              '2026-06-27 21:00:00-05', 'Grupos', 3, 'Grupo J',  'Arrowhead Stadium',            'Kansas City, US 🇺🇸'),
(70, 'Argentina',            'Jordania',             '2026-06-27 21:00:00-05', 'Grupos', 3, 'Grupo J',  'AT&T Stadium',                 'Dallas, US 🇺🇸'),
(71, 'Portugal',             'Colombia',             '2026-06-27 18:30:00-05', 'Grupos', 3, 'Grupo K',  'Hard Rock Stadium',            'Miami, US 🇺🇸'),
(72, 'RD Congo',             'Uzbekistán',           '2026-06-27 18:30:00-05', 'Grupos', 3, 'Grupo K',  'Mercedes-Benz Stadium',        'Atlanta, US 🇺🇸')

ON CONFLICT (numero_partido) DO UPDATE SET
    equipo_a   = EXCLUDED.equipo_a,
    equipo_b   = EXCLUDED.equipo_b,
    fecha_hora = EXCLUDED.fecha_hora,
    fase       = EXCLUDED.fase,
    jornada    = EXCLUDED.jornada,
    grupo      = EXCLUDED.grupo,
    sede       = EXCLUDED.sede,
    ciudad     = EXCLUDED.ciudad;

-- ====================================================================
-- 8. INYECCIÓN DE COLABORADORES EN auth.users
--
-- Contraseña por defecto para todos: SoftMedia2026!
-- Hash bcrypt generado con cost=10. Válido para Supabase Auth.
--
-- IMPORTANTE: Cada colaborador deberá cambiar su contraseña al ingresar
-- por primera vez usando la opción "Cambiar contraseña" del panel,
-- o mediante el flujo de recuperación de contraseña en la pantalla de login.
-- ====================================================================
DO $$
DECLARE
    u         RECORD;
    user_list JSONB := '[
      {"id": "050e5f4f-cf6d-4cc2-a4c0-982bc74dc27f", "nombre": "Alexander",  "apellido": "Chancayauri", "email": "alexander.chancayauri@softmediaconsultores.com"},
      {"id": "0f90544d-dbfc-4515-8ac8-9bb3034d5ccb", "nombre": "Celeste",    "apellido": "Rosas",        "email": "celeste.rosas@softmediaconsultores.com"},
      {"id": "13710a47-fbc0-4534-9e1d-21bd873446bb", "nombre": "Cesar",      "apellido": "Diaz",         "email": "cesar.diaz@softmediaconsultores.com"},
      {"id": "17c86923-665f-40ed-904c-a75ee7957c46", "nombre": "Cristian",   "apellido": "Olaya",        "email": "cristian.olaya@softmediaconsultores.com"},
      {"id": "24a84286-d6f5-418e-97fb-4f9fd546cabd", "nombre": "Esther",     "apellido": "Tellez",       "email": "esther.tellez@softmediaconsultores.com"},
      {"id": "320575d5-62d4-4be2-9e69-0b90193f10c2", "nombre": "Flavio",     "apellido": "Arias",        "email": "flavio.arias@softmediaconsultores.com"},
      {"id": "4c32604f-ff9f-4e52-9351-bf1a8c3041c4", "nombre": "Gabriel",    "apellido": "Castillejos",  "email": "gabriel.castillejos@softmediaconsultores.com"},
      {"id": "6245066c-4e9a-4521-a390-8a38855dc413", "nombre": "Gerson",     "apellido": "Diaz",         "email": "gerson.diaz@softmediaconsultores.com"},
      {"id": "660cbb8b-2aad-4200-822f-4d817bc64d41", "nombre": "Jeferson",   "apellido": "Rosas",        "email": "jeferson.rosas@softmediaconsultores.com"},
      {"id": "681d3ddb-0706-4d67-b8d8-4c20473248b0", "nombre": "Jorge",      "apellido": "Ipanaque",     "email": "jorge.ipanaque@softmediaconsultores.com"},
      {"id": "6e343cc5-a946-4a8e-b5b4-7fe2d903568f", "nombre": "Jorge",      "apellido": "Mateo",        "email": "jorge.mateo@softmediaconsultores.com"},
      {"id": "71af27ea-bf8c-4c46-9a5c-f1f7a3e60c8b", "nombre": "Josue",      "apellido": "Espinoza",     "email": "josue.espinoza@softmediaconsultores.com"},
      {"id": "77af7947-e8c3-4ea2-9bbf-c89a48cf8f0e", "nombre": "Luis",       "apellido": "Arias",        "email": "luis.arias@softmediaconsultores.com"},
      {"id": "8c7719a7-2268-4d14-9b67-cae8ef53dc4f", "nombre": "Marco",      "apellido": "Rumaldo",      "email": "marco.rumaldo@softmediaconsultores.com"},
      {"id": "938b8759-aa19-451b-9ea7-e3db34f28adf", "nombre": "Maricarmen", "apellido": "Alvarado",     "email": "maricarmen.alvarado@softmediaconsultores.com"},
      {"id": "995e0f7e-bea2-4abe-b6a2-d4f081f4a8dd", "nombre": "Martin",     "apellido": "Gonzales",     "email": "martin.gonzales@softmediaconsultores.com"},
      {"id": "aa14287f-21e7-4c80-bc2d-e136a8524e50", "nombre": "Miguel",     "apellido": "Alva",         "email": "miguel.alva@softmediaconsultores.com"},
      {"id": "ad6221a6-4e50-4065-a67a-8986247f5c7d", "nombre": "Naysha",     "apellido": "Yengle",       "email": "naysha.yengle@softmediaconsultores.com"},
      {"id": "bd43cf67-a8e1-4d85-97c9-2e473d47ef41", "nombre": "Paul",       "apellido": "Malqui",       "email": "paul.malqui@softmediaconsultores.com"},
      {"id": "bd7a7fb8-4a38-4c08-9caf-cae3c8e3c256", "nombre": "Percy",      "apellido": "Valverde",     "email": "percy.valverde@softmediaconsultores.com"},
      {"id": "cc88d181-1bd1-49b0-8eb7-89b8daa398e4", "nombre": "Roger",      "apellido": "Vasquez",      "email": "roger.vasquez@softmediaconsultores.com"},
      {"id": "d5fe3c48-5de9-464a-9452-619f4cc5da22", "nombre": "Samantha",   "apellido": "Dextre",       "email": "samantha.dextre@softmediaconsultores.com"},
      {"id": "ddb7543d-e5a2-4858-a44a-de44ad2b44d0", "nombre": "Piero",      "apellido": "Martinez",     "email": "piero.martinez@softmediaconsultores.com"},
      {"id": "e3161420-964b-4774-8819-9c6088c87898", "nombre": "Kojiro",     "apellido": "Pacha",        "email": "kojiro.pacha@softmediaconsultores.com"},
      {"id": "e9283b4c-c2b1-4235-b390-8ed9e925224a", "nombre": "Gianlucas",  "apellido": "Hinostroza",   "email": "gianlucas.hinostroza@softmediaconsultores.com"},
      {"id": "ec7e30af-371a-45ac-afa6-428c68185591", "nombre": "Angela",     "apellido": "Arias",        "email": "administracion@softmediaconsultores.com"},
      {"id": "eff6ef1c-b389-43d4-908a-7d8cdca98287", "nombre": "Jazmin",     "apellido": "Ayuque",       "email": "yazmin.datac@gmail.com"},
      {"id": "f89a8666-c09d-4410-895d-d26c19afe660", "nombre": "Melisa",     "apellido": "Izquierdo",    "email": "melisa.izquierdo@softmediaconsultores.com"},
      {"id": "fb967ff5-dcca-49de-8264-20f720bdaf0a", "nombre": "Rocio",      "apellido": "Rosas",        "email": "rrhh@softmediaconsultores.com"},
      {"id": "f1a09d02-12a9-4bca-847e-ef8f352932cb", "nombre": "Jorge",      "apellido": "Aranda",       "email": "jorge.aranda@softmediaconsultores.com"}
    ]';
BEGIN
    FOR u IN SELECT * FROM jsonb_to_recordset(user_list) AS x(id uuid, nombre text, apellido text, email text) LOOP
        IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = LOWER(u.email)) THEN
            INSERT INTO auth.users (
                instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                raw_app_meta_data, raw_user_meta_data, created_at, updated_at
            )
            VALUES (
                '00000000-0000-0000-0000-000000000000',
                u.id,
                'authenticated',
                'authenticated',
                LOWER(u.email),
                -- Contraseña por defecto: SoftMedia2026!
                crypt('SoftMedia2026!', gen_salt('bf', 10)),
                NOW(),
                '{"provider": "email", "providers": ["email"]}',
                jsonb_build_object('nombre', u.nombre, 'apellido', u.apellido, 'rol_usuario', 'usuario'),
                NOW(),
                NOW()
            );
        END IF;
    END LOOP;
END $$;

-- ====================================================================
-- 9. MARCAR AL ADMIN PRINCIPAL CON ROL 'admin' EN LA TABLA USUARIOS
-- (Esto lo hace la función es_admin() más robusta al no depender solo del email)
-- ====================================================================
UPDATE public.usuarios
SET rol_usuario = 'admin'
WHERE email = 'jorge.aranda@softmediaconsultores.com';