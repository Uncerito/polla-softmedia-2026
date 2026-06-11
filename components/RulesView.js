import React from 'react';
import htm from 'htm';
import * as Lucide from 'lucide-react';

const html = htm.bind(React.createElement);
const { Trophy, Clock, Target, ShieldAlert, Award, Calendar, FileText, AlertTriangle } = Lucide;

export function RulesView() {
  return html`
    <div class="space-y-6 text-slate-800">
      
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
            <span class="px-2 py-0.5 rounded-full bg-white/20 text-white text-[8px] font-bold uppercase tracking-wider">REGLAMENTO</span>
          </div>
          <h2 class="text-lg font-black font-outfit uppercase mt-2 tracking-tight">Reglas Oficiales de Juego</h2>
          <p class="text-[10px] md:text-xs text-slate-200/90 font-medium max-w-xl mt-1">Conoce la mecánica de puntuación, los tiempos límite de registro y las políticas de fair play aplicadas en los Pronósticos SoftMedia.</p>
        </div>
        
        <!-- Copa del Mundo Decorativa Flotante -->
        <div class="relative flex-shrink-0 w-24 h-24 -my-4 -mr-2 flex items-center justify-center select-none z-10">
          <img src="./images/trofeo_mundial.png" class="max-h-full max-w-full object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.4)] transform rotate-6 hover:rotate-0 transition-transform duration-300 animate-pulse" alt="Trophy" />
        </div>
      </div>

      <!-- Grid de Reglas Estilo Bento -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        <!-- Tarjeta 1: Sistema de Puntuación -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between lg:col-span-2">
          <div>
            <div class="flex items-center space-x-3 mb-4">
              <div class="p-2.5 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl shadow-sm">
                <${Trophy} size=${20} />
              </div>
              <div>
                <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Regla #1</span>
                <h3 class="font-outfit font-black text-sm text-slate-800 uppercase tracking-wide mt-0.5">Sistema de Puntuación</h3>
              </div>
            </div>
            
            <p class="text-xs text-slate-600 leading-relaxed font-medium mb-4">
              Los puntos se calculan automáticamente de forma acumulativa según el acierto en cada partido registrado:
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <!-- Acierto Resultado -->
              <div class="bg-slate-50 border border-slate-200 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between">
                <div class="absolute right-3 top-3 text-[#008f5c]/15"><${Target} size=${40} /></div>
                <div>
                  <div class="flex items-center space-x-1.5">
                    <span class="px-2 py-0.5 rounded bg-emerald-50 text-[#005a36] text-[10px] font-bold">+1 Pts</span>
                    <span class="text-[10px] font-extrabold text-[#008f5c] uppercase">Acierto Simple</span>
                  </div>
                  <h4 class="font-outfit font-bold text-xs text-slate-800 uppercase mt-2">Ganador o Empate</h4>
                  <p class="text-[10px] text-slate-550 mt-1 leading-relaxed">Sumas 1 punto si aciertas el resultado general del partido (gana local, gana visita o empate), sin importar el score exacto.</p>
                </div>
              </div>
              
              <!-- Acierto Score -->
              <div class="bg-gradient-to-br from-amber-50/50 to-white border border-amber-200 rounded-xl p-3.5 relative overflow-hidden flex flex-col justify-between">
                <div class="absolute right-3 top-3 text-amber-500/10"><${Award} size=${40} /></div>
                <div>
                  <div class="flex items-center space-x-1.5">
                    <span class="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">+1 Pts Extra</span>
                    <span class="text-[10px] font-extrabold text-amber-600 uppercase">Acierto Score</span>
                  </div>
                  <h4 class="font-outfit font-bold text-xs text-slate-800 uppercase mt-2">Marcador Exacto</h4>
                  <p class="text-[10px] text-slate-550 mt-1 leading-relaxed">Sumas 1 punto adicional (un total de 2 puntos) si aciertas la cantidad exacta de goles anotados por cada selección.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="p-3 bg-rose-50 border border-rose-100 rounded-xl text-left">
            <span class="text-[8px] font-bold text-rose-700 uppercase tracking-widest block leading-none">Importante en caso de Fallar</span>
            <p class="text-[9px] text-rose-600 mt-1 font-semibold leading-relaxed">
              Si no aciertas el ganador o empate, obtendrás 0 puntos de forma automática para ese encuentro, independientemente de si acertaste los goles de uno de los equipos.
            </p>
          </div>
        </div>

        <!-- Tarjeta 2: Bloqueo de Pronósticos -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div class="flex items-center space-x-3 mb-4">
              <div class="p-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl shadow-sm">
                <${Clock} size=${20} />
              </div>
              <div>
                <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Regla #2</span>
                <h3 class="font-outfit font-black text-sm text-slate-800 uppercase tracking-wide mt-0.5">Cierre de Apuestas</h3>
              </div>
            </div>
            
            <p class="text-xs text-slate-650 leading-relaxed font-medium mb-3">
              Para garantizar el juego limpio y que ningún competidor tenga ventajas de tiempo:
            </p>

            <ul class="space-y-2.5 text-[11px] text-slate-600 font-semibold">
              <li class="flex items-start space-x-2">
                <span class="text-[#008f5c] mt-0.5">✔</span>
                <span>Los pronósticos se bloquean estrictamente al <b>inicio del partido</b> (pitazo inicial oficial).</span>
              </li>
              <li class="flex items-start space-x-2">
                <span class="text-[#008f5c] mt-0.5">✔</span>
                <span>Los botones de guardado e inputs se deshabilitan en el navegador.</span>
              </li>
              <li class="flex items-start space-x-2">
                <span class="text-[#008f5c] mt-0.5">✔</span>
                <span>La base de datos (Supabase) rechaza cualquier intento de escritura posterior.</span>
              </li>
            </ul>
          </div>
          
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center mt-4">
            <span class="text-[9px] text-slate-555 font-bold uppercase tracking-wider">Respeto Absoluto de Horarios</span>
          </div>
        </div>

        <!-- Tarjeta 3: Fase de Grupos vs Eliminatorias -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div class="flex items-center space-x-3 mb-4">
              <div class="p-2.5 bg-emerald-50 text-[#005a36] border border-emerald-100 rounded-xl shadow-sm">
                <${Calendar} size=${20} />
              </div>
              <div>
                <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Regla #3</span>
                <h3 class="font-outfit font-black text-sm text-slate-800 uppercase tracking-wide mt-0.5">Fases del Mundial</h3>
              </div>
            </div>
            
            <p class="text-xs text-slate-650 leading-relaxed font-medium mb-3">
              Las reglas de definición varían de acuerdo a la etapa del Mundial 2026:
            </p>

            <div class="space-y-3">
              <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span class="text-[9px] font-bold text-[#005a36] uppercase tracking-wide">Fase de Grupos</span>
                <p class="text-[10px] text-slate-600 mt-0.5">Se evalúa el resultado oficial al terminar los 90 minutos reglamentarios (incluyendo la adición por descuentos).</p>
              </div>
              <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span class="text-[9px] font-bold text-amber-600 uppercase tracking-wide">Fases Eliminatorias</span>
                <p class="text-[10px] text-slate-600 mt-0.5">Se considera el score definitivo final, incluyendo los tiempos extras y la tanda de penales si el partido requiere definición.</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Tarjeta 4: Gestión de Resultados -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div class="flex items-center space-x-3 mb-4">
              <div class="p-2.5 bg-sky-50 text-sky-600 border border-sky-100 rounded-xl shadow-sm">
                <${Award} size=${20} />
              </div>
              <div>
                <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Regla #4</span>
                <h3 class="font-outfit font-black text-sm text-slate-800 uppercase tracking-wide mt-0.5">Resultados y Errores</h3>
              </div>
            </div>
            
            <p class="text-xs text-slate-650 leading-relaxed font-medium">
              El administrador del sistema ingresa los marcadores oficiales una vez finalizado cada encuentro.
            </p>
            <p class="text-[11px] text-slate-550 leading-relaxed mt-2.5">
              En caso de error en el registro de un marcador, el administrador cuenta con la función de <b>"Eliminar Marcador"</b>, lo cual devuelve el partido a pendiente y revierte todos los puntos asignados automáticamente.
            </p>
          </div>
          
          <div class="bg-sky-50/50 border border-sky-100 p-2.5 rounded-xl text-[9px] text-sky-750 font-semibold mt-4">
            Los puntos se recalculan en vivo de manera de clasificación global.
          </div>
        </div>

        <!-- Tarjeta 5: Juego Limpio y Descalificación -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div class="flex items-center space-x-3 mb-4">
              <div class="p-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl shadow-sm">
                <${ShieldAlert} size=${20} />
              </div>
              <div>
                <span class="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Regla #5</span>
                <h3 class="font-outfit font-black text-sm text-slate-800 uppercase tracking-wide mt-0.5">Fair Play y Ética</h3>
              </div>
            </div>
            
            <p class="text-xs text-slate-650 leading-relaxed font-medium mb-3">
              Todos los participantes deben competir con honestidad:
            </p>
            <p class="text-[11px] text-slate-600 font-semibold leading-relaxed">
              Cualquier intento de burlar el sistema, registrar scores fuera del tiempo reglamentario o hackear la base de datos resultará en la <b>descalificación inmediata y permanente</b>.
            </p>
          </div>

          <div class="p-2.5 bg-rose-50 border border-rose-100 rounded-xl flex items-center space-x-2 mt-4 text-rose-700">
            <${AlertTriangle} size=${14} class="flex-shrink-0" />
            <span class="text-[9px] font-black uppercase tracking-wider leading-none">Auditoría con marcas de tiempo</span>
          </div>
        </div>

      </div>
    </div>
  `;
}

export default RulesView;
