# Video Pipeline Core - Context

## Overview

Este plan define la construcción del núcleo del Video Pipeline System - una plataforma para generación automatizada de videos usando OpenCode AI, MiniMax Hailuo AI y Remotion. El core incluye la infraestructura base, conexión a OpenCode, gestión de sesiones, sistema de eventos, SDK unificado y utilidades esenciales.

## Background

El sistema actual tiene:
- API Express básica con SQLite
- Servicio MiniMax funcional para generación de video
- Estructura de videos/escenas en base de datos
- CLI para operaciones básicas

Lo que falta es el **core completo** que permita:
- Controlar OpenCode desde cualquier parte del código
- Gestionar sesiones ACP robustamente
- Comunicación via Event Bus
- Abstracciones para las partes más complejas
- SDK unificado para integraciones

## Goal

Tener un core sólido y extensible que permita:
1. Conectar y controlar OpenCode (modo ACP) desde cualquier lugar del código
2. Gestionar sesiones con metadatos, health checks y reconnexión
3. Emitir y escuchar eventos entre componentes
4. Abstraer complejidad de FFmpeg, OpenCode y MiniMax
5. Proveer utilidades reutilizables (logger, config, errors)
6. Estructura de carpetas clara y escalable

## Key Decisions

- **OpenCode Mode**: ACP (Agent Client Protocol) con stdio para sesiones persistentes
- **Session Management**: SessionManager con metadatos, health checks y reconnexión automática
- **Event System**: EventBus tipo pub/sub en memoria (suficiente para MVP)
- **Architecture**: Layered - Core → Services → API → Frontend
- **Language**: TypeScript con ES modules
- **Folder Structure**: Feature-based organization

## Scope Boundaries

- **In scope**:
  - Core infrastructure (config, logger, errors)
  - OpenCode SDK y adaptadores
  - Session Manager completo
  - Event Bus y estructura de eventos
  - FFmpeg wrapper
  - Estructura de carpetas del proyecto
  - Base para planificación de escenas
  
- **Out of scope**:
  - UI/Frontend components
  - API routes específicas de negocio
  - Integración MiniMax (ya existe)
  - Base de datos (ya existe)
  - Remotion compositions
