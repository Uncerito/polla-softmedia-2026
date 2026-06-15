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

    let pronosticosFinMap = {}; // mapping: usuario_id -> count of puntos_ganados > 0
    if (totalFinished > 0) {
      const { data: pronosticosFin, error: pfError } = await this.client
        .from('pronosticos')
        .select('usuario_id, puntos_ganados')
        .in('partido_id', finishedMatchIds);
        
      if (!pfError && pronosticosFin) {
        pronosticosFin.forEach(p => {
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

    // Agregar la hora de la apuesta del último partido terminado a cada usuario, más estadísticas
    const leaderboardWithTime = data.map(u => {
      const acertados = pronosticosFinMap[u.id] || 0;
      const perdidos = Math.max(0, totalFinished - acertados);
      return {
        ...u,
        fecha_apuesta_ultimo_partido: pronosticosMap[u.id] || null,
        partido_referencia_descripcion: partidoReferenciaDescripcion,
        partido_referencia_es_en_curso: esEnCurso,
        acertados,
        perdidos
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
