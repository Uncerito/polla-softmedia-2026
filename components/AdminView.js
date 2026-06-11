import React, { useState, useEffect } from 'react';
import htm from 'htm';
import * as Lucide from 'lucide-react';
import { db } from '../supabase.js';
import { getFlagUrl } from './utils.js';

const html = htm.bind(React.createElement);
const { Trophy, UserPlus, Save, Trash2, Shield } = Lucide;


export function AdminMatchRow({ partido, onUpdateGoals, isUpdating }) {
  const [golesA, setGolesA] = useState(partido.goles_a !== null ? String(partido.goles_a) : '');
  const [golesB, setGolesB] = useState(partido.goles_b !== null ? String(partido.goles_b) : '');

  useEffect(() => {
    setGolesA(partido.goles_a !== null ? String(partido.goles_a) : '');
    setGolesB(partido.goles_b !== null ? String(partido.goles_b) : '');
  }, [partido.goles_a, partido.goles_b]);

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

  return html`
    <div class="pixar-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
      <div>
        <span class="px-2 py-0.5 rounded bg-[#e6f0ec] text-[#005a36] text-[9px] font-bold uppercase">Partido #${partido.numero_partido} • ${partido.fase}</span>
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
          
          ${partido.goles_a !== null && partido.goles_b !== null && html`
            <button 
              disabled=${isUpdating} 
              onClick=${handleClear} 
              class="px-3 py-2 rounded text-xs font-bold bg-rose-600 hover:bg-rose-700 border border-rose-600 text-white transition-all flex items-center space-x-1 uppercase tracking-wider disabled:opacity-50"
              title="Eliminar marcador"
            >
              <${Trash2} size=${12} />
              <span>Eliminar</span>
            </button>
          `}
        </div>
      </div>
    </div>
  `;
}

export function AdminView({ adminUsers, fixture, onRefresh, addToast }) {
  const [adminTab, setAdminTab] = useState('resultados');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [creatingUser, setCreatingUser] = useState(false);
  const [updatingMatch, setUpdatingMatch] = useState(null);

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
            <div class="space-y-3.5">
              ${fixture.map(partido => html`
                <${AdminMatchRow} 
                  key=${partido.id} 
                  partido=${partido} 
                  onUpdateGoals=${handleUpdateGoals} 
                  isUpdating=${updatingMatch === partido.id} 
                />
              `)}
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
