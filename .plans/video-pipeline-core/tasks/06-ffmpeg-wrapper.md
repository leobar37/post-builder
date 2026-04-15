# T-006 FFmpeg Wrapper

## Objective

Crear un wrapper para FFmpeg que abstraiga operaciones comunes de video: concatenación, extracción de metadata, conversión.

## Requirements Covered

- `FR-011` - Wrapper FFmpeg para operaciones de video

## Dependencies

- `T-002` - Utilities (usa file utils)

## Files or Areas Involved

- `src/core/ffmpeg/types.ts` - Create - Tipos para opciones y resultados
- `src/core/ffmpeg/wrapper.ts` - Create - FFmpegWrapper class
- `src/core/ffmpeg/commands.ts` - Create - Builders de comandos
- `src/core/ffmpeg/index.ts` - Create - Exports

## Actions

1. Definir interfaces: `ConcatOptions`, `ExtractOptions`, `VideoInfo`
2. Crear clase `FFmpegWrapper` que use `ffmpeg-static`
3. Implementar método `concat(inputs, output)` para unir videos
4. Implementar método `getInfo(input)` para extraer metadata
5. Implementar método `extractAudio(input, output)`
6. Implementar método `extractFrame(input, time, output)`
7. Crear builders para construir comandos FFmpeg complejos
8. Manejar errores de FFmpeg con mensajes claros
9. Integrar con logger para debug de comandos

## Completion Criteria

- [ ] Concatenación de múltiples videos funciona
- [ ] Extracción de metadata devuelve duración, resolución, etc.
- [ ] Extracción de audio genera archivo válido
- [ ] Extracción de frame captura en timestamp específico
- [ ] Errores de FFmpeg se capturan y reportan

## Validation

```bash
pnpm typecheck
```

## Risks or Notes

- Requiere `ffmpeg-static` instalado
- Comandos complejos pueden fallar en diferentes versiones de FFmpeg
- Operaciones son CPU intensivas, considerar timeouts largos
- Validar que archivos de entrada existan antes de ejecutar
