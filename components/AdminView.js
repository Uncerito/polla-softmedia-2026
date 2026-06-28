import React, { useState, useEffect } from 'react';
import htm from 'htm';
import * as Lucide from 'lucide-react';
import { db } from '../supabase.js';
import { getFlagUrl } from './utils.js?v=1.1.0';

const html = htm.bind(React.createElement);
const { Trophy, UserPlus, Save, Trash2, Shield, Edit, X } = Lucide;

const formatDateForInput = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  try {
    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    const formatted = formatter.format(date);
    return formatted.replace(' ', 'T');
  } catch (e) {
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const h = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${y}-${m}-${d}T${h}:${min}`;
  }
};


export function AdminMatchRow({ partido, onUpdateGoals, onUpdateInfo, isUpdating }) {
  const [golesA, setGolesA] = useState(partido.goles_a !== null ? String(partido.goles_a) : '');
  const [golesB, setGolesB] = useState(partido.goles_b !== null ? String(partido.goles_b) : '');

  // Info editing states
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editEquipoA, setEditEquipoA] = useState(partido.equipo_a);
  const [editEquipoB, setEditEquipoB] = useState(partido.equipo_b);
  const [editFechaHora, setEditFechaHora] = useState(formatDateForInput(partido.fecha_hora));

  useEffect(() => {
    setGolesA(partido.goles_a !== null ? String(partido.goles_a) : '');
    setGolesB(partido.goles_b !== null ? String(partido.goles_b) : '');
  }, [partido.goles_a, partido.goles_b]);

  useEffect(() => {
    setEditEquipoA(partido.equipo_a);
    setEditEquipoB(partido.equipo_b);
    setEditFechaHora(formatDateForInput(partido.fecha_hora));
  }, [partido.equipo_a, partido.equipo_b, partido.fecha_hora]);

  const handleSave = () => {
    if (golesA === '' && golesB === '') {
      onUpdateGoals(partido.id, null, null);
      return;
    }
    if (golesA === '' || golesB === '') {
      alert('Por favor, ingresa los goles para ambos equipos o deja ambos campos vacíos para limpiar el marcador.');
      return;
    }
    onUpdateGoals(partido.id, golesA, golesB);
  };

  const handleClear = () => {
    if (confirm(`¿Estás seguro de que deseas eliminar el marcador oficial de ${partido.equipo_a} vs ${partido.equipo_b}? Esto restablecerá el partido a pendiente y recalculará todos los puntos.`)) {
      onUpdateGoals(partido.id, null, null);
    }
  };

  const handleSaveInfo = () => {
    if (!editEquipoA.trim() || !editEquipoB.trim()) {
      alert('Los nombres de los equipos no pueden estar vacíos.');
      return;
    }
    if (!editFechaHora) {
      alert('Debe ingresar una fecha y hora válida.');
      return;
    }
    // Convert local input time to UTC (assuming input is in Lima time)
    const isoString = new Date(editFechaHora + ':00-05:00').toISOString();
    onUpdateInfo(partido.id, editEquipoA.trim(), editEquipoB.trim(), isoString);
    setIsEditingInfo(false);
  };

  const getFormattedDateDisplay = (isoString) => {
    if (!isoString) return 'Sin fecha';
    const dateObj = new Date(isoString);
    return dateObj.toLocaleString('es-PE', {
      timeZone: 'America/Lima',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return html`
    <div class="pixar-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      ${isEditingInfo 
        ? html`
            <div class="flex-grow w-full md:w-auto space-y-3">
              <div class="flex items-center justify-between">
                <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold uppercase border border-amber-200">
                  Editar Partido #${partido.numero_partido} • ${partido.fase}
                </span>
              </div>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">País Local (Equipo A)</label>
                  <input 
                    type="text" 
                    value=${editEquipoA} 
                    onChange=${e => setEditEquipoA(e.target.value)} 
                    disabled=${isUpdating}
                    class="w-full bg-white border border-slate-300 focus:border-[#005a36] focus:ring-1 focus:ring-[#005a36] rounded px-2.5 py-1.5 text-xs font-semibold outline-none transition-all text-slate-800" 
                  />
                </div>
                <div>
                  <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">País Visitante (Equipo B)</label>
                  <input 
                    type="text" 
                    value=${editEquipoB} 
                    onChange=${e => setEditEquipoB(e.target.value)} 
                    disabled=${isUpdating}
                    class="w-full bg-white border border-slate-300 focus:border-[#005a36] focus:ring-1 focus:ring-[#005a36] rounded px-2.5 py-1.5 text-xs font-semibold outline-none transition-all text-slate-800" 
                  />
                </div>
                <div>
                  <label class="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha y Hora (Lima/PE)</label>
                  <input 
                    type="datetime-local" 
                    value=${editFechaHora} 
                    onChange=${e => setEditFechaHora(e.target.value)} 
                    disabled=${isUpdating}
                    class="w-full bg-white border border-slate-300 focus:border-[#005a36] focus:ring-1 focus:ring-[#005a36] rounded px-2.5 py-1.5 text-xs font-semibold outline-none transition-all text-slate-800" 
                  />
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-2 w-full md:w-auto justify-end">
              <button 
                disabled=${isUpdating} 
                onClick=${handleSaveInfo} 
                class="px-3 py-2 rounded text-xs font-bold bg-[#005a36] hover:bg-[#004d30] text-white transition-all flex items-center space-x-1 uppercase tracking-wider disabled:opacity-50 border border-[#005a36]"
                title="Guardar cambios de información"
              >
                ${isUpdating 
                  ? html`<div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>` 
                  : html`<span class="flex items-center space-x-1"><${Save} size=${12} /><span>Guardar Info</span></span>`
                }
              </button>
              <button 
                disabled=${isUpdating} 
                onClick=${() => {
                  setEditEquipoA(partido.equipo_a);
                  setEditEquipoB(partido.equipo_b);
                  setEditFechaHora(formatDateForInput(partido.fecha_hora));
                  setIsEditingInfo(false);
                }} 
                class="px-3 py-2 rounded text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all flex items-center space-x-1 uppercase tracking-wider disabled:opacity-50 border border-slate-200"
                title="Cancelar edición"
              >
                <${X} size=${12} />
                <span>Cancelar</span>
              </button>
            </div>
          `
        : html`
            <div>
              <span class="px-2 py-0.5 rounded bg-[#e6f0ec] text-[#005a36] text-[9px] font-bold uppercase">Partido #${partido.numero_partido} • ${partido.fase}</span>
              <span class="ml-2 text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">📅 ${getFormattedDateDisplay(partido.fecha_hora)}</span>
              <div class="flex items-center space-x-3 mt-1.5">
                <img src=${getFlagUrl(partido.equipo_a)} class="w-8 h-5.5 rounded object-cover shadow-sm border border-slate-200" />
                <span class="font-sans font-medium text-sm text-slate-900">${partido.equipo_a}</span>
                <span class="text-[10px] text-slate-400">vs</span>
                <img src=${getFlagUrl(partido.equipo_b)} class="w-8 h-5.5 rounded object-cover shadow-sm border border-slate-200" />
                <span class="font-sans font-medium text-sm text-slate-900">${partido.equipo_b}</span>
              </div>
            </div>
            
            <div class="flex items-center space-x-3">
              <div class="flex items-center space-x-1.5 bg-slate-100 p-1 rounded border border-slate-250">
                <input 
                  type="number" 
                  min="0" 
                  placeholder="0"
                  value=${golesA} 
                  onChange=${e => setGolesA(e.target.value)} 
                  disabled=${isUpdating}
                  class="w-11 h-8 text-center bg-white border border-slate-300 rounded text-xs font-bold outline-none focus:border-[#005a36] focus:ring-1 focus:ring-[#005a36]" 
                />
                <span class="text-slate-400 font-bold text-xs">-</span>
                <input 
                  type="number" 
                  min="0" 
                  placeholder="0"
                  value=${golesB} 
                  onChange=${e => setGolesB(e.target.value)} 
                  disabled=${isUpdating}
                  class="w-11 h-8 text-center bg-white border border-slate-300 rounded text-xs font-bold outline-none focus:border-[#005a36] focus:ring-1 focus:ring-[#005a36]" 
                />
              </div>
              
              <div class="flex items-center space-x-2">
                <button 
                  disabled=${isUpdating} 
                  onClick=${handleSave} 
                  class="px-4 py-2 rounded text-xs font-bold bg-[#005a36] hover:bg-[#004d30] text-white transition-all flex items-center space-x-1 uppercase tracking-wider disabled:opacity-50 border border-[#005a36]"
                  title="Guardar marcador oficial"
                >
                  ${isUpdating 
                    ? html`<div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>` 
                    : html`<span class="flex items-center space-x-1"><${Save} size=${12} /><span>Guardar</span></span>`
                  }
                </button>
                
                <button 
                  disabled=${isUpdating} 
                  onClick=${() => setIsEditingInfo(true)} 
                  class="px-3 py-2 rounded text-xs font-bold bg-amber-500 hover:bg-amber-600 border border-amber-500 text-white transition-all flex items-center space-x-1 uppercase tracking-wider disabled:opacity-50"
                  title="Editar nombre de equipos y fecha/hora"
                >
                  <${Edit} size=${12} />
                  <span>Editar Info</span>
                </button>

                ${partido.goles_a !== null && partido.goles_b !== null ? html`
                  <button 
                    disabled=${isUpdating} 
                    onClick=${handleClear} 
                    class="px-3 py-2 rounded text-xs font-bold bg-rose-600 hover:bg-rose-700 border border-rose-600 text-white transition-all flex items-center space-x-1 uppercase tracking-wider disabled:opacity-50"
                    title="Eliminar marcador"
                  >
                    <${Trash2} size=${12} />
                    <span>Eliminar</span>
                  </button>
                ` : null}
              </div>
            </div>
          `
      }
    </div>
  `;
}

export function AdminView({ adminUsers, fixture, onRefresh, addToast }) {
  const [adminTab, setAdminTab] = useState('resultados');
  const [subTab, setSubTab] = useState('hoy');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [updatingMatch, setUpdatingMatch] = useState(null);

  // Clasificación de partidos por fecha en hora de Lima
  const now = new Date();
  const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });

  const matchesToday = [];
  const matchesUpcoming = [];
  const matchesPast = [];

  fixture.forEach(partido => {
    const matchLoc = new Date(partido.fecha_hora).toLocaleDateString('sv-SE', { timeZone: 'America/Lima' });
    if (matchLoc === todayStr) {
      matchesToday.push(partido);
    } else if (partido.resultado !== null || new Date(partido.fecha_hora) < now) {
      matchesPast.push(partido);
    } else {
      matchesUpcoming.push(partido);
    }
  });

  // Ajuste inteligente para redirigir a la pestaña con contenido si la de hoy está vacía
  useEffect(() => {
    if (fixture.length > 0) {
      const hasToday = fixture.some(p => new Date(p.fecha_hora).toLocaleDateString('sv-SE', { timeZone: 'America/Lima' }) === todayStr);
      if (!hasToday) {
        const hasUpcoming = fixture.some(p => p.resultado === null && new Date(p.fecha_hora) >= now);
        if (hasUpcoming) {
          setSubTab('proximos');
        } else {
          setSubTab('pasados');
        }
      }
    }
  }, [fixture]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!email || !nombre || !apellido || !contrasena) return;
    setCreatingUser(true);
    try {
      await db.registrarUsuario(email, nombre, apellido, contrasena);
      addToast('¡Colaborador registrado exitosamente!');
      setNombre(''); setApellido(''); setEmail(''); setContrasena('');
      onRefresh();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleUpdateGoals = async (partidoId, golesA, golesB) => {
    setUpdatingMatch(partidoId);
    try {
      await db.updateMatchGoals(partidoId, golesA, golesB);
      addToast('Marcador oficial actualizado. ¡Puntos recalculados!');
      onRefresh();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUpdatingMatch(null);
    }
  };

  const handleUpdateInfo = async (partidoId, equipoA, equipoB, fechaHora) => {
    setUpdatingMatch(partidoId);
    try {
      await db.updateMatchInfo(partidoId, equipoA, equipoB, fechaHora);
      addToast('Información del partido actualizada exitosamente.');
      onRefresh();
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setUpdatingMatch(null);
    }
  };

  const [calculatingBracket, setCalculatingBracket] = useState(false);

  const handleCalculateBracket = async () => {
    if (!confirm('¿Deseas calcular los clasificados y actualizar los emparejamientos del Bracket según los resultados oficiales actuales?')) {
      return;
    }
    setCalculatingBracket(true);
    try {
      await db.calculateAndUpdateBracket();
      addToast('¡Bracket de playoffs calculado y actualizado con éxito!');
      onRefresh();
    } catch (err) {
      addToast('Error al calcular el bracket: ' + err.message, 'error');
    } finally {
      setCalculatingBracket(false);
    }
  };

    return html`
    <div class="space-y-5">
      <!-- Banner Cabecera Mundialista (Tamaño optimizado) -->
      <div class="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#005a36] via-[#008f5c] to-[#121616] p-4 md:p-5 text-white shadow-sm">
        <!-- Elementos decorativos de fútbol -->
        <div class="absolute right-0 top-0 opacity-10 transform translate-x-6 -translate-y-6 pointer-events-none">
          <svg width="180" height="180" viewBox="0 0 100 100" fill="currentColor">
            <path d="M50 0C22.4 0 0 22.4 0 50s22.4 50 50 50 50-22.4 50-50S77.6 0 50 0zm0 90C27.9 90 10 72.1 10 50S27.9 10 50 10s40 17.9 40 40-17.9 40-40 40z"/>
          </svg>
        </div>
        
        <div class="relative z-10 flex items-center justify-between gap-4">
          <div class="text-left">
            <div class="flex items-center space-x-1.5">
              <span class="px-2 py-0.5 rounded-full bg-amber-400 text-[#005a36] text-[8px] font-black uppercase tracking-wider">FIFA WORLD CUP 2026</span>
              <span class="px-2 py-0.5 rounded-full bg-white/20 text-white text-[8px] font-bold uppercase tracking-wider">ADMIN</span>
            </div>
            <h2 class="text-lg font-black font-outfit uppercase mt-2 tracking-tight">Panel del Administrador</h2>
            <p class="text-[10px] md:text-xs text-slate-200/90 font-medium max-w-xl mt-1">Registra marcadores oficiales y administra colaboradores autorizados.</p>
          </div>
          <div class="p-2 bg-white/10 rounded-xl border border-white/20 shadow-inner flex-shrink-0 flex items-center justify-center">
            <${Shield} size=${20} class="text-amber-300" />
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div class="glass-panel p-4 h-fit space-y-1.5 shadow-sm">
          <button onClick=${() => setAdminTab('resultados')} class="w-full text-left px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all ${adminTab === 'resultados' ? 'bg-[#005a36] text-white' : 'text-slate-600 hover:bg-slate-100'}"><${Trophy} size=${14} /> <span>Resultados</span></button>
          <button onClick=${() => setAdminTab('colaboradores')} class="w-full text-left px-4 py-2.5 rounded text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all ${adminTab === 'colaboradores' ? 'bg-[#005a36] text-white' : 'text-slate-600 hover:bg-slate-100'}"><${UserPlus} size=${14} /> <span>Colaboradores</span></button>
        </div>

        <div class="lg:col-span-3 space-y-4">
          ${adminTab === 'resultados' && html`
            <div class="space-y-4">
              <!-- Sub-navegación por Fecha de Partido + Botón de Cálculo -->
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2.5 border-b border-slate-200">
                <div class="flex items-center space-x-2.5 overflow-x-auto">
                  <button 
                    onClick=${() => setSubTab('hoy')} 
                    class="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1.5 flex-shrink-0 transition-all ${
                      subTab === 'hoy'
                        ? 'bg-[#005a36] text-white border border-[#005a36] shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                    }"
                  >
                    <span class="w-1.5 h-1.5 rounded-full ${matchesToday.length > 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}"></span>
                    <span>De Hoy (${matchesToday.length})</span>
                  </button>
                  
                  <button 
                    onClick=${() => setSubTab('proximos')} 
                    class="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1.5 flex-shrink-0 transition-all ${
                      subTab === 'proximos'
                        ? 'bg-[#005a36] text-white border border-[#005a36] shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                    }"
                  >
                    <span>Próximos (${matchesUpcoming.length})</span>
                  </button>
                  
                  <button 
                    onClick=${() => setSubTab('pasados')} 
                    class="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1.5 flex-shrink-0 transition-all ${
                      subTab === 'pasados'
                        ? 'bg-[#005a36] text-white border border-[#005a36] shadow-sm'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200'
                    }"
                  >
                    <span>Pasados (${matchesPast.length})</span>
                  </button>
                </div>

                <button 
                  disabled=${calculatingBracket}
                  onClick=${handleCalculateBracket}
                  class="px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white shadow-sm flex items-center justify-center space-x-1.5 self-end sm:self-auto cursor-pointer transition-all"
                  title="Calcular clasificados y actualizar Camino a la Copa"
                >
                  ${calculatingBracket 
                    ? html`<div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>`
                    : html`<span class="flex items-center space-x-1.5"><${Trophy} size=${12} /><span>Calcular y Actualizar Bracket</span></span>`
                  }
                </button>
              </div>

              <!-- Listados de Partidos -->
              <div class="space-y-3.5">
                ${subTab === 'hoy' && html`
                  ${matchesToday.length === 0 
                    ? html`
                        <div class="glass-panel p-10 text-center text-slate-500">
                          <p class="font-outfit font-bold text-xs uppercase text-slate-700">No hay partidos programados para hoy</p>
                          <p class="text-[9px] font-semibold text-slate-450 mt-1">Usa las otras pestañas para ver partidos próximos o pasados.</p>
                        </div>
                      `
                    : matchesToday.map(partido => html`
                        <${AdminMatchRow} 
                          key=${partido.id} 
                          partido=${partido} 
                          onUpdateGoals=${handleUpdateGoals} 
                          onUpdateInfo=${handleUpdateInfo}
                          isUpdating=${updatingMatch === partido.id} 
                        />
                      `)
                  }
                `}

                ${subTab === 'proximos' && html`
                  ${matchesUpcoming.length === 0 
                    ? html`
                        <div class="glass-panel p-10 text-center text-slate-500">
                          <p class="font-outfit font-bold text-xs uppercase text-slate-700">No hay partidos próximos</p>
                          <p class="text-[9px] font-semibold text-slate-450 mt-1">Todos los partidos del fixture han comenzado o terminado.</p>
                        </div>
                      `
                    : matchesUpcoming.map(partido => html`
                        <${AdminMatchRow} 
                          key=${partido.id} 
                          partido=${partido} 
                          onUpdateGoals=${handleUpdateGoals} 
                          onUpdateInfo=${handleUpdateInfo}
                          isUpdating=${updatingMatch === partido.id} 
                        />
                      `)
                  }
                `}

                ${subTab === 'pasados' && html`
                  ${matchesPast.length === 0 
                    ? html`
                        <div class="glass-panel p-10 text-center text-slate-500">
                          <p class="font-outfit font-bold text-xs uppercase text-slate-700">No hay partidos pasados</p>
                          <p class="text-[9px] font-semibold text-slate-450 mt-1">Los partidos que ya iniciaron o culminaron aparecerán aquí.</p>
                        </div>
                      `
                    : matchesPast.map(partido => html`
                        <${AdminMatchRow} 
                          key=${partido.id} 
                          partido=${partido} 
                          onUpdateGoals=${handleUpdateGoals} 
                          onUpdateInfo=${handleUpdateInfo}
                          isUpdating=${updatingMatch === partido.id} 
                        />
                      `)
                  }
                `}
              </div>
            </div>
          `}

          ${adminTab === 'colaboradores' && html`
            <div class="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div class="md:col-span-2 glass-panel p-5 shadow-sm">
                <form onSubmit=${handleCreateUser} class="space-y-4">
                  <input type="text" required value=${nombre} onChange=${e => setNombre(e.target.value)} placeholder="Nombre" class="w-full bg-white border border-slate-300 focus:border-[#008f5c] focus:ring-1 focus:ring-[#008f5c]/25 rounded px-3 py-2.5 text-xs font-semibold outline-none transition-all text-slate-800 placeholder:text-slate-400" />
                  <input type="text" required value=${apellido} onChange=${e => setApellido(e.target.value)} placeholder="Apellido" class="w-full bg-white border border-slate-300 focus:border-[#008f5c] focus:ring-1 focus:ring-[#008f5c]/25 rounded px-3 py-2.5 text-xs font-semibold outline-none transition-all text-slate-800 placeholder:text-slate-400" />
                  <input type="email" required value=${email} onChange=${e => setEmail(e.target.value)} placeholder="Correo Corporativo" class="w-full bg-white border border-slate-300 focus:border-[#008f5c] focus:ring-1 focus:ring-[#008f5c]/25 rounded px-3 py-2.5 text-xs font-semibold outline-none transition-all text-slate-800 placeholder:text-slate-400" />
                  <input type="password" required value=${contrasena} onChange=${e => setContrasena(e.target.value)} placeholder="Contraseña Temporal" class="w-full bg-white border border-slate-300 focus:border-[#008f5c] focus:ring-1 focus:ring-[#008f5c]/25 rounded px-3 py-2.5 text-xs font-semibold outline-none transition-all text-slate-800 placeholder:text-slate-400" />
                  <button type="submit" disabled=${creatingUser} class="w-full bg-[#005a36] hover:bg-[#004d30] text-white py-2.5 rounded text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50">
                    ${creatingUser ? html`<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>` : html`<span>Crear Usuario</span>`}
                  </button>
                </form>
              </div>
              <div class="md:col-span-3 glass-panel p-5 shadow-sm">
                <h3 class="font-sans font-bold text-slate-800 text-xs tracking-wider uppercase mb-4 border-b border-slate-200 pb-2">Registrados (${adminUsers.length})</h3>
                <div class="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  ${adminUsers.map(user => html`
                    <div key=${user.id} class="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs hover:bg-slate-100 transition-colors">
                      <div>
                        <div class="font-bold text-slate-800">${user.nombre} ${user.apellido}</div>
                        <div class="text-[10px] font-semibold text-slate-550 mt-0.5">${user.email}</div>
                      </div>
                      <span class="px-2 py-0.5 rounded bg-[#005a36]/10 border border-[#005a36]/20 text-[#005a36] text-[8px] font-bold uppercase">${user.rol_usuario}</span>
                    </div>
                  `)}
                </div>
              </div>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

export default AdminView;
