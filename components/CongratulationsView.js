import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import * as Lucide from 'lucide-react';
import { CollaboratorAvatar } from './utils.js?v=1.1.0';

const html = htm.bind(React.createElement);
const { Trophy, Crown, Sparkles, Medal, Award, Flame, Calendar, BarChart3, ChevronRight, PartyPopper, Target, Users, TrendingUp, Star, ShieldCheck, Zap } = Lucide;

export function CongratulationsView({ leaderboard = [], session, onNavigate }) {
  const canvasRef = useRef(null);
  const [confettiActive, setConfettiActive] = useState(false);

  // Ordenar clasificación: puntaje descendente, tie-breaker por fecha de apuesta y luego alfabético
  const sortedData = [...leaderboard].sort((a, b) => {
    const ptsA = Number(a.puntos_totales !== undefined && a.puntos_totales !== null ? a.puntos_totales : (a.puntos || 0));
    const ptsB = Number(b.puntos_totales !== undefined && b.puntos_totales !== null ? b.puntos_totales : (b.puntos || 0));
    if (ptsB !== ptsA) return ptsB - ptsA;

    const timeA = a.fecha_apuesta_ultimo_partido;
    const timeB = b.fecha_apuesta_ultimo_partido;
    if (timeA && timeB) {
      const dateA = new Date(timeA).getTime();
      const dateB = new Date(timeB).getTime();
      if (dateA !== dateB) return dateA - dateB;
    } else if (timeA && !timeB) return -1;
    else if (!timeA && timeB) return 1;

    const nameA = `${a.nombre} ${a.apellido}`.toLowerCase();
    const nameB = `${b.nombre} ${b.apellido}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  const top3 = sortedData.slice(0, 3);
  const primerLugar = top3[0] || null;
  const segundoLugar = top3[1] || null;
  const tercerLugar = top3[2] || null;

  // Posición del usuario actual
  const myIndex = session?.user ? sortedData.findIndex(u => u.id === session.user.id) : -1;
  const myRank = myIndex >= 0 ? myIndex + 1 : null;
  const myData = myIndex >= 0 ? sortedData[myIndex] : null;

  // Estadísticas globales rápidas
  const totalJugadores = sortedData.length;

  function getAveragePoints(data) {
    if (!data || !data.length) return '0';
    const sum = data.reduce((acc, u) => acc + (typeof u.puntos_totales === 'number' ? u.puntos_totales : (u.puntos || 0)), 0);
    return (sum / data.length).toFixed(1);
  }

  const promedioPuntos = getAveragePoints(sortedData);

  // Animación de Confeti en Canvas HTML5
  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    canvas.width = parent ? parent.clientWidth : window.innerWidth;
    canvas.height = 450;

    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#facc15', '#ffffff'];
    const pCount = 140;
    const newParticles = [];

    for (let i = 0; i < pCount; i++) {
      newParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 3 + 2.5,
        speedX: Math.random() * 2 - 1,
        angle: Math.random() * 360,
        spin: Math.random() * 0.2 - 0.1,
        shape: Math.random() > 0.4 ? 'circle' : 'rect'
      });
    }

    let animationFrameId;
    let renderCount = 0;
    setConfettiActive(true);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      renderCount++;

      newParticles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.angle += p.spin;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;

        if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        }
        ctx.restore();
      });

      if (renderCount < 200) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setConfettiActive(false);
      }
    };

    animate();
  };

  useEffect(() => {
    triggerConfetti();
    const t = setTimeout(() => triggerConfetti(), 500);
    return () => clearTimeout(t);
  }, [leaderboard]);

  const getPoints = (u) => u ? (typeof u.puntos_totales === 'number' ? u.puntos_totales : (u.puntos || 0)) : 0;
  const getEfectividad = (u) => {
    if (!u) return '0%';
    const acert = u.acertados || 0;
    const perd = u.perdidos || 0;
    const tot = acert + perd;
    if (tot === 0) return '100%';
    return `${Math.round((acert / tot) * 100)}%`;
  };

  return html`
    <div class="space-y-6 relative overflow-hidden pb-8 select-none">
      <!-- Canvas de Confeti Integrado -->
      <div class="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        <canvas ref=${canvasRef} class="w-full h-[450px]"></canvas>
      </div>

      <!-- HERO DE BIENVENIDA Y GLORIA -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#031d10] via-[#004f2f] to-[#02180d] text-white shadow-2xl border border-emerald-500/20">
        <div class="country-gradient-bar"></div>

        <div class="p-6 md:p-8 relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="space-y-3 max-w-xl text-center md:text-left">
            <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 font-extrabold text-[9.5px] md:text-[10.5px] uppercase tracking-widest border border-amber-400/30">
              <${Sparkles} size=${12} class="animate-spin text-amber-400" />
              <span>MUNDIAL SOFTMEDIA 2026</span>
            </div>

            <h1 class="text-2xl md:text-4xl font-black font-outfit uppercase tracking-tight text-white drop-shadow-md">
              Gran Cuadro de Honor
            </h1>

            <p class="text-xs md:text-sm text-emerald-100/90 font-medium leading-relaxed">
              ¡Felicitaciones a los tres grandes campeones de la polla! Su precisión y conocimiento del fútbol los posicionan en lo más alto del podio.
            </p>

            <!-- Acciones Principales Integradas -->
            <div class="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button 
                onClick=${triggerConfetti} 
                class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center space-x-2 cursor-pointer border border-amber-300 active:scale-95"
              >
                <${PartyPopper} size=${15} />
                <span>${confettiActive ? '¡Celebrando!' : '¡Lanzar Confeti!'}</span>
              </button>

              ${onNavigate && html`
                <button 
                  onClick=${() => onNavigate('dashboard')} 
                  class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <${Calendar} size=${14} />
                  <span>Mis Pronósticos</span>
                </button>
              `}

              ${onNavigate && html`
                <button 
                  onClick=${() => onNavigate('leaderboard')} 
                  class="px-4 py-2.5 rounded-xl bg-emerald-600/40 hover:bg-emerald-600/60 border border-emerald-400/30 text-emerald-100 font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <${Trophy} size=${14} />
                  <span>Tabla Completa</span>
                </button>
              `}
            </div>
          </div>

          <!-- Trofeo Flotante Decorativo -->
          <div class="relative flex-shrink-0 flex items-center justify-center w-36 h-36 md:w-44 md:h-44 group cursor-pointer" onClick=${triggerConfetti}>
            <div class="absolute inset-0 rounded-full bg-amber-400/20 blur-2xl group-hover:blur-3xl transition-all"></div>
            <img 
              src="./images/trofeo_mundial.png" 
              alt="Trofeo Copa del Mundo" 
              class="relative z-10 max-h-full max-w-full object-contain drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)] transform hover:scale-110 hover:rotate-2 transition-all duration-300 animate-pulse"
            />
          </div>
        </div>
      </div>

      <!-- PODIO 3D ELEGANTE CON PEDESTALES PROPORCIONALES -->
      <div class="pt-2">
        <div class="text-center mb-6">
          <span class="text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest font-outfit">ORGANIZACIÓN GENERAL</span>
          <h2 class="text-xl md:text-2xl font-black font-outfit text-slate-900 dark:text-white uppercase tracking-tight">
            Los 3 Primeros Lugares
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 items-end max-w-5xl mx-auto px-2">
          
          <!-- 2do LUGAR (SUBCAMPEÓN) -->
          <div class="order-2 md:order-1 glass-panel p-5 flex flex-col items-center text-center relative rounded-3xl bg-white/90 dark:bg-[#131929]/90 border border-slate-200 dark:border-slate-800 shadow-xl hover:-translate-y-1.5 transition-all ${segundoLugar && session && segundoLugar.id === session.user.id ? 'ring-2 ring-emerald-500' : ''}">
            <div class="absolute -top-4 px-3 py-1 rounded-full bg-gradient-to-r from-slate-200 to-slate-400 dark:from-slate-700 dark:to-slate-600 text-slate-900 dark:text-white font-black text-[9.5px] uppercase tracking-wider shadow flex items-center space-x-1.5 border border-slate-300 dark:border-slate-500">
              <${Medal} size=${13} class="text-slate-600 dark:text-slate-300" />
              <span>2° SUBCAMPEÓN</span>
            </div>

            <div class="mt-5 relative">
              <${CollaboratorAvatar} 
                userId=${segundoLugar ? segundoLugar.id : null} 
                nombre=${segundoLugar ? segundoLugar.nombre : 'Jugador'} 
                apellido=${segundoLugar ? segundoLugar.apellido : '2'} 
                className="w-24 h-24 text-3xl border-4 border-slate-300 dark:border-slate-600 shadow-lg" 
              />
              <span class="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-black text-sm flex items-center justify-center border-2 border-white dark:border-slate-900 shadow">🥈</span>
            </div>

            <h3 class="mt-3 text-base font-extrabold text-slate-900 dark:text-white truncate max-w-full">
              ${segundoLugar ? `${segundoLugar.nombre} ${segundoLugar.apellido}` : 'En espera'}
            </h3>

            <div class="mt-2 flex items-center space-x-2 text-[9.5px] font-bold">
              <span class="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                🟢 ${segundoLugar ? (segundoLugar.acertados || 0) : 0} aciertos
              </span>
              <span class="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                ⚡ ${getEfectividad(segundoLugar)}
              </span>
            </div>

            <!-- Pedestal Representativo 2° -->
            <div class="mt-4 pt-3 border-t border-slate-150 dark:border-slate-800 w-full text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-b-2xl p-2">
              <span class="text-3xl font-black font-outfit text-slate-800 dark:text-slate-100">
                ${getPoints(segundoLugar)}
              </span>
              <span class="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Puntos Totales</span>
            </div>
          </div>

          <!-- 1er LUGAR (CAMPEÓN DE ORO DESTACADO EN EL CENTRO) -->
          <div class="order-1 md:order-2 glass-panel p-6 flex flex-col items-center text-center relative rounded-3xl bg-gradient-to-b from-amber-500/15 via-white to-amber-50/30 dark:from-amber-500/20 dark:via-[#131929] dark:to-[#0f1422] border-2 border-amber-400 dark:border-amber-500/50 shadow-2xl scale-105 z-20 hover:-translate-y-2 transition-all ${primerLugar && session && primerLugar.id === session.user.id ? 'ring-4 ring-amber-400/60' : ''}">
            
            <div class="absolute -top-5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl flex items-center space-x-1.5 border border-amber-200">
              <${Crown} size=${15} class="text-slate-950" />
              <span>👑 1° LUGAR - CAMPEÓN</span>
            </div>

            <div class="mt-4 relative">
              <div class="absolute -inset-2 rounded-full bg-amber-400/40 opacity-75 blur-md animate-pulse"></div>
              <${CollaboratorAvatar} 
                userId=${primerLugar ? primerLugar.id : null} 
                nombre=${primerLugar ? primerLugar.nombre : 'Campeón'} 
                apellido=${primerLugar ? primerLugar.apellido : '1'} 
                className="relative z-10 w-28 h-28 text-4xl border-4 border-amber-400 shadow-2xl" 
              />
              <span class="absolute -bottom-1 -right-1 z-20 w-9 h-9 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-base flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg">🥇</span>
            </div>

            <h3 class="mt-3 text-lg font-black text-slate-900 dark:text-amber-300 truncate max-w-full">
              ${primerLugar ? `${primerLugar.nombre} ${primerLugar.apellido}` : 'En espera'}
            </h3>
            
            <div class="mt-1 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-300 font-extrabold text-[9px] uppercase tracking-wider border border-amber-400/30">
              Líder del Mundial 2026
            </div>

            <div class="mt-3 flex items-center space-x-2 text-[10px] font-bold">
              <span class="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
                🟢 ${primerLugar ? (primerLugar.acertados || 0) : 0} aciertos
              </span>
              <span class="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-2.5 py-0.5 rounded border border-amber-300 dark:border-amber-800">
                ⚡ ${getEfectividad(primerLugar)}
              </span>
            </div>

            <!-- Pedestal Representativo 1° -->
            <div class="mt-4 pt-3 border-t border-amber-200 dark:border-amber-500/30 w-full text-center bg-amber-50/50 dark:bg-amber-950/20 rounded-b-2xl p-2.5">
              <span class="text-4xl font-black font-outfit text-amber-600 dark:text-amber-400 drop-shadow-xs">
                ${getPoints(primerLugar)}
              </span>
              <span class="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest block">Puntos Totales</span>
            </div>
          </div>

          <!-- 3er LUGAR (BRONCE) -->
          <div class="order-3 glass-panel p-5 flex flex-col items-center text-center relative rounded-3xl bg-white/90 dark:bg-[#131929]/90 border border-slate-200 dark:border-slate-800 shadow-xl hover:-translate-y-1.5 transition-all ${tercerLugar && session && tercerLugar.id === session.user.id ? 'ring-2 ring-emerald-500' : ''}">
            <div class="absolute -top-4 px-3 py-1 rounded-full bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100 font-black text-[9.5px] uppercase tracking-wider shadow flex items-center space-x-1.5 border border-amber-600">
              <${Award} size=${13} class="text-amber-300" />
              <span>3° MEDALLA BRONCE</span>
            </div>

            <div class="mt-5 relative">
              <${CollaboratorAvatar} 
                userId=${tercerLugar ? tercerLugar.id : null} 
                nombre=${tercerLugar ? tercerLugar.nombre : 'Jugador'} 
                apellido=${tercerLugar ? tercerLugar.apellido : '3'} 
                className="w-24 h-24 text-3xl border-4 border-amber-800/40 shadow-lg" 
              />
              <span class="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-700 text-amber-100 font-black text-sm flex items-center justify-center border-2 border-white dark:border-slate-900 shadow">🥉</span>
            </div>

            <h3 class="mt-3 text-base font-extrabold text-slate-900 dark:text-white truncate max-w-full">
              ${tercerLugar ? `${tercerLugar.nombre} ${tercerLugar.apellido}` : 'En espera'}
            </h3>

            <div class="mt-2 flex items-center space-x-2 text-[9.5px] font-bold">
              <span class="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                🟢 ${tercerLugar ? (tercerLugar.acertados || 0) : 0} aciertos
              </span>
              <span class="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                ⚡ ${getEfectividad(tercerLugar)}
              </span>
            </div>

            <!-- Pedestal Representativo 3° -->
            <div class="mt-4 pt-3 border-t border-slate-150 dark:border-slate-800 w-full text-center bg-amber-950/5 dark:bg-amber-950/20 rounded-b-2xl p-2">
              <span class="text-3xl font-black font-outfit text-amber-800 dark:text-amber-500">
                ${getPoints(tercerLugar)}
              </span>
              <span class="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block">Puntos Totales</span>
            </div>
          </div>

        </div>
      </div>

      <!-- BENTO GRID DE MI ESTADO Y RESUMEN GENERAL -->
      <div class="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
        
        <!-- Tarjeta Personal del Usuario Logueado -->
        <div class="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/30 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-2">
              <span class="text-[9.5px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">TU CLASIFICACIÓN</span>
              <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold text-[9px]">
                ${myRank ? `#${myRank} PUESTO` : 'SIN PUNTOS'}
              </span>
            </div>

            <div class="flex items-center space-x-3 mt-3">
              <${CollaboratorAvatar} 
                userId=${session?.user?.id} 
                nombre=${session?.user?.nombre} 
                apellido=${session?.user?.apellido} 
                className="w-12 h-12 text-lg border-2 border-emerald-500" 
              />
              <div>
                <h4 class="text-sm font-black text-slate-900 dark:text-white uppercase font-outfit">
                  ${session?.user?.nombre} ${session?.user?.apellido}
                </h4>
                <div class="text-[10px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                  ${myData ? `${getPoints(myData)} Puntos Totales` : 'Empieza a pronosticar'}
                </div>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-emerald-500/20">
            ${onNavigate && html`
              <button 
                onClick=${() => onNavigate('dashboard')} 
                class="w-full py-2 px-3 rounded-xl bg-[#008f5c] hover:bg-[#00734a] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer shadow"
              >
                <${Calendar} size=${14} />
                <span>Mis Pronósticos</span>
                <${ChevronRight} size=${14} />
              </button>
            `}
          </div>
        </div>

        <!-- Estadísticas Clave del Torneo -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#131929]/80 flex flex-col justify-between">
          <div>
            <span class="text-[9.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">RESUMEN DEL TORNEO</span>
            
            <div class="space-y-3 mt-1">
              <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div class="flex items-center space-x-2">
                  <${Users} size=${16} class="text-emerald-500" />
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Competidores</span>
                </div>
                <span class="text-sm font-black font-outfit text-slate-900 dark:text-white">${totalJugadores}</span>
              </div>

              <div class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                <div class="flex items-center space-x-2">
                  <${Zap} size=${16} class="text-amber-500" />
                  <span class="text-xs font-bold text-slate-700 dark:text-slate-300">Promedio de Puntos</span>
                </div>
                <span class="text-sm font-black font-outfit text-slate-900 dark:text-white">${promedioPuntos} pts</span>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span class="text-[10px] text-slate-400 font-medium">Polla SoftMedia • Edición Mundialista</span>
          </div>
        </div>

        <!-- Carta de Honor Corporativo SoftMedia -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#131929]/80 flex flex-col justify-between">
          <div>
            <div class="flex items-center space-x-1.5 text-amber-500 font-bold text-[10px] uppercase tracking-wider mb-1.5">
              <${ShieldCheck} size=${15} />
              <span>RECONOCIMIENTO OFICIAL</span>
            </div>
            <h4 class="text-sm font-black text-slate-900 dark:text-white uppercase font-outfit">
              ¡Espíritu Deportivo SoftMedia!
            </h4>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Felicidades a todos los participantes por dar batalla en cada partido. ¡Demostraron visión, estrategia y mucha pasión!
            </p>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span>SOFTMEDIA 2026</span>
            <span>MUNDIAL ⚽</span>
          </div>
        </div>

      </div>
    </div>
  `;
}
