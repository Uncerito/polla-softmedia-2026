import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { MapPin } from 'lucide-react';
import { getFlagUrl, isPlaceholderTeam } from './utils.js';

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
  const isPlaceholder = isPlaceholderTeam(partido.equipo_a) || isPlaceholderTeam(partido.equipo_b);
  const isLocked = !isOpen || isPlaceholder;
  const statusTimeLeft = isPlaceholder ? 'Por definir' : timeLeft;
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
    <div class="wc-match-card-wrapper">
      <div class="wc-match-card-inner">
        
        <!-- Top Row: Fase y Cuenta Regresiva de Tiempo / Candado -->
        <div class="flex items-center justify-between text-[10px] font-bold tracking-wider mb-4 px-1 text-slate-300">
          <span class="flex items-center gap-1.5 uppercase font-outfit">
            <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            ${partido.grupo ? `Fase de Grupos · Grupo ${partido.grupo}` : partido.fase}
          </span>
          <span class="bg-white/10 px-2 py-0.5 rounded text-white text-[9px] font-black uppercase tracking-widest font-outfit">
            Partido #${partido.numero_partido}
          </span>
        </div>

        <!-- Teams Grid (Dos filas horizontales bien estructuradas) -->
        <div class="flex flex-col space-y-3 flex-grow justify-center my-1.5">
          <!-- Team A Row -->
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center space-x-3 truncate">
              <img src=${getFlagUrl(partido.equipo_a)} class="w-12 h-7.5 rounded border border-white/20 object-cover shadow-md flex-shrink-0" alt=${partido.equipo_a} />
              <span class="wc-team-name truncate" title=${partido.equipo_a}>
                <span class="mr-1" title=${`Mascota: ${charA.name}`}>${charA.emoji}</span>
                ${partido.equipo_a}
              </span>
            </div>
            
            <!-- Score Box / Input Goles A -->
            <div class="wc-score-box">
              ${partido.resultado !== null || isLocked
                ? html`<span>${partido.resultado !== null ? partido.goles_a : (partido.pronostico_goles_a !== null && partido.pronostico_goles_a !== undefined ? partido.pronostico_goles_a : '-')}</span>`
                : html`
                    <input 
                      type="number" 
                      min="0"
                      placeholder="-"
                      disabled=${isSaving}
                      value=${userGolesA}
                      onChange=${e => setUserGolesA(e.target.value)}
                      class="wc-score-input"
                    />
                  `
              }
            </div>
          </div>

          <!-- Divider Line -->
          <div class="wc-divider"></div>

          <!-- Team B Row -->
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center space-x-3 truncate">
              <img src=${getFlagUrl(partido.equipo_b)} class="w-12 h-7.5 rounded border border-white/20 object-cover shadow-md flex-shrink-0" alt=${partido.equipo_b} />
              <span class="wc-team-name truncate" title=${partido.equipo_b}>
                <span class="mr-1" title=${`Mascota: ${charB.name}`}>${charB.emoji}</span>
                ${partido.equipo_b}
              </span>
            </div>
            
            <!-- Score Box / Input Goles B -->
            <div class="wc-score-box">
              ${partido.resultado !== null || isLocked
                ? html`<span>${partido.resultado !== null ? partido.goles_b : (partido.pronostico_goles_b !== null && partido.pronostico_goles_b !== undefined ? partido.pronostico_goles_b : '-')}</span>`
                : html`
                    <input 
                      type="number" 
                      min="0"
                      placeholder="-"
                      disabled=${isSaving}
                      value=${userGolesB}
                      onChange=${e => setUserGolesB(e.target.value)}
                      class="wc-score-input"
                    />
                  `
              }
            </div>
          </div>
        </div>

        <!-- Match Info & Prediction Controls -->
        <div class="mt-4 pt-3 border-t border-white/10 flex flex-col space-y-2.5">
          <!-- Date, Time and Stadium Venue -->
          <div class="flex items-start justify-between gap-2 text-[10px] text-slate-450 font-semibold leading-tight px-1">
            <div class="flex flex-col space-y-0.5 text-left">
              <span>📅 ${dateStr} · <span class="text-white font-bold">${hourStr}</span></span>
              <span class="truncate max-w-[180px] text-[9px] text-slate-400" title=${partido.sede || ''}>🏟️ ${partido.sede || 'Por definir'}</span>
            </div>
            <div class="text-right flex flex-col space-y-0.5">
              <span class="text-slate-400 uppercase tracking-widest text-[8px] font-bold">${statusTimeLeft}</span>
            </div>
          </div>

          <!-- Action Panel (Guardar / Pronóstico / Puntos) -->
          <div class="w-full">
            ${partido.resultado !== null
              ? html`
                  <!-- Partido Finalizado (Resultado Oficial vs Pronóstico) -->
                  <div class="flex flex-col space-y-1 w-full bg-black/30 border border-white/10 p-2 rounded-xl text-[10px]">
                    <div class="flex items-center justify-between px-1">
                      <div class="text-slate-400 font-bold">TU APUESTA: <span class="text-white font-black">${partido.pronostico_goles_a !== null && partido.pronostico_goles_a !== undefined ? `${partido.pronostico_goles_a} - ${partido.pronostico_goles_b}` : 'Ninguna'}</span></div>
                      <div class="text-slate-400 font-bold">OFICIAL: <span class="text-[#8efad4] font-black">${partido.goles_a} - ${partido.goles_b}</span></div>
                    </div>
                    <div class="h-px bg-white/5 my-1"></div>
                    <div class="flex items-center justify-center font-black uppercase tracking-wider ${partido.puntos_pronostico > 0 ? 'text-[#8efad4]' : 'text-rose-400'}">
                      ${partido.puntos_pronostico === 2 
                        ? '✓ ¡Score Exacto! (+2 Pts)' 
                        : partido.puntos_pronostico === 1 
                          ? '✓ Acertado (+1 Pts)' 
                          : '✗ No Acertado (0 Pts)'}
                    </div>
                  </div>
                `
              : html`
                  <!-- Partido Pendiente / Apuestas Abiertas o Cerradas -->
                  <div class="flex items-center justify-between gap-2">
                    <!-- Estado del pronóstico de usuario -->
                    <div class="text-left px-1 flex flex-col">
                      <span class="text-[9px] font-bold text-slate-450 uppercase tracking-wider">Tu Apuesta:</span>
                      <span class="text-xs font-black text-white">
                        ${partido.pronostico_goles_a !== null && partido.pronostico_goles_a !== undefined 
                          ? `${partido.pronostico_goles_a} - ${partido.pronostico_goles_b}` 
                          : 'Sin pronóstico'}
                      </span>
                    </div>

                    ${!isLocked
                      ? html`
                          <button 
                            disabled=${isSaving || userGolesA === '' || userGolesB === '' || isSavedUnchanged} 
                            onClick=${() => onPredict(userGolesA, userGolesB)} 
                            class="py-1 px-3.5 rounded-lg text-[10px] font-black uppercase transition-all bg-[#22c55e] hover:bg-[#16a34a] border border-[#22c55e] text-black disabled:opacity-40 disabled:bg-white/10 disabled:border-white/10 disabled:text-slate-400 tracking-wider h-7 flex items-center justify-center cursor-pointer select-none"
                          >
                            ${isSavedUnchanged ? 'Listo ✓' : 'Guardar'}
                          </button>
                        `
                      : html`
                          <div class="flex items-center space-x-1 bg-white/5 border border-white/10 py-1 px-2.5 rounded-lg text-slate-400 text-[9px] font-black uppercase tracking-wider">
                            <span>🔒 Cerrado</span>
                          </div>
                        `
                    }
                  </div>
                `
            }
          </div>
        </div>

        <!-- FIFA World Cup 2026 Footer Banner -->
        <div class="wc-card-footer-banner">
          FIFA WORLD CUP 2026
        </div>

        <!-- Indicador de carga al guardar -->
        ${isSaving && html`
          <div class="absolute inset-0 bg-black/70 rounded-[22px] flex flex-col items-center justify-center space-y-2 z-20">
            <div class="w-6 h-6 border-2 border-[#8efad4] border-t-transparent rounded-full animate-spin"></div>
            <span class="text-[9px] text-[#8efad4] font-black uppercase tracking-widest animate-pulse">Guardando...</span>
          </div>
        `}

      </div>
    </div>
  `;
}

export default MatchCard;
