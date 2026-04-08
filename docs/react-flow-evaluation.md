# Evaluación Técnica: React Flow

> **Fecha de evaluación:** Abril 2025  
> **Versión analizada:** 12.10.2 (actual)

---

## 1. Introducción a React Flow

### Qué es y qué problema resuelve

React Flow es una librería de componentes React de código abierto para construir **editores de nodos basados en flujo** (node-based UIs). Permite crear interfaces interactivas como:

- Editores de workflows y automatizaciones
- Diagramas de flujo y flowcharts
- Visualizaciones de pipelines de datos
- Constructores de chatbots
- Sintetizadores de audio visuales
- Herramientas de ML pipeline

**Problema que resuelve:** Construir desde cero un sistema de nodos interactivos con drag & drop, zoom, pan, conexiones entre nodos, y un sistema de viewport es complejo y consume mucho tiempo de desarrollo. React Flow proporciona estas capacidades "listas para usar" con una API declarativa de React.

### Versión actual y estado del proyecto

| Métrica | Valor |
|---------|-------|
| **Versión actual** | 12.10.2 (marzo 2026) |
| **GitHub Stars** | ~35,800+ |
| **Weekly NPM installs** | ~4.6 millones |
| **Dependientes** | 12,300+ proyectos |
| **Contributors** | 131 |
| **Lenguaje principal** | TypeScript (85.5%) |
| **Mantenimiento** | Activo (equipo xyflow) |

**Nota importante:** En la v12 el paquete cambió de nombre de `reactflow` a `@xyflow/react`. La v11 está en modo mantenimiento.

### Licencia y costos

**Open Source (MIT License):**
- Gratuito para uso personal y comercial
- Código completamente accesible
- Puede usarse sin atribución (aunque se recomienda mantenerla para apoyar el proyecto)

**React Flow Pro (Suscripción):**

| Plan | Precio | Incluye |
|------|--------|---------|
| **Starter** | ~€69/año | Pro examples, templates, 1 miembro, issues priorizados |
| **Professional** | ~€189/año | + 1h soporte/mes, call con creadores |
| **Enterprise** | Custom | + Soporte voice/video, procurement custom |

La suscripción Pro NO desbloquea funcionalidad en la librería base, solo ejemplos, templates y soporte.

---

## 2. Arquitectura y API

### Estructura de datos esperada

React Flow opera sobre dos arrays principales:

```typescript
// Nodes
interface Node<T = any> {
  id: string;                    // Identificador único
  position: { x: number; y: number };  // Coordenadas absolutas
  data: T;                       // Datos arbitrarios del nodo
  type?: string;                 // Tipo de nodo (custom o built-in)
  parentId?: string;             // Para sub-flows
  hidden?: boolean;              // Visibilidad
  selected?: boolean;            // Estado de selección
  dragging?: boolean;            // Estado de drag
  draggable?: boolean;           // Permite drag
  selectable?: boolean;          // Permite selección
  connectable?: boolean;         // Permite conexiones
  deletable?: boolean;           // Permite borrado
  style?: CSSProperties;
  className?: string;
  width?: number;                // Ancho fijo
  height?: number;               // Alto fijo
  extent?: 'parent' | CoordinateExtent;
  expandParent?: boolean;
  zIndex?: number;
}

// Edges
interface Edge<T = any> {
  id: string;                    // Identificador único
  source: string;                // ID del nodo origen
  target: string;                // ID del nodo destino
  sourceHandle?: string;         // ID del handle origen
  targetHandle?: string;         // ID del handle destino
  type?: 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier' | string;
  animated?: boolean;            // Animación de flujo
  label?: string | ReactNode;
  labelStyle?: CSSProperties;
  labelShowBg?: boolean;
  labelBgStyle?: CSSProperties;
  labelBgPadding?: [number, number];
  labelBgBorderRadius?: number;
  style?: CSSProperties;
  className?: string;
  hidden?: boolean;
  data?: T;
  markerStart?: EdgeMarkerType;
  markerEnd?: EdgeMarkerType;
  selected?: boolean;
  selectable?: boolean;
  deletable?: boolean;
  focusable?: boolean;
  reconnectable?: boolean | 'source' | 'target';
  pathOptions?: BezierPathOptions | SmoothStepPathOptions;
}
```

### Componentes principales

#### ReactFlow (Componente raíz)
```tsx
<ReactFlow
  nodes={nodes}
  edges={edges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
  onConnect={onConnect}
  nodeTypes={nodeTypes}
  edgeTypes={edgeTypes}
  fitView
  snapToGrid
  snapGrid={[15, 15]}
  defaultViewport={{ x: 0, y: 0, zoom: 1 }}
>
  {/* Componentes hijos */}
</ReactFlow>
```

#### Background
```tsx
<Background
  variant="dots" | "lines" | "cross"
  gap={16}
  size={1}
  color="#ccc"
/>
```

#### Controls
```tsx
<Controls
  showZoom={true}
  showFitView={true}
  showInteractive={true}
  onZoomIn={() => {}}
  onZoomOut={() => {}}
  onFitView={() => {}}
  onInteractiveChange={() => {}}
/>
```

#### MiniMap
```tsx
<MiniMap
  nodeStrokeColor={(node) => (node.selected ? '#ff0000' : '#000')}
  nodeColor={(node) => (node.selected ? '#ff0000' : '#eee')}
  maskColor="rgba(240, 240, 240, 0.6)"
/>
```

### Sistema de Handles (source/target)

Los handles son los puntos de conexión en los nodos:

```tsx
import { Handle, Position } from '@xyflow/react';

function CustomNode({ data }) {
  return (
    <div className="custom-node">
      {/* Handle de entrada (recibe conexiones) */}
      <Handle
        type="target"
        position={Position.Left}
        id="input-1"
        isConnectable={true}
        isConnectableStart={false}  // No puede iniciar conexión
        isConnectableEnd={true}      // Puede recibir conexión
      />

      <div>{data.label}</div>

      {/* Handle de salida (inicia conexiones) */}
      <Handle
        type="source"
        position={Position.Right}
        id="output-1"
        isConnectable={true}
        isConnectableStart={true}
        isConnectableEnd={false}
      />
    </div>
  );
}
```

**Posiciones disponibles:** `Position.Top`, `Position.Right`, `Position.Bottom`, `Position.Left`

### Custom Node Types

Definir nodos personalizados:

```tsx
// Definición del componente
const TextUpdaterNode = memo(({ data, isConnectable }) => {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);

  return (
    <div className="text-updater-node">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <div>
        <label htmlFor="text">Text:</label>
        <input id="text" name="text" onChange={onChange} className="nodrag" />
      </div>
      <Handle type="source" position={Position.Bottom} id="a" isConnectable={isConnectable} />
    </div>
  );
});

// Mapeo de tipos (¡fuera del componente para evitar re-renders!)
const nodeTypes = {
  textUpdater: TextUpdaterNode,
  selectorNode: SelectorNode,
};

// Uso
<ReactFlow nodeTypes={nodeTypes} />

// En la definición de nodes
const nodes = [
  {
    id: '1',
    type: 'textUpdater',  // Referencia al tipo custom
    position: { x: 0, y: 0 },
    data: { value: 123 },
  },
];
```

**Props inyectadas automáticamente en custom nodes:**
- `id`: string
- `data`: T
- `selected`: boolean
- `dragging`: boolean
- `isConnectable`: boolean
- `type`: string
- `zIndex`: number
- `xPos`: number
- `yPos`: number
- `width` / `height`: number (si definido)

### Edge Types

| Tipo | Descripción | Uso típico |
|------|-------------|------------|
| `default` | Bezier curve con control automático | Conexiones generales |
| `straight` | Línea recta | Conexiones directas cortas |
| `step` | Líneas rectas con esquina a 90° | Diagramas técnicos |
| `smoothstep` | Esquinas redondeadas | Flowcharts profesionales |
| `bezier` | Curva de Bezier con control manual | Conexiones estilizadas |

```tsx
const edgeTypes = {
  customEdge: CustomEdgeComponent,
};

// En edges
{
  id: 'e1-2',
  source: '1',
  target: '2',
  type: 'smoothstep',
  animated: true,
  style: { stroke: '#ff0000' },
  markerEnd: { type: MarkerType.ArrowClosed },
}
```

---

## 3. Capacidades Principales

### Drag and Drop de Nodos

**Nativo incluido:**
- Arrastre de nodos individual y multi-selección
- Snap to grid configurable
- Extensión de nodos padre
- Drag handles personalizables

```tsx
// Clase especial para elementos que inician drag
<input className="nodrag" />  // No inicia drag del nodo
<input className="nowheel" /> // No captura wheel event
```

### Zoom y Pan Nativo

| Acción | Control |
|--------|---------|
| Zoom | Scroll wheel, pinch gesture, botones Controls |
| Pan | Click + drag en canvas, two-finger drag |
| Zoom to fit | `fitView` prop o botón Controls |
| Min/Max zoom | `minZoom={0.1}` / `maxZoom={2}` |
| Pan on scroll | `panOnScroll={true}` |

### Selección de Nodos

```tsx
<ReactFlow
  selectNodesOnDrag={true}     // Seleccionar al arrastrar
  selectionOnDrag={true}       // Box selection al drag
  selectionMode={SelectionMode.Full} | SelectionMode.Partial
  selectionKeyCode="Shift"      // Tecla para multi-selección
  multiSelectionKeyCode="Cmd"   // Tecla para añadir a selección
  deleteKeyCode="Backspace"     // Tecla para borrar
  onSelectionChange={({ nodes, edges }) => {}}
/>
```

### Paneles y Overlays

```tsx
// Panel personalizado posicionable
<Panel position="top-right" className="custom-panel">
  <button>My Action</button>
</Panel>

// Portal para renderizar fuera del viewport transformado
<ViewportPortal>
  <div style={{ position: 'absolute', left: 100, top: 100 }}>
    Fixed content
  </div>
</ViewportPortal>
```

### Plugins Disponibles

**Built-in:**
- `MiniMap` - Vista miniatura del diagrama
- `Controls` - Botones de zoom y fit
- `Background` - Grid/retícula
- `Panel` - Contenedor flotante
- `NodeToolbar` - Toolbar contextual para nodos
- `NodeResizer` - Handles para redimensionar
- `EdgeToolbar` - Toolbar contextual para edges

**Pro UI Components (requiere suscripción):**
- `NodeSearch` - Búsqueda de nodos
- `ZoomSlider` - Control deslizante de zoom
- `ZoomSelect` - Selector de zoom
- `DevTools` - Herramientas de debugging
- Templates de workflow editor
- Templates de AI workflow editor

---

## 4. Sistema de Eventos

### Eventos de Nodos

```tsx
<ReactFlow
  // Click en nodo
  onNodeClick={(event, node) => console.log('Clicked:', node.id)}

  // Doble click
  onNodeDoubleClick={(event, node) => {}}

  // Context menu
  onNodeContextMenu={(event, node) => {}}

  // Inicio/fin de drag
  onNodeDragStart={(event, node, nodes) => {}}
  onNodeDrag={(event, node, nodes) => {}}
  onNodeDragStop={(event, node, nodes) => {}}

  // Cambios en nodos (posición, selección, etc)
  onNodesChange={(changes) => {
    // changes: [{ type: 'position', id: '1', dragging: true }, ...]
  }}

  // Borrado de nodos
  onNodesDelete={(deletedNodes) => {}}

  // Validación antes de borrar
  onBeforeDelete={async ({ nodes, edges }) => {
    return window.confirm('Delete?'); // true = permitir
  }}
/>
```

### Eventos de Edges

```tsx
<ReactFlow
  onEdgeClick={(event, edge) => {}}
  onEdgeDoubleClick={(event, edge) => {}}
  onEdgeContextMenu={(event, edge) => {}}
  onEdgeMouseEnter={(event, edge) => {}}
  onEdgeMouseLeave={(event, edge) => {}}
  onEdgeMouseMove={(event, edge) => {}}

  onEdgesChange={(changes) => {}}
  onEdgesDelete={(deletedEdges) => {}}

  // Reconexión
  onReconnect={(oldEdge, newConnection) => {}}
  onReconnectStart={(event, edge, handleType) => {}}
  onReconnectEnd={(event, edge, handleType) => {}}
/>
```

### Eventos de Conexiones

```tsx
<ReactFlow
  // Cuando se crea una conexión
  onConnect={(connection) => {
    // connection: { source, target, sourceHandle?, targetHandle? }
    setEdges((eds) => addEdge(connection, eds));
  }}

  // Inicio/fin de drag de conexión
  onConnectStart={(event, { nodeId, handleId, handleType }) => {
    console.log('Starting connection from:', nodeId);
  }}
  onConnectEnd={(event) => {}}

  // Validación de conexión
  isValidConnection={(connection) => {
    // Retornar false para prevenir la conexión
    return connection.source !== connection.target;
  }}

  // Estado de conexión (mientras se arrastra)
  onConnectionStart={() => {}}
/>
```

### Eventos de Viewport

```tsx
<ReactFlow
  onInit={(instance) => {
    // ReactFlowInstance con métodos como fitView, zoomIn, etc
  }}

  onMove={(event, viewport) => {
    // viewport: { x, y, zoom }
  }}
  onMoveStart={(event) => {}}
  onMoveEnd={(event, viewport) => {}}

  onViewportChange={(viewport) => {}}
/>
```

### Utilidades para cambios

```tsx
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

// Aplicar cambios de nodos
const onNodesChange = useCallback((changes) => {
  setNodes((nds) => applyNodeChanges(changes, nds));
}, []);

// Aplicar cambios de edges
const onEdgesChange = useCallback((changes) => {
  setEdges((eds) => applyEdgeChanges(changes, eds));
}, []);

// Añadir edge
const onConnect = useCallback((connection) => {
  setEdges((eds) => addEdge({ ...connection, animated: true }, eds));
}, []);
```

---

## 5. Limitaciones Identificadas

### Límites de Escala

| Aspecto | Límite aproximado | Notas |
|---------|-------------------|-------|
| Nodos renderizables | ~100-500 | Depende de complejidad del custom node |
| Performance óptima | <100 nodos | Con custom nodes complejos |
| Límite práctico | 1000+ nodos | Requiere virtualización o lazy loading |

**De la documentación oficial:**
> "React Flow is not intended to be used with 1000+ nodes/edges"

**Estrategias para escalar:**
- Usar `hidden: true` para nodos fuera del viewport
- Implementar virtualización personalizada
- Colapsar sub-árboles (`hidden` dinámico)
- Memoizar todos los componentes y callbacks
- Evitar acceder a `nodes`/`edges` completos en componentes

### Restricciones de Layout Automático

**No incluido nativamente:**
- React Flow NO incluye un motor de layout automático
- Debe integrarse con librerías externas

**Opciones de integración:**

| Librería | Node Sizes Dinámicas | Sub-flows | Edge Routing | Bundle Size |
|----------|---------------------|-----------|--------------|-------------|
| **Dagre** | Sí | Parcial | No | ~40KB |
| **ELK** | Sí | Sí | Sí | ~1.4MB |
| **d3-force** | Sí | No | No | ~16KB |
| **d3-hierarchy** | No | No | No | ~15KB |

### Qué NO puede hacer nativamente

| Limitación | Alternativa/Workaround |
|------------|------------------------|
| Layout automático | Integrar Dagre/ELK |
| Virtualización nativa | Implementar manualmente con `hidden` |
| Límite de conexiones por handle | Implementar con `isConnectable` + contador manual |
| Edge routing automático | Usar ELK o pathfinding manual |
| Animación de nodos entre posiciones | Usar librerías externas (framer-motion) |
| Clusters/grupos automáticos | Sub-flows con parentId |
| Soporte Canvas nativo | Usar React Flow sobre DOM o ir a Canvas puro |

### Dependencias y Bundle Size

**Tamaño del bundle (@xyflow/react):**
- Minified: **177.6 KB**
- Minified + Gzipped: **56.6 KB**
- Download time (Slow 3G): ~1.13s

**Dependencias directas:**
- `@xyflow/system` (42.7% del bundle)
- `d3-selection` (7.8%)
- `d3-transition` (7.0%)
- `d3-zoom` (5.1%)
- `d3-color`, `d3-interpolate`, `d3-drag`

**Consideraciones:**
- Es tree-shakeable (se pueden eliminar partes no usadas)
- Usa D3 para zoom/pan
- No tiene dependencias de React adicionales

---

## 6. Comparativa: React Flow vs Canvas API Nativo

### Cuándo usar React Flow

**Casos de uso ideales:**

| Escenario | Por qué React Flow |
|-----------|-------------------|
| Workflow editors | Drag & drop, conexiones, propiedades listas |
| Prototipos rápidos | Setup en minutos, funcionalidad completa |
| Formularios visuales | Integración nativa con inputs React |
| Diagramas interactivos | Eventos, tooltips, menús contextuales fáciles |
| Apps con UI compleja en nodos | Cualquier componente React funciona dentro del nodo |
| Equipos pequeños | Sin necesidad de experto en Canvas/graphics |
| MVP de node editor | Validar concepto sin invertir semanas |

**Pros:**
- ✅ Setup en minutos, API declarativa
- ✅ Cualquier componente React puede ser un nodo
- ✅ Integración perfecta con ecosistema React
- ✅ Eventos DOM nativos (onClick, onContextMenu, etc)
- ✅ Accesibilidad (keyboard navigation, ARIA)
- ✅ Estilizado con CSS/Tailwind fácilmente
- ✅ Plugins útiles incluidos (MiniMap, Controls)
- ✅ TypeScript first
- ✅ Comunidad activa y ejemplos abundantes

### Cuándo NO usar React Flow

**Casos donde Canvas API nativo es mejor:**

| Escenario | Por qué Canvas nativo |
|-----------|---------------------|
| 1000+ nodos | Performance superior con GPU acceleration |
| Renderizado pesado (imágenes, videos) | Canvas WebGL para texturas grandes |
| Animaciones complejas | 60fps garantizado con requestAnimationFrame |
| Juegos/gráficos interactivos | Control total sobre rendering loop |
| Exportación vectorial precisa | SVG/Canvas generado pixel-perfect |
| Necesidades de visualización científica | Librerías especializadas (three.js, etc) |
| Bundle size crítico (<50KB total) | Canvas es parte del browser |

**Contras de React Flow:**
- ❌ No escala bien a 1000+ elementos
- ❌ Re-renders frecuentes pueden ser costosos
- ❌ Bundle size significativo (~57KB gzipped)
- ❌ Dependencia de React (no funciona en otros frameworks sin adaptador)
- ❌ Layout automático requiere librerías externas
- ❌ Virtualización manual necesaria para grandes datasets

### Curva de Aprendizaje Comparada

| Aspecto | React Flow | Canvas API Nativo |
|---------|------------|-------------------|
| **Setup inicial** | 10 minutos | 1-2 días |
| **Nodo básico** | Componente React | Clase + métodos de dibujo |
| **Drag & drop** | Incluido | Implementar hit testing, events |
| **Zoom/pan** | Incluido | Implementar transform matrix |
| **Conexiones** | Incluido | Pathfinding, collision detection |
| **Eventos** | DOM nativos | Reimplementar todo desde cero |
| **Optimización** | useMemo/useCallback | Layering, culling, batching |
| **Customización** | Props y CSS | Shaders, rendering pipeline |

### Tabla Comparativa Completa

| Característica | React Flow | Canvas API Nativo |
|----------------|------------|-------------------|
| **Complejidad inicial** | Baja | Alta |
| **Flexibilidad** | Media | Total |
| **Performance** | Buena (<500 elementos) | Excelente (ilimitada) |
| **Bundle size** | ~57KB | ~0KB (nativo) |
| **Ecosistema React** | Excelente | Requiere integración |
| **Accesibilidad** | Buena | Manual |
| **Mobile/Touch** | Incluido | Implementar gestures |
| **Custom nodes UI** | Excelente | Limitada/Difícil |
| **Animaciones** | Mediante librerías externas | Nativo 60fps |
| **Exportación** | html2canvas/SVG | Nativo canvas.toDataURL |

---

## 7. Recursos

### Documentación Oficial

| Recurso | URL |
|---------|-----|
| Documentación | https://reactflow.dev/learn |
| API Reference | https://reactflow.dev/api-reference |
| Ejemplos | https://reactflow.dev/examples |
| Playground interactivo | https://play.reactflow.dev/ |
| UI Components | https://reactflow.dev/ui |
| Changelog | https://reactflow.dev/whats-new |

### GitHub

- **Repositorio principal:** https://github.com/xyflow/xyflow
- **Issues:** https://github.com/xyflow/xyflow/issues
- **Discussions:** https://github.com/xyflow/xyflow/discussions
- **Releases:** 369+ releases

### Comunidad y Soporte

| Canal | Enlace |
|-------|--------|
| Discord | https://discord.gg/RVmnytFmGW |
| Twitter/X | @xyflowdev |
| Bluesky | @xyflow.com |
| Blog xyflow | https://xyflow.com/blog |
| Email | info@xyflow.com |

### Librerías Relacionadas Recomendadas

| Librería | Uso |
|----------|-----|
| `@dagrejs/dagre` | Layout automático de grafos dirigidos |
| `elkjs` | Layout avanzado con edge routing |
| `d3-force` | Fuerzas físicas para layouts |
| `zustand` | State management (recomendado por docs) |
| `html-to-image` | Exportación a PNG/SVG |

### Proyectos Notables que usan React Flow

- **Stripe:** Workflow automation tools
- **Typeform:** Visual form builder
- **Linear:** Workflow views
- **Vercel:** Deployment pipelines
- **AI/ML tools:** LangFlow, Flowise

---

## 8. Recomendación Final

### Usar React Flow cuando:

1. **Prioridad es velocidad de desarrollo** - Necesitas un node editor funcional en días, no semanas
2. **UI compleja en nodos** - Formularios, botones, charts dentro de nodos
3. **Equipo con expertise React** - Sin desarrolladores especializados en Canvas/WebGL
4. **<500 nodos esperados** - La mayoría de workflows de negocio
5. **Integración con backend React** - Usas React Query, Zustand, etc
6. **MVP o validación** - Probar el concepto antes de invertir en solución custom

### Implementar con Canvas API nativo cuando:

1. **Rendimiento crítico con 1000+ elementos** - Visualizaciones de datos masivas
2. **Animaciones complejas requeridas** - Movimientos suaves, efectos visuales
3. **Bundle size extremadamente restrictivo** - <50KB total
4. **Experiencia gaming/interactiva** - Juegos, simulaciones físicas
5. **Exportación vectorial perfecta** - Diagramas técnicos de precisión
6. **Independencia de framework** - Necesitas usar en Vue, Angular, vanilla JS

### Híbrido recomendado:

Para aplicaciones que crecen, considera:
- **React Flow para edición:** Interfaz de usuario rica, WYSIWYG
- **Canvas para visualización:** Modo "readonly" con alto rendimiento para datasets grandes

---

> **Conclusión:** React Flow es la elección pragmática para la gran mayoría de aplicaciones node-based en React. Solo considera Canvas nativo si tienes requisitos de performance extremos o necesidades gráficas muy específicas que escapan del modelo DOM.
