# Reglas Oficiales - Pronósticos SoftMedia Mundial 2026

¡Bienvenidos a la plataforma de pronósticos de SoftMedia! A continuación se detallan las reglas oficiales del juego, el sistema de puntuación y las políticas de seguridad implementadas.

---

## 1. Sistema de Puntuación
* **Acierto de Resultado (Ganador/Empate):** Sumas **+1 punto** si aciertas el ganador o empate del partido (es decir, la dirección del resultado: gana local, gana visita o empate).
* **Acierto del Marcador Exacto (Punto Extra):** Sumas **+1 punto adicional** (haciendo un total de **2 puntos** para ese partido) si además de acertar el ganador/empate, tu pronóstico coincide exactamente con la cantidad de goles anotados por cada equipo (ej: si pronosticas 2 - 1 y el partido termina 2 - 1).
* **Fallas:** Si fallas el resultado del partido (ej: pronosticas victoria del equipo A pero hay empate o victoria del equipo B), obtienes **0 puntos**, independientemente de los goles.

## 2. Plazo de Registro y Bloqueo de Pronósticos
Para garantizar la transparencia y evitar fraudes o ventajas competitivas:
* **Cierre Automático:** La posibilidad de guardar o modificar un pronóstico se bloquea estrictamente **al iniciar** cada partido (es decir, hasta antes del pitazo inicial oficial en hora de Lima/Perú).

* **Seguridad de Doble Capa:**
  1. **En la Interfaz (Frontend):** Los botones de apuesta se desactivan automáticamente y el estado cambia a **"Cerrado"**.
  2. **En la Base de Datos (Supabase RLS):** Contamos con políticas de seguridad a nivel de base de datos (Row Level Security) que impiden cualquier inserción o actualización de pronóstico si el partido ya inició. Es imposible burlar el bloqueo modificando el reloj del computador.

## 3. Fase de Grupos vs. Eliminatorias
* **Fase de Grupos:** Se evalúa el resultado oficial al finalizar el tiempo reglamentario de 90 minutos (incluido el tiempo de reposición).
* **Fases Eliminatorias (16avos, Octavos, Cuartos, Semifinales y Final):** Se evalúa el resultado final definitivo, considerando prórroga y tanda de penales si el partido se define por esa vía.

## 4. Gestión de Marcadores y Resultados
* **Registro de Resultados:** El administrador del sistema ingresará los resultados oficiales tan pronto finalice cada encuentro.
* **Recalculación en Vivo:** Al guardar un marcador oficial, el sistema recalcula en tiempo real los aciertos y la tabla de posiciones global (Clasificación).
* **Corrección de Errores:** Si el administrador registra por error un score en un partido incorrecto o antes de que se juegue, cuenta con una opción de **"Eliminar Marcador"** que restablece el cotejo a pendiente y devuelve los puntos de los pronósticos al estado anterior de inmediato.

## 5. Conducta Ética y Descalificación
* **Juego Limpio:** Se espera que todos los colaboradores compitan bajo principios de honestidad y compañerismo.
* **Intento de Manipulación:** Cualquier comportamiento antiético, intento comprobado de hackeo, manipulación maliciosa de peticiones a la base de datos, o explotación de vulnerabilidades para intentar alterar scores o apuestas fuera de tiempo conllevará a la **descalificación inmediata y permanente** del participante.
* **Auditoría de Registros:** Los administradores tienen acceso al historial detallado de logs y marcas de tiempo en el servidor de Supabase (donde cada registro y actualización se graba con fecha y hora inalterables de forma nativa), lo cual servirá como fuente oficial ante cualquier sospecha o disputa.

---
*Que gane el mejor pronosticador de SoftMedia. ¡Buena suerte a todos!*
