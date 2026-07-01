const { createClient } = require('@supabase/supabase-js');

const url = 'https://oefldbmikcdhrdmatrsx.supabase.co';
const key = 'sb_publishable_bq0e5WKTPJrQAeZZJULnVQ_BO4RwK1z';

const supabase = createClient(url, key);

async function run() {
  try {
    console.log('Logging in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'jorge.aranda@softmediaconsultores.com',
      password: 'SoftMedia2026!'
    });

    if (authError) {
      throw authError;
    }
    console.log('Logged in successfully!');

    console.log('Fetching finished matches...');
    const { data: partidos, error: errorPartidos } = await supabase
      .from('partidos')
      .select('*')
      .not('resultado', 'is', null);

    if (errorPartidos) throw errorPartidos;
    console.log(`Found ${partidos.length} finished matches.`);

    if (partidos.length === 0) {
      console.log('No finished matches to inspect.');
      return;
    }

    console.log('Fetching all predictions for these matches...');
    const { data: pronosticos, error: errorPronos } = await supabase
      .from('pronosticos')
      .select('*, usuarios(nombre, apellido)')
      .in('partido_id', partidos.map(p => p.id));

    if (errorPronos) throw errorPronos;
    console.log(`Found ${pronosticos.length} predictions.`);

    console.log('\n--- Analyzing Predictions for Draws ---');
    for (const pr of pronosticos) {
      const match = partidos.find(p => p.id === pr.partido_id);
      if (!match) continue;

      if (pr.prediccion === 'empate' && match.resultado === 'empate') {
        const exactMatch = (pr.goles_a === match.goles_a && pr.goles_b === match.goles_b);
        const user = pr.usuarios ? `${pr.usuarios.nombre} ${pr.usuarios.apellido}` : pr.usuario_id;
        
        console.log(`User: ${user}`);
        console.log(`Match #${match.numero_partido}: ${match.equipo_a} vs ${match.equipo_b}`);
        console.log(`Prediction: ${pr.goles_a}-${pr.goles_b} (PK: ${pr.prediccion_penales})`);
        console.log(`Actual Result: ${match.goles_a}-${match.goles_b} (PK: ${match.ganador_penales})`);
        console.log(`Exact Match: ${exactMatch}`);
        console.log(`Points Awarded in DB: ${pr.puntos_ganados}`);
        console.log('--------------------------------------');
      }
    }

  } catch (error) {
    console.error('Error during inspection:', error);
  }
}

run();
