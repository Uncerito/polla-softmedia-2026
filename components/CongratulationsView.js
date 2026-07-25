import React, { useState, useEffect, useRef } from 'react';
import htm from 'htm';
import * as Lucide from 'lucide-react';
import { CollaboratorAvatar } from './utils.js?v=1.1.0';

const html = htm.bind(React.createElement);
const { Trophy, Crown, Sparkles, Medal, Award, Flame, Calendar, BarChart3, ChevronRight, Share2, PartyPopper } = Lucide;

export function CongratulationsView({ leaderboard = [], session, onNavigate }) {
  const canvasRef = useRef(null);

  // Ordenar clasificación: puntaje descendente, tie-breaker por fecha_apuesta_ultimo_partido y luego alfabético
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

  // Sistema de animación de Confeti en Canvas de HTML5
  const triggerConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const parent = canvas.parentElement;
    canvas.width = parent ? parent.clientWidth : window.innerWidth;
    canvas.height = 420;

    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#eab308', '#ffffff'];
    const pCount = 130;
    const newParticles = [];

    for (let i = 0; i < pCount; i++) {
      newParticles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 3 + 2,
        speedX: Math.random() * 2 - 1,
        angle: Math.random() * 360,
        spin: Math.random() * 0.2 - 0.1,
        shape: Math.random() > 0.4 ? 'circle' : 'rect'
      });
    }

    let animationFrameId;
    let renderCount = 0;

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

      if (renderCount < 180) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    animate();
  };

  useEffect(() => {
    triggerConfetti();
    const timer = setTimeout(() => triggerConfetti(), 600);
    return () => clearTimeout(timer);
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
      <!-- Canvas Flotante de Confeti -->
      <div class="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        <canvas ref=${canvasRef} class="w-full h-[420px]"></canvas>
      </div>

      <!-- BANNER PRINCIPAL PECULIAR CON TROFEO FLOTANTE Y DESTELLOS NEÓN -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#032314] via-[#005a36] to-[#011a10] p-6 md:p-8 text-white shadow-2xl border border-emerald-500/30">
        <div class="absolute -right-16 -top-16 w-80 h-80 bg-amber-400/20 rounded-full blur-3xl pointer-events-none animate-pulse"></div>
        <div class="absolute -left-16 -bottom-16 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div class="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div class="text-center md:text-left space-y-3 max-w-xl">
            <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-[9px] md:text-[10px] tracking-widest uppercase shadow-lg">
              <${Sparkles} size=${12} class="animate-spin" />
              <span>GRAN PODIO DE HONOR Y GLORIA</span>
            </div>
            
            <h1 class="text-2xl md:text-4xl font-black font-outfit uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-emerald-200 drop-shadow-sm">
              ¡Felicitaciones a los Campeones!
            </h1>
            
            <p class="text-xs md:text-sm text-emerald-100/90 font-medium leading-relaxed">
              Reconocimiento especial a los 3 mejores pronosticadores de la <strong class="text-amber-300 font-bold">Polla SoftMedia Mundial 2026</strong> por su visión, intuición y pasión futbolera.
            </p>

            <div class="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              <button 
                onClick=${triggerConfetti} 
                class="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center space-x-2 cursor-pointer border border-amber-300"
              >
                <${PartyPopper} size=${16} />
                <span>¡Lanzar Confeti!</span>
              </button>

              ${onNavigate && html`
                <button 
                  onClick=${() => onNavigate('dashboard')} 
                  class="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <${Calendar} size=${15} />
                  <span>Mis Pronósticos</span>
                </button>
              `}
            </div>
          </div>

          <!-- Trofeo Flotante con efecto Neón -->
          <div class="relative flex-shrink-0 flex items-center justify-center w-36 h-36 md:w-44 md:h-44 group cursor-pointer" onClick=${triggerConfetti}>
            <div class="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400/30 via-emerald-400/30 to-amber-300/30 blur-2xl group-hover:blur-3xl transition-all"></div>
            <img 
              src="./images/trofeo_mundial.png" 
              alt="Copa Mundial Trofeo" 
              class="relative z-10 max-h-full max-w-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] transform hover:scale-110 hover:-rotate-3 transition-all duration-300 animate-pulse"
            />
          </div>
        </div>
      </div>

      <!-- PODIO DE LOS 3 PRIMEROS LUGARES (ESTILO BENTO-GRID 3D PECULIAR) -->
      <div class="pt-4">
        <div class="text-center mb-6">
          <span class="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-outfit">CUADRO DE HONOR</span>
          <h2 class="text-xl md:text-2xl font-black font-outfit text-slate-900 dark:text-white uppercase tracking-tight">
            Los 3 Mejores Pronosticadores
          </h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-5 items-end max-w-5xl mx-auto px-2">
          
          <!-- 2do LUGAR (SUBCAMPEÓN - PLATA) -->
          <div class="order-2 md:order-1 glass-panel p-5 flex flex-col items-center text-center relative rounded-3xl bg-gradient-to-b from-slate-100/90 to-white dark:from-[#131929] dark:to-[#0a0d18] border-2 border-slate-300 dark:border-slate-700 shadow-xl hover:-translate-y-1.5 transition-transform duration-300 ${segundoLugar && session && segundoLugar.id === session.user.id ? 'ring-2 ring-emerald-500' : ''}">
            <div class="absolute -top-5 px-3 py-1 rounded-full bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900 font-black text-[10px] uppercase tracking-wider shadow-md flex items-center space-x-1.5 border border-slate-200">
              <${Medal} size=${14} class="text-slate-700" />
              <span>2° LUGAR - SUBCAMPEÓN</span>
            </div>

            <div class="mt-4 relative">
              <${CollaboratorAvatar} 
                userId=${segundoLugar ? segundoLugar.id : null} 
                nombre=${segundoLugar ? segundoLugar.nombre : 'Jugador'} 
                apellido=${segundoLugar ? segundoLugar.apellido : '2'} 
                className="w-24 h-24 text-3xl border-4 border-slate-300 dark:border-slate-600 shadow-xl" 
              />
              <span class="absolute -bottom-2 -right-1 w-8 h-8 rounded-full bg-slate-300 text-slate-800 font-black text-sm flex items-center justify-center border-2 border-white dark:border-slate-800 shadow">🥈</span>
            </div>

            <h3 class="mt-4 text-base font-extrabold text-slate-900 dark:text-white truncate max-w-full">
              ${segundoLugar ? `${segundoLugar.nombre} ${segundoLugar.apellido}` : 'En espera'}
            </h3>

            <div class="mt-2 flex items-center space-x-2 text-[10px] font-bold">
              <span class="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300/40">
                🟢 ${segundoLugar ? (segundoLugar.acertados || 0) : 0} Aciertos
              </span>
              <span class="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full">
                ⚡ ${getEfectividad(segundoLugar)} Eficacia
              </span>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 w-full text-center">
              <span class="text-3xl font-black font-outfit text-slate-800 dark:text-slate-200">
                ${getPoints(segundoLugar)}
              </span>
              <span class="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mt-0.5">Puntos Totales</span>
            </div>
          </div>

          <!-- 1er LUGAR (CAMPEÓN ABSOLUTO - ORO DESTACADO) -->
          <div class="order-1 md:order-2 glass-panel p-6 flex flex-col items-center text-center relative rounded-3xl bg-gradient-to-b from-amber-500/10 via-amber-100/40 to-white dark:from-amber-500/20 dark:via-[#1a1710] dark:to-[#0a0d18] border-2 border-amber-400 dark:border-amber-500/60 shadow-2xl scale-105 z-20 hover:-translate-y-2 transition-transform duration-300 ${primerLugar && session && primerLugar.id === session.user.id ? 'ring-4 ring-amber-400/60' : ''}">
            
            <div class="absolute -top-6 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black text-xs uppercase tracking-widest shadow-xl flex items-center space-x-2 border border-amber-200 animate-bounce">
              <${Crown} size=${16} class="text-slate-950" />
              <span>👑 CAMPEÓN DE LA POLLA</span>
            </div>

            <div class="mt-4 relative">
              <div class="absolute -inset-2 rounded-full bg-gradient-to-r from-amber-400 to-yellow-300 opacity-75 blur-md animate-pulse"></div>
              <${CollaboratorAvatar} 
                userId=${primerLugar ? primerLugar.id : null} 
                nombre=${primerLugar ? primerLugar.nombre : 'Campeón'} 
                apellido=${primerLugar ? primerLugar.apellido : '1'} 
                className="relative z-10 w-28 h-28 text-4xl border-4 border-amber-400 shadow-2xl" 
              />
              <span class="absolute -bottom-2 -right-1 z-20 w-9 h-9 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-base flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-lg">🥇</span>
            </div>

            <h3 class="mt-4 text-lg font-black text-slate-900 dark:text-amber-300 truncate max-w-full">
              ${primerLugar ? `${primerLugar.nombre} ${primerLugar.apellido}` : 'En espera'}
            </h3>
            
            <div class="mt-1 px-3 py-0.5 rounded-full bg-amber-400/20 text-amber-800 dark:text-amber-300 font-extrabold text-[9px] uppercase tracking-wider border border-amber-400/30">
              Mundial SoftMedia 2026
            </div>

            <div class="mt-3 flex items-center space-x-2 text-[10px] font-bold">
              <span class="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/40">
                🟢 ${primerLugar ? (primerLugar.acertados || 0) : 0} Aciertos
              </span>
              <span class="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-2.5 py-0.5 rounded-full border border-amber-300/40">
                ⚡ ${getEfectividad(primerLugar)} Eficacia
              </span>
            </div>

            <div class="mt-4 pt-3 border-t border-amber-200 dark:border-amber-500/30 w-full text-center">
              <span class="text-4xl font-black font-outfit text-amber-600 dark:text-amber-400 drop-shadow-sm">
                ${getPoints(primerLugar)}
              </span>
              <span class="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-widest block mt-0.5">Puntos de Oro</span>
            </div>
          </div>

          <!-- 3er LUGAR (BRONCE) -->
          <div class="order-3 glass-panel p-5 flex flex-col items-center text-center relative rounded-3xl bg-gradient-to-b from-amber-900/10 to-white dark:from-[#1c1410] dark:to-[#0a0d18] border-2 border-amber-800/30 dark:border-amber-900/40 shadow-xl hover:-translate-y-1.5 transition-transform duration-300 ${tercerLugar && session && tercerLugar.id === session.user.id ? 'ring-2 ring-emerald-500' : ''}">
            <div class="absolute -top-5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-700 to-amber-800 text-amber-100 font-black text-[10px] uppercase tracking-wider shadow-md flex items-center space-x-1.5 border border-amber-600">
              <${Award} size=${14} class="text-amber-300" />
              <span>3° LUGAR - MEDALLA BRONCE</span>
            </div>

            <div class="mt-4 relative">
              <${CollaboratorAvatar} 
                userId=${tercerLugar ? tercerLugar.id : null} 
                nombre=${tercerLugar ? tercerLugar.nombre : 'Jugador'} 
                apellido=${tercerLugar ? tercerLugar.apellido : '3'} 
                className="w-24 h-24 text-3xl border-4 border-amber-800/40 shadow-xl" 
              />
              <span class="absolute -bottom-2 -right-1 w-8 h-8 rounded-full bg-amber-700 text-amber-100 font-black text-sm flex items-center justify-center border-2 border-white dark:border-slate-800 shadow">🥉</span>
            </div>

            <h3 class="mt-4 text-base font-extrabold text-slate-900 dark:text-white truncate max-w-full">
              ${tercerLugar ? `${tercerLugar.nombre} ${tercerLugar.apellido}` : 'En espera'}
            </h3>

            <div class="mt-2 flex items-center space-x-2 text-[10px] font-bold">
              <span class="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-300/40">
                🟢 ${tercerLugar ? (tercerLugar.acertados || 0) : 0} Aciertos
              </span>
              <span class="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full">
                ⚡ ${getEfectividad(tercerLugar)} Eficacia
              </span>
            </div>

            <div class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 w-full text-center">
              <span class="text-3xl font-black font-outfit text-amber-800 dark:text-amber-500">
                ${getPoints(tercerLugar)}
              </span>
              <span class="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest block mt-0.5">Puntos Totales</span>
            </div>
          </div>

        </div>
      </div>

      <!-- CARTA DE HONOR Y NAVEGACIÓN RÁPIDA -->
      <div class="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
        <!-- Reconocimiento Corporativo SoftMedia -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#131929]/70 flex flex-col justify-between">
          <div>
            <div class="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2">
              <${Award} size=${16} />
              <span>RECONOCIMIENTO SOFTMEDIA</span>
            </div>
            <h4 class="text-sm font-black text-slate-900 dark:text-white uppercase font-outfit">
              Pasión, Estrategia y Espíritu Deportivo
            </h4>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Un gran aplauso a nuestros tres campeones y a cada uno de los participantes que hicieron vibrar la Polla del Mundial 2026. ¡Gracias por competir con deportividad y entusiasmo!
            </p>
          </div>
          <div class="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span>SOFTMEDIA INC. 2026</span>
            <span class="text-emerald-600 dark:text-emerald-400 font-bold">MUNDIAL 2026 ⚽</span>
          </div>
        </div>

        <!-- Tarjeta de Acceso a Tabla Completa -->
        <div class="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/40 flex flex-col justify-between">
          <div>
            <div class="flex items-center space-x-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider mb-2">
              <${BarChart3} size=${16} />
              <span>CLASIFICACIÓN COMPLETA</span>
            </div>
            <h4 class="text-sm font-black text-slate-900 dark:text-white uppercase font-outfit">
              ¿Quieres ver la tabla general completa?
            </h4>
            <p class="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
              Explora los puntos de todos los demás competidores, el desempate por hora de apuestas y el historial completo de aciertos.
            </p>
          </div>
          <div class="mt-4 pt-3">
            ${onNavigate && html`
              <button 
                onClick=${() => onNavigate('leaderboard')} 
                class="w-full py-2.5 px-4 rounded-xl bg-[#008f5c] hover:bg-[#007048] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer shadow"
              >
                <${Trophy} size=${14} />
                <span>Ver Tabla Completa</span>
                <${ChevronRight} size=${14} />
              </button>
            `}
          </div>
        </div>
      </div>
    </div>
  `;
}
