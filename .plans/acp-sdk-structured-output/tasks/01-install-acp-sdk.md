# T-001 Install ACP SDK

## Objective

Instalar `@agentclientprotocol/sdk` como dependencia del proyecto.

## Requirements Covered

- `FR-001`

## Dependencies

- none

## Files or Areas Involved

- `package.json` - Modify - Agregar dependencia
- `pnpm-lock.yaml` - Modify - Actualizar lock file

## Actions

1. Ejecutar `pnpm add @agentclientprotocol/sdk`
2. Verificar que se agregó a `dependencies` en `package.json`
3. Confirmar que `pnpm-lock.yaml` se actualizó

## Completion Criteria

- [ ] `@agentclientprotocol/sdk` aparece en `package.json`
- [ ] `pnpm-lock.yaml` tiene la nueva dependencia
- [ ] `node_modules/@agentclientprotocol/sdk` existe

## Validation

```bash
pnpm list @agentclientprotocol/sdk
```

## Risks or Notes

- Verificar compatibilidad con Node.js 20+
- El SDK requiere ESM (ya configurado en proyecto)
