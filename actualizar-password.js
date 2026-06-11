import { db } from './supabase.js';

async function guardarNuevaPasswordDesdeEnlace() {
  const input = document.getElementById('nueva_password_field');
  if (!input) return;

  const nuevaClave = input.value;
  if (!nuevaClave || nuevaClave.length < 6) {
    alert('La nueva contraseña debe tener al menos 6 caracteres.');
    return;
  }

  try {
    // 1. Ejecutar la actualización en Supabase Auth
    await db.actualizarContrasena(nuevaClave);
    
    // 2. Limpiar cualquier sesión anterior local
    await db.logout();
    localStorage.removeItem('pollita_session');

    // 3. Alertar y redireccionar a la portada / login
    alert('¡Contraseña actualizada con éxito! Ya puedes iniciar sesión con tu nueva contraseña.');
    window.location.href = 'index.html';
  } catch (err) {
    alert('Error al actualizar la contraseña: ' + err.message);
  }
}

// Exponer la función al objeto window para que esté disponible en el botón HTML onclick
window.guardarNuevaPasswordDesdeEnlace = guardarNuevaPasswordDesdeEnlace;
