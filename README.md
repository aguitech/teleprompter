# AGUITECH Teleprompter

Teleprompter web profesional, 100% en el navegador (sin servidor, sin tracking). Velocidad ajustable, mirror mode para cristal, multi-script con `localStorage`, atajos de teclado, fullscreen.

---

## 🚀 Demo

👉 **https://aguitech.github.io/teleprompter/**

---

## ✨ Características

| Feature | Detalle |
|---|---|
| **Velocidad ajustable** | 5–200 px/s, slider + flechas ← → |
| **Tamaño de fuente** | 20–120px, slider + teclas + − |
| **Mirror mode** | Reflejo horizontal para usar con cristal teleprompter |
| **Multi-script** | Guarda N guiones en `localStorage`, selector desplegable |
| **Countdown** | Cuenta regresiva 3-2-1 antes de iniciar |
| **5 colores** | Blanco, amarillo, verde, rojo, cian |
| **Fullscreen** | Prompter ocupa toda la pantalla |
| **Live preview** | Editas el texto y el prompter se actualiza en tiempo real |
| **Word highlight** | La palabra actual se resalta al pasar por la línea de enfoque |
| **Atajos teclado** | Space, R, F, M, ← →, + −, Esc |
| **Responsive** | Funciona en desktop, tablet y mobile |
| **100% privado** | Cero servidor, cero cookies, cero tracking |

---

## ⌨️ Atajos de teclado

| Tecla | Acción |
|---|---|
| `Space` | Play / Pausa |
| `R` | Reiniciar scroll |
| `F` | Fullscreen |
| `M` | Toggle mirror |
| `Esc` | Salir de fullscreen |
| `←` | Velocidad -5 |
| `→` | Velocidad +5 |
| `+` / `=` | Font size +4 |
| `−` / `_` | Font size -4 |

---

## 🏗️ Estructura

```
teleprompter/
├── docs/                    # GitHub Pages
│   └── index.html           # Single-page app
├── assets/
│   ├── style.css            # Dark mode + responsive
│   └── app.js               # Toda la lógica
├── .github/
│   └── workflows/
│       └── pages.yml        # Auto-deploy a Pages
├── .gitignore
└── README.md
```

---

## 🛠️ Tech Stack

- **Frontend:** HTML5 + CSS3 + Vanilla JavaScript (zero frameworks, zero build)
- **Storage:** `localStorage` del navegador (sin backend)
- **Hosting:** GitHub Pages (gratis, estático)

---

## 🎬 Casos de uso

- **YouTubers / podcasters** que graban con teleprompter físico (cámara + cristal)
- **Presentadores** que necesitan leer un guion manteniendo contacto visual
- **Creadores de contenido** que practican pitches o monólogos
- **Educadores** grabando clases magistrales
- **Cualquier persona** que quiera leer un texto largo en cámara sin perder la mirada

---

## 🪞 Mirror Mode (cómo usarlo)

1. Activa **Mirror: ON** con la tecla `M` o el botón en el sidebar
2. Conecta una pantalla externa o usa un cristal teleprompter físico
3. El texto aparece invertido horizontalmente → al reflejarse en el cristal, se ve correcto
4. La cámara queda detrás del cristal grabándote de frente, sin que tengas que mirar abajo

---

## 💾 Persistencia

Todos tus scripts y ajustes se guardan en `localStorage` del navegador. **No se envía nada a ningún servidor**. Si cambias de navegador o borras las cookies, perderás los scripts guardados.

Para hacer backup, copia el JSON de:
```js
JSON.parse(localStorage.getItem('aguitech_teleprompter_v1'))
```

---

## 🤝 Créditos

Construido por **AGUITECH** · https://aguitech.com.mx

Tagline: *Ingeniería + Diseño + Sistemas*

Repo: https://github.com/aguitech/teleprompter

---

## 📝 Licencia

MIT — úsalo, modifícalo, distribúyelo.
