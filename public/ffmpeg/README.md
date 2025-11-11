# FFmpeg Core Files

Para habilitar la carga local de FFmpeg y evitar dependencias de CDNs externos, descarga los siguientes archivos desde:

https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/

Y colócalos en esta carpeta `public/ffmpeg/`:

1. `ffmpeg-core.js`
2. `ffmpeg-core.wasm`
3. `ffmpeg-core.worker.js`

## Cómo descargar los archivos:

```bash
# Desde la raíz del proyecto:
cd public/ffmpeg

# Descargar ffmpeg-core.js
curl -o ffmpeg-core.js https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js

# Descargar ffmpeg-core.wasm
curl -o ffmpeg-core.wasm https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm

# Descargar ffmpeg-core.worker.js
curl -o ffmpeg-core.worker.js https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.worker.js
```

## Nota:

Si los archivos no están presentes, el sistema automáticamente intentará cargarlos desde CDNs externos (JSDelivr o Unpkg) como fallback.
