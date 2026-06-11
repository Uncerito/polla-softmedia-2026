import React, { useState } from 'react';
import htm from 'htm';
import * as Lucide from 'lucide-react';

const html = htm.bind(React.createElement);
const { Trophy, ChevronLeft, ChevronRight } = Lucide;

function CollaboratorAvatar({ userId, nombre, apellido, className }) {
  const [imgSrc, setImgSrc] = useState(`./images/colaboradores/${userId}.png`);
  const [retryJpg, setRetryJpg] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!retryJpg) {
      setRetryJpg(true);
      setImgSrc(`./images/colaboradores/${userId}.jpg`);
    } else {
      setHasError(true);
    }
  };

  const initials = `${nombre ? nombre[0] : ''}${apellido ? apellido[0] : ''}`.toUpperCase();

  if (hasError || !userId) {
    return html`
      <div class="rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 flex-shrink-0 ${className}">
        ${initials}
      </div>
    `;
  }

  return html`
    <img 
      src=${imgSrc} 
      onError=${handleError} 
      class="rounded-full object-cover border border-slate-200 flex-shrink-0 ${className}" 
      alt=${`${nombre} ${apellido}`} 
    />
  `;
}

export function LeaderboardView({ leaderboard, session }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // 1. Ordenar clasificación: puntaje descendente, y en caso de empate, alfabéticamente
  const sortedData = [...leaderboard].sort((a, b) => {
    const ptsA = typeof a.puntos_totales === 'number' ? a.puntos_totales : (a.puntos || 0);
    const ptsB = typeof b.puntos_totales === 'number' ? b.puntos_totales : (b.puntos || 0);
    if (ptsB !== ptsA) {
      return ptsB - ptsA;
    }
    const nameA = `${a.nombre} ${a.apellido}`.toLowerCase();
    const nameB = `${b.nombre} ${b.apellido}`.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // 2. Extraer Top 3 para las tarjetas superiores
  const top3 = sortedData.slice(0, 3);
  
  // Organizar podio: 2do (izquierda), 1ro (centro, destacado), 3ro (derecha)
  const podium = [];
  if (top3[1]) podium.push({ ...top3[1], lugar: 2, colorClass: 'text-slate-400', cardClass: 'bg-gradient-to-t from-slate-50 to-white border-slate-200' });
  if (top3[0]) podium.push({ ...top3[0], lugar: 1, colorClass: 'text-amber-500 drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]', cardClass: 'bg-gradient-to-t from-amber-50 to-white border-amber-300 scale-105 md:scale-110 z-10 ring-2 ring-amber-300/40' });
  if (top3[2]) podium.push({ ...top3[2], lugar: 3, colorClass: 'text-amber-700', cardClass: 'bg-gradient-to-t from-amber-100/10 to-white border-amber-200' });

  // 3. El resto de clasificados a partir del 4to lugar
  const listData = sortedData.slice(3);
  const totalPages = Math.max(1, Math.ceil(listData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = listData.slice(startIndex, startIndex + itemsPerPage);

  const getPoints = (user) => typeof user.puntos_totales === 'number' ? user.puntos_totales : (user.puntos || 0);  return html`
    <div class="space-y-5">
      <!-- Banner Cabecera Mundialista (Con Trofeo de Copa del Mundo) -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#005a36] via-[#008f5c] to-[#04140c] p-4 md:p-5 text-white shadow-sm flex items-center justify-between">
        <!-- Elementos decorativos de fútbol -->
        <div class="absolute right-12 top-0 opacity-10 transform translate-x-6 -translate-y-6 pointer-events-none">
          <svg width="180" height="180" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90C27.9 90 10 72.1 10 50S27.9 10 50 10s40 17.9 40 40-17.9 40-40 40z"/>
          </svg>
        </div>
        
        <div class="relative z-10 text-left">
          <div class="flex items-center space-x-1.5">
            <span class="px-2 py-0.5 rounded-full bg-amber-400 text-[#005a36] text-[8px] font-black uppercase tracking-wider">FIFA WORLD CUP 2026</span>
            <span class="px-2 py-0.5 rounded-full bg-white/20 text-white text-[8px] font-bold uppercase tracking-wider">TABLA</span>
          </div>
          <h2 class="text-lg font-black font-outfit uppercase mt-2 tracking-tight">Clasificación Global</h2>
          <p class="text-[10px] md:text-xs text-slate-200/90 font-medium max-w-xl mt-1">Tabla de posiciones general de todos los competidores de los Pronósticos SoftMedia.</p>
        </div>
        
        <!-- Copa del Mundo Decorativa Flotante -->
        <div class="relative flex-shrink-0 w-24 h-24 -my-4 -mr-2 flex items-center justify-center select-none z-10">
          <img src="./images/trofeo_mundial.png" class="max-h-full max-w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] transform rotate-6 hover:rotate-0 transition-transform duration-300 animate-pulse" alt="Trophy" />
        </div>
      </div>

      <!-- Podio / Tarjetas de 1er, 2do y 3er Lugar con Copas -->
      ${podium.length > 0 && html`
        <div class="grid grid-cols-3 gap-2.5 sm:gap-4 max-w-2xl mx-auto items-end pt-7 pb-2">
          ${podium.map((user) => {
            const isMe = user.id === session.user.id;
            const pts = getPoints(user);
            const userCardClass = user.lugar === 1 
              ? 'bg-gradient-to-br from-amber-50 to-amber-100/40 border-amber-300 scale-105 md:scale-110 z-10 ring-2 ring-amber-300/40' 
              : 'bg-white border-slate-200';

            return html`
              <div key=${user.id} class="glass-panel p-3.5 sm:p-5 flex flex-col items-center text-center relative ${userCardClass} ${isMe && user.lugar !== 1 ? 'ring-2 ring-emerald-500 bg-emerald-50/20' : ''}">
                
                <!-- Copa indicador de Lugar -->
                <div class="absolute -top-6 w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center ${user.colorClass}">
                  <${Trophy} size=${18} />
                </div>
                
                <span class="text-[8px] font-bold uppercase tracking-wider text-slate-500 mt-4">${user.lugar}° Puesto</span>
                
                <!-- Avatar -->
                <${CollaboratorAvatar} 
                  userId=${user.id} 
                  nombre=${user.nombre} 
                  apellido=${user.apellido} 
                  className="w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl my-2.5" 
                />
                
                <!-- Nombre -->
                <span class="text-xs sm:text-sm font-bold text-slate-800 truncate max-w-full leading-tight">
                  ${user.nombre}
                </span>
                
                <!-- Puntos -->
                <div class="mt-3 pt-2.5 border-t border-slate-150 w-full text-center">
                  <span class="text-lg sm:text-xl font-bold scoreboard-font text-slate-850 leading-none">${pts}</span>
                  <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wide block mt-0.5">Puntos</span>
                </div>
              </div>
            `;
          })}
        </div>
      `}

      <!-- Lista a partir del 4to Lugar -->
      <div class="glass-panel overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <h3 class="font-outfit font-bold text-slate-800 text-xs tracking-wider uppercase">Posiciones desde el 4° Lugar</h3>
        </div>
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-100/60 text-slate-650 text-[10px] font-bold uppercase tracking-wider">
              <th class="py-2.5 px-5 text-center w-16">Pos</th>
              <th class="py-2.5 px-5">Colaborador</th>
              <th class="py-2.5 px-5 text-center">Puntos Totales</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-150 text-xs sm:text-sm">
            ${paginatedData.length === 0
              ? html`<tr><td colspan="3" class="py-10 text-center text-slate-500 font-semibold">No hay más competidores registrados.</td></tr>`
              : paginatedData.map((user, idx) => {
                  const isMe = user.id === session.user.id;
                  const pts = getPoints(user);
                  return html`
                    <tr key=${user.id} class="hover:bg-slate-50/85 transition-colors ${isMe ? 'bg-emerald-50/80 font-bold text-[#005a36] border-l-4 border-[#005a36]' : 'text-slate-700'}">
                      <td class="py-2.5 px-5 text-center">
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600 text-xs font-bold">
                          ${startIndex + idx + 4}
                        </span>
                      </td>
                      <td class="py-2.5 px-5 flex items-center space-x-3">
                        <${CollaboratorAvatar} 
                          userId=${user.id} 
                          nombre=${user.nombre} 
                          apellido=${user.apellido} 
                          className="w-16 h-16 text-lg" 
                        />
                        <span class="truncate font-semibold">${user.nombre} ${user.apellido}</span>
                      </td>
                      <td class="py-2.5 px-5 text-center font-bold font-outfit text-slate-850 text-sm sm:text-base">
                        ${pts} <span class="text-[10px] font-medium text-slate-500 lowercase">pts</span>
                      </td>
                    </tr>
                  `;
                })
            }
          </tbody>
        </table>
        
        <!-- Paginación -->
        ${totalPages > 1 && html`
          <div class="bg-slate-50 py-2.5 px-5 border-t border-slate-200 flex items-center justify-between">
            <span class="text-[10px] font-bold text-slate-550 uppercase tracking-wider">Página ${currentPage} de ${totalPages}</span>
            <div class="flex items-center space-x-2">
              <button disabled=${currentPage === 1} onClick=${() => setCurrentPage(prev => Math.max(1, prev - 1))} class="p-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded transition-all"><${ChevronLeft} size=${14} /></button>
              <button disabled=${currentPage === totalPages} onClick=${() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} class="p-2 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded transition-all"><${ChevronRight} size=${14} /></button>
            </div>
          </div>
        `}
      </div>
    </div>
  `;
}

export default LeaderboardView;
