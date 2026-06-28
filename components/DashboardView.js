import React, { useState, useEffect } from 'react';
import htm from 'htm';
import * as Lucide from 'lucide-react';
import { db } from '../supabase.js';
import { getFlagUrl, isPlaceholderTeam } from './utils.js?v=1.1.0';
import { MatchCard } from './MatchCard.js?v=1.1.0';

const html = htm.bind(React.createElement);
const { Clock, Star, Shield, Calendar, Trophy, AlertCircle, Users, Edit, Check, BarChart3, ChevronDown } = Lucide;

export function DashboardView({
  session, fixture, dailyResults, leaderboard = [], onSavePrediction, addToast,
  dashboardTab, setDashboardTab, selectedEliminatoria, setSelectedEliminatoria,
  fullFixture = []
}) {
  const [selectedJornada, setSelectedJornada] = useState('Todas');
  const [savingPrediction, setSavingPrediction] = useState(null);

  const handlePredict = async (partidoId, golesA, golesB) => {
    setSavingPrediction(partidoId);
    try {
      await db.savePrediction(session.user.id, partidoId, golesA, golesB);
      await onSavePrediction();
      addToast('¡Predicción guardada!');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setSavingPrediction(null);
    }
  };

  // Corrección de filtro flexible para el esquema real de Supabase
  const hasGroupMatches = fixture.some(p => p.grupo !== null || (p.fase && p.fase.toLowerCase().includes('grupo')));

  let matchesToShow = fixture;
  if (dashboardTab === 'proximos') {
    // Only show matches for prediction if both teams are fully defined/resolved
    matchesToShow = fixture.filter(p => !isPlaceholderTeam(p.equipo_a) && !isPlaceholderTeam(p.equipo_b));
  }

  if (hasGroupMatches && selectedJornada !== 'Todas') {
    matchesToShow = matchesToShow.filter(p => Number(p.jornada) === Number(selectedJornada));
  }

  const sortedMatches = [...matchesToShow].sort((a, b) => {
    if (dashboardTab === 'pasados') {
      return new Date(b.fecha_hora) - new Date(a.fecha_hora);
    }
    return new Date(a.fecha_hora) - new Date(b.fecha_hora);
  });

  const matchesByDay = {};
  const dayKeysInOrder = [];

  sortedMatches.forEach(partido => {
    const date = new Date(partido.fecha_hora);
    const key = date.toLocaleDateString('es-PE', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    
    if (!matchesByDay[key]) {
      matchesByDay[key] = [];
      dayKeysInOrder.push(key);
    }
    matchesByDay[key].push(partido);
  });

  const getDayHeaderString = (fechaHoraStr) => {
    const fecha = new Date(fechaHoraStr);
    const options = { timeZone: 'America/Lima', weekday: 'long', day: 'numeric', month: 'long' };
    return `⚽ ${new Intl.DateTimeFormat('es-PE', options).format(fecha).toUpperCase().replace(',', '')}`;
  };

  const availableJornadas = ['Todas', ...Array.from(new Set(
    (fullFixture.length > 0 ? fullFixture : fixture)
      .filter(p => p.fase === 'Grupos' && p.jornada !== null && p.jornada !== undefined)
      .map(p => String(p.jornada))
  )).sort((a, b) => Number(a) - Number(b))];

  const matchesForStats = fullFixture.length > 0 ? fullFixture : fixture;
  const totalJugados = matchesForStats.filter(p => p.resultado !== null).length;
  const totalApostados = matchesForStats.filter(p => p.prediccion_usuario !== null).length;
  const totalAcertados = matchesForStats.filter(p => p.puntos_pronostico > 0).length;
  const totalNoAcertados = matchesForStats.filter(p => p.resultado !== null && p.puntos_pronostico === 0).length;
  
  const userRow = leaderboard.find(u => u.id === session.user.id);
  const totalPuntosGlobal = userRow ? (userRow.puntos_totales || userRow.puntos || 0) : matchesForStats.reduce((sum, p) => sum + (p.puntos_pronostico || 0), 0);

  return html`
    <div class="space-y-5 w-full dashboard-assemble text-slate-200">
      
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
            <span class="px-2 py-0.5 rounded-full bg-white/20 text-white text-[8px] font-bold uppercase tracking-wider">MIS PRONÓSTICOS</span>
          </div>
          <h2 class="text-lg font-black font-outfit uppercase mt-2 tracking-tight">Mis Pronósticos</h2>
          <p class="text-[10px] md:text-xs text-slate-200/90 font-medium max-w-xl mt-1">Ingresa y guarda tus goles pronosticados para cada encuentro antes del pitazo inicial.</p>
        </div>
        
        <!-- Copa del Mundo Decorativa Flotante -->
        <div class="relative flex-shrink-0 w-24 h-24 -my-4 -mr-2 flex items-center justify-center select-none z-10">
          <img src="./images/trofeo_mundial.png" class="max-h-full max-w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] transform rotate-6 hover:rotate-0 transition-transform duration-300 animate-pulse" alt="Trophy" />
        </div>
      </div>

      <div class="my-2 text-left p-5 rounded-xl bg-white border border-slate-200 shadow-sm">
        <div class="flex items-center justify-between border-b border-slate-200 pb-3 mb-4">
          <div class="text-left">
            <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Resumen de Actividad</span>
            <h3 class="text-sm font-black font-outfit text-slate-850 uppercase tracking-wider mt-0.5">Mi Rendimiento</h3>
          </div>
          <div class="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
            <span class="w-1.5 h-1.5 rounded-full bg-[#008f5c] animate-pulse"></span>
            <span class="text-[9px] font-bold text-[#008f5c] uppercase tracking-wider">${session.user.nombre} ${session.user.apellido}</span>
          </div>
        </div>

        <div class="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div class="flex items-center justify-between"><span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Jugados</span><span class="text-slate-400"><${Users} size=${14} /></span></div>
            <div class="mt-2"><span class="text-xl font-black font-outfit text-slate-850 leading-none">${totalJugados}</span></div>
          </div>
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div class="flex items-center justify-between"><span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Apostados</span><span class="text-slate-400"><${Edit} size=${14} /></span></div>
            <div class="mt-2"><span class="text-xl font-black font-outfit text-slate-850 leading-none">${totalApostados}</span></div>
          </div>
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div class="flex items-center justify-between"><span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Acertados</span><span class="text-[#008f5c]"><${Check} size=${14} /></span></div>
            <div class="mt-2"><span class="text-xl font-black font-outfit text-[#008f5c] leading-none">${totalAcertados}</span></div>
          </div>
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
            <div class="flex items-center justify-between"><span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider">No Acertados</span><span class="text-rose-450"><${AlertCircle} size=${14} /></span></div>
            <div class="mt-2"><span class="text-xl font-black font-outfit text-rose-500 leading-none">${totalNoAcertados}</span></div>
          </div>
          <div class="bg-gradient-to-br from-[#005a36] to-[#121616] border border-slate-200 rounded-xl p-4 flex flex-col justify-between lg:col-span-1 col-span-2 text-white">
            <div class="flex items-center justify-between"><span class="text-[9px] font-bold text-white/90 uppercase tracking-wider">Puntuación</span><span class="text-[#f6b426]"><${Trophy} size=${14} /></span></div>
            <div class="mt-2"><span class="text-xl font-black font-outfit text-white leading-none">${totalPuntosGlobal} <span class="text-[10px] font-normal text-slate-350">Pts</span></span></div>
          </div>
        </div>
      </div>

      <div class="flex items-center space-x-2 border-b border-slate-200 pt-2">
        <button onClick=${() => { setDashboardTab('proximos'); setSelectedJornada('Todas'); }} class="px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${dashboardTab === 'proximos' ? 'border-[#008f5c] text-[#008f5c] font-bold bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}">
          Próximos
        </button>
        <button onClick=${() => { setDashboardTab('pasados'); setSelectedJornada('Todas'); }} class="px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${dashboardTab === 'pasados' ? 'border-[#008f5c] text-[#008f5c] font-bold bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}">
          Resultados / Pasados
        </button>
        <button onClick=${() => { setDashboardTab('eliminatorias'); setSelectedJornada('Todas'); }} class="px-4 py-2.5 text-xs font-bold border-b-2 transition-all ${dashboardTab === 'eliminatorias' ? 'border-[#008f5c] text-[#008f5c] font-bold bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}">
          Fases Eliminatorias
        </button>
      </div>

      ${dashboardTab === 'eliminatorias' && html`
        <div class="flex flex-wrap gap-1.5 items-center bg-slate-100 p-1.5 rounded-lg border border-slate-200 w-full sm:w-fit">
          ${['16avos', 'Octavos', 'Cuartos', 'Semifinal', 'Final'].map(fase => html`
            <button key=${fase} onClick=${() => setSelectedEliminatoria(fase)} class="px-3 py-1 rounded text-xs font-bold transition-all ${selectedEliminatoria === fase ? 'bg-[#005a36] text-white font-bold' : 'text-slate-500 hover:text-slate-800'}">
              ${fase === '16avos' ? '16avos' : fase === 'Semifinal' ? 'Semifinales' : fase}
            </button>
          `)}
        </div>
      `}

      ${hasGroupMatches && availableJornadas.length > 1 && html`
        <div class="bg-slate-100 border border-slate-200 p-3 rounded-lg flex items-center space-x-3 w-fit">
          <span class="text-xs font-bold text-slate-650 uppercase tracking-wider">Jornada:</span>
          <div class="flex items-center space-x-1 bg-white p-1 rounded border border-slate-200">
            ${availableJornadas.map(j => html`
              <button key=${j} onClick=${() => setSelectedJornada(j)} class="px-3 py-1 rounded text-[11px] font-bold transition-all ${selectedJornada === j ? 'bg-[#005a36] text-white' : 'text-slate-500 hover:text-slate-800'}">${j}</button>
            `)}
          </div>
        </div>
      `}

      <div class="space-y-6">
        ${matchesToShow.length === 0
          ? html`
              <div class="bg-white border border-slate-200 p-12 text-center rounded-xl text-slate-500 shadow-sm">
                <${Clock} size=${24} class="mx-auto text-slate-400 mb-2" />
                <p class="font-outfit font-bold text-xs text-slate-650">No hay partidos disponibles en esta sección.</p>
              </div>
            `
          : html`
              ${dayKeysInOrder.map(dayKey => {
                const dayMatches = matchesByDay[dayKey];
                return html`
                  <div key=${dayKey} class="space-y-3">
                    <h3 class="text-xs font-bold text-slate-800 tracking-wider uppercase border-b border-slate-200 pb-2 pt-2 flex items-center space-x-2">
                       <span class="w-1.5 h-3 bg-[#008f5c] rounded-full"></span>
                       <span>${getDayHeaderString(dayMatches[0].fecha_hora)}</span>
                    </h3>
                    <div class="fixture-list">
                      ${dayMatches.map(partido => html`
                        <${MatchCard} 
                          key=${partido.id} 
                          partido=${partido} 
                          isSaving=${savingPrediction === partido.id} 
                          onPredict=${(golesA, golesB) => handlePredict(partido.id, golesA, golesB)} 
                        />
                      `)}
                    </div>
                  </div>
                `;
              })}
            `
        }
      </div>
    </div>
  `;
}
export default DashboardView;
