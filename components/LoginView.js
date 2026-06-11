import React, { useState, useEffect } from 'react';
import htm from 'htm';
import * as Lucide from 'lucide-react';
import { db } from '../supabase.js';

const html = htm.bind(React.createElement);
const { Eye, EyeOff } = Lucide;

export function LoginView({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recoveryStatus, setRecoveryStatus] = useState(null); // { message, type }
  const [randomImage] = useState(() => {
    const portadas = ['image01.jpeg', 'image02.jpeg', 'image03.jpeg', 'image04.jpeg'];
    return portadas[Math.floor(Math.random() * portadas.length)];
  });

  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const targetDate = new Date('2026-06-11T14:00:00-05:00').getTime();

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const diff = targetDate - now;
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown({ days: d, hours: h, minutes: m, seconds: s });
      }
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setRecoveryStatus(null);
    await onLogin(email, password);
    setLoading(false);
  };

  const handleRecuperar = async () => {
    if (!email) {
      setRecoveryStatus({ message: 'Por favor, ingresa tu correo corporativo en el campo de texto.', type: 'error' });
      return;
    }
    setLoading(true);
    setRecoveryStatus(null);
    try {
      await db.solicitarRecuperacion(email);
      setRecoveryStatus({ message: '¡Enlace de recuperación enviado a tu correo corporativo!', type: 'success' });
    } catch (err) {
      setRecoveryStatus({ message: 'Error: ' + err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return html`
    <div class="login-container h-screen w-full bg-[#0a0d18] flex flex-col md:flex-row overflow-hidden select-none text-slate-200">
      
      <div class="hidden md:flex md:w-1/2 relative h-full bg-white items-center justify-center overflow-hidden">
        <img src=${`./images/portada/${randomImage}`} alt="Portada Mundial 2026" class="object-contain w-full h-full select-none" />
      </div>

      <div class="w-full md:w-1/2 h-full flex flex-col justify-center items-center p-6 sm:p-12 md:p-16 bg-[#131929] relative overflow-y-auto overflow-x-hidden">
        <div class="absolute w-[25rem] h-[25rem] bg-[#008f5c]/10 rounded-full blur-[100px] -top-10 -left-10 pointer-events-none"></div>
        <div class="absolute w-[25rem] h-[25rem] bg-[#00c25d]/0.08 rounded-full blur-[100px] top-1/3 -right-20 pointer-events-none"></div>
        <div class="absolute w-[25rem] h-[25rem] bg-[#ff3b47]/0.08 rounded-full blur-[100px] -bottom-10 left-10 pointer-events-none"></div>
        <div class="absolute w-[25rem] h-[25rem] bg-[#005a36]/20 rounded-full blur-[100px] bottom-10 right-10 pointer-events-none"></div>

        <div class="relative z-10 w-full max-w-md flex flex-col space-y-6">
          
          <div class="flex flex-col items-center text-center space-y-3">
            <div class="flex items-center space-x-3 bg-[#0a0d18] border border-[#222c42] px-4 py-2.5 rounded-xl">
              <img src="./images/logotipo.png" alt="SoftMedia" class="h-8 w-auto object-contain brightness-110" />
              <div class="h-6 w-px bg-[#222c42]"></div>
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400 font-outfit">Mundial 2026</span>
            </div>
            <div class="mt-4 flex flex-col items-center">
              <img src="./images/trofeo_mundial.png" class="h-20 w-auto object-contain drop-shadow-[0_4px_10px_rgba(0,143,92,0.4)] mb-3 animate-pulse" alt="Trophy" />
              <h2 class="text-xl font-bold font-outfit text-white tracking-tight uppercase leading-none">Iniciar Sesión</h2>
              <p class="text-[10px] text-[#008f5c] font-bold mt-2 uppercase tracking-widest">Plataforma de Pronósticos Oficial</p>
            </div>
          </div>

          <div class="w-full bg-[#0a0d18] border border-[#222c42] rounded-xl p-4 flex flex-col items-center text-center shadow-sm">
            <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Cuenta Regresiva Inaugural</span>
            <div class="flex items-center space-x-3.5">
              <div class="flex flex-col items-center">
                <span class="text-2xl font-bold text-white scoreboard-font">${String(countdown.days).padStart(2, '0')}</span>
                <span class="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Días</span>
              </div>
              <span class="text-xl font-bold text-slate-600 select-none pb-4">:</span>
              <div class="flex flex-col items-center">
                <span class="text-2xl font-bold text-white scoreboard-font">${String(countdown.hours).padStart(2, '0')}</span>
                <span class="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Horas</span>
              </div>
              <span class="text-xl font-bold text-slate-600 select-none pb-4">:</span>
              <div class="flex flex-col items-center">
                <span class="text-2xl font-bold text-white scoreboard-font">${String(countdown.minutes).padStart(2, '0')}</span>
                <span class="text-[8px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">Min</span>
              </div>
              <span class="text-xl font-bold text-slate-600 select-none pb-4">:</span>
              <div class="flex flex-col items-center">
                <span class="text-2xl font-bold text-[#008f5c] scoreboard-font">${String(countdown.seconds).padStart(2, '0')}</span>
                <span class="text-[8px] font-bold text-[#008f5c] uppercase tracking-wider mt-0.5">Seg</span>
              </div>
            </div>
            <span class="text-[8px] text-slate-400 font-semibold uppercase tracking-wide mt-2.5">México vs Sudáfrica • 11 Jun 2026 (14:00)</span>
          </div>

          ${recoveryStatus && html`
            <div class="p-3 text-xs font-bold rounded-xl border text-center ${recoveryStatus.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/30 text-[#00c25d]' }">
              ${recoveryStatus.message}
            </div>
          `}

          <form onSubmit=${handleSubmit} class="space-y-4">
            <div class="space-y-1.5 text-left">
              <label class="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Correo Corporativo</label>
              <input type="email" id="login_email_field" required value=${email} onChange=${e => setEmail(e.target.value)} placeholder="nombre.apellido@softmediaconsultores.com" class="w-full bg-[#0a0d18] border border-[#222c42] focus:border-[#008f5c] focus:ring-1 focus:ring-[#008f5c]/25 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 transition-all font-semibold outline-none" />
            </div>

            <div class="space-y-1.5 text-left">
              <label class="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Contraseña</label>
              <div class="relative">
                <input type=${showPassword ? 'text' : 'password'} required value=${password} onChange=${e => setPassword(e.target.value)} placeholder="••••••••••••" class="w-full bg-[#0a0d18] border border-[#222c42] focus:border-[#008f5c] focus:ring-1 focus:ring-[#008f5c]/25 rounded-xl pl-4 pr-11 py-3 text-sm text-white placeholder:text-slate-500 transition-all font-semibold outline-none" />
                <button type="button" onClick=${() => setShowPassword(!showPassword)} class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1">
                  ${showPassword ? html`<${EyeOff} size=${16} />` : html`<${Eye} size=${16} />`}
                </button>
              </div>
              <div class="flex items-center justify-between mt-1 select-none">
                <div></div>
                <button type="button" onClick=${handleRecuperar} disabled=${loading} class="text-[10px] text-slate-400 hover:text-[#00c25d] transition-colors font-bold uppercase tracking-wider bg-transparent border-0 cursor-pointer disabled:opacity-50 focus:outline-none">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            <button type="submit" disabled=${loading} class="w-full bg-[#008f5c] hover:bg-[#00734a] text-white font-black rounded-xl py-3.5 text-xs uppercase tracking-widest transition-all duration-300 disabled:opacity-50 mt-2 flex items-center justify-center border border-[#008f5c] shadow-md hover:shadow-lg focus:outline-none">
              ${loading ? html`<div class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>` : html`<span>INGRESAR</span>`}
            </button>
          </form>

        </div>
      </div>
    </div>
  `;
}

export default LoginView;