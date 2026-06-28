import React from 'react';
import htm from 'htm';
import * as Lucide from 'lucide-react';
import { getFlagUrl } from './utils.js';

const html = htm.bind(React.createElement);
const { GitCommit, Trophy, Award, Calendar, HelpCircle } = Lucide;

export function BracketView({ fixture = [] }) {
  // Intentar filtrar partidos de eliminación directa
  const matches16 = fixture.filter(p => p.fase === '16avos');
  const matches8 = fixture.filter(p => p.fase === 'Octavos');
  const matches4 = fixture.filter(p => p.fase === 'Cuartos');
  const matches2 = fixture.filter(p => p.fase === 'Semifinal');
  const matches1 = fixture.filter(p => p.fase === 'Final');

  // Si no hay partidos cargados en la DB para estas fases, generamos los placeholders oficiales del fixture
  const renderTeam = (teamName, score, isWinner) => {
    const isPlaceholder = !teamName || teamName.includes('Ganador') || teamName.includes('1º') || teamName.includes('2º') || teamName.includes('3º') || teamName.includes('Clasificado');
    const flag = isPlaceholder ? null : getFlagUrl(teamName);
    const displayTeam = isPlaceholder ? (teamName || 'Por definir') : teamName.toUpperCase();

    return html`
      <div class="bracket-team-row ${isWinner ? 'winner' : ''} flex items-center justify-between py-1 text-white">
        <div class="bracket-team-info flex items-center space-x-1.5 truncate">
          ${flag 
            ? html`<img src=${flag} class="w-5 h-3.5 rounded object-cover border border-white/20 shadow-sm" />`
            : html`<span class="text-[11px] text-slate-400">🏳️</span>`
          }
          <span class="text-[10px] font-black truncate max-w-[125px] font-outfit tracking-wide ${isPlaceholder ? 'text-slate-400 font-normal italic' : 'text-white'}">
            ${displayTeam}
          </span>
        </div>
        ${score !== null && score !== undefined && html`
          <span class="bracket-team-score font-black font-outfit text-[10px] ml-2">
            ${score}
          </span>
        `}
      </div>
    `;
  };

  const renderMatchNode = (matchNum, teamA, teamB, scoreA, scoreB, result, label) => {
    const isWinnerA = result === 'gana_a';
    const isWinnerB = result === 'gana_b';

    return html`
      <div class="bracket-match-node wc-bracket-dark text-left select-none relative">
        <div class="text-[7px] font-bold text-slate-350 uppercase tracking-widest mb-1.5 pb-1 border-b border-white/10 flex items-center justify-between">
          <span>Match #${matchNum}</span>
          <span class="font-extrabold text-[#8efad4]">${label}</span>
        </div>
        <div class="space-y-1.5">
          ${renderTeam(teamA, scoreA, isWinnerA)}
          ${renderTeam(teamB, scoreB, isWinnerB)}
        </div>
        <div class="bracket-footer-mini">
          FIFA WORLD CUP 2026
        </div>
      </div>
    `;
  };

  // Datos mock oficiales de la estructura si la base de datos está vacía para eliminación directa
  const getMock16 = () => [
    { num: 73, a: 'Sudáfrica', b: 'Canadá', label: '16avos 1' },
    { num: 74, a: 'Alemania', b: 'Paraguay', label: '16avos 2' },
    { num: 75, a: 'Países Bajos', b: 'Marruecos', label: '16avos 3' },
    { num: 76, a: 'Brasil', b: 'Japón', label: '16avos 4' },
    { num: 77, a: 'Francia', b: 'Suecia', label: '16avos 5' },
    { num: 78, a: 'Costa de Marfil', b: 'Noruega', label: '16avos 6' },
    { num: 79, a: 'México', b: 'Ecuador', label: '16avos 7' },
    { num: 80, a: 'Inglaterra', b: 'RD Congo', label: '16avos 8' },
    { num: 81, a: 'EE. UU.', b: 'Bosnia y Herzegovina', label: '16avos 9' },
    { num: 82, a: 'Bélgica', b: 'Senegal', label: '16avos 10' },
    { num: 83, a: 'España', b: 'Austria', label: '16avos 11' },
    { num: 84, a: 'Portugal', b: 'Croacia', label: '16avos 12' },
    { num: 85, a: 'Suiza', b: 'Argelia', label: '16avos 13' },
    { num: 86, a: 'Argentina', b: 'Islas de Cabo Verde', label: '16avos 14' },
    { num: 87, a: 'Colombia', b: 'Ghana', label: '16avos 15' },
    { num: 88, a: 'Australia', b: 'Egipto', label: '16avos 16' },
  ];

  const getMock8 = () => [
    { num: 89, a: 'Ganador M73', b: 'Ganador M75', label: 'Octavos 1' },
    { num: 90, a: 'Ganador M74', b: 'Ganador M77', label: 'Octavos 2' },
    { num: 91, a: 'Ganador M76', b: 'Ganador M78', label: 'Octavos 3' },
    { num: 92, a: 'Ganador M79', b: 'Ganador M80', label: 'Octavos 4' },
    { num: 93, a: 'Ganador M83', b: 'Ganador M84', label: 'Octavos 5' },
    { num: 94, a: 'Ganador M81', b: 'Ganador M82', label: 'Octavos 6' },
    { num: 95, a: 'Ganador M86', b: 'Ganador M88', label: 'Octavos 7' },
    { num: 96, a: 'Ganador M85', b: 'Ganador M87', label: 'Octavos 8' },
  ];

  const getMock4 = () => [
    { num: 97, a: 'Ganador M89', b: 'Ganador M90', label: 'Cuartos 1' },
    { num: 98, a: 'Ganador M93', b: 'Ganador M94', label: 'Cuartos 2' },
    { num: 99, a: 'Ganador M91', b: 'Ganador M92', label: 'Cuartos 3' },
    { num: 100, a: 'Ganador M95', b: 'Ganador M96', label: 'Cuartos 4' },
  ];

  const getMock2 = () => [
    { num: 101, a: 'Ganador M97', b: 'Ganador M98', label: 'Semifinal 1' },
    { num: 102, a: 'Ganador M99', b: 'Ganador M100', label: 'Semifinal 2' },
  ];

  const getMock1 = () => [
    { num: 104, a: 'Ganador M101', b: 'Ganador M102', label: 'Gran Final' },
  ];

  // Construir columnas reales o mockeadas
  const data16 = matches16.length > 0 ? matches16.map(p => ({ num: p.numero_partido, a: p.equipo_a, b: p.equipo_b, sa: p.goles_a, sb: p.goles_b, res: p.resultado, label: '16avos' })) : getMock16();
  const data8 = matches8.length > 0 ? matches8.map(p => ({ num: p.numero_partido, a: p.equipo_a, b: p.equipo_b, sa: p.goles_a, sb: p.goles_b, res: p.resultado, label: 'Octavos' })) : getMock8();
  const data4 = matches4.length > 0 ? matches4.map(p => ({ num: p.numero_partido, a: p.equipo_a, b: p.equipo_b, sa: p.goles_a, sb: p.goles_b, res: p.resultado, label: 'Cuartos' })) : getMock4();
  const data2 = matches2.length > 0 ? matches2.map(p => ({ num: p.numero_partido, a: p.equipo_a, b: p.equipo_b, sa: p.goles_a, sb: p.goles_b, res: p.resultado, label: 'Semifinal' })) : getMock2();
  const data1 = matches1.length > 0 ? matches1.map(p => ({ num: p.numero_partido, a: p.equipo_a, b: p.equipo_b, sa: p.goles_a, sb: p.goles_b, res: p.resultado, label: 'Final' })) : getMock1();

  const isMock = matches16.length === 0 && matches8.length === 0 && matches4.length === 0 && matches2.length === 0 && matches1.length === 0;

  return html`
    <div class="space-y-6">
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
            <span class="px-2 py-0.5 rounded-full bg-white/20 text-white text-[8px] font-bold uppercase tracking-wider">BRACKET</span>
          </div>
          <h2 class="text-lg font-black font-outfit uppercase mt-2 tracking-tight">Camino a la Copa</h2>
          <p class="text-[10px] md:text-xs text-slate-200/90 font-medium max-w-xl mt-1">Sigue de cerca las llaves de eliminación directa y los cruces desde la ronda de 16avos hasta coronar al campeón.</p>
        </div>
        
        <!-- Copa del Mundo Decorativa Flotante -->
        <div class="relative flex-shrink-0 w-24 h-24 -my-4 -mr-2 flex items-center justify-center select-none z-10">
          <img src="./images/trofeo_mundial.png" class="max-h-full max-w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] transform rotate-6 hover:rotate-0 transition-transform duration-300 animate-pulse" alt="Trophy" />
        </div>
      </div>

      <!-- Info Alert si es Estructura de Simulación -->
      ${isMock && html`
        <div class="flex items-start space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left">
          <${HelpCircle} size=${18} class="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <span class="text-xs font-black text-amber-800 uppercase tracking-wide">Estructura del Torneo</span>
            <p class="text-[10px] text-amber-700 leading-relaxed font-semibold mt-1">
              Actualmente nos encontramos en la Fase de Grupos. Las llaves de abajo muestran los cruces oficiales del Mundial 2026. Los partidos reales aparecerán aquí una vez que los administradores registren los clasificados en la base de datos.
            </p>
          </div>
        </div>
      `}

      <!-- Contenedor Scrollable del Bracket -->
      <div class="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm text-left relative overflow-hidden">
        <div class="bracket-wrapper">
          
          <!-- Ronda 1: 16avos de Final (32 equipos, 16 partidos) -->
          <div class="bracket-column">
            <div class="bracket-header-title">16avos de Final</div>
            <div class="space-y-4">
              ${data16.map(p => renderMatchNode(p.num, p.a, p.b, p.sa, p.sb, p.res, p.label))}
            </div>
          </div>

          <!-- Ronda 2: Octavos de Final (16 equipos, 8 partidos) -->
          <div class="bracket-column">
            <div class="bracket-header-title">Octavos de Final</div>
            <div class="space-y-12">
              ${data8.map(p => renderMatchNode(p.num, p.a, p.b, p.sa, p.sb, p.res, p.label))}
            </div>
          </div>

          <!-- Ronda 3: Cuartos de Final (8 equipos, 4 partidos) -->
          <div class="bracket-column">
            <div class="bracket-header-title">Cuartos de Final</div>
            <div class="space-y-24">
              ${data4.map(p => renderMatchNode(p.num, p.a, p.b, p.sa, p.sb, p.res, p.label))}
            </div>
          </div>

          <!-- Ronda 4: Semifinales (4 equipos, 2 partidos) -->
          <div class="bracket-column">
            <div class="bracket-header-title">Semifinales</div>
            <div class="space-y-[24rem]">
              ${data2.map(p => renderMatchNode(p.num, p.a, p.b, p.sa, p.sb, p.res, p.label))}
            </div>
          </div>

          <!-- Ronda 5: Gran Final (2 equipos, 1 partido) -->
          <div class="bracket-column">
            <div class="bracket-header-title">Gran Final</div>
            <div class="flex flex-col justify-center h-full space-y-6">
              <div class="flex justify-center mb-4 text-center">
                <div class="p-4 rounded-full bg-amber-100 text-amber-600 border border-amber-200 shadow-md">
                  <${Trophy} size=${36} class="animate-bounce" />
                </div>
              </div>
              ${data1.map(p => renderMatchNode(p.num, p.a, p.b, p.sa, p.sb, p.res, p.label))}
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

export default BracketView;
