import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import * as Lucide from 'lucide-react';

const html = htm.bind(React.createElement);
const { BarChart3, TrendingUp, Users, Percent, Clock, Trophy, Target } = Lucide;

export function StatsView({ session, fixture = [], leaderboard = [] }) {
  const [activeTab, setActiveTab] = useState('personales'); // 'personales' | 'globales'
  const [chartReady, setChartReady] = useState(() => typeof window !== 'undefined' && !!window.Chart);

  useEffect(() => {
    if (chartReady) return;
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && window.Chart) {
        setChartReady(true);
        clearInterval(interval);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [chartReady]);

  // Refs para los gráficos de Chart.js
  const trendChartRef = useRef(null);
  const evolutionChartRef = useRef(null);
  const compareChartRef = useRef(null);
  const leadersChartRef = useRef(null);

  // Cálculos Personales
  const totalPartidos = fixture.length;
  const totalFinalizados = fixture.filter(p => p.resultado !== null).length;
  const totalPronosticados = fixture.filter(p => p.prediccion_usuario !== null).length;
  const totalPuntos = fixture.reduce((sum, p) => sum + (p.puntos_pronostico || 0), 0);
  const totalAcertados = fixture.filter(p => p.puntos_pronostico > 0).length;
  const efectividad = totalFinalizados > 0 ? Math.round((totalAcertados / totalFinalizados) * 100) : 0;

  // Tendencias de voto
  const userGanaA = fixture.filter(p => p.prediccion_usuario === 'gana_a').length;
  const userEmpate = fixture.filter(p => p.prediccion_usuario === 'empate').length;
  const userGanaB = fixture.filter(p => p.prediccion_usuario === 'gana_b').length;
  const totalTendencias = userGanaA + userEmpate + userGanaB;

  const pctA = totalTendencias > 0 ? Math.round((userGanaA / totalTendencias) * 100) : 0;
  const pctEmpate = totalTendencias > 0 ? Math.round((userEmpate / totalTendencias) * 100) : 0;
  const pctB = totalTendencias > 0 ? Math.round((userGanaB / totalTendencias) * 100) : 0;

  // Cálculos Globales / Comunidad
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    const ptsA = typeof a.puntos_totales === 'number' ? a.puntos_totales : (a.puntos || 0);
    const ptsB = typeof b.puntos_totales === 'number' ? b.puntos_totales : (b.puntos || 0);
    if (ptsB !== ptsA) return ptsB - ptsA;
    const nameA = `${a.nombre} ${a.apellido}`.toLowerCase();
    const nameB = `${b.nombre} ${b.apellido}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const totalJugadores = sortedLeaderboard.length;
  const promedioPuntos = totalJugadores > 0 ? (sortedLeaderboard.reduce((sum, u) => {
    const pts = typeof u.puntos_totales === 'number' ? u.puntos_totales : (u.puntos || 0);
    return sum + pts;
  }, 0) / totalJugadores).toFixed(1) : 0;

  const lider = sortedLeaderboard[0];
  const miPosicion = sortedLeaderboard.findIndex(u => u.id === session.user.id) + 1;

  // Lista de partidos finalizados ordenada cronológicamente
  const finalizadosSorted = [...fixture]
    .filter(p => p.resultado !== null)
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));

  // Efecto para inicializar gráficos de la pestaña "Personales"
  useEffect(() => {
    if (!chartReady) return;
    if (activeTab !== 'personales') return;

    let trendChartInstance = null;
    let evolutionChartInstance = null;

    // 1. Gráfico de Dona: Tendencias de pronósticos
    if (trendChartRef.current && window.Chart) {
      const ctx = trendChartRef.current.getContext('2d');
      trendChartInstance = new window.Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Gana Local (A)', 'Empate', 'Gana Visita (B)'],
          datasets: [{
            data: [userGanaA, userEmpate, userGanaB],
            backgroundColor: [
              'rgba(217, 26, 35, 0.85)',   // Rojo Perú
              'rgba(0, 43, 127, 0.85)',    // Azul Chile
              'rgba(116, 172, 223, 0.85)'  // Celeste Argentina
            ],
            borderColor: [
              '#d91a23',
              '#002b7f',
              '#74acdf'
            ],
            borderWidth: 1.5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                boxWidth: 12,
                font: { family: 'Outfit', size: 10, weight: '600' },
                color: '#475569',
                padding: 15
              }
            }
          },
          cutout: '65%'
        }
      });
    }

    // 2. Gráfico de Línea: Evolución de puntos acumulados
    if (evolutionChartRef.current && finalizadosSorted.length > 0 && window.Chart) {
      const ctx = evolutionChartRef.current.getContext('2d');

      let cumulative = 0;
      const dataPoints = [];
      const labels = [];

      dataPoints.push(0);
      labels.push('Inicio');

      finalizadosSorted.forEach((m) => {
        cumulative += (m.puntos_pronostico || 0);
        dataPoints.push(cumulative);
        labels.push(`P#${m.numero_partido}`);
      });

      evolutionChartInstance = new window.Chart(ctx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [{
            label: 'Puntos',
            data: dataPoints,
            borderColor: '#74acdf',
            backgroundColor: 'rgba(116, 172, 223, 0.08)',
            borderWidth: 2.5,
            fill: true,
            tension: 0.2,
            pointBackgroundColor: '#74acdf',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 3.5,
            pointHoverRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1,
                font: { family: 'Outfit', size: 9 },
                color: '#64748b'
              },
              grid: { color: 'rgba(0, 0, 0, 0.06)' }
            },
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Outfit', size: 9 }, color: '#64748b' }
            }
          }
        }
      });
    }

    return () => {
      if (trendChartInstance) trendChartInstance.destroy();
      if (evolutionChartInstance) evolutionChartInstance.destroy();
    };
  }, [activeTab, fixture, userGanaA, userEmpate, userGanaB, chartReady]);

  // Efecto para inicializar gráficos de la pestaña "Globales"
  useEffect(() => {
    if (!chartReady) return;
    if (activeTab !== 'globales') return;

    let compareChartInstance = null;
    let leadersChartInstance = null;

    const liderPts = lider ? (typeof lider.puntos_totales === 'number' ? lider.puntos_totales : (lider.puntos || 0)) : 0;

    // 3. Gráfico de Barras: Comparación del usuario con el promedio y el líder
    if (compareChartRef.current && window.Chart) {
      const ctx = compareChartRef.current.getContext('2d');
      compareChartInstance = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Tú', 'Promedio Grupo', 'Líder'],
          datasets: [{
            data: [totalPuntos, Number(promedioPuntos), liderPts],
            backgroundColor: [
              'rgba(116, 172, 223, 0.85)',
              'rgba(0, 194, 93, 0.8)',
              'rgba(246, 180, 38, 0.85)'
            ],
            borderColor: [
              '#74acdf',
              '#00c25d',
              '#f6b426'
            ],
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: { font: { family: 'Outfit', size: 9 }, color: '#64748b' },
              grid: { color: 'rgba(0, 0, 0, 0.06)' }
            },
            x: {
              grid: { display: false },
              ticks: { font: { family: 'Outfit', size: 9, weight: '700' }, color: '#64748b' }
            }
          }
        }
      });
    }

    // 4. Gráfico de Barras Horizontales: Top 5 de competidores
    const top5 = sortedLeaderboard.slice(0, 5);
    if (leadersChartRef.current && top5.length > 0 && window.Chart) {
      const ctx = leadersChartRef.current.getContext('2d');
      const labels = top5.map(u => `${u.nombre} ${u.apellido.substring(0, 1)}.`);
      const data = top5.map(u => typeof u.puntos_totales === 'number' ? u.puntos_totales : (u.puntos || 0));

      const bgColors = top5.map(u => u.id === session.user.id ? 'rgba(59, 130, 246, 0.8)' : 'rgba(148, 163, 184, 0.35)');
      const borderColors = top5.map(u => u.id === session.user.id ? '#3b82f6' : '#cbd5e1');

      leadersChartInstance = new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            data: data,
            backgroundColor: bgColors,
            borderColor: borderColors,
            borderWidth: 1,
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              beginAtZero: true,
              ticks: { font: { family: 'Outfit', size: 9 }, color: '#64748b' },
              grid: { color: 'rgba(0, 0, 0, 0.06)' }
            },
            y: {
              grid: { display: false },
              ticks: { font: { family: 'Outfit', size: 9, weight: '700' }, color: '#64748b' }
            }
          }
        }
      });
    }

    return () => {
      if (compareChartInstance) compareChartInstance.destroy();
      if (leadersChartInstance) leadersChartInstance.destroy();
    };
  }, [activeTab, leaderboard, sortedLeaderboard, totalPuntos, promedioPuntos, lider, session, chartReady]);

  return html`
    <div class="stats-container space-y-5 relative z-10 text-slate-700">
      <!-- Banner Cabecera Mundialista (Con Trofeo de Copa del Mundo) -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#005a36] via-[#008f5c] to-[#04140c] p-4 md:p-5 text-white shadow-sm flex items-center justify-between mb-2">
        <!-- Elementos decorativos de fútbol -->
        <div class="absolute right-12 top-0 opacity-10 transform translate-x-6 -translate-y-6 pointer-events-none">
          <svg width="180" height="180" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90C27.9 90 10 72.1 10 50S27.9 10 50 10s40 17.9 40 40-17.9 40-40 40z"/>
          </svg>
        </div>
        
        <div class="relative z-10 text-left">
          <div class="flex items-center space-x-1.5">
            <span class="px-2 py-0.5 rounded-full bg-amber-400 text-[#005a36] text-[8px] font-black uppercase tracking-wider">FIFA WORLD CUP 2026</span>
            <span class="px-2 py-0.5 rounded-full bg-white/20 text-white text-[8px] font-bold uppercase tracking-wider">ANÁLISIS</span>
          </div>
          <h2 class="text-lg font-black font-outfit uppercase mt-2 tracking-tight">Estadísticas y Análisis</h2>
          <p class="text-[10px] md:text-xs text-slate-200/90 font-medium max-w-xl mt-1">Revisa tu rendimiento, completado de pronósticos y estadísticas del grupo.</p>
        </div>
        
        <!-- Copa del Mundo Decorativa Flotante -->
        <div class="relative flex-shrink-0 w-24 h-24 -my-4 -mr-2 flex items-center justify-center select-none z-10">
          <img src="./images/trofeo_mundial.png" class="max-h-full max-w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] transform rotate-6 hover:rotate-0 transition-transform duration-300 animate-pulse" alt="Trophy" />
        </div>
      </div>

      <div class="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit shadow-sm">
        <button onClick=${() => setActiveTab('personales')} class="px-4 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'personales' ? 'bg-[#005a36] text-white font-extrabold shadow-sm' : 'text-slate-550 hover:text-slate-800'}">Estadísticas Personales</button>
        <button onClick=${() => setActiveTab('globales')} class="px-4 py-1.5 rounded text-xs font-bold transition-all ${activeTab === 'globales' ? 'bg-[#005a36] text-white font-extrabold shadow-sm' : 'text-slate-550 hover:text-slate-800'}">Estadísticas del Grupo</button>
      </div>

      ${activeTab === 'personales'
      ? html`
            <div class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-[9px] font-bold uppercase tracking-wider text-slate-500">Puntaje Actual</span>
                    <span class="p-2 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                      <${Trophy} size=${14} />
                    </span>
                  </div>
                  <div class="my-4 flex items-center space-x-3.5">
                    <div class="flex items-baseline space-x-1.5">
                      <span class="text-3xl font-bold scoreboard-font text-slate-800 leading-none">${totalPuntos}</span>
                      <span class="text-xs font-bold text-slate-500 uppercase">Pts</span>
                    </div>
                  </div>
                  <p class="text-[11px] text-slate-700 mt-1 font-semibold">${totalAcertados} aciertos acumulados</p>
                  <div class="text-[9px] text-slate-500 font-semibold border-t border-slate-100 pt-2.5 mt-2">
                    Suma 1 punto por cada acierto exacto de resultado.
                  </div>
                </div>

                <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-[9px] font-bold uppercase tracking-wider text-slate-500">Porcentaje de Éxito</span>
                    <span class="p-2 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
                      <${Percent} size=${14} />
                    </span>
                  </div>
                  <div class="my-4 flex items-center space-x-4">
                    <div class="relative w-12 h-12 flex items-center justify-center bg-emerald-50 border-2 border-emerald-100 rounded-full select-none flex-shrink-0">
                      <span class="text-xs font-bold text-emerald-700 font-outfit">${efectividad}%</span>
                    </div>
                    <div>
                      <span class="text-xs font-bold text-slate-800 leading-tight block">Tasa de Aciertos</span>
                      <span class="text-[10px] font-semibold text-slate-550 block mt-0.5">${totalAcertados} acertados de ${totalFinalizados}</span>
                    </div>
                  </div>
                  <div class="text-[9px] text-slate-500 font-semibold border-t border-slate-100 pt-2.5">
                    Aciertos: ${totalAcertados} | Fallados: ${totalFinalizados - totalAcertados}
                  </div>
                </div>

                <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                  <div class="flex items-center justify-between">
                    <span class="text-[9px] font-bold uppercase tracking-wider text-slate-500">Pronósticos Completados</span>
                    <span class="p-2 rounded bg-purple-50 text-purple-600 border border-purple-100 shadow-sm">
                      <${Clock} size=${14} />
                    </span>
                  </div>
                  <div class="my-4">
                    <div class="flex items-baseline space-x-1.5">
                      <span class="text-3xl font-bold scoreboard-font text-slate-800 leading-none">${totalPronosticados}</span>
                      <span class="text-xs font-bold text-slate-400">/ ${totalPartidos}</span>
                    </div>
                    <p class="text-[11px] text-slate-600 mt-1.5 font-semibold">Partidos pronosticados en total</p>
                  </div>
                  <div class="w-full bg-slate-100 rounded h-2 overflow-hidden border border-slate-200">
                    <div style=${{ width: `${totalPartidos > 0 ? (totalPronosticados / totalPartidos) * 100 : 0}%` }} class="bg-[#008f5c] h-full rounded"></div>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                  <div class="flex items-center space-x-2.5 mb-3 border-b border-slate-100 pb-2">
                    <span class="p-1 rounded bg-amber-50 text-amber-600">
                      <${TrendingUp} size=${14} />
                    </span>
                    <h4 class="font-outfit font-bold text-slate-800 text-xs tracking-wider uppercase">Tendencia de Pronósticos</h4>
                  </div>
                  <div class="h-44 relative flex items-center justify-center">
                    ${!chartReady
          ? html`<div class="text-xs font-semibold text-slate-500 animate-pulse">Cargando gráfico analítico...</div>`
          : html`<canvas ref=${trendChartRef}></canvas>`
        }
                  </div>
                  <div class="text-[10px] text-slate-550 mt-2 text-center font-bold">
                    Votos: Gana A (<b>${userGanaA}</b>) | Empate (<b>${userEmpate}</b>) | Gana B (<b>${userGanaB}</b>)
                  </div>
                </div>

                <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                  <div class="flex items-center space-x-2.5 mb-3 border-b border-slate-100 pb-2">
                    <span class="p-1 rounded bg-emerald-50 text-emerald-600">
                      <${Trophy} size=${14} />
                    </span>
                    <h4 class="font-outfit font-bold text-slate-800 text-xs tracking-wider uppercase">Evolución de Puntos</h4>
                  </div>
                  ${finalizadosSorted.length === 0
          ? html`<div class="flex-grow flex items-center justify-center text-xs text-slate-500 h-44">No hay partidos finalizados para graficar la evolución.</div>`
          : html`
                        <div class="h-44 relative flex items-center justify-center">
                          ${!chartReady
              ? html`<div class="text-xs font-semibold text-slate-500 animate-pulse">Cargando gráfico analítico...</div>`
              : html`<canvas ref=${evolutionChartRef} class="w-full h-full"></canvas>`
            }
                        </div>
                      `
        }
                  <div class="text-[10px] text-slate-550 mt-2 text-center font-bold">
                    Progreso histórico acumulativo de puntos
                  </div>
                </div>
              </div>
            </div>
          `
      : html`
            <div class="space-y-6">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                  <span class="font-bold uppercase tracking-wider text-[9px] text-slate-500">Total Jugadores</span>
                  <div class="mt-3 flex items-baseline space-x-1.5">
                    <span class="text-2xl font-bold scoreboard-font text-slate-800">${totalJugadores}</span>
                    <span class="text-[10px] font-bold text-slate-500 uppercase">Colab.</span>
                  </div>
                  <div class="mt-2.5 text-[9px] text-slate-500 flex items-center space-x-1 border-t border-slate-100 pt-2">
                    <${Users} size=${10} /> <span>Grupo de SoftMedia</span>
                  </div>
                </div>

                <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                  <span class="font-bold uppercase tracking-wider text-[9px] text-slate-500">Tu Posición</span>
                  <div class="mt-3">
                    <span class="text-2xl font-bold scoreboard-font text-emerald-600">#${miPosicion > 0 ? miPosicion : '-'}</span>
                    <span class="text-[10px] font-bold text-slate-500 uppercase"> de ${totalJugadores}</span>
                  </div>
                  <div class="mt-2.5 text-[9px] text-slate-500 flex items-center space-x-1 border-t border-slate-100 pt-2">
                    <${Target} size=${10} class="text-emerald-650" /> <span>¡Sigue sumando!</span>
                  </div>
                </div>

                <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                  <span class="font-bold uppercase tracking-wider text-[9px] text-slate-500">Media de Puntos</span>
                  <div class="mt-3">
                    <span class="text-2xl font-bold scoreboard-font text-slate-800">${promedioPuntos}</span>
                    <span class="text-[10px] font-bold text-slate-500 uppercase"> Pts</span>
                  </div>
                  <div class="mt-2.5 text-[9px] text-slate-500 border-t border-slate-100 pt-2">
                    Rendimiento promedio general.
                  </div>
                </div>

                <div class="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between shadow-sm">
                  <span class="font-bold uppercase tracking-wider text-[9px] text-slate-500">Líder Actual</span>
                  <div class="mt-2 text-slate-700">
                    ${lider
          ? html`
                          <p class="text-[11px] font-bold truncate leading-none">${lider.nombre} ${lider.apellido}</p>
                          <p class="text-lg font-bold scoreboard-font text-amber-600 mt-1">${typeof lider.puntos_totales === 'number' ? lider.puntos_totales : (lider.puntos || 0)} pts</p>
                        `
          : html`<p class="text-[10px] text-slate-400">Cargando...</p>`
        }
                  </div>
                  <div class="mt-2 text-[9px] text-slate-500 border-t border-slate-100 pt-1.5 flex items-center space-x-1">
                    <${Trophy} size=${10} class="text-amber-500" /> <span>Puntero actual</span>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                  <div class="flex items-center space-x-2.5 mb-3 border-b border-slate-100 pb-2">
                    <span class="p-1 rounded bg-emerald-50 text-emerald-600">
                      <${Target} size=${14} />
                    </span>
                    <h4 class="font-outfit font-bold text-slate-800 text-xs tracking-wider uppercase">Tú vs Promedio</h4>
                  </div>
                  <div class="h-44 relative flex items-center justify-center">
                    ${!chartReady
          ? html`<div class="text-xs font-semibold text-slate-500 animate-pulse">Cargando comparación...</div>`
          : html`<canvas ref=${compareChartRef} class="w-full h-full"></canvas>`
        }
                  </div>
                  <div class="text-[10px] text-slate-500 mt-2 text-center font-bold">
                    Tu puntuación comparada con la media y el líder
                  </div>
                </div>

                <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                  <div class="flex items-center space-x-2.5 mb-3 border-b border-slate-100 pb-2">
                    <span class="p-1 rounded bg-amber-50 text-amber-600">
                      <${Trophy} size=${14} />
                    </span>
                    <h4 class="font-outfit font-bold text-slate-800 text-xs tracking-wider uppercase">Top 5 Competidores</h4>
                  </div>
                  <div class="h-44 relative flex items-center justify-center">
                    ${!chartReady
          ? html`<div class="text-xs font-semibold text-slate-500 animate-pulse">Cargando líderes...</div>`
          : html`<canvas ref=${leadersChartRef} class="w-full h-full"></canvas>`
        }
                  </div>
                  <div class="text-[10px] text-slate-550 mt-2 text-center font-bold">
                    Mejores 5 puntajes del grupo de pronósticos
                  </div>
                </div>

                ${sortedLeaderboard.length > 0
          ? html`
                      <div class="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                        <div class="flex items-center space-x-2.5 mb-3 border-b border-slate-100 pb-2">
                          <span class="w-1.5 h-3 bg-[#008f5c] rounded-full"></span>
                          <h4 class="font-outfit font-bold text-slate-800 text-xs tracking-wider uppercase">Podio de Líderes</h4>
                        </div>
                        <div class="space-y-2 flex-grow flex flex-col justify-center">
                          ${sortedLeaderboard.slice(0, 3).map((u, idx) => {
            const pts = typeof u.puntos_totales === 'number' ? u.puntos_totales : (u.puntos || 0);
            return html`
                              <div key=${u.id} class="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-200 shadow-inner">
                                <div class="flex items-center space-x-2 truncate">
                                  <span class="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-50 font-bold text-[10px] text-emerald-700">
                                    ${idx + 1}
                                  </span>
                                  <span class="text-xs font-bold text-slate-700 truncate">${u.nombre} ${u.apellido}</span>
                                </div>
                                <span class="text-xs font-bold text-slate-800 font-outfit ml-2">${pts} Pts</span>
                              </div>
                            `;
          })}
                        </div>
                        <div class="text-[10px] text-slate-550 mt-2.5 text-center border-t border-slate-100 pt-2 font-bold">
                          Tres mejores puestos actuales
                        </div>
                      </div>
                    `
          : ''
        }
              </div>
            </div>
          `
    }
    </div>
  `;
}

export default StatsView;