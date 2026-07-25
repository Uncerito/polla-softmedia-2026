import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import * as Lucide from 'lucide-react';
import { CollaboratorAvatar } from './utils.js?v=1.1.0';

const html = htm.bind(React.createElement);
const { Trophy, Crown, Sparkles, Medal, Award, Calendar, BarChart3, ChevronRight, PartyPopper, Users, Zap, ShieldCheck } = Lucide;

export function CongratulationsView({ leaderboard = [], session, onNavigate }) {
  const canvasRef = useRef(null);
  const [confettiActive, setConfettiActive] = useState(false);

  // Ordenar clasificación: puntaje descendente, tie-breaker por fecha de apuesta y alfabético
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

  const totalJugadores = sortedData.length;
  const promedioPuntos = totalJugadores > 0 ? (sortedData.reduce((sum, u) => {
    const pts = typeof u.puntos_totales === 'number' ? u.puntos_totales : (u.puntos || 0);
    return sum + pts;
  }, 0) / totalJugadores).toFixed(1) : '0';

  // Confeti interactivo en canvas HTML5
  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    canvas.width = parent ? parent.clientWidth : window.innerWidth;
    canvas.height = 550;

    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#facc15', '#ffffff'];
    const pCount = 160;
    const newParticles = [];

    for (let i = 0; i < pCount; i++) {
      newParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 9 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 3.5 + 2.5,
        speedX: Math.random() * 2.5 - 1.25,
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

      if (renderCount < 220) {
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
    const t = setTimeout(() => triggerConfetti(), 400);
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
    <div class="space-y-6 relative overflow-hidden pb-6 select-none w-full max-w-7xl mx-auto">
      <!-- Canvas de Confeti en todo el ancho -->
      <div class="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        <canvas ref=${canvasRef} class="w-full h-[550px]"></canvas>
      </div>

      <!-- BANNER SUPERIOR COMPACTO Y ELEGANTE -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#031d10] via-[#005a36] to-[#02180d] text-white shadow-xl border border-emerald-500/30 p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="country-gradient-bar absolute top-0 left-0 right-0"></div>

        <div class="flex items-center space-x-3.5 text-center md:text-left">
          <div class="p-2.5 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 shadow-lg flex-shrink-0">
            <${Trophy} size=${24} />
          </div>
          <div>
            <div class="flex items-center space-x-2 justify-center md:justify-start">
              <span class="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-black text-[9px] uppercase tracking-widest border border-amber-400/30">
                MUNDIAL SOFTMEDIA 2026
              </span>
              <span class="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-bold text-[9px] uppercase tracking-wider">
                HALL OF FAME
              </span>
            </div>
            <h1 class="text-xl md:text-2xl font-black font-outfit uppercase tracking-tight text-white mt-0.5">
              Gran Cuadro de Honor de Campeones
            </h1>
          </div>
        </div>

        <!-- Botones de Acción Superiores -->
        <div class="flex flex-wrap items-center justify-center gap-2.5">
          <button 
            onClick=${triggerConfetti} 
            class="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer border border-amber-300 active:scale-95"
          >
            <${PartyPopper} size=${15} />
            <span>${confettiActive ? '¡Celebrando!' : '¡Lanzar Confeti!'}</span>
          </button>

          ${onNavigate && html`
            <button 
              onClick=${() => onNavigate('dashboard')} 
              class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <${Calendar} size=${14} />
              <span>Mis Pronósticos</span>
            </button>
          `}

          ${onNavigate && html`
            <button 
              onClick=${() => onNavigate('leaderboard')} 
              class="px-3.5 py-2 rounded-xl bg-emerald-600/50 hover:bg-emerald-600/70 border border-emerald-400/40 text-emerald-100 font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 cursor-pointer"
            >
              <${BarChart3} size=${14} />
              <span>Ver Clasificación</span>
            </button>
          `}
        </div>
      </div>

      <!-- GRAN ESCENARIO DE CAMPEONES - PODIO INTEGRADO COMPLETO (ANCHO COMPLETO Y ALTA VISIBILIDAD) -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#091510] via-[#0d1e18] to-[#060e0a] p-6 md:p-10 shadow-2xl border border-emerald-500/20 text-white">
        
        <!-- Destellos radiales de fondo -->
        <div class="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="text-center mb-8 relative z-10">
          <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400/20 to-yellow-400/20 text-amber-300 font-black text-xs uppercase tracking-widest border border-amber-400/30">
            <${Crown} size=${14} class="text-amber-400 animate-bounce" />
            <span>LOS 3 MEJORES PRONOSTICADORES DEL MUNDIAL</span>
          </div>
        </div>

        <!-- PODIO TRIUNFAL (3 COLUMNAS PROPORCIONALES Y AMPLIAS) -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-end max-w-6xl mx-auto relative z-10">
          
          <!-- 2° LUGAR - SUBCAMPEÓN (PLATA METÁLICA) -->
          <div class="order-2 md:order-1 flex flex-col items-center">
            <div class="w-full rounded-3xl bg-gradient-to-b from-[#1b263b] via-[#111a2e] to-[#0a101d] border-2 border-slate-400/50 shadow-2xl p-6 flex flex-col items-center text-center relative hover:-translate-y-2 transition-all duration-300 ${segundoLugar && session && segundoLugar.id === session.user.id ? 'ring-4 ring-emerald-500' : ''}">
              
              <!-- Insignia Plata -->
              <div class="absolute -top-5 px-4 py-1.5 rounded-full bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 font-black text-xs uppercase tracking-wider shadow-xl flex items-center space-x-1.5 border border-white">
                <${Medal} size=${15} class="text-slate-800" />
                <span>2° LUGAR • SUBCAMPEÓN</span>
              </div>

              <!-- Avatar Plata -->
              <div class="mt-4 relative">
                <div class="absolute -inset-2 rounded-full bg-slate-400/30 blur-md"></div>
                <${CollaboratorAvatar} 
                  userId=${segundoLugar ? segundoLugar.id : null} 
                  nombre=${segundoLugar ? segundoLugar.nombre : 'Jugador'} 
                  apellido=${segundoLugar ? segundoLugar.apellido : '2'} 
                  className="relative z-10 w-28 h-28 md:w-32 md:h-32 text-3xl border-4 border-slate-300 shadow-2xl" 
                />
                <span class="absolute -bottom-2 -right-1 z-20 w-10 h-10 rounded-full bg-gradient-to-r from-slate-200 to-slate-400 text-slate-950 font-black text-lg flex items-center justify-center border-2 border-slate-900 shadow-lg">🥈</span>
              </div>

              <!-- Nombre Completo Grande con Máximo Contraste -->
              <h3 class="mt-5 text-xl md:text-2xl font-black text-white font-outfit truncate max-w-full tracking-wide">
                ${segundoLugar ? `${segundoLugar.nombre} ${segundoLugar.apellido}` : 'En espera'}
              </h3>

              <div class="mt-2 inline-flex items-center space-x-2 text-xs font-bold">
                <span class="bg-emerald-950/80 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/40">
                  🟢 ${segundoLugar ? (segundoLugar.acertados || 0) : 0} aciertos
                </span>
                <span class="bg-slate-800 text-slate-200 px-3 py-1 rounded-full border border-slate-700">
                  ⚡ ${getEfectividad(segundoLugar)}
                </span>
              </div>

              <!-- Pedestal 2° Puntos -->
              <div class="mt-6 pt-4 border-t border-slate-700/60 w-full text-center bg-slate-900/60 rounded-2xl p-3">
                <span class="text-4xl md:text-5xl font-black font-outfit text-slate-100 scoreboard-font">
                  ${getPoints(segundoLugar)}
                </span>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mt-1">Puntos Totales</span>
              </div>
            </div>
          </div>

          <!-- 1° LUGAR - CAMPEÓN ABSOLUTO (ORO DESTACADO CENTRAL) -->
          <div class="order-1 md:order-2 flex flex-col items-center">
            <div class="w-full rounded-3xl bg-gradient-to-b from-[#2a1d08] via-[#1c1305] to-[#0f0a02] border-4 border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.3)] p-7 flex flex-col items-center text-center relative scale-105 z-20 hover:-translate-y-3 transition-all duration-300 ${primerLugar && session && primerLugar.id === session.user.id ? 'ring-4 ring-amber-300' : ''}">
              
              <!-- Insignia Oro Campeón -->
              <div class="absolute -top-6 px-5 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-slate-950 font-black text-sm uppercase tracking-widest shadow-2xl flex items-center space-x-2 border-2 border-yellow-200 animate-pulse">
                <${Crown} size=${18} class="text-slate-950" />
                <span>👑 1° LUGAR • CAMPEÓN</span>
              </div>

              <!-- Avatar Oro Grande -->
              <div class="mt-5 relative">
                <div class="absolute -inset-3 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 opacity-80 blur-lg animate-pulse"></div>
                <${CollaboratorAvatar} 
                  userId=${primerLugar ? primerLugar.id : null} 
                  nombre=${primerLugar ? primerLugar.nombre : 'Campeón'} 
                  apellido=${primerLugar ? primerLugar.apellido : '1'} 
                  className="relative z-10 w-32 h-32 md:w-36 md:h-36 text-4xl border-4 border-amber-400 shadow-2xl" 
                />
                <span class="absolute -bottom-2 -right-1 z-20 w-11 h-11 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black text-xl flex items-center justify-center border-2 border-slate-950 shadow-xl">🥇</span>
              </div>

              <!-- Nombre Completo Grande del Campeón -->
              <h3 class="mt-5 text-2xl md:text-3xl font-black text-amber-300 font-outfit truncate max-w-full tracking-wide drop-shadow-md">
                ${primerLugar ? `${primerLugar.nombre} ${primerLugar.apellido}` : 'En espera'}
              </h3>
              
              <div class="mt-1 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-black text-[10px] uppercase tracking-widest border border-amber-400/40">
                LÍDER ABSOLUTO DEL MUNDIAL 2026
              </div>

              <div class="mt-3 inline-flex items-center space-x-2 text-xs font-bold">
                <span class="bg-emerald-950 text-emerald-300 px-3 py-1 rounded-full border border-emerald-400/50">
                  🟢 ${primerLugar ? (primerLugar.acertados || 0) : 0} aciertos
                </span>
                <span class="bg-amber-950 text-amber-200 px-3 py-1 rounded-full border border-amber-400/50">
                  ⚡ ${getEfectividad(primerLugar)}
                </span>
              </div>

              <!-- Pedestal 1° Puntos Gigantes -->
              <div class="mt-6 pt-4 border-t border-amber-500/40 w-full text-center bg-amber-950/60 rounded-2xl p-3.5">
                <span class="text-5xl md:text-6xl font-black font-outfit text-amber-400 scoreboard-font drop-shadow-md">
                  ${getPoints(primerLugar)}
                </span>
                <span class="text-xs font-black text-amber-400 uppercase tracking-widest block mt-1">PUNTOS DE ORO</span>
              </div>
            </div>
          </div>

          <!-- 3° LUGAR - MEDALLA BRONCE (BRONCE METÁLICO) -->
          <div class="order-3 flex flex-col items-center">
            <div class="w-full rounded-3xl bg-gradient-to-b from-[#251710] via-[#190f0a] to-[#0d0704] border-2 border-amber-700/60 shadow-2xl p-6 flex flex-col items-center text-center relative hover:-translate-y-2 transition-all duration-300 ${tercerLugar && session && tercerLugar.id === session.user.id ? 'ring-4 ring-emerald-500' : ''}">
              
              <!-- Insignia Bronce -->
              <div class="absolute -top-5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100 font-black text-xs uppercase tracking-wider shadow-xl flex items-center space-x-1.5 border border-amber-500">
                <${Award} size=${15} class="text-amber-300" />
                <span>3° LUGAR • BRONCE</span>
              </div>

              <!-- Avatar Bronce -->
              <div class="mt-4 relative">
                <div class="absolute -inset-2 rounded-full bg-amber-700/30 blur-md"></div>
                <${CollaboratorAvatar} 
                  userId=${tercerLugar ? tercerLugar.id : null} 
                  nombre=${tercerLugar ? tercerLugar.nombre : 'Jugador'} 
                  apellido=${tercerLugar ? tercerLugar.apellido : '3'} 
                  className="relative z-10 w-28 h-28 md:w-32 md:h-32 text-3xl border-4 border-amber-700/60 shadow-2xl" 
                />
                <span class="absolute -bottom-2 -right-1 z-20 w-10 h-10 rounded-full bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100 font-black text-lg flex items-center justify-center border-2 border-slate-950 shadow-lg">🥉</span>
              </div>

              <!-- Nombre Completo Grande -->
              <h3 class="mt-5 text-xl md:text-2xl font-black text-white font-outfit truncate max-w-full tracking-wide">
                ${tercerLugar ? `${tercerLugar.nombre} ${tercerLugar.apellido}` : 'En espera'}
              </h3>

              <div class="mt-2 inline-flex items-center space-x-2 text-xs font-bold">
                <span class="bg-emerald-950/80 text-emerald-300 px-3 py-1 rounded-full border border-emerald-500/40">
                  🟢 ${tercerLugar ? (tercerLugar.acertados || 0) : 0} aciertos
                </span>
                <span class="bg-amber-950/80 text-amber-200 px-3 py-1 rounded-full border border-amber-700/50">
                  ⚡ ${getEfectividad(tercerLugar)}
                </span>
              </div>

              <!-- Pedestal 3° Puntos -->
              <div class="mt-6 pt-4 border-t border-amber-800/60 w-full text-center bg-amber-950/50 rounded-2xl p-3">
                <span class="text-4xl md:text-5xl font-black font-outfit text-amber-500 scoreboard-font">
                  ${getPoints(tercerLugar)}
                </span>
                <span class="text-[10px] font-black text-amber-400/80 uppercase tracking-widest block mt-1">Puntos Totales</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- FRANJA INFERIOR UNIFICADA Y ARMONIOSA EN ANCHO COMPLETO -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        
        <!-- 1. Estado Personal del Usuario -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#131929]/90 flex items-center justify-between">
          <div class="flex items-center space-x-3.5">
            <${CollaboratorAvatar} 
              userId=${session?.user?.id} 
              nombre=${session?.user?.nombre} 
              apellido=${session?.user?.apellido} 
              className="w-12 h-12 text-base border-2 border-emerald-500 flex-shrink-0" 
            />
            <div>
              <div class="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">TU POSICIÓN</div>
              <div class="text-sm font-black text-slate-900 dark:text-white font-outfit">
                ${session?.user?.nombre} ${session?.user?.apellido}
              </div>
              <div class="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                ${myData ? `${getPoints(myData)} Pts (${myRank ? `#${myRank} Puesto` : '-'})` : 'Sin puntos'}
              </div>
            </div>
          </div>

          ${onNavigate && html`
            <button 
              onClick=${() => onNavigate('dashboard')} 
              class="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 transition-all" 
              title="Mis Pronósticos"
            >
              <${ChevronRight} size=${18} />
            </button>
          `}
        </div>

        <!-- 2. Resumen del Torneo -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#131929]/90 flex items-center justify-around text-center">
          <div>
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">JUGADORES</span>
            <span class="text-xl font-black font-outfit text-slate-900 dark:text-white mt-0.5 block">${totalJugadores}</span>
          </div>
          <div class="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
          <div>
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest block">PROMEDIO PTS</span>
            <span class="text-xl font-black font-outfit text-amber-600 dark:text-amber-400 mt-0.5 block">${promedioPuntos}</span>
          </div>
        </div>

        <!-- 3. Reconocimiento SoftMedia -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-[#131929]/90 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="p-2.5 rounded-xl bg-amber-400/20 text-amber-500 font-bold">
              <${ShieldCheck} size=${20} />
            </div>
            <div>
              <div class="text-[9px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">SOFTMEDIA 2026</div>
              <div class="text-xs font-bold text-slate-800 dark:text-slate-200">
                ¡Gracias por participar con deportividad!
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `;
}
