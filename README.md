# Francisco · Dashboard

## Pasos para subir a Netlify

### 1. Sube a GitHub
- Ve a github.com y crea un nuevo repositorio llamado `mi-dashboard`
- Sube estos 3 archivos/carpetas:
  - `index.html`
  - `netlify.toml`
  - `netlify/functions/data.js`

### 2. Conecta GitHub con Netlify
- Ve a netlify.com → "Add new site" → "Import an existing project"
- Conecta tu cuenta de GitHub y selecciona el repositorio `mi-dashboard`
- Clic en "Deploy site"

### 3. Agrega tu API Key de Anthropic
- En Netlify ve a: Site settings → Environment variables → Add a variable
- Name: `ANTHROPIC_API_KEY`
- Value: (tu API key de console.anthropic.com)

### 4. ¡Listo!
Tu dashboard estará en una URL como: https://tu-nombre.netlify.app

Se actualiza automáticamente con tus correos y calendario cada vez que presionas "Actualizar".
