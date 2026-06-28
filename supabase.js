// Cliente de base de datos unificado completo para los Pronósticos SoftMedia Mundial 2026
// Conexión exclusiva y nativa utilizando Supabase Auth y el esquema público

class SupabaseRealClient {
  constructor(supabaseUrl, supabaseKey) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseKey = supabaseKey;
    this.client = null;
  }

  // Inicializador dinámico del SDK oficial de Supabase
  async init() {
    if (!this.client) {
      const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.8');
      this.client = createClient(this.supabaseUrl, this.supabaseKey);
    }
  }

  // ====================================================================
  // 1. MÓDULO DE AUTENTICACIÓN Y GESTIÓN DE CREDENCIALES
  // ====================================================================

  // Iniciar Sesión con credenciales nativas de Supabase Auth
  async login(email, contrasena) {
    await this.init();
    const cleanEmail = email.trim().toLowerCase();

    const { data: authData, error: authError } = await this.client.auth.signInWithPassword({
      email: cleanEmail,
      password: contrasena
    });

    if (authError) throw new Error('Credenciales inválidas o usuario no registrado.');

    const { data: profile, error: profileError } = await this.client
      .from('usuarios')
      .select('id, email, nombre, apellido, puntos_totales, rol_usuario')
      .eq('id', authData.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error('Perfil no encontrado. Intente limpiar la caché del navegador.');
    }

    const session = { user: profile, token: authData.session.access_token };
    localStorage.setItem('pollita_session', JSON.stringify(session));
    return session;
  }

  // Registro de nuevos colaboradores
  async registrarUsuario(email, nombre, apellido, contrasena) {
    await this.init();
    
    const { data, error } = await this.client.auth.signUp({
      email: email.toLowerCase(),
      password: contrasena,
      options: {
        data: {
          nombre: nombre,
          apellido: apellido,
          rol_usuario: 'usuario'
        }
      }
    });

    if (error) throw error;
    return { success: true };
  }

  // Flujo "¿Olvidé mi contraseña?": Envía correo de restablecimiento automático
  async solicitarRecuperacion(email) {
    await this.init();
    const { error } = await this.client.auth.resetPasswordForEmail(email.toLowerCase(), {
      redirectTo: window.location.origin + '/actualizar-password.html', 
    });

    if (error) throw error;
    return { success: true };
  }

  // Actualizar Contraseña (Sirve tanto dentro del panel como en el link de recuperación)
  async actualizarContrasena(nuevaContrasena) {
    await this.init();
    const { error } = await this.client.auth.updateUser({
      password: nuevaContrasena
    });

    if (error) throw error;
    return { success: true };
  }

  // Cerrar sesión
  async logout() {
    await this.init();
    if (this.client.auth) await this.client.auth.signOut();
    localStorage.removeItem('pollita_session');
  }

  // Consultar sesión activa local y validarla contra Supabase Auth
  async getSession() {
    await this.init();
    try {
      const { data: { session }, error } = await this.client.auth.getSession();
      if (error || !session) {
        localStorage.removeItem('pollita_session');
        return null;
      }

      const { data: profile, error: profileError } = await this.client
        .from('usuarios')
        .select('id, email, nombre, apellido, puntos_totales, rol_usuario')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        const localSessionStr = localStorage.getItem('pollita_session');
        if (localSessionStr) {
          try {
            const localSession = JSON.parse(localSessionStr);
            if (localSession && localSession.user && localSession.user.id === session.user.id) {
              return localSession;
            }
          } catch (e) {}
        }
        return { user: { id: session.user.id, email: session.user.email }, token: session.access_token };
      }

      const sessionObj = { user: profile, token: session.access_token };
      localStorage.setItem('pollita_session', JSON.stringify(sessionObj));
      return sessionObj;
    } catch (e) {
      console.error('Error al validar sesión:', e);
      const sessionStr = localStorage.getItem('pollita_session');
      return sessionStr ? JSON.parse(sessionStr) : null;
    }
  }

  // ====================================================================
  // 2. MÓDULO DE OPERACIÓN DE JUEGOS Y PRONÓSTICOS
  // ====================================================================

  // Obtener partidos acoplados con pronósticos filtrados dinámicamente y desde fuentes/vistas opcionales
  async getFixture(userId, source = 'partidos', filters = {}) {
    await this.init();
    
    let partidos = [];
    if (source === 'partidos') {
      let queryProx = this.client.from('view_partidos_proximos').select('*');
      let queryPas = this.client.from('view_partidos_pasados').select('*');
      
      // Aplicar filtros dinámicos (ej: { fase: 'Octavos' } o { jornada: 1 })
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          queryProx = queryProx.eq(key, filters[key]);
          queryPas = queryPas.eq(key, filters[key]);
        }
      });
      
      const { data: prox, error: errorProx } = await queryProx;
      if (errorProx) throw errorProx;
      
      const { data: pas, error: errorPas } = await queryPas;
      if (errorPas) throw errorPas;
      
      // Fusionar y ordenar ascendentemente por número de partido
      partidos = [...prox, ...pas].sort((a, b) => a.numero_partido - b.numero_partido);
    } else {
      let query = this.client.from(source).select('*');
      
      // Si consultamos los partidos pasados, ordenamos del más reciente al más antiguo
      if (source === 'view_partidos_pasados') {
        query = query.order('fecha_hora', { ascending: false });
      } else {
        query = query.order('numero_partido', { ascending: true });
      }

      // Aplicar filtros dinámicos
      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null) {
          query = query.eq(key, filters[key]);
        }
      });

      const { data: resPartidos, error: errorPartidos } = await query;
      if (errorPartidos) throw errorPartidos;
      partidos = resPartidos;
    }

    const { data: pronosticos, error: errorPronosticos } = await this.client
      .from('pronosticos')
      .select('*')
      .eq('usuario_id', userId);

    if (errorPronosticos) throw errorPronosticos;

    return partidos.map(partido => {
      const pronostico = pronosticos.find(p => p.partido_id === partido.id);
      return {
        ...partido,
        pronostico_usuario: pronostico ? pronostico.prediccion : null,
        prediccion_usuario: pronostico ? pronostico.prediccion : null,
        pronostico_goles_a: pronostico ? pronostico.goles_a : null,
        pronostico_goles_b: pronostico ? pronostico.goles_b : null,
        puntos_pronostico: pronostico ? pronostico.puntos_ganados : 0
      };
    });
  }

  // Guardar o modificar un pronóstico (Con validación estricta de tiempo de Lima y goles)
  async savePrediction(userId, partidoId, golesA, golesB) {
    await this.init();
    
    const { data: partido, error: ep } = await this.client
      .from('partidos')
      .select('fecha_hora')
      .eq('id', partidoId)
      .single();

    if (ep || !partido) throw new Error('El partido solicitado no existe.');
    
    // Bloqueo estricto por software ante hora del cotejo
    const fechaHoraLimite = new Date(partido.fecha_hora);
    if (new Date() >= fechaHoraLimite) {
      throw new Error('El partido ya ha comenzado. Apuestas cerradas.');
    }

    // Calcular la prediccion según la diferencia de goles
    let prediccion = 'empate';
    if (Number(golesA) > Number(golesB)) {
      prediccion = 'gana_a';
    } else if (Number(golesA) < Number(golesB)) {
      prediccion = 'gana_b';
    }

    const { data: existente } = await this.client
      .from('pronosticos')
      .select('id')
      .eq('usuario_id', userId)
      .eq('partido_id', partidoId)
      .maybeSingle();

    if (existente) {
      const { error } = await this.client
        .from('pronosticos')
        .update({ 
          prediccion,
          goles_a: Number(golesA),
          goles_b: Number(golesB),
          creado_en: new Date().toISOString()
        })
        .eq('id', existente.id);
      if (error) throw error;
    } else {
      const { error } = await this.client
        .from('pronosticos')
        .insert({
          usuario_id: userId,
          partido_id: partidoId,
          prediccion,
          goles_a: Number(golesA),
          goles_b: Number(golesB)
        });
      if (error) throw error;
    }

    return { success: true };
  }

  // Obtener Tabla de Posiciones Global (Ranking)
  // Obtener Tabla de Posiciones Global (Ranking)
  async getLeaderboard() {
    await this.init();
    
    // 1. Intentar obtener el último partido en curso (comenzado pero sin resultado)
    const { data: partidoEnCurso, error: ecError } = await this.client
      .from('partidos')
      .select('id, numero_partido, fecha_hora, equipo_a, equipo_b')
      .lte('fecha_hora', new Date().toISOString())
      .is('resultado', null)
      .order('fecha_hora', { ascending: false })
      .order('numero_partido', { ascending: false })
      .limit(1)
      .maybeSingle();

    let partidoReferencia = null;
    let esEnCurso = false;

    if (!ecError && partidoEnCurso) {
      partidoReferencia = partidoEnCurso;
      esEnCurso = true;
    } else {
      // 2. Si no hay en curso, obtener el último partido terminado
      const { data: ultimoTerminado, error: etError } = await this.client
        .from('partidos')
        .select('id, numero_partido, fecha_hora, equipo_a, equipo_b')
        .not('resultado', 'is', null)
        .order('fecha_hora', { ascending: false })
        .order('numero_partido', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!etError && ultimoTerminado) {
        partidoReferencia = ultimoTerminado;
      }
    }

    let partidoReferenciaDescripcion = '';
    if (partidoReferencia) {
      partidoReferenciaDescripcion = `${partidoReferencia.equipo_a} vs ${partidoReferencia.equipo_b} (P#${partidoReferencia.numero_partido})`;
    }

    let pronosticosMap = {};
    if (partidoReferencia) {
      // 3. Obtener todos los pronósticos para ese partido
      const { data: pronosticos, error: pronosError } = await this.client
        .from('pronosticos')
        .select('usuario_id, creado_en')
        .eq('partido_id', partidoReferencia.id);

      if (!pronosError && pronosticos) {
        pronosticos.forEach(p => {
          pronosticosMap[p.usuario_id] = p.creado_en;
        });
      }
    }

    // 3.5. Obtener los 2 últimos partidos cerrados
    const { data: ultimosJugados, error: ujError } = await this.client
      .from('view_partidos_pasados')
      .select('id, numero_partido, fecha_hora, equipo_a, equipo_b, goles_a, goles_b, resultado')
      .order('fecha_hora', { ascending: false })
      .order('numero_partido', { ascending: false })
      .limit(2);

    let pronosticosUltimosMap = {};
    if (!ujError && ultimosJugados && ultimosJugados.length > 0) {
      const matchIds = ultimosJugados.map(m => m.id);
      const { data: pronosUltimos, error: puError } = await this.client
        .from('pronosticos')
        .select('usuario_id, partido_id, prediccion, goles_a, goles_b, puntos_ganados')
        .in('partido_id', matchIds);
      
      if (!puError && pronosUltimos) {
        pronosUltimos.forEach(p => {
          if (!pronosticosUltimosMap[p.usuario_id]) {
            pronosticosUltimosMap[p.usuario_id] = [];
          }
          pronosticosUltimosMap[p.usuario_id].push({
            partido_id: p.partido_id,
            prediccion: p.prediccion,
            goles_a: p.goles_a,
            goles_b: p.goles_b,
            puntos_ganados: p.puntos_ganados
          });
        });
      }
    }

    // 4. Obtener todos los partidos terminados oficiales para calcular estadísticas de aciertos/fallos
    const { data: finishedMatches, error: fmError } = await this.client
      .from('partidos')
      .select('id')
      .not('resultado', 'is', null);

    // Para evitar discrepancias en entornos de prueba si se forzaron puntos en pronósticos manualmente:
    // Un partido se considera "terminado" si tiene resultado en la tabla partidos,
    // o si algún usuario obtuvo puntos (> 0) en su pronóstico para el mismo.
    let finishedMatchIdsSet = new Set(finishedMatches ? finishedMatches.map(m => m.id) : []);

    // Escanear la tabla pronósticos para encontrar otros partidos que puedan tener puntos asignados
    const { data: allActivePronosticos, error: apError } = await this.client
      .from('pronosticos')
      .select('partido_id, usuario_id, puntos_ganados')
      .gt('puntos_ganados', 0);

    if (!apError && allActivePronosticos) {
      allActivePronosticos.forEach(p => {
        finishedMatchIdsSet.add(p.partido_id);
      });
    }

    const finishedMatchIds = Array.from(finishedMatchIdsSet);
    const totalFinished = finishedMatchIds.length;

    let userPredictionsCountMap = {}; // mapping: usuario_id -> count of predictions made for finished matches
    let pronosticosFinMap = {}; // mapping: usuario_id -> count of puntos_ganados > 0
    if (totalFinished > 0) {
      const { data: pronosticosFin, error: pfError } = await this.client
        .from('pronosticos')
        .select('usuario_id, puntos_ganados')
        .in('partido_id', finishedMatchIds);
        
      if (!pfError && pronosticosFin) {
        pronosticosFin.forEach(p => {
          userPredictionsCountMap[p.usuario_id] = (userPredictionsCountMap[p.usuario_id] || 0) + 1;
          
          if (!pronosticosFinMap[p.usuario_id]) {
            pronosticosFinMap[p.usuario_id] = 0;
          }
          if (p.puntos_ganados > 0) {
            pronosticosFinMap[p.usuario_id]++;
          }
        });
      }
    }

    const { data, error } = await this.client
      .from('usuarios')
      .select('id, nombre, apellido, puntos_totales');

    if (error) throw error;

    // Agregar la hora de la apuesta del último partido terminado a cada usuario, más estadísticas y datos del último pronóstico
    const leaderboardWithTime = data.map(u => {
      const acertados = pronosticosFinMap[u.id] || 0;
      const totalPredictions = userPredictionsCountMap[u.id] || 0;
      const perdidos = Math.max(0, totalPredictions - acertados);
      const no_apostados = Math.max(0, totalFinished - totalPredictions);

      const ultimos_pronosticos = (ultimosJugados || []).map(partido => {
        const prList = pronosticosUltimosMap[u.id] || [];
        const pr = prList.find(p => p.partido_id === partido.id);
        return pr ? {
          partido_id: partido.id,
          numero_partido: partido.numero_partido,
          equipo_a: partido.equipo_a,
          equipo_b: partido.equipo_b,
          goles_a_oficial: partido.goles_a,
          goles_b_oficial: partido.goles_b,
          resultado_oficial: partido.resultado,
          prediccion: pr.prediccion,
          goles_a: pr.goles_a,
          goles_b: pr.goles_b,
          puntos_ganados: pr.puntos_ganados,
          no_aposto: false
        } : {
          partido_id: partido.id,
          numero_partido: partido.numero_partido,
          equipo_a: partido.equipo_a,
          equipo_b: partido.equipo_b,
          goles_a_oficial: partido.goles_a,
          goles_b_oficial: partido.goles_b,
          resultado_oficial: partido.resultado,
          prediccion: null,
          goles_a: null,
          goles_b: null,
          puntos_ganados: 0,
          no_aposto: true
        };
      });

      // Mantener compatibilidad hacia atrás
      const ultimoJugado = ultimosJugados ? ultimosJugados[0] : null;
      const ultimoPronostico = ultimos_pronosticos && ultimos_pronosticos[0] ? {
        prediccion: ultimos_pronosticos[0].prediccion,
        goles_a: ultimos_pronosticos[0].goles_a,
        goles_b: ultimos_pronosticos[0].goles_b,
        puntos_ganados: ultimos_pronosticos[0].puntos_ganados
      } : null;

      return {
        ...u,
        fecha_apuesta_ultimo_partido: pronosticosMap[u.id] || null,
        partido_referencia_descripcion: partidoReferenciaDescripcion,
        partido_referencia_es_en_curso: esEnCurso,
        acertados,
        perdidos,
        no_apostados,
        ultimo_partido_jugado: ultimoJugado ? {
          id: ultimoJugado.id,
          numero_partido: ultimoJugado.numero_partido,
          equipo_a: ultimoJugado.equipo_a,
          equipo_b: ultimoJugado.equipo_b,
          goles_a: ultimoJugado.goles_a,
          goles_b: ultimoJugado.goles_b,
          resultado: ultimoJugado.resultado
        } : null,
        ultimo_pronostico: ultimoPronostico,
        ultimos_pronosticos: ultimos_pronosticos
      };
    });

    // Ordenar:
    // 1. Puntos totales desc
    // 2. Si hay empate, por la fecha de la apuesta del último partido terminado (más antigua/ascendente)
    //    Si uno no tiene apuesta, va al final (fecha_apuesta_ultimo_partido es null)
    // 3. Si persiste el empate (o si no hay partido terminado), alfabéticamente
    leaderboardWithTime.sort((a, b) => {
      const ptsA = Number(a.puntos_totales !== undefined && a.puntos_totales !== null ? a.puntos_totales : (a.puntos || 0));
      const ptsB = Number(b.puntos_totales !== undefined && b.puntos_totales !== null ? b.puntos_totales : (b.puntos || 0));
      if (ptsB !== ptsA) {
        return ptsB - ptsA;
      }

      const timeA = a.fecha_apuesta_ultimo_partido;
      const timeB = b.fecha_apuesta_ultimo_partido;

      if (timeA && timeB) {
        const dateA = new Date(timeA).getTime();
        const dateB = new Date(timeB).getTime();
        if (dateA !== dateB) {
          return dateA - dateB; // Más antiguo primero (orden ascendente)
        }
      } else if (timeA && !timeB) {
        return -1; // a tiene apuesta, b no. a va primero.
      } else if (!timeA && timeB) {
        return 1; // b tiene apuesta, a no. b va primero.
      }

      // Fallback alfabético
      const nameA = `${a.nombre} ${a.apellido}`.toLowerCase();
      const nameB = `${b.nombre} ${b.apellido}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return leaderboardWithTime.map((u, index) => ({
      ...u,
      puesto: index + 1
    }));
  }

  // Helper to calculate standings
  calculateLocalStandings(matches) {
    const groups = {};
    matches.forEach(match => {
      if (!match.grupo) return;
      const gName = match.grupo;
      if (!groups[gName]) {
        groups[gName] = {};
      }
      [match.equipo_a, match.equipo_b].forEach(teamName => {
        if (!groups[gName][teamName]) {
          groups[gName][teamName] = {
            equipo: teamName,
            pj: 0,
            pg: 0,
            pe: 0,
            pp: 0,
            gf: 0,
            gc: 0,
            dg: 0,
            pts: 0
          };
        }
      });
    });

    matches.forEach(match => {
      if (!match.grupo || !match.resultado) return;
      const gName = match.grupo;
      const teamA = match.equipo_a;
      const teamB = match.equipo_b;
      const statsA = groups[gName][teamA];
      const statsB = groups[gName][teamB];
      if (!statsA || !statsB) return;

      statsA.pj += 1;
      statsB.pj += 1;
      const golesA = match.goles_a !== null ? Number(match.goles_a) : 0;
      const golesB = match.goles_b !== null ? Number(match.goles_b) : 0;

      statsA.gf += golesA;
      statsA.gc += golesB;
      statsA.dg = statsA.gf - statsA.gc;

      statsB.gf += golesB;
      statsB.gc += golesA;
      statsB.dg = statsB.gf - statsB.gc;

      if (match.resultado === 'gana_a') {
        statsA.pg += 1;
        statsA.pts += 3;
        statsB.pp += 1;
      } else if (match.resultado === 'gana_b') {
        statsB.pg += 1;
        statsB.pts += 3;
        statsA.pp += 1;
      } else if (match.resultado === 'empate') {
        statsA.pe += 1;
        statsA.pts += 1;
        statsB.pe += 1;
        statsB.pts += 1;
      }
    });

    const sortedGroups = {};
    Object.keys(groups).sort().forEach(gName => {
      sortedGroups[gName] = Object.values(groups[gName]).sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.dg !== a.dg) return b.dg - a.dg;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.equipo.localeCompare(b.equipo);
      });
    });

    return sortedGroups;
  }

  // Lógica de cálculo y automatización del bracket mundialista
  async calculateAndUpdateBracket() {
    await this.init();

    const BRACKET_MATCHES_DEF = [
      // 16avos de Final (Matches 73 to 88)
      { numero_partido: 73, fase: '16avos', equipo_a: '2º Grupo A', equipo_b: '2º Grupo B', fecha_hora: '2026-06-28T14:00:00-05:00', sede: 'Estadio Los Angeles', ciudad: 'Los Ángeles, US 🇺🇸' },
      { numero_partido: 74, fase: '16avos', equipo_a: '1º Grupo E', equipo_b: '3º Grupo A/B/C/D/F', fecha_hora: '2026-06-29T15:30:00-05:00', sede: 'Estadio Boston', ciudad: 'Boston, US 🇺🇸' },
      { numero_partido: 75, fase: '16avos', equipo_a: '1º Grupo F', equipo_b: '2º Grupo C', fecha_hora: '2026-06-29T20:00:00-05:00', sede: 'Estadio Monterrey', ciudad: 'Monterrey, MX 🇲🇽' },
      { numero_partido: 76, fase: '16avos', equipo_a: '1º Grupo C', equipo_b: '2º Grupo F', fecha_hora: '2026-06-29T12:00:00-05:00', sede: 'Estadio Houston', ciudad: 'Houston, US 🇺🇸' },
      { numero_partido: 77, fase: '16avos', equipo_a: '1º Grupo I', equipo_b: '3º Grupo C/D/F/G/H', fecha_hora: '2026-06-30T16:00:00-05:00', sede: 'Estadio Nueva York/Nueva Jersey', ciudad: 'Nueva Jersey, US 🇺🇸' },
      { numero_partido: 78, fase: '16avos', equipo_a: '2º Grupo E', equipo_b: '2º Grupo I', fecha_hora: '2026-06-30T12:00:00-05:00', sede: 'Estadio Dallas', ciudad: 'Dallas, US 🇺🇸' },
      { numero_partido: 79, fase: '16avos', equipo_a: '1º Grupo A', equipo_b: '3º Grupo C/E/F/H/I', fecha_hora: '2026-06-30T20:00:00-05:00', sede: 'Estadio Ciudad de México', ciudad: 'Ciudad de México, MX 🇲🇽' },
      { numero_partido: 80, fase: '16avos', equipo_a: '1º Grupo L', equipo_b: '3º Grupo E/H/I/J/K', fecha_hora: '2026-07-01T11:00:00-05:00', sede: 'Estadio Atlanta', ciudad: 'Atlanta, US 🇺🇸' },
      { numero_partido: 81, fase: '16avos', equipo_a: '1º Grupo D', equipo_b: '3º Grupo B/E/F/I/J', fecha_hora: '2026-07-01T15:00:00-05:00', sede: 'Estadio Seattle', ciudad: 'Seattle, US 🇺🇸' },
      { numero_partido: 82, fase: '16avos', equipo_a: '1º Grupo G', equipo_b: '3º Grupo A/E/H/I/J', fecha_hora: '2026-07-01T19:00:00-05:00', sede: 'Estadio de la Bahía de San Francisco', ciudad: 'Área de la Bahía de San Francisco, US 🇺🇸' },
      { numero_partido: 83, fase: '16avos', equipo_a: '2º Grupo K', equipo_b: '2º Grupo L', fecha_hora: '2026-07-02T14:00:00-05:00', sede: 'Estadio Los Angeles', ciudad: 'Los Ángeles, US 🇺🇸' },
      { numero_partido: 84, fase: '16avos', equipo_a: '1º Grupo H', equipo_b: '2º Grupo J', fecha_hora: '2026-07-02T18:00:00-05:00', sede: 'Estadio de Toronto', ciudad: 'Toronto, CA 🇨🇦' },
      { numero_partido: 85, fase: '16avos', equipo_a: '1º Grupo B', equipo_b: '3º Grupo E/F/G/I/J', fecha_hora: '2026-07-02T22:00:00-05:00', sede: 'Estadio BC Place Vancouver', ciudad: 'Vancouver, CA 🇨🇦' },
      { numero_partido: 86, fase: '16avos', equipo_a: '1º Grupo J', equipo_b: '2º Grupo H', fecha_hora: '2026-07-03T17:00:00-05:00', sede: 'Estadio Miami', ciudad: 'Miami, US 🇺🇸' },
      { numero_partido: 87, fase: '16avos', equipo_a: '1º Grupo K', equipo_b: '3º Grupo D/E/I/J/L', fecha_hora: '2026-07-03T20:30:00-05:00', sede: 'Estadio Kansas City', ciudad: 'Kansas City, US 🇺🇸' },
      { numero_partido: 88, fase: '16avos', equipo_a: '2º Grupo D', equipo_b: '2º Grupo G', fecha_hora: '2026-07-03T13:00:00-05:00', sede: 'Estadio Dallas', ciudad: 'Dallas, US 🇺🇸' },

      // Octavos de Final (Matches 89 to 96)
      { numero_partido: 89, fase: 'Octavos', equipo_a: 'Ganador M73', equipo_b: 'Ganador M75', fecha_hora: '2026-07-04T16:00:00-05:00', sede: 'MetLife Stadium', ciudad: 'Nueva York, US 🇺🇸' },
      { numero_partido: 90, fase: 'Octavos', equipo_a: 'Ganador M74', equipo_b: 'Ganador M77', fecha_hora: '2026-07-04T21:00:00-05:00', sede: 'SoFi Stadium', ciudad: 'Los Angeles, US 🇺🇸' },
      { numero_partido: 91, fase: 'Octavos', equipo_a: 'Ganador M76', equipo_b: 'Ganador M78', fecha_hora: '2026-07-05T16:00:00-05:00', sede: 'AT&T Stadium', ciudad: 'Dallas, US 🇺🇸' },
      { numero_partido: 92, fase: 'Octavos', equipo_a: 'Ganador M79', equipo_b: 'Ganador M80', fecha_hora: '2026-07-05T21:00:00-05:00', sede: 'BC Place', ciudad: 'Vancouver, CA 🇨🇦' },
      { numero_partido: 93, fase: 'Octavos', equipo_a: 'Ganador M83', equipo_b: 'Ganador M84', fecha_hora: '2026-07-06T16:00:00-05:00', sede: 'Gillette Stadium', ciudad: 'Boston, US 🇺🇸' },
      { numero_partido: 94, fase: 'Octavos', equipo_a: 'Ganador M81', equipo_b: 'Ganador M82', fecha_hora: '2026-07-06T21:00:00-05:00', sede: 'Mercedes-Benz Stadium', ciudad: 'Atlanta, US 🇺🇸' },
      { numero_partido: 95, fase: 'Octavos', equipo_a: 'Ganador M86', equipo_b: 'Ganador M88', fecha_hora: '2026-07-07T16:00:00-05:00', sede: 'Estadio Azteca', ciudad: 'Ciudad de México, MX 🇲🇽' },
      { numero_partido: 96, fase: 'Octavos', equipo_a: 'Ganador M85', equipo_b: 'Ganador M87', fecha_hora: '2026-07-07T21:00:00-05:00', sede: 'Hard Rock Stadium', ciudad: 'Miami, US 🇺🇸' },

      // Cuartos de Final (Matches 97 to 100)
      { numero_partido: 97, fase: 'Cuartos', equipo_a: 'Ganador M89', equipo_b: 'Ganador M90', fecha_hora: '2026-07-09T17:00:00-05:00', sede: 'Gillette Stadium', ciudad: 'Boston, US 🇺🇸' },
      { numero_partido: 98, fase: 'Cuartos', equipo_a: 'Ganador M93', equipo_b: 'Ganador M94', fecha_hora: '2026-07-10T17:00:00-05:00', sede: 'SoFi Stadium', ciudad: 'Los Angeles, US 🇺🇸' },
      { numero_partido: 99, fase: 'Cuartos', equipo_a: 'Ganador M91', equipo_b: 'Ganador M92', fecha_hora: '2026-07-11T17:00:00-05:00', sede: 'MetLife Stadium', ciudad: 'Nueva York, US 🇺🇸' },
      { numero_partido: 100, fase: 'Cuartos', equipo_a: 'Ganador M95', equipo_b: 'Ganador M96', fecha_hora: '2026-07-12T17:00:00-05:00', sede: 'Arrowhead Stadium', ciudad: 'Kansas City, US 🇺🇸' },

      // Semifinales (Matches 101 to 102)
      { numero_partido: 101, fase: 'Semifinal', equipo_a: 'Ganador M97', equipo_b: 'Ganador M98', fecha_hora: '2026-07-15T19:00:00-05:00', sede: 'AT&T Stadium', ciudad: 'Dallas, US 🇺🇸' },
      { numero_partido: 102, fase: 'Semifinal', equipo_a: 'Ganador M99', equipo_b: 'Ganador M100', fecha_hora: '2026-07-16T19:00:00-05:00', sede: 'Mercedes-Benz Stadium', ciudad: 'Atlanta, US 🇺🇸' },

      // Gran Final (Match 104)
      { numero_partido: 104, fase: 'Final', equipo_a: 'Ganador M101', equipo_b: 'Ganador M102', fecha_hora: '2026-07-19T16:00:00-05:00', sede: 'MetLife Stadium', ciudad: 'Nueva York/Nueva Jersey, US 🇺🇸' }
    ];

    // 1. Garantizar la existencia de los partidos de playoffs en la base de datos
    const { data: existing, error: fetchError } = await this.client
      .from('partidos')
      .select('id, numero_partido, equipo_a, equipo_b, resultado')
      .gte('numero_partido', 73);

    if (fetchError) throw fetchError;

    const existingMap = {};
    if (existing) {
      existing.forEach(m => {
        existingMap[m.numero_partido] = m;
      });
    }

    const missingMatches = BRACKET_MATCHES_DEF.filter(m => !existingMap[m.numero_partido]);
    if (missingMatches.length > 0) {
      const { error: insertError } = await this.client
        .from('partidos')
        .insert(missingMatches);
      if (insertError) throw insertError;
    }

    // Volver a consultar para tener la lista completa real de partidos en la base de datos
    const { data: allMatches, error: allErr } = await this.client
      .from('partidos')
      .select('*')
      .order('numero_partido', { ascending: true });

    if (allErr) throw allErr;

    // 2. Calcular tablas de posiciones locales
    const groupMatches = allMatches.filter(m => m.numero_partido <= 72);
    const standings = this.calculateLocalStandings(groupMatches);

    // Helper para validar si un grupo está completamente terminado
    const isGroupComplete = (groupStandings) => {
      const totalPj = groupStandings.reduce((sum, t) => sum + t.pj, 0);
      return totalPj === 12; // 6 partidos por grupo * 2 equipos = 12 partidos jugados en total
    };

    const updates = {}; // mapeo: numero_partido -> { equipo_a, equipo_b }

    // 3. Emparejar clasificados directos (1º y 2º) de grupos completados
    const groupsList = ['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D', 'Grupo E', 'Grupo F', 'Grupo G', 'Grupo H', 'Grupo I', 'Grupo J', 'Grupo K', 'Grupo L'];
    
    // Mapeo de partidos 73-88 a sus reglas de 1º y 2º
    const groupWinnersMapping = {
      73: [
        { group: 'Grupo A', pos: 2, field: 'equipo_a' },
        { group: 'Grupo B', pos: 2, field: 'equipo_b' }
      ],
      74: { group: 'Grupo E', pos: 1, field: 'equipo_a' },
      75: [
        { group: 'Grupo F', pos: 1, field: 'equipo_a' },
        { group: 'Grupo C', pos: 2, field: 'equipo_b' }
      ],
      76: [
        { group: 'Grupo C', pos: 1, field: 'equipo_a' },
        { group: 'Grupo F', pos: 2, field: 'equipo_b' }
      ],
      77: { group: 'Grupo I', pos: 1, field: 'equipo_a' },
      78: [
        { group: 'Grupo E', pos: 2, field: 'equipo_a' },
        { group: 'Grupo I', pos: 2, field: 'equipo_b' }
      ],
      79: { group: 'Grupo A', pos: 1, field: 'equipo_a' },
      80: { group: 'Grupo L', pos: 1, field: 'equipo_a' },
      81: { group: 'Grupo D', pos: 1, field: 'equipo_a' },
      82: { group: 'Grupo G', pos: 1, field: 'equipo_a' },
      83: [
        { group: 'Grupo K', pos: 2, field: 'equipo_a' },
        { group: 'Grupo L', pos: 2, field: 'equipo_b' }
      ],
      84: [
        { group: 'Grupo H', pos: 1, field: 'equipo_a' },
        { group: 'Grupo J', pos: 2, field: 'equipo_b' }
      ],
      85: { group: 'Grupo B', pos: 1, field: 'equipo_a' },
      86: [
        { group: 'Grupo J', pos: 1, field: 'equipo_a' },
        { group: 'Grupo H', pos: 2, field: 'equipo_b' }
      ],
      87: { group: 'Grupo K', pos: 1, field: 'equipo_a' },
      88: [
        { group: 'Grupo D', pos: 2, field: 'equipo_a' },
        { group: 'Grupo G', pos: 2, field: 'equipo_b' }
      ]
    };

    Object.keys(groupWinnersMapping).forEach(matchNum => {
      const num = Number(matchNum);
      const rule = groupWinnersMapping[num];
      
      const applyRule = (r) => {
        const groupSt = standings[r.group];
        if (groupSt && isGroupComplete(groupSt)) {
          const team = groupSt[r.pos - 1].equipo;
          updates[num] = { ...updates[num], [r.field]: team };
        }
      };

      if (Array.isArray(rule)) {
        rule.forEach(applyRule);
      } else {
        applyRule(rule);
      }
    });

    // 4. Si TODOS los grupos están terminados, calcular los 8 mejores terceros y distribuirlos
    const allCompleted = groupsList.every(g => standings[g] && isGroupComplete(standings[g]));
    if (allCompleted) {
      const thirdPlaces = groupsList.map(g => ({
        group: g,
        ...standings[g][2]
      }));
      
      // Ordenar terceros según criterios FIFA
      thirdPlaces.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.dg !== a.dg) return b.dg - a.dg;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.equipo.localeCompare(b.equipo);
      });

      const best8Thirds = thirdPlaces.slice(0, 8);

      const slots = [
        { num: 74, allowed: ['Grupo A', 'Grupo B', 'Grupo C', 'Grupo D', 'Grupo F'], winner: 'Grupo E' },
        { num: 77, allowed: ['Grupo C', 'Grupo D', 'Grupo F', 'Grupo G', 'Grupo H'], winner: 'Grupo I' },
        { num: 79, allowed: ['Grupo C', 'Grupo E', 'Grupo F', 'Grupo H', 'Grupo I'], winner: 'Grupo A' },
        { num: 80, allowed: ['Grupo E', 'Grupo H', 'Grupo I', 'Grupo J', 'Grupo K'], winner: 'Grupo L' },
        { num: 81, allowed: ['Grupo B', 'Grupo E', 'Grupo F', 'Grupo I', 'Grupo J'], winner: 'Grupo D' },
        { num: 82, allowed: ['Grupo A', 'Grupo E', 'Grupo H', 'Grupo I', 'Grupo J'], winner: 'Grupo G' },
        { num: 85, allowed: ['Grupo E', 'Grupo F', 'Grupo G', 'Grupo I', 'Grupo J'], winner: 'Grupo B' },
        { num: 87, allowed: ['Grupo D', 'Grupo E', 'Grupo I', 'Grupo J', 'Grupo L'], winner: 'Grupo K' }
      ];

      // Algoritmo de backtracking para asignación balanceada de terceros clasificados
      const assignThirds = (teams, currentSlots, assignment = {}) => {
        if (teams.length === 0) return assignment;
        const team = teams[0];
        const restTeams = teams.slice(1);

        for (let i = 0; i < currentSlots.length; i++) {
          const slot = currentSlots[i];
          if (slot.allowed.includes(team.group) && slot.winner !== team.group) {
            const nextSlots = currentSlots.filter(s => s.num !== slot.num);
            const result = assignThirds(restTeams, nextSlots, { ...assignment, [slot.num]: team.equipo });
            if (result) return result;
          }
        }
        return null;
      };

      const thirdAssignments = assignThirds(best8Thirds, slots);
      if (thirdAssignments) {
        Object.keys(thirdAssignments).forEach(matchNum => {
          const num = Number(matchNum);
          updates[num] = { ...updates[num], equipo_b: thirdAssignments[num] };
        });
      }
    }

    // 5. Progresar ganadores para llaves eliminatorias de Octavos en adelante
    const getMatchWinner = (matchNum, currentMatches) => {
      const match = currentMatches.find(m => m.numero_partido === matchNum);
      if (!match || match.resultado === null || match.resultado === '') return null;
      return match.resultado === 'gana_a' ? match.equipo_a : match.equipo_b;
    };

    const knockoutProgressions = [
      // Octavos
      { num: 89, source_a: 73, source_b: 75 },
      { num: 90, source_a: 74, source_b: 77 },
      { num: 91, source_a: 76, source_b: 78 },
      { num: 92, source_a: 79, source_b: 80 },
      { num: 93, source_a: 83, source_b: 84 },
      { num: 94, source_a: 81, source_b: 82 },
      { num: 95, source_a: 86, source_b: 88 },
      { num: 96, source_a: 85, source_b: 87 },
      // Cuartos
      { num: 97, source_a: 89, source_b: 90 },
      { num: 98, source_a: 93, source_b: 94 },
      { num: 99, source_a: 91, source_b: 92 },
      { num: 100, source_a: 95, source_b: 96 },
      // Semifinales
      { num: 101, source_a: 97, source_b: 98 },
      { num: 102, source_a: 99, source_b: 100 },
      // Final
      { num: 104, source_a: 101, source_b: 102 }
    ];

    knockoutProgressions.forEach(prog => {
      const winnerA = getMatchWinner(prog.source_a, allMatches);
      const winnerB = getMatchWinner(prog.source_b, allMatches);
      
      if (winnerA) {
        updates[prog.num] = { ...updates[prog.num], equipo_a: winnerA };
      }
      if (winnerB) {
        updates[prog.num] = { ...updates[prog.num], equipo_b: winnerB };
      }
    });

    // 6. Aplicar actualizaciones en lote (sincronizando equipos y metadatos oficiales del fixture)
    const updatePromises = allMatches.filter(m => m.numero_partido >= 73).map(match => {
      const num = match.numero_partido;
      const def = BRACKET_MATCHES_DEF.find(d => d.numero_partido === num);
      if (!def) return Promise.resolve();

      const updateObj = updates[num] || {};
      const payload = {};
      let changed = false;

      // Si el equipo calculado está definido se usa, de lo contrario se revierte al placeholder oficial
      const targetA = updateObj.equipo_a !== undefined ? updateObj.equipo_a : def.equipo_a;
      if (match.equipo_a !== targetA) {
        payload.equipo_a = targetA;
        changed = true;
      }

      const targetB = updateObj.equipo_b !== undefined ? updateObj.equipo_b : def.equipo_b;
      if (match.equipo_b !== targetB) {
        payload.equipo_b = targetB;
        changed = true;
      }

      // Sincronizar fechas, horas, sedes y ciudades oficiales si difieren
      const dbTime = new Date(match.fecha_hora).getTime();
      const defTime = new Date(def.fecha_hora).getTime();
      if (dbTime !== defTime) {
        payload.fecha_hora = def.fecha_hora;
        changed = true;
      }
      if (match.sede !== def.sede) {
        payload.sede = def.sede;
        changed = true;
      }
      if (match.ciudad !== def.ciudad) {
        payload.ciudad = def.ciudad;
        changed = true;
      }

      if (changed) {
        return this.client
          .from('partidos')
          .update(payload)
          .eq('id', match.id)
          .then(({ error }) => {
            if (error) throw error;
          });
      }
      return Promise.resolve();
    });

    await Promise.all(updatePromises);
    return { success: true };
  }

  // Obtener lista completa de usuarios (Vista exclusiva del Administrador)
  async getUsuariosAdmin() {
    await this.init();
    const { data, error } = await this.client
      .from('usuarios')
      .select('id, email, nombre, apellido, puntos_totales, rol_usuario')
      .order('creado_en', { ascending: false });
    if (error) throw error;
    return data;
  }

  // Actualizar los goles oficiales de un partido (Acción de Administrador)
  async updateMatchGoals(partidoId, golesA, golesB) {
    await this.init();
    
    let resultado = null;
    if (golesA !== '' && golesA !== null && golesB !== '' && golesB !== null) {
      const numA = Number(golesA);
      const numB = Number(golesB);
      if (numA > numB) {
        resultado = 'gana_a';
      } else if (numA < numB) {
        resultado = 'gana_b';
      } else {
        resultado = 'empate';
      }
    }

    const { error } = await this.client
      .from('partidos')
      .update({ 
        goles_a: golesA === '' || golesA === null ? null : Number(golesA), 
        goles_b: golesB === '' || golesB === null ? null : Number(golesB),
        resultado: resultado
      })
      .eq('id', partidoId);

    if (error) throw error;
    return { success: true };
  }

  // Actualizar la información de un partido (Acción de Administrador)
  async updateMatchInfo(partidoId, equipoA, equipoB, fechaHora) {
    await this.init();
    
    const { error } = await this.client
      .from('partidos')
      .update({ 
        equipo_a: equipoA,
        equipo_b: equipoB,
        fecha_hora: fechaHora
      })
      .eq('id', partidoId);

    if (error) throw error;
    return { success: true };
  }

  // Obtener el resumen de aciertos en las últimas 24 horas
  async getDailyResults(userId) {
    await this.init();
    
    const hoy = new Date();
    const hace24Horas = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const { data: partidos, error: ep } = await this.client
      .from('view_partidos_pasados')
      .select('*')
      .gte('fecha_hora', hace24Horas.toISOString())
      .lte('fecha_hora', hoy.toISOString())
      .not('resultado', 'is', null);

    if (ep) throw ep;

    if (partidos.length === 0) {
      return { jugadosHoy: [], aciertos: 0 };
    }

    const { data: pronosticos, error: epr } = await this.client
      .from('pronosticos')
      .select('*')
      .eq('usuario_id', userId)
      .in('partido_id', partidos.map(p => p.id));

    if (epr) throw epr;

    const jugadosHoy = partidos.map(partido => {
      const pronostico = pronosticos.find(p => p.partido_id === partido.id);
      return {
        id: partido.id,
        equipo_a: partido.equipo_a,
        equipo_b: partido.equipo_b,
        goles_a: partido.goles_a,
        goles_b: partido.goles_b,
        resultado: partido.resultado,
        prediccion_usuario: pronostico ? pronostico.prediccion : 'Ninguno',
        acertado: pronostico ? (pronostico.prediccion === partido.resultado) : false
      };
    });

    const aciertos = jugadosHoy.filter(j => j.acertado).length;

    return { jugadosHoy, aciertos };
  }
}

// Inicialización de la base de datos con tus credenciales asignadas
export function getDatabase() {
  const url = 'https://oefldbmikcdhrdmatrsx.supabase.co';
  const key = 'sb_publishable_bq0e5WKTPJrQAeZZJULnVQ_BO4RwK1z';
  
  console.log('Pronósticos SoftMedia: Conectando directamente a las tablas reales de Supabase...');
  return new SupabaseRealClient(url, key);
}

export const db = getDatabase();
