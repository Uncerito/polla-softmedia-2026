import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import htm from 'htm';
import * as Lucide from 'lucide-react';
import { db } from './supabase.js';

import { LoginView } from './components/LoginView.js?v=1.1.0';
import { DashboardView } from './components/DashboardView.js?v=1.2.1';
import { LeaderboardView } from './components/LeaderboardView.js?v=1.1.1';
import { AdminView } from './components/AdminView.js?v=1.1.0';
import { GroupStandingsView } from './components/GroupStandingsView.js?v=1.1.0';
import { StatsView } from './components/StatsView.js?v=1.1.0';
import { RulesView } from './components/RulesView.js?v=1.1.0';
import { BracketView } from './components/BracketView.js?v=1.1.0';

const html = htm.bind(React.createElement);

const {
  Trophy, Calendar, Users, LogOut, Shield, Award, Edit, Trash,
  Plus, Check, Clock, AlertCircle, Database, ChevronLeft, ChevronRight,
  UserPlus, Settings, Save, RefreshCw, Star, Eye, EyeOff, Menu, X, BarChart3,
  ChevronDown, BookOpen, GitCommit, MapPin, HelpCircle, Sun, Moon
} = Lucide;

window.cambiarClaveDentroDelPanel = async () => {
  const input = document.getElementById('perfil_password_field');
  if (!input || !input.value) {
    alert('Por favor, abre el panel de perfil e ingresa una nueva contraseña.');
    return;
  }
  const claveNueva = input.value;
  if (!claveNueva || claveNueva.length < 6) {
    alert('La nueva contraseña debe tener al menos 6 caracteres.');
    return;
  }
  try {
    await db.actualizarContrasena(claveNueva);
    alert('¡Contraseña cambiada con éxito!');
    input.value = '';
  } catch (err) {
    alert('Error al cambiar la contraseña: ' + err.message);
  }
};

export function App() {
  const [session, setSession] = useState(null);
  const [currentView, setCurrentView] = useState('stats');
  const [loading, setLoading] = useState(true);

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('app-theme');
    return saved || 'light';
  });

  const [dashboardTab, setDashboardTab] = useState('proximos');
  const [selectedEliminatoria, setSelectedEliminatoria] = useState('Octavos');
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('theme-light');
    } else {
      document.body.classList.remove('theme-light');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebar_open');
    if (saved !== null) return saved === 'true';
    return window.innerWidth >= 768;
  });

  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev;
      localStorage.setItem('sidebar_open', next);
      return next;
    });
  };

  const [fixture, setFixture] = useState([]);
  const [fullFixture, setFullFixture] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [dailyResults, setDailyResults] = useState({ jugadosHoy: [], aciertos: 0 });
  const [adminUsers, setAdminUsers] = useState([]);
  const [toasts, setToasts] = useState([]);

  const [bgImage] = useState(() => {
    const portadas = ['image01.jpeg', 'image02.jpeg', 'image03.jpeg', 'image04.jpeg'];
    return portadas[Math.floor(Math.random() * portadas.length)];
  });

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // 1. FLUJO DE CONTROL ÚNICO: Inicializa Supabase y valida sesión una sola vez al arrancar
  useEffect(() => {
    const iniciarPlataforma = async () => {
      try {
        await db.init();
        const activeSession = await db.getSession();
        if (activeSession) {
          setSession(activeSession);
        }
      } catch (err) {
        console.error('Error al inicializar sesión:', err);
      } finally {
        setLoading(false);
      }
    };
    iniciarPlataforma();
  }, []);

  // 2. CARGA DE DATOS CONTROLADA: Solo se dispara cuando explícitamente cambias de sección o pestañas
  useEffect(() => {
    if (session) {
      loadData();
    }
  }, [session, currentView, dashboardTab, selectedEliminatoria]);

  const loadData = async (force = false) => {
    if (!session) return;
    try {
      let currentFixture = fullFixture;
      if (fullFixture.length === 0 || force) {
        currentFixture = await db.getFixture(session.user.id, 'partidos');
        setFullFixture(currentFixture);
      }

      if (currentView === 'stats') {
        setFixture(currentFixture);
        if (leaderboard.length === 0 || force) {
          const lead = await db.getLeaderboard();
          setLeaderboard(lead);
        }
      } else if (currentView === 'dashboard') {
        let fix = [];
        if (dashboardTab === 'proximos') {
          fix = currentFixture.filter(p => p.resultado === null);
        } else if (dashboardTab === 'pasados') {
          fix = currentFixture.filter(p => p.resultado !== null);
        } else if (dashboardTab === 'eliminatorias') {
          fix = currentFixture.filter(p => p.fase === selectedEliminatoria);
        }
        setFixture(fix);

        const daily = await db.getDailyResults(session.user.id);
        setDailyResults(daily);

        if (leaderboard.length === 0 || force) {
          const lead = await db.getLeaderboard();
          setLeaderboard(lead);
        }
      } else if (currentView === 'groups') {
        const fix = currentFixture.filter(p => p.grupo !== null && p.grupo !== '');
        setFixture(fix);
      } else if (currentView === 'leaderboard') {
        if (leaderboard.length === 0 || force) {
          const lead = await db.getLeaderboard();
          setLeaderboard(lead);
        }
      } else if (currentView === 'admin' && session.user.rol_usuario === 'admin') {
        const users = await db.getUsuariosAdmin();
        setAdminUsers(users);
        setFixture(currentFixture);
      } else if (currentView === 'bracket') {
        setFixture(currentFixture);
      }
    } catch (err) {
      console.error('Error en carga de datos:', err);
    }
  };

  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      const activeSession = await db.login(email, password);
      if (activeSession) {
        // Primero inyectamos la sesión para desmontar el bloque de login
        setSession(activeSession);
        // Forzamos el enrutamiento interno
        setCurrentView('stats');
        addToast(`¡Bienvenido, ${activeSession.user.nombre}!`);
      } else {
        throw new Error("No se pudo recuperar la sesión activa.");
      }
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await db.logout();
      setSession(null);
      addToast('Sesión cerrada correctamente.');
    } catch (err) {
      addToast('Error al cerrar sesión: ' + err.message, 'error');
    }
  };

  if (loading) {
    return html`
      <div class="flex flex-col items-center justify-center min-h-screen space-y-4 bg-[#0a0d18]">
        <div class="w-16 h-16 border-4 border-[#008f5c] border-t-transparent rounded-full animate-spin"></div>
        <p class="text-sm font-outfit text-[#008f5c] font-bold tracking-widest animate-pulse uppercase">CARGANDO MUNDIAL 2026...</p>
      </div>
    `;
  }

  if (!session) {
    return html`
      <div class="h-screen w-full bg-[#0a0d18] overflow-hidden login-container">
        <div class="fixed top-4 right-4 z-50 flex flex-col space-y-2 max-w-sm">
          ${toasts.map(toast => html`
            <div key=${toast.id} class="flex items-center p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 ${toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-850' : 'bg-emerald-50 border-emerald-200 text-[#005a36]'}">
              <span class="mr-2">
                ${toast.type === 'error' ? html`<${AlertCircle} size=${18} class="text-rose-600" />` : html`<${Check} size=${18} class="text-emerald-650" />`}
              </span>
              <p class="text-sm font-medium">${toast.message}</p>
            </div>
          `)}
        </div>
        <${LoginView} onLogin=${handleLogin} />
      </div>
    `;
  }

  const navItems = [
    { id: 'stats', name: 'ESTADÍSTICAS', icon: BarChart3 },
    { id: 'dashboard', name: 'MIS PRONÓSTICOS', icon: Calendar },
    { id: 'groups', name: 'GRUPOS DEL MUNDIAL', icon: Users },
    { id: 'leaderboard', name: 'CLASIFICACIÓN', icon: Trophy },
    { id: 'bracket', name: 'CAMINO A LA COPA', icon: GitCommit },
    { id: 'rules', name: 'REGLAS DEL JUEGO', icon: BookOpen },
    ...(session.user.rol_usuario === 'admin' ? [{ id: 'admin', name: 'ADMINISTRADOR', icon: Shield }] : [])
  ];

  return html`
    <div class="min-h-screen flex flex-col relative overflow-hidden soccer-field-bg main-app-container">
      <div class="relative z-10 flex flex-col min-h-screen">
        <div class="fixed top-4 right-4 z-50 flex flex-col space-y-2 max-w-sm">
          ${toasts.map(toast => html`
            <div key=${toast.id} class="flex items-center p-4 rounded-xl shadow-xl border backdrop-blur-md transition-all duration-300 ${toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-850' : 'bg-emerald-50 border-emerald-200 text-[#005a36]'}">
              <span class="mr-2">
                ${toast.type === 'error' ? html`<${AlertCircle} size=${18} class="text-rose-600" />` : html`<${Check} size=${18} class="text-emerald-650" />`}
              </span>
              <p class="text-sm font-medium">${toast.message}</p>
            </div>
          `)}
        </div>
        <header class="border-b border-slate-200 sticky top-0 z-40 bg-white shadow-sm w-full">
          <div class="country-gradient-bar"></div>
          <div class="w-full px-4 md:px-8 h-16 flex items-center justify-between relative">
            <div class="flex items-center space-x-4">
              <button onClick=${toggleSidebar} class="p-2 rounded-xl text-slate-500 hover:text-slate-850 hover:bg-slate-100 transition-colors focus:outline-none" title=${sidebarOpen ? 'Ocultar Menú' : 'Mostrar Menú'}>
                <${Menu} size=${18} />
              </button>
              <div class="flex items-center space-x-3.5">
                <img src="./images/logotipo.png" alt="SoftMedia Logo" class="h-6 md:h-7 w-auto object-contain select-none" />
                <div class="h-6 w-px bg-slate-200"></div>
                <img src="./images/logomundial.jpg" alt="FIFA World Cup 2026 Logo" class="h-10 md:h-11 w-auto object-contain select-none hover:scale-105 transition-transform duration-200" />
              </div>
            </div>

            <div class="flex items-center space-x-3">
              <div class="relative">
                <button onClick=${() => setProfileDropdownOpen(!profileDropdownOpen)} class="flex items-center space-x-1.5 text-slate-850 hover:text-[#008f5c] font-bold text-[10px] md:text-[11px] uppercase tracking-wider transition-colors focus:outline-none cursor-pointer">
                  <span>${session.user.nombre}</span>
                  <${ChevronDown} size=${12} class="text-slate-400" />
                </button>
                
                ${profileDropdownOpen && html`
                  <div class="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 text-left">
                    <div class="px-4 py-2 border-b border-slate-100">
                      <div class="text-[10px] font-bold text-slate-850 uppercase">${session.user.nombre} ${session.user.apellido}</div>
                      <div class="text-[8px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">${session.user.email}</div>
                    </div>
                    <div class="p-2 space-y-1">
                      <button onClick=${() => { setCurrentView('stats'); setProfileDropdownOpen(false); }} class="w-full flex items-center space-x-2 px-3 py-2 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg uppercase tracking-wider text-left">
                        <${BarChart3} size=${12} />
                        <span>Estadísticas</span>
                      </button>
                      <button onClick=${() => { setCurrentView('dashboard'); setProfileDropdownOpen(false); }} class="w-full flex items-center space-x-2 px-3 py-2 text-[10px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg uppercase tracking-wider text-left">
                        <${Calendar} size=${12} />
                        <span>Mis Pronósticos</span>
                      </button>
                      <button onClick=${handleLogout} class="w-full flex items-center space-x-2 px-3 py-2 text-[10px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg uppercase tracking-wider mt-1.5 border-t border-slate-100 pt-2 text-left">
                        <${LogOut} size=${12} />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                `}
              </div>

              <button onClick=${toggleTheme} class="p-1.5 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 transition-all shadow-sm" title=${theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
                ${theme === 'dark' ? html`<${Sun} size=${14} />` : html`<${Moon} size=${14} />`}
              </button>

              <button onClick=${handleLogout} class="p-1.5 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:bg-rose-50 hover:border-rose-250 hover:text-rose-600 transition-all shadow-sm" title="Cerrar Sesión">
                <${LogOut} size=${14} />
              </button>
            </div>
          </div>
        </header>

        <div class="w-full flex flex-row relative min-h-[calc(100vh-4.25rem)]">
          ${sidebarOpen && html`
            <div onClick=${() => setSidebarOpen(false)} class="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-35 sidebar-overlay" />
          `}

          <aside class="sidebar-transition bg-slate-50 border-r border-slate-200 flex flex-col z-40 overflow-hidden fixed inset-y-0 left-0 md:sticky md:top-[69px] md:h-[calc(100vh-4.3rem)] ${sidebarOpen ? 'w-64 opacity-100 border-r translate-x-0' : 'w-64 opacity-0 -translate-x-full md:w-0 md:opacity-0 md:border-r-0 md:translate-x-0'}">
            <div class="w-64 flex flex-col h-full justify-between">
              <div>
                <div class="p-4 border-b border-slate-200 flex items-center justify-between md:hidden bg-slate-50">
                  <span class="font-outfit font-black text-slate-850 text-xs tracking-wider uppercase">Menú Principal</span>
                  <button onClick=${() => setSidebarOpen(false)} class="p-1.5 rounded-lg text-slate-550 hover:bg-slate-100 hover:text-slate-850">
                    <${X} size=${18} />
                  </button>
                </div>

                <div class="p-3">
                  <nav class="space-y-1">
                    ${navItems.map(item => {
                      const isActive = currentView === item.id;
                      return html`
                        <button key=${item.id} onClick=${() => { setCurrentView(item.id); if (window.innerWidth < 768) setSidebarOpen(false); }} 
                          class="w-full flex items-center space-x-3 px-4 py-2.5 text-[10px] font-bold tracking-wider uppercase transition-all duration-150 group relative sidebar-switch ${isActive
                            ? 'sidebar-switch-active'
                            : 'text-slate-500 hover:text-slate-800'
                          }">
                          <${item.icon} size=${14} class="${isActive ? 'text-white' : 'text-slate-450 group-hover:text-slate-800 transition-colors'}" />
                          <span class="whitespace-nowrap text-left truncate flex-1">${item.name}</span>
                        </button>
                      `;
                    })}
                  </nav>
                </div>
              </div>

              <div class="mt-auto flex flex-col">
                <div class="p-4 border-t border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center space-y-1 select-none">
                  <img src="./images/trofeo_mundial.png" alt="FIFA World Cup Trophy" class="h-16 w-auto object-contain hover:scale-110 transition-transform duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]" />
                  <span class="text-[8px] text-[#008f5c] font-black uppercase tracking-widest font-outfit mt-1">Copa del Mundo 2026</span>
                </div>

                <div class="p-4 border-t border-slate-200 bg-slate-50 md:hidden flex items-center justify-between">
                  <div class="text-left">
                    <div class="text-xs font-bold text-slate-850">${session.user.nombre} ${session.user.apellido}</div>
                    <div class="text-[9px] font-semibold text-[#008f5c] mt-0.5">${session.user.email}</div>
                  </div>
                  <button onClick=${handleLogout} class="p-2 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:bg-rose-50 hover:border-rose-250 hover:text-rose-600 transition-all">
                    <${LogOut} size=${16} />
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <div class="flex-1 flex flex-col min-w-0">
            <main class="flex-grow w-full px-4 md:px-6 py-5 relative z-10">
              ${currentView === 'stats' && html`
                <${StatsView} session=${session} fixture=${fixture} leaderboard=${leaderboard} />
              `}
              ${currentView === 'dashboard' && html`
                <${DashboardView} session=${session} fixture=${fixture} fullFixture=${fullFixture} dailyResults=${dailyResults} leaderboard=${leaderboard} onSavePrediction=${() => loadData(true)} addToast=${addToast} dashboardTab=${dashboardTab} setDashboardTab=${setDashboardTab} selectedEliminatoria=${selectedEliminatoria} setSelectedEliminatoria=${setSelectedEliminatoria} />
              `}
              ${currentView === 'groups' && html`
                <div class="dashboard-assemble">
                  <${GroupStandingsView} fixture=${fixture} />
                </div>
              `}
              ${currentView === 'leaderboard' && html`
                <div class="dashboard-assemble">
                  <${LeaderboardView} leaderboard=${leaderboard} session=${session} />
                </div>
              `}
              ${currentView === 'bracket' && html`
                <div class="dashboard-assemble">
                  <${BracketView} fixture=${fixture} />
                </div>
              `}

              ${currentView === 'rules' && html`
                <div class="dashboard-assemble">
                  <${RulesView} />
                </div>
              `}
              ${currentView === 'admin' && session.user.rol_usuario === 'admin' && html`
                <div class="dashboard-assemble">
                  <${AdminView} adminUsers=${adminUsers} fixture=${fixture} onRefresh=${() => loadData(true)} addToast=${addToast} />
                </div>
              `}
            </main>
            <footer class="py-6 border-t border-slate-200 bg-transparent text-center text-xs text-[#005a36] font-bold relative z-10">
              <p>© 2026 SoftMedia Inc. Todos los derechos reservados.</p>
            </footer>
          </div>
        </div>
      </div>
    </div>
  `;
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(html`<${App} />`);