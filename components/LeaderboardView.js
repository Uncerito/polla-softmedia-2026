import React, { useState, useEffect } from 'react';
import htm from 'htm';
import * as Lucide from 'lucide-react';
import { getFlagUrl } from './utils.js';

const html = htm.bind(React.createElement);
const { Trophy, ChevronLeft, ChevronRight } = Lucide;

function formatPredictionDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const d = date.toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const t = date.toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  return `${d} ${t}`;
}

function CollaboratorAvatar({ userId, nombre, apellido, className }) {
  const getCollaboratorFilename = (nom, ape) => {
    if (!nom) return '';
    const clean = (str) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
    };
    const normNombre = clean(nom);
    const normApellido = clean(ape || '');
    const combined = normNombre + normApellido;

    const exceptions = {
      'marcorumaldo': 'marcoromaldo',
      'martingonzales': 'martringonzales',
      'paulmalqui': 'paulmallqui',
      'kojiropacha': 'kojiropachas',
      'melizamendoza': 'melizamensoza',
      'melisamendoza': 'melizamensoza',
    };

    return exceptions[combined] || combined;
  };

  const filename = getCollaboratorFilename(nombre, apellido);
  const [imgSrc, setImgSrc] = useState(filename ? `./images/colaboradores/${filename}.png` : '');
  const [retryJpg, setRetryJpg] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!filename) {
      setHasError(true);
    } else {
      setImgSrc(`./images/colaboradores/${filename}.png`);
      setRetryJpg(false);
      setHasError(false);
    }
  }, [filename]);

  const handleError = () => {
    if (!retryJpg && filename) {
      setRetryJpg(true);
      setImgSrc(`./images/colaboradores/${filename}.jpg`);
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

  // 1. Ordenar clasificación: puntaje descendente, y en caso de empate, por hora de apuesta del último partido culminado (más antigua primero), y si persiste, alfabéticamente
  const sortedData = [...leaderboard].sort((a, b) => {
    const ptsA = Number(a.puntos_totales !== undefined && a.puntos_totales !== null ? a.puntos_totales : (a.puntos || 0));
    const ptsB = Number(b.puntos_totales !== undefined && b.puntos_totales !== null ? b.puntos_totales : (b.puntos || 0));
    if (ptsB !== ptsA) {
      return ptsB - ptsA;
    }

    // Desempate por la hora de apuesta del último partido culminado (más antigua primero)
    const timeA = a.fecha_apuesta_ultimo_partido;
    const timeB = b.fecha_apuesta_ultimo_partido;
    if (timeA && timeB) {
      const dateA = new Date(timeA).getTime();
      const dateB = new Date(timeB).getTime();
      if (dateA !== dateB) {
        return dateA - dateB;
      }
    } else if (timeA && !timeB) {
      return -1;
    } else if (!timeA && timeB) {
      return 1;
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

  const getPoints = (user) => typeof user.puntos_totales === 'number' ? user.puntos_totales : (user.puntos || 0);
  const ultimoPartido = leaderboard[0]?.ultimo_partido_jugado;
  return html`
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

                <!-- Estadísticas de Aciertos/Fallos en Podio -->
                <div class="flex items-center justify-center space-x-2 mt-1.5 text-[9px] font-bold">
                  <span class="text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-100" title="Acertados">🟢 ${user.acertados || 0}</span>
                  <span class="text-rose-600 bg-rose-50 px-1 py-0.2 rounded border border-rose-100" title="Perdidos">🔴 ${user.perdidos || 0}</span>
                  <span class="text-slate-600 bg-slate-50 px-1 py-0.2 rounded border border-slate-200" title="No Apostados">⚫ ${user.no_apostados || 0}</span>
                </div>
                
                <!-- Puntos -->
                <div class="mt-3 pt-2.5 border-t border-slate-150 w-full text-center">
                  <span class="text-lg sm:text-xl font-bold scoreboard-font text-slate-850 leading-none">${pts}</span>
                  <span class="text-[9px] font-bold text-slate-550 uppercase tracking-wide block mt-0.5">Puntos</span>
                </div>

                <!-- Pronósticos de los Últimos Partidos Cerrados -->
                ${user.ultimos_pronosticos && user.ultimos_pronosticos.length > 0 && html`
                  <div class="mt-2.5 pt-2.5 border-t border-slate-150 w-full flex flex-col items-center">
                    <span class="text-[8px] font-bold text-slate-550 uppercase tracking-wider mb-1">Últimos Pronósticos</span>
                    <div class="flex flex-col space-y-1.5 w-full">
                      ${user.ultimos_pronosticos.map((item) => {
                        const titleText = `${item.equipo_a} vs ${item.equipo_b} ${item.goles_a_oficial !== null ? `(Oficial: ${item.goles_a_oficial}-${item.goles_b_oficial})` : '(Pendiente)'}`;
                        return html`
                          <div key=${item.partido_id} class="flex flex-col items-center justify-center p-1 rounded bg-slate-50/50 border border-slate-100" title=${titleText}>
                            <div class="flex items-center justify-center space-x-1">
                              <img src=${getFlagUrl(item.equipo_a)} class="w-4 h-2.5 object-cover rounded shadow-xs" alt=${item.equipo_a} />
                              <span class="text-[9.5px] font-black text-slate-800">
                                ${item.no_aposto ? '-' : `${item.goles_a} - ${item.goles_b}`}
                              </span>
                              <img src=${getFlagUrl(item.equipo_b)} class="w-4 h-2.5 object-cover rounded shadow-xs" alt=${item.equipo_b} />
                            </div>
                            <div class="mt-0.5 leading-none">
                              ${item.no_aposto
                                ? html`<span class="text-[7px] bg-slate-100 text-slate-450 px-1 py-0.2 rounded font-bold uppercase tracking-wider">Sin Pts</span>`
                                : item.resultado_oficial === null
                                  ? html`<span class="inline-flex items-center px-1 py-0.2 rounded text-[7px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">Pend.</span>`
                                  : html`
                                      <span class="inline-flex items-center px-1 py-0.2 rounded text-[7px] font-black uppercase tracking-wider ${
                                        item.puntos_ganados === 2
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                          : item.puntos_ganados === 1
                                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                            : 'bg-rose-50 text-rose-700 border border-rose-100'
                                      }">
                                        ${item.puntos_ganados === 2 ? '+2' : item.puntos_ganados === 1 ? '+1' : '0'} Pts
                                      </span>
                                    `
                              }
                            </div>
                          </div>
                        `;
                      })}
                    </div>
                  </div>
                `}
              </div>
            `;
          })}
        </div>
      `}

      <!-- Lista a partir del 4to Lugar -->
      <div class="glass-panel overflow-hidden">
        <div class="px-5 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h3 class="font-outfit font-bold text-slate-800 text-xs tracking-wider uppercase">Posiciones desde el 4° Lugar</h3>
          ${leaderboard[0]?.partido_referencia_descripcion && html`
            <div class="inline-flex items-center space-x-1.5 text-[9px] sm:text-[10px] text-slate-550 font-bold bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full w-fit">
              <span class="w-1.5 h-1.5 rounded-full ${leaderboard[0].partido_referencia_es_en_curso ? 'bg-amber-500 animate-pulse' : 'bg-slate-400'}"></span>
              <span>Últ. Partido: <b>${leaderboard[0].partido_referencia_descripcion}</b></span>
              <span class="text-slate-400 uppercase text-[8px]">(${leaderboard[0].partido_referencia_es_en_curso ? 'En Curso' : 'Terminado'})</span>
            </div>
          `}
        </div>
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 bg-slate-100/60 text-slate-650 text-[10px] font-bold uppercase tracking-wider">
              <th class="py-2.5 px-3 sm:px-5 text-center w-12 sm:w-16">Pos</th>
              <th class="py-2.5 px-3 sm:px-5">Colaborador</th>
              <th class="py-2.5 px-3 sm:px-5 text-center">Estadísticas</th>
              <th class="py-2.5 px-3 sm:px-5 text-center min-w-[145px]" title="Pronósticos de los 2 últimos partidos cerrados (Pasa el cursor para ver detalles)">
                Últimos Pronósticos
              </th>
              <th class="py-2.5 px-3 sm:px-5 text-center w-28">Puntos Totales</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-150 text-xs sm:text-sm">
            ${paginatedData.length === 0
              ? html`<tr><td colspan="5" class="py-10 text-center text-slate-500 font-semibold">No hay más competidores registrados.</td></tr>`
              : paginatedData.map((user, idx) => {
                  const isMe = user.id === session.user.id;
                  const pts = getPoints(user);
                  return html`
                    <tr key=${user.id} class="hover:bg-slate-50/85 transition-colors ${isMe ? 'bg-emerald-50/80 font-bold text-[#005a36] border-l-4 border-[#005a36]' : 'text-slate-700'}">
                      <td class="py-2.5 px-3 sm:px-5 text-center">
                        <span class="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600 text-xs font-bold">
                          ${startIndex + idx + 4}
                        </span>
                      </td>
                      <td class="py-2.5 px-3 sm:px-5 flex items-center space-x-3">
                        <${CollaboratorAvatar} 
                          userId=${user.id} 
                          nombre=${user.nombre} 
                          apellido=${user.apellido} 
                          className="w-12 h-12 sm:w-16 sm:h-16 text-xs sm:text-lg" 
                        />
                        <span class="truncate font-semibold text-xs sm:text-sm">${user.nombre} ${user.apellido}</span>
                      </td>
                      <td class="py-2.5 px-3 sm:px-5 text-center whitespace-nowrap">
                        <div class="flex items-center justify-center space-x-1 sm:space-x-2 font-bold text-[10px] sm:text-xs">
                          <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100" title="Acertados">
                            🟢 <span class="ml-0.5 sm:ml-1">${user.acertados || 0}</span>
                            <span class="hidden md:inline ml-1 text-[9px] uppercase font-semibold">Acertados</span>
                          </span>
                          <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100" title="Perdidos">
                            🔴 <span class="ml-0.5 sm:ml-1">${user.perdidos || 0}</span>
                            <span class="hidden md:inline ml-1 text-[9px] uppercase font-semibold">Perdidos</span>
                          </span>
                          <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-50 text-slate-700 border border-slate-200" title="No Apostados">
                            ⚫ <span class="ml-0.5 sm:ml-1">${user.no_apostados || 0}</span>
                            <span class="hidden md:inline ml-1 text-[9px] uppercase font-semibold">No Apostados</span>
                          </span>
                        </div>
                      </td>
                      <td class="py-2.5 px-3 sm:px-5 text-center">
                        <div class="flex flex-col sm:flex-row gap-2 justify-center items-center">
                          ${user.ultimos_pronosticos && user.ultimos_pronosticos.length > 0
                            ? user.ultimos_pronosticos.map((item) => {
                                const titleText = `${item.equipo_a} vs ${item.equipo_b} ${item.goles_a_oficial !== null ? `(Oficial: ${item.goles_a_oficial}-${item.goles_b_oficial})` : '(Pendiente)'}`;
                                return html`
                                  <div key=${item.partido_id} class="flex flex-col items-center justify-center p-1.5 rounded-lg border border-slate-100 bg-white shadow-2xs max-w-[125px] w-full text-center hover:bg-slate-50 transition-colors" title=${titleText}>
                                    <div class="flex items-center justify-center space-x-1">
                                      <img src=${getFlagUrl(item.equipo_a)} class="w-5 h-3 object-cover rounded border border-slate-100" alt=${item.equipo_a} />
                                      <span class="font-black text-slate-800 text-[10px]">
                                        ${item.no_aposto ? '-' : `${item.goles_a}-${item.goles_b}`}
                                      </span>
                                      <img src=${getFlagUrl(item.equipo_b)} class="w-5 h-3 object-cover rounded border border-slate-100" alt=${item.equipo_b} />
                                    </div>
                                    
                                    ${item.goles_a_oficial !== null && html`
                                      <div class="text-[8px] text-slate-500 font-bold mt-0.5 leading-none">
                                        Ofi: ${item.goles_a_oficial}-${item.goles_b_oficial}
                                      </div>
                                    `}
                                    
                                    <div class="mt-1 leading-none">
                                      ${item.no_aposto
                                        ? html`<span class="text-[8px] bg-slate-50 text-slate-450 px-1 py-0.2 rounded font-bold uppercase tracking-wider">Sin Pts</span>`
                                        : item.resultado_oficial === null
                                          ? html`<span class="inline-flex items-center px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100 animate-pulse">Pend.</span>`
                                          : html`
                                              <span class="inline-flex items-center px-1 py-0.2 rounded text-[8px] font-black uppercase tracking-wider ${
                                                item.puntos_ganados === 2
                                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                  : item.puntos_ganados === 1
                                                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                                    : 'bg-rose-50 text-rose-700 border border-rose-100'
                                              }">
                                                ${item.puntos_ganados === 2 ? '+2 Pts' : item.puntos_ganados === 1 ? '+1 Pt' : '0 Pts'}
                                              </span>
                                            `
                                      }
                                    </div>
                                  </div>
                                `;
                              })
                            : html`<span class="text-slate-400 italic text-xs">Sin registros</span>`
                          }
                        </div>
                      </td>
                      <td class="py-2.5 px-3 sm:px-5 text-center font-bold font-outfit text-slate-850 text-xs sm:text-base">
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
