import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

class FFmpegManager {
  private static instance: FFmpegManager;
  private ffmpeg: FFmpeg;
  private loaded: boolean = false;
  private loading: boolean = false;

  private constructor() {
    this.ffmpeg = new FFmpeg();
    
    this.ffmpeg.on('log', ({ message }) => {
      console.log('[FFmpeg]', message);
    });
  }

  public static getInstance(): FFmpegManager {
    if (!FFmpegManager.instance) {
      FFmpegManager.instance = new FFmpegManager();
    }
    return FFmpegManager.instance;
  }

  public async load(onProgress?: (progress: number) => void): Promise<void> {
    if (this.loaded) {
      console.log('✅ FFmpeg ya estaba cargado');
      return;
    }

    if (this.loading) {
      console.log('⏳ FFmpeg ya se está cargando, esperando...');
      const startTime = Date.now();
      while (this.loading && Date.now() - startTime < 30000) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (!this.loaded) {
        throw new Error('FFmpeg load timeout - otra instancia no completó carga');
      }
      return;
    }

    this.loading = true;
    const maxRetries = 2;
    let lastError: Error | null = null;

    // Intentar cargar desde assets locales primero
    const baseUrl = `${window.location.origin}/ffmpeg`;
    console.log('🔄 Intentando cargar FFmpeg desde assets locales:', baseUrl);
    
    try {
      onProgress?.(20);
      console.log('📥 Descargando ffmpeg-core.js local...');
      const coreURL = await toBlobURL(`${baseUrl}/ffmpeg-core.js`, 'text/javascript');
      
      console.log('📥 Descargando ffmpeg-core.wasm local...');
      const wasmURL = await toBlobURL(`${baseUrl}/ffmpeg-core.wasm`, 'application/wasm');

      console.log('🔧 Inicializando FFmpeg desde local...');
      await this.ffmpeg.load({ coreURL, wasmURL });
      
      this.loaded = true;
      this.loading = false;
      onProgress?.(100);
      console.log('✅ FFmpeg cargado desde assets locales');
      return;
    } catch (error) {
      console.warn('⚠️ No se pudo cargar FFmpeg desde assets locales, intentando CDNs...', error);
      lastError = error as Error;
    }

    // Fallback: CDNs alternativas
    const cdnUrls = [
      'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd',
      'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
    ];

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      for (const baseURL of cdnUrls) {
        try {
          console.log(`🔄 Intento ${attempt}/${maxRetries} desde ${baseURL.includes('jsdelivr') ? 'JSDelivr' : 'Unpkg'}...`);
          onProgress?.(attempt * 40);

          console.log('📥 Descargando ffmpeg-core.js...');
          const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
          
          console.log('📥 Descargando ffmpeg-core.wasm...');
          const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');

          console.log('🔧 Inicializando FFmpeg...');
          await this.ffmpeg.load({ coreURL, wasmURL });
          
          this.loaded = true;
          this.loading = false;
          onProgress?.(100);
          console.log('✅ FFmpeg cargado correctamente desde CDN');
          return;
        } catch (error) {
          lastError = error as Error;
          console.error(`❌ Error cargando FFmpeg desde ${baseURL}:`, error);
          if (attempt === maxRetries && baseURL === cdnUrls[cdnUrls.length - 1]) {
            this.loading = false;
            throw new Error(`Failed to load FFmpeg after ${maxRetries} attempts: ${error}`);
          }
        }
      }

      if (attempt < maxRetries) {
        console.log(`⏳ Reintentando en 1 segundo...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    this.loading = false;
    throw new Error(
      `No se pudo cargar FFmpeg después de ${maxRetries} intentos desde múltiples CDNs. ` +
      `Error: ${lastError?.message}. Verifica tu conexión a internet.`
    );
  }

  public async concatenateVideos(
    videoBlobs: Blob[],
    options: {
      width: number;
      height: number;
      fps: number;
    },
    onProgress?: (progress: number, stage: string) => void
  ): Promise<Blob> {
    if (!this.loaded) throw new Error('FFmpeg no está cargado. Llama a load() primero.');

    try {
      onProgress?.(5, 'Escribiendo videos...');

      // 1. Escribir todos los videos al sistema de archivos virtual
      for (let i = 0; i < videoBlobs.length; i++) {
        await this.ffmpeg.writeFile(`input${i}.mp4`, await fetchFile(videoBlobs[i]));
        onProgress?.(10 + ((i + 1) / videoBlobs.length) * 20, `Video ${i + 1}/${videoBlobs.length} cargado`);
      }

      onProgress?.(30, 'Normalizando videos...');

      // 2. Normalizar cada video (resolución, fps, formato) - optimizado para velocidad
      for (let i = 0; i < videoBlobs.length; i++) {
        await this.ffmpeg.exec([
          '-i', `input${i}.mp4`,
          '-vf', `scale=${options.width}:${options.height}:force_original_aspect_ratio=decrease,pad=${options.width}:${options.height}:(ow-iw)/2:(oh-ih)/2:black,setsar=1,fps=24`,
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-crf', '28', // Mayor compresión para velocidad
          '-pix_fmt', 'yuv420p', // Formato de píxeles compatible
          '-movflags', '+faststart', // Optimizar para streaming
          '-an', // Sin audio por ahora
          `normalized${i}.mp4`
        ]);
        onProgress?.(30 + ((i + 1) / videoBlobs.length) * 30, `Normalizando ${i + 1}/${videoBlobs.length}`);
      }

      // 3. Crear archivo de lista para concatenación
      const listContent = videoBlobs
        .map((_, i) => `file 'normalized${i}.mp4'`)
        .join('\n');
      await this.ffmpeg.writeFile('list.txt', new TextEncoder().encode(listContent));

      // 4. Concatenar todos los videos con indicador de progreso visual
      onProgress?.(60, 'Concatenando videos...');
      
      // Indicador de progreso "heartbeat" durante concatenación
      let concatProgress = 60;
      const progressInterval = setInterval(() => {
        concatProgress = Math.min(concatProgress + 0.5, 95);
        onProgress?.(concatProgress, 'Concatenando videos...');
      }, 1500);
      
      try {
        await this.ffmpeg.exec([
          '-f', 'concat',
          '-safe', '0',
          '-i', 'list.txt',
          '-c', 'copy',
          'concatenated.mp4'
        ]);
        clearInterval(progressInterval);
        onProgress?.(80, 'Finalizando...');
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }

      // 5. Leer el resultado
      const data = await this.ffmpeg.readFile('concatenated.mp4');
      const uint8Data = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
      const resultBlob = new Blob([uint8Data], { type: 'video/mp4' });

      onProgress?.(100, 'Completado');

      // 6. Limpiar archivos temporales
      try {
        for (let i = 0; i < videoBlobs.length; i++) {
          await this.ffmpeg.deleteFile(`input${i}.mp4`);
          await this.ffmpeg.deleteFile(`normalized${i}.mp4`);
        }
        await this.ffmpeg.deleteFile('list.txt');
        await this.ffmpeg.deleteFile('concatenated.mp4');
      } catch (e) {
        console.warn('No se pudieron eliminar archivos temporales:', e);
      }

      return resultBlob;
    } catch (error) {
      console.error('❌ Error al concatenar videos:', error);
      throw error;
    }
  }

  public async addOverlays(
    inputBlob: Blob,
    logoUrl: string,
    overlayConfig: {
      text: string;
      position: { x: number; y: number };
      fontSize: number;
      color: string;
    }[]
  ): Promise<Blob> {
    if (!this.loaded) throw new Error('FFmpeg no está cargado');

    try {
      await this.ffmpeg.writeFile('input.mp4', await fetchFile(inputBlob));
      
      if (logoUrl) {
        await this.ffmpeg.writeFile('logo.png', await fetchFile(logoUrl));
      }

      // Construir filtro de overlays
      let filterComplex = '[0:v]';
      
      // Añadir logo si existe
      if (logoUrl) {
        filterComplex += '[1:v]overlay=10:10[v]';
      }

      await this.ffmpeg.exec([
        '-i', 'input.mp4',
        ...(logoUrl ? ['-i', 'logo.png'] : []),
        '-filter_complex', filterComplex,
        '-map', logoUrl ? '[v]' : '[0:v]',
        '-c:v', 'libx264',
        '-preset', 'medium',
        '-crf', '23',
        'output.mp4'
      ]);

      const data = await this.ffmpeg.readFile('output.mp4');
      const uint8Data = typeof data === 'string' ? new TextEncoder().encode(data) : new Uint8Array(data);
      const resultBlob = new Blob([uint8Data], { type: 'video/mp4' });

      // Limpiar
      await this.ffmpeg.deleteFile('input.mp4');
      await this.ffmpeg.deleteFile('output.mp4');
      if (logoUrl) await this.ffmpeg.deleteFile('logo.png');

      return resultBlob;
    } catch (error) {
      console.error('❌ Error al añadir overlays:', error);
      throw error;
    }
  }

  public isLoaded(): boolean {
    return this.loaded;
  }

  // Métodos públicos para acceder a FFmpeg
  public async writeFile(name: string, data: Uint8Array | string): Promise<void> {
    if (!this.loaded) throw new Error('FFmpeg no está cargado');
    await this.ffmpeg.writeFile(name, data);
  }

  public async readFile(name: string): Promise<Uint8Array | string> {
    if (!this.loaded) throw new Error('FFmpeg no está cargado');
    return await this.ffmpeg.readFile(name);
  }

  public async deleteFile(name: string): Promise<void> {
    if (!this.loaded) throw new Error('FFmpeg no está cargado');
    await this.ffmpeg.deleteFile(name);
  }

  public async exec(args: string[]): Promise<void> {
    if (!this.loaded) throw new Error('FFmpeg no está cargado');
    await this.ffmpeg.exec(args);
  }

  public onProgress(callback: (progress: { progress: number }) => void): void {
    this.ffmpeg.on('progress', callback);
  }

  public offProgress(callback: (progress: { progress: number }) => void): void {
    this.ffmpeg.off('progress', callback);
  }
}

export default FFmpegManager;
