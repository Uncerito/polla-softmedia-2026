import React from 'react';
import htm from 'htm';
import * as Lucide from 'lucide-react';
import { getFlagUrl } from './utils.js';

const html = htm.bind(React.createElement);
const { Users } = Lucide;

export const calculateGroupStandings = (matches) => {
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
};

export function GroupStandingsView({ fixture }) {
  const standings = calculateGroupStandings(fixture);
  const groupNames = Object.keys(standings);

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
            <span class="px-2 py-0.5 rounded-full bg-white/20 text-white text-[8px] font-bold uppercase tracking-wider">GRUPOS</span>
          </div>
          <h2 class="text-lg font-black font-outfit uppercase mt-2 tracking-tight">Grupos del Mundial</h2>
          <p class="text-[10px] md:text-xs text-slate-200/90 font-medium max-w-xl mt-1">Tablas de posiciones de la Fase de Grupos calculadas según los resultados reales.</p>
        </div>
        
        <!-- Copa del Mundo Decorativa Flotante -->
        <div class="relative flex-shrink-0 w-24 h-24 -my-4 -mr-2 flex items-center justify-center select-none z-10">
          <img src="./images/trofeo_mundial.png" class="max-h-full max-w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] transform rotate-6 hover:rotate-0 transition-transform duration-300 animate-pulse" alt="Trophy" />
        </div>
      </div>

      ${groupNames.length === 0
      ? html`
            <div class="glass-panel p-12 text-center text-slate-500">
              <p class="font-outfit font-semibold text-lg text-slate-700">No hay información de grupos disponible.</p>
              <p class="text-sm text-slate-400 mt-1">El fixture debe contener grupos asignados.</p>
            </div>
          `
      : html`
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              ${groupNames.map(gName => {
        const teams = standings[gName];
        return html`
                  <div key=${gName} class="glass-panel overflow-hidden">
                    <div class="bg-[#005a36] px-5 py-2.5 text-white flex items-center justify-center">
                      <h3 class="font-outfit font-bold tracking-wider text-sm uppercase text-center text-white">${gName}</h3>
                    </div>

                    <div class="overflow-x-auto">
                      <table class="w-full text-left border-collapse">
                        <thead>
                          <tr class="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
                            <th class="py-2.5 px-3 text-center w-8">Pos</th>
                            <th class="py-2.5 px-3">Equipo</th>
                            <th class="py-2.5 px-2 text-center w-8">PJ</th>
                            <th class="py-2.5 px-2 text-center w-8">G</th>
                            <th class="py-2.5 px-2 text-center w-8">E</th>
                            <th class="py-2.5 px-2 text-center w-8">P</th>
                            <th class="py-2.5 px-2 text-center w-8">GF</th>
                            <th class="py-2.5 px-2 text-center w-8">GC</th>
                            <th class="py-2.5 px-2 text-center w-8">DG</th>
                            <th class="py-2.5 px-3 text-center w-10 font-bold text-[#005a36] bg-[#005a36]/10">Pts</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-150 text-xs">
                          ${teams.map((stats, idx) => {
          const isQualifier = idx < 2;
          return html`
                              <tr key=${stats.equipo} class="hover:bg-slate-50 transition-colors ${isQualifier ? 'bg-emerald-50/60' : ''}">
                                <td class="py-2.5 px-3 text-center">
                                  <span class="inline-flex items-center justify-center w-4 h-4 rounded text-[10px] font-bold ${isQualifier ? 'bg-[#005a36]/20 text-[#005a36]' : 'bg-slate-100 text-slate-550'}">
                                    ${idx + 1}
                                  </span>
                                </td>
                                <td class="py-3 px-3 font-semibold text-slate-800 flex items-center space-x-2 truncate">
                                  <img src=${getFlagUrl(stats.equipo)} alt=${stats.equipo} class="w-5 h-3.5 rounded object-cover border border-slate-200 flex-shrink-0" />
                                  <span class="truncate">${stats.equipo}</span>
                                </td>
                                <td class="py-2.5 px-2 text-center text-slate-500">${stats.pj}</td>
                                <td class="py-2.5 px-2 text-center text-slate-700">${stats.pg}</td>
                                <td class="py-2.5 px-2 text-center text-slate-500">${stats.pe}</td>
                                <td class="py-2.5 px-2 text-center text-slate-500">${stats.pp}</td>
                                <td class="py-2.5 px-2 text-center text-slate-500">${stats.gf}</td>
                                <td class="py-2.5 px-2 text-center text-slate-500">${stats.gc}</td>
                                <td class="py-2.5 px-2 text-center font-bold ${stats.dg > 0 ? 'text-emerald-600' : stats.dg < 0 ? 'text-rose-600' : 'text-slate-500'}">
                                  ${stats.dg > 0 ? `+${stats.dg}` : stats.dg}
                                </td>
                                <td class="py-2.5 px-3 text-center font-bold text-[#005a36] bg-[#005a36]/5 font-outfit text-sm">
                                  ${stats.pts}
                                </td>
                              </tr>
                            `;
        })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                `;
      })}
            </div>
          `}
    </div>
  `;
}

export default GroupStandingsView;
