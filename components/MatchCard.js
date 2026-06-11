import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { MapPin } from 'lucide-react';
import { getFlagUrl } from './utils.js';

const html = htm.bind(React.createElement);

// Mapeo de personajes estilo Pixar 3D para cada selección del Mundial 2026
const getTeamCharacter = (teamName) => {
  const characters = {
    'México': { emoji: '🤠', name: 'Mariachi' },
    'Sudáfrica': { emoji: '🦁', name: 'Leoncito' },
    'Corea del Sur': { emoji: '🐯', name: 'Tigre' },
    'República Checa': { emoji: '🏰', name: 'Castillo' },
    'Canadá': { emoji: '🦫', name: 'Castor' },
    'Bosnia y Herzegovina': { emoji: '🐉', name: 'Dragón' },
    'Catar': { emoji: '🦅', name: 'Halcón' },
    'Suiza': { emoji: '🏔️', name: 'Montaña' },
    'Brasil': { emoji: '🦜', name: 'Guacamayo' },
    'Marruecos': { emoji: '🦁', name: 'León Atlas' },
    'Haití': { emoji: '🌴', name: 'Palmera' },
    'Escocia': { emoji: '🦄', name: 'Unicornio' },
    'Estados Unidos': { emoji: '🦅', name: 'Águila' },
    'Paraguay': { emoji: '🦜', name: 'Papagayo' },
    'Australia': { emoji: '🦘', name: 'Canguro' },
    'Turquía': { emoji: '🐺', name: 'Lobo' },
    'Alemania': { emoji: '🐻', name: 'Oso' },
    'Curazao': { emoji: '🐠', name: 'Peces' },
    'Costa de Marfil': { emoji: '🐘', name: 'Elefante' },
    'Ecuador': { emoji: '🦅', name: 'Cóndor' },
    'Países Bajos': { emoji: '🦁', name: 'León Naranja' },
    'Japón': { emoji: '🦊', name: 'Kitsune' },
    'Suecia': { emoji: '🦌', name: 'Alce' },
    'Túnez': { emoji: '🦅', name: 'Águila Cartago' },
    'Bélgica': { emoji: '😈', name: 'Diablito' },
    'Egipto': { emoji: '🐈', name: 'Gato Faraón' },
    'Irán': { emoji: '🐆', name: 'Leopardo' },
    'Nueva Zelanda': { emoji: '🥝', name: 'Kiwi' },
    'España': { emoji: '🐂', name: 'Toro' },
    'Cabo Verde': { emoji: '🦈', name: 'Tiburón' },
    'Arabia Saudita': { emoji: '🐪', name: 'Camello' },
    'Uruguay': { emoji: '🦅', name: 'Charrúa' },
    'Francia': { emoji: '🐓', name: 'Gallo' },
    'Senegal': { emoji: '🦁', name: 'León Teranga' },
    'Irak': { emoji: '🦁', name: 'Babilonia' },
    'Noruega': { emoji: '🐻', name: 'Vikingo' },
    'Argentina': { emoji: '🧉', name: 'Gauchito' },
    'Argelia': { emoji: '🦊', name: 'Fennec' },
    'Austria': { emoji: '🦅', name: 'Águila Alpina' },
    'Jordania': { emoji: '🦅', name: 'Halcón Petra' },
    'Portugal': { emoji: '🐓', name: 'Gallo Barcelos' },
    'RD Congo': { emoji: '🐆', name: 'Leopardo Congo' },
    'Uzbekistán': { emoji: '🐺', name: 'Lobo Uzbeko' },
    'Colombia': { emoji: '☕', name: 'Cafeterito' },
    'Inglaterra': { emoji: '🦁', name: 'León Inglés' },
    'Croacia': { emoji: '🐆', name: 'Marta' },
    'Ghana': { emoji: '⭐', name: 'Estrella Negra' },
    'Panamá': { emoji: '🦅', name: 'Águila Arpía' }
  };
  return characters[teamName] || { emoji: '⚽', name: 'Mascotita' };
};

export function MatchCard({ partido, isSaving, onPredict, isUrgent }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [userGolesA, setUserGolesA] = useState('');
  const [userGolesB, setUserGolesB] = useState('');

  const horaInicio = new Date(partido.fecha_hora).getTime();

  useEffect(() => {
    const updateCountdown = () => {
      const diff = horaInicio - Date.now();
      if (diff <= 0) {
        setTimeLeft('Cerrado');
        setIsOpen(false);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours >= 24) {
          setTimeLeft(`Cierra en ${Math.floor(hours / 24)}d`);
        } else if (hours >= 1) {
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`Cierra en ${hours}h ${minutes}m`);
        } else {
          const minutes = Math.floor(diff / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`Cierra en ${minutes}m ${seconds}s`);
        }
        setIsOpen(true);
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [partido.fecha_hora]);

  useEffect(() => {
    setUserGolesA(partido.pronostico_goles_a !== null && partido.pronostico_goles_a !== undefined ? String(partido.pronostico_goles_a) : '');
    setUserGolesB(partido.pronostico_goles_b !== null && partido.pronostico_goles_b !== undefined ? String(partido.pronostico_goles_b) : '');
  }, [partido.pronostico_goles_a, partido.pronostico_goles_b]);

  const fecha = new Date(partido.fecha_hora);
  const charA = getTeamCharacter(partido.equipo_a);
  const charB = getTeamCharacter(partido.equipo_b);
  const isLocked = !isOpen;
  const isSavedUnchanged =
    partido.pronostico_goles_a !== null &&
    partido.pronostico_goles_a !== undefined &&
    partido.pronostico_goles_b !== null &&
    partido.pronostico_goles_b !== undefined &&
    String(partido.pronostico_goles_a) === String(userGolesA) &&
    String(partido.pronostico_goles_b) === String(userGolesB);

  // Formateo de fecha y hora estilo maqueta
  const dateStr = fecha.toLocaleDateString('es-PE', {
    timeZone: 'America/Lima',
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).replace('.', '').replace(',', ''); // ej: "jue 11 de jun"

  const hourStr = fecha.toLocaleTimeString('es-PE', {
    timeZone: 'America/Lima',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).toLowerCase().replace(' ', ''); // ej: "02:00p.m."

  return html`
    <div class="bg-white border border-slate-200 rounded-2xl p-4.5 flex flex-col justify-between transition-all shadow-sm hover:shadow-md hover:border-slate-350 relative ${isUrgent ? 'border-[#005a36] ring-1 ring-[#005a36]/20' : ''} text-slate-800 w-full">
      
      <!-- Top Row: Badge de Fase/Grupo y Número de Partido -->
      <div class="flex items-center justify-between mb-4 w-full">
        <span class="px-2 py-0.5 rounded bg-sky-50 text-sky-700 text-[9px] font-bold uppercase tracking-wide border border-sky-100">
          ${partido.grupo ? `Fase de Grupos · ${partido.grupo}` : partido.fase}
        </span>
        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
          #${partido.numero_partido}
        </span>
      </div>

      <!-- Middle Row: Enfrentamiento (3 Columnas) -->
      <div class="grid grid-cols-3 items-center w-full my-1.5 gap-2">
        <!-- Team A -->
        <div class="flex flex-col items-center justify-center text-center">
          <img src=${getFlagUrl(partido.equipo_a)} class="w-13 h-8.5 rounded-lg border border-slate-200 object-cover shadow-sm flex-shrink-0" alt=${partido.equipo_a} />
          <span class="font-sans font-extrabold text-[11px] text-slate-800 tracking-tight leading-tight mt-2 block truncate max-w-full">
            <span class="mr-0.5" title=${`Mascota: ${charA.name}`}>${charA.emoji}</span>
            ${partido.equipo_a}
          </span>
        </div>
        
        <!-- Hour and Date Info -->
        <div class="flex flex-col items-center justify-center text-center">
          <span class="text-[9px] font-bold text-slate-400 uppercase tracking-wide block mb-0.5">${dateStr}</span>
          <span class="text-[15px] font-black text-slate-900 font-outfit block leading-none py-0.5">${hourStr}</span>
          <span class="text-[8px] font-bold text-slate-450 uppercase tracking-wider block mt-0.5">America/Lima</span>
        </div>

        <!-- Team B -->
        <div class="flex flex-col items-center justify-center text-center">
          <img src=${getFlagUrl(partido.equipo_b)} class="w-13 h-8.5 rounded-lg border border-slate-200 object-cover shadow-sm flex-shrink-0" alt=${partido.equipo_b} />
          <span class="font-sans font-extrabold text-[11px] text-slate-800 tracking-tight leading-tight mt-2 block truncate max-w-full">
            ${partido.equipo_b}
            <span class="ml-0.5" title=${`Mascota: ${charB.name}`}>${charB.emoji}</span>
          </span>
        </div>
      </div>

      <!-- Venue Info -->
      <div class="flex items-center justify-center text-[9px] font-bold text-slate-550 uppercase tracking-wider mt-2.5 space-x-1 bg-slate-50 py-1.5 px-3 rounded-lg border border-slate-150">
        <span class="text-slate-400"><${MapPin} size=${11} /></span>
        <span class="truncate max-w-[90%]" title="${partido.sede || ''} - ${partido.ciudad || ''}">
          ${partido.sede || 'Estadio por definir'}${partido.ciudad ? `, ${partido.ciudad}` : ''}
        </span>
      </div>

      <!-- Bottom Row: Apuesta / Pronóstico (Reemplaza al estadio) -->
      <div class="border-t border-slate-150 pt-3 mt-3.5 w-full">
        ${partido.resultado !== null
          ? html`
              <!-- Partido Finalizado (Resultado Oficial vs Pronóstico) -->
              <div class="flex flex-col space-y-1.5 w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div class="flex items-center justify-between text-[9px] font-extrabold">
                  <div class="text-slate-500 uppercase tracking-wider">Apuesta: <span class="text-slate-800 font-black">${partido.pronostico_goles_a} - ${partido.pronostico_goles_b}</span></div>
                  <div class="text-slate-500 uppercase tracking-wider">Oficial: <span class="text-[#008f5c] font-black">${partido.goles_a} - ${partido.goles_b}</span></div>
                </div>
                <div class="h-px bg-slate-200"></div>
                <div class="flex items-center justify-center text-[9px] font-black uppercase tracking-wider ${partido.puntos_pronostico > 0 ? 'text-[#008f5c]' : 'text-rose-600'}">
                  ${partido.puntos_pronostico === 2 
                    ? '✓ ¡Score Exacto! (+2 Pts)' 
                    : partido.puntos_pronostico === 1 
                      ? '✓ Acertado (+1 Pts)' 
                      : '✗ No Acertado (0 Pts)'}
                </div>
              </div>
            `
          : html`
              <!-- Partido Pendiente (Campos de entrada para apuesta) -->
              <div class="flex items-center justify-between gap-2.5 bg-slate-50 p-1.5 rounded-xl border border-slate-200 relative">
                <div class="flex items-center space-x-1.5 flex-grow justify-center">
                  <span class="text-[9px] font-black text-slate-500 uppercase tracking-wider mr-1">Tú:</span>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    disabled=${isLocked || isSaving}
                    value=${userGolesA}
                    onChange=${e => setUserGolesA(e.target.value)}
                    class="w-9 h-7 text-center bg-white border border-slate-300 rounded-md text-xs font-black focus:border-[#005a36] focus:ring-1 focus:ring-[#005a36] outline-none disabled:opacity-50"
                  />
                  <span class="text-slate-400 font-bold text-xs">-</span>
                  <input 
                    type="number" 
                    min="0"
                    placeholder="0"
                    disabled=${isLocked || isSaving}
                    value=${userGolesB}
                    onChange=${e => setUserGolesB(e.target.value)}
                    class="w-9 h-7 text-center bg-white border border-slate-300 rounded-md text-xs font-black focus:border-[#005a36] focus:ring-1 focus:ring-[#005a36] outline-none disabled:opacity-50"
                  />
                </div>

                <button 
                  disabled=${isLocked || isSaving || userGolesA === '' || userGolesB === '' || isSavedUnchanged} 
                  onClick=${() => onPredict(userGolesA, userGolesB)} 
                  class="py-1.5 px-3 rounded-lg text-[9px] font-black uppercase transition-all bg-[#005a36] hover:bg-[#004d30] border border-[#005a36] text-white disabled:opacity-50 tracking-wider h-7 flex items-center justify-center cursor-pointer select-none"
                >
                  ${isSavedUnchanged ? 'Listo' : 'Guardar'}
                </button>

                ${isSaving && html`
                  <div class="absolute inset-0 bg-white/70 rounded-lg flex items-center justify-center">
                    <div class="w-4 h-4 border-2 border-[#005a36] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                `}
              </div>
              ${isLocked && html`
                <div class="text-[8px] text-center font-bold text-slate-400 uppercase tracking-widest mt-1.5 flex items-center justify-center space-x-1">
                  <span>🔒 apuestas cerradas</span>
                </div>
              `}
            `
        }
      </div>
    </div>
  `;
}

export default MatchCard;
