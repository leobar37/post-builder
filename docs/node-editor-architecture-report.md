# Patrones Arquitectónicos para Node Editors

Reporte técnico detallado sobre la construcción de editores visuales basados en nodos.

---

## 1. Estructura de Datos para Grafos

### 1.1 Representación de Nodos

Un nodo en un editor visual típicamente contiene:

```typescript
interface Node {
  id: string;                    // Identificador único
  type: string;                  // Tipo de nodo (custom, default, input, output)
  position: { x: number; y: number };  // Posición en coordenadas del mundo
  data: Record<string, any>;     // Datos específicos del nodo
  width?: number;                // Dimensiones (opcional, para layout)
  height?: number;
  selected?: boolean;            // Estado de selección
  dragging?: boolean;            // Estado de drag
  parentId?: string;             // Para nodos anidados (sub-flows)
  zIndex?: number;               // Orden de renderizado
}
```

**Ejemplo real de React Flow:**
```typescript
const node = {
  id: '1',
  type: 'default',           // 'default' | 'input' | 'output' | custom
  position: { x: 0, y: 0 },
  data: { label: 'Node 1', color: '#ff0000' },
  style: { backgroundColor: '#fff' },
  targetPosition: 'left',    // Posición de handles de entrada
  sourcePosition: 'right',   // Posición de handles de salida
  parentId: 'group-1',       // Para sub-flows
  extent: 'parent',          // 'parent' | undefined
};
```

### 1.2 Representación de Conexiones (Edges)

```typescript
interface Edge {
  id: string;
  source: string;              // ID del nodo origen
  target: string;              // ID del nodo destino
  sourceHandle?: string;       // ID del puerto de salida (opcional)
  targetHandle?: string;       // ID del puerto de entrada (opcional)
  type?: string;               // 'default' | 'straight' | 'step' | 'smoothstep'
  data?: Record<string, any>;
  animated?: boolean;
  selected?: boolean;
  label?: string;
  markerStart?: string;        // ID de marcador SVG
  markerEnd?: string;
}
```

**Ejemplo de conexión completa:**
```typescript
const edge = {
  id: 'e1-2',
  source: '1',
  target: '2',
  sourceHandle: 'output-1',  // Puerto específico del source
  targetHandle: 'input-1',     // Puerto específico del target
  type: 'bezier',
  animated: true,
  data: { flowRate: 100 },
};
```

### 1.3 Ports/Handles: Modelado de Puntos de Conexión

Los handles/puertos pueden modelarse de dos formas:

**Opción A: Handles como parte del nodo (Godot/Unity style)**
```typescript
interface NodeWithSlots {
  id: string;
  slots: Array<{
    index: number;           // Índice del slot
    type: 'input' | 'output';
    dataType: string;        // 'number' | 'string' | 'image' | etc
    color: string;
    label?: string;
    enabled: boolean;
  }>;
}
```

**Opción B: Handles independientes (React Flow style)**
```typescript
interface Handle {
  id: string;
  nodeId: string;           // Referencia al nodo padre
  type: 'source' | 'target';
  position: 'left' | 'right' | 'top' | 'bottom';
  dataType: string;
  x: number;                // Posición calculada relativa al nodo
  y: number;
}
```

**Cálculo de posición de handles:**
```typescript
function getHandlePosition(
  nodePosition: { x: number, y: number },
  nodeDimensions: { width: number, height: number },
  handlePosition: 'left' | 'right' | 'top' | 'bottom',
  handleOffset: { x: number, y: number } = { x: 0, y: 0 }
): { x: number, y: number } {
  switch (handlePosition) {
    case 'left':
      return { x: nodePosition.x, y: nodePosition.y + nodeDimensions.height / 2 };
    case 'right':
      return { x: nodePosition.x + nodeDimensions.width, y: nodePosition.y + nodeDimensions.height / 2 };
    case 'top':
      return { x: nodePosition.x + nodeDimensions.width / 2, y: nodePosition.y };
    case 'bottom':
      return { x: nodePosition.x + nodeDimensions.width / 2, y: nodePosition.y + nodeDimensions.height };
  }
}
```

### 1.4 Grafo Dirigido vs No Dirigido

**Grafo Dirigido (DAG - Directed Acyclic Graph)**
- Usado en: Dataflow programming, shaders, workflow automation
- Características: Las conexiones tienen dirección (source → target)
- Algoritmos de layout: Dagre, ELK, d3-hierarchy
- Detección de ciclos necesaria para validación

```typescript
// Verificar si agregar una arista crearía un ciclo
function wouldCreateCycle(
  edges: Edge[],
  newEdge: { source: string, target: string }
): boolean {
  const adjacency = new Map<string, Set<string>>();

  // Construir lista de adyacencia
  edges.forEach(e => {
    if (!adjacency.has(e.source)) adjacency.set(e.source, new Set());
    adjacency.get(e.source)!.add(e.target);
  });

  // Verificar si target puede alcanzar source (usando DFS)
  const visited = new Set<string>();
  const stack = [newEdge.target];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === newEdge.source) return true;
    if (visited.has(current)) continue;
    visited.add(current);

    const neighbors = adjacency.get(current);
    if (neighbors) {
      neighbors.forEach(n => stack.push(n));
    }
  }
  return false;
}
```

**Grafo No Dirigido**
- Usado en: Diagramas de red, grafos de conocimiento
- Características: Las conexiones no tienen dirección inherente
- Permite ciclos sin restricciones

---

## 2. Sistema de Coordenadas

### 2.1 World Coordinates vs Screen Coordinates

```
Screen Space (CSS pixels)        World Space (canvas lógico)
┌─────────────────────────┐      ┌─────────────────────────┐
│  (0,0)         (800,0)  │      │  (-100,-50)    (300,-50)│
│     ┌─────────┐          │      │     ┌─────────┐         │
│     │  Node   │          │      │     │  Node   │         │
│     │  (100,  │          │      │     │(50, 100)│         │
│     │   100)  │          │      │     │         │         │
│     └─────────┘          │      │     └─────────┘         │
│  (0,600)       (800,600) │      │  (-100,350)  (300,350)  │
└─────────────────────────┘      └─────────────────────────┘

Transformación: world = (screen - pan) / zoom
```

### 2.2 Transformaciones: Pan (Traslación) y Zoom (Escala)

**Estructura del viewport:**
```typescript
interface Viewport {
  x: number;        // Traslación en X
  y: number;        // Traslación en Y
  zoom: number;     // Factor de escala (1 = 100%)
}
```

**Matriz de transformación:**
```typescript
interface TransformMatrix {
  scale: number;
  translateX: number;
  translateY: number;
}

function createTransformMatrix(viewport: Viewport): string {
  // CSS transform matrix: scale(zoom) translate(x, y)
  return `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;
}
```

**Transformación de punto:**
```typescript
// Screen → World
function screenToFlowPosition(
  screenPoint: { x: number, y: number },
  viewport: Viewport
): { x: number, y: number } {
  return {
    x: (screenPoint.x - viewport.x) / viewport.zoom,
    y: (screenPoint.y - viewport.y) / viewport.zoom,
  };
}

// World → Screen
function flowToScreenPosition(
  flowPoint: { x: number, y: number },
  viewport: Viewport
): { x: number, y: number } {
  return {
    x: flowPoint.x * viewport.zoom + viewport.x,
    y: flowPoint.y * viewport.zoom + viewport.y,
  };
}
```

### 2.3 Conversión Mouse Event → World Position

```typescript
function getMousePositionInWorld(
  event: MouseEvent,
  containerRef: HTMLElement,
  viewport: Viewport
): { x: number, y: number } {
  // Obtener bounds del contenedor
  const rect = containerRef.getBoundingClientRect();

  // Posición relativa al contenedor
  const screenX = event.clientX - rect.left;
  const screenY = event.clientY - rect.top;

  // Transformar a world coordinates
  return screenToFlowPosition({ x: screenX, y: screenY }, viewport);
}
```

### 2.4 Cálculo del Viewport Visible

```typescript
interface VisibleViewport {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function getVisibleViewport(
  containerWidth: number,
  containerHeight: number,
  viewport: Viewport
): VisibleViewport {
  const minX = -viewport.x / viewport.zoom;
  const minY = -viewport.y / viewport.zoom;
  const maxX = minX + containerWidth / viewport.zoom;
  const maxY = minY + containerHeight / viewport.zoom;

  return { minX, minY, maxX, maxY };
}

// Optimización: renderizado parcial
function isNodeVisible(
  node: Node,
  nodeWidth: number,
  nodeHeight: number,
  visibleViewport: VisibleViewport
): boolean {
  return (
    node.position.x < visibleViewport.maxX &&
    node.position.x + nodeWidth > visibleViewport.minX &&
    node.position.y < visibleViewport.maxY &&
    node.position.y + nodeHeight > visibleViewport.minY
  );
}
```

---

## 3. Layout y Posicionamiento

### 3.1 Layout Automático

**Dagre (Directed Graph Editor)**
```typescript
import dagre from '@dagrejs/dagre';

function layoutWithDagre(nodes: Node[], edges: Edge[], direction: 'TB' | 'LR' = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  // Configuración
  dagreGraph.setGraph({
    rankdir: direction,      // 'TB' (top-bottom) o 'LR' (left-right)
    nodesep: 50,             // Separación horizontal entre nodos
    ranksep: 100,            // Separación vertical entre niveles
    marginx: 20,
    marginy: 20,
  });

  // Agregar nodos
  nodes.forEach(node => {
    dagreGraph.setNode(node.id, {
      width: node.width || 150,
      height: node.height || 50,
    });
  });

  // Agregar aristas
  edges.forEach(edge => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Calcular layout
  dagre.layout(dagreGraph);

  // Extraer posiciones
  return nodes.map(node => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (node.width || 150) / 2,
        y: nodeWithPosition.y - (node.height || 50) / 2,
      },
    };
  });
}
```

**D3-Force (Physics-based)**
```typescript
import { forceSimulation, forceManyBody, forceLink, forceCenter } from 'd3-force';

function useForceLayout(nodes: Node[], edges: Edge[]) {
  const simulation = forceSimulation(nodes)
    .force('charge', forceManyBody().strength(-300))     // Repulsión entre nodos
    .force('link', forceLink(edges)
      .id((d: any) => d.id)
      .distance(100))                                     // Longitud deseada de aristas
    .force('center', forceCenter(width / 2, height / 2))  // Centrar en el canvas
    .force('collision', forceCollide().radius(d => Math.max(d.width, d.height) / 2));

  // Actualizar posiciones en cada tick
  simulation.on('tick', () => {
    updateNodePositions(nodes);  // Actualizar UI
  });

  return simulation;
}

// Fuerza de colisión para rectángulos (custom)
function forceCollideRect() {
  let nodes: Node[];
  const padding = 10;

  function force() {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const nodeA = nodes[i];
        const nodeB = nodes[j];

        // AABB collision detection
        const overlapX = Math.min(
          nodeA.position.x + nodeA.width! - nodeB.position.x,
          nodeB.position.x + nodeB.width! - nodeA.position.x
        );
        const overlapY = Math.min(
          nodeA.position.y + nodeA.height! - nodeB.position.y,
          nodeB.position.y + nodeA.height! - nodeA.position.y
        );

        if (overlapX > 0 && overlapY > 0) {
          // Separar nodos
          const dx = (nodeA.position.x + nodeA.width!/2) - (nodeB.position.x + nodeB.width!/2);
          const dy = (nodeA.position.y + nodeA.height!/2) - (nodeB.position.y + nodeB.height!/2);

          const moveX = overlapX * (dx > 0 ? 1 : -1) / 2;
          const moveY = overlapY * (dy > 0 ? 1 : -1) / 2;

          nodeA.position.x += moveX;
          nodeA.position.y += moveY;
          nodeB.position.x -= moveX;
          nodeB.position.y -= moveY;
        }
      }
    }
  }

  force.initialize = (_nodes: Node[]) => nodes = _nodes;
  return force;
}
```

### 3.2 Grid Snapping

```typescript
interface GridConfig {
  size: number;           // Tamaño de la celda (ej: 20px)
  enabled: boolean;
  snapToGrid: (position: { x: number, y: number }) => { x: number, y: number };
}

function snapToGrid(position: { x: number, y: number }, gridSize: number): { x: number, y: number } {
  return {
    x: Math.round(position.x / gridSize) * gridSize,
    y: Math.round(position.y / gridSize) * gridSize,
  };
}

// Versión con offset
function snapToGridWithOffset(
  position: { x: number, y: number },
  gridSize: number,
  offset: { x: number, y: number } = { x: 0, y: 0 }
): { x: number, y: number } {
  return {
    x: Math.round((position.x - offset.x) / gridSize) * gridSize + offset.x,
    y: Math.round((position.y - offset.y) / gridSize) * gridSize + offset.y,
  };
}

// Visualización del grid (SVG)
function GridBackground({ gridSize, viewport }: { gridSize: number, viewport: Viewport }) {
  const dotSize = 1;
  const dotColor = '#ddd';

  return (
    <svg className="grid-background" style={{ position: 'absolute', inset: 0 }}>
      <defs>
        <pattern
          id="grid"
          width={gridSize * viewport.zoom}
          height={gridSize * viewport.zoom}
          patternUnits="userSpaceOnUse"
          x={viewport.x % (gridSize * viewport.zoom)}
          y={viewport.y % (gridSize * viewport.zoom)}
        >
          <circle
            cx={gridSize * viewport.zoom / 2}
            cy={gridSize * viewport.zoom / 2}
            r={dotSize}
            fill={dotColor}
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}
```

### 3.3 Collision Detection

```typescript
// AABB (Axis-Aligned Bounding Box) collision
function checkNodeCollision(
  nodeA: Node,
  nodeB: Node,
  padding: number = 10
): boolean {
  const aLeft = nodeA.position.x - padding;
  const aRight = nodeA.position.x + (nodeA.width || 150) + padding;
  const aTop = nodeA.position.y - padding;
  const aBottom = nodeA.position.y + (nodeA.height || 50) + padding;

  const bLeft = nodeB.position.x - padding;
  const bRight = nodeB.position.x + (nodeB.width || 150) + padding;
  const bTop = nodeB.position.y - padding;
  const bBottom = nodeB.position.y + (nodeB.height || 50) + padding;

  return aLeft < bRight && aRight > bLeft && aTop < bBottom && aBottom > bTop;
}

// Resolver colisiones (empujar nodos superpuestos)
function resolveCollisions(nodes: Node[], padding: number = 10): Node[] {
  const resolved = [...nodes];
  const iterations = 5;  // Iteraciones para estabilidad

  for (let i = 0; i < iterations; i++) {
    for (let a = 0; a < resolved.length; a++) {
      for (let b = a + 1; b < resolved.length; b++) {
        if (checkNodeCollision(resolved[a], resolved[b], padding)) {
          const dx = (resolved[b].position.x + (resolved[b].width || 150) / 2) -
                     (resolved[a].position.x + (resolved[a].width || 150) / 2);
          const dy = (resolved[b].position.y + (resolved[b].height || 50) / 2) -
                     (resolved[a].position.y + (resolved[a].height || 50) / 2);

          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const overlap = padding * 2;

          const moveX = (dx / distance) * overlap;
          const moveY = (dy / distance) * overlap;

          resolved[a].position.x -= moveX / 2;
          resolved[a].position.y -= moveY / 2;
          resolved[b].position.x += moveX / 2;
          resolved[b].position.y += moveY / 2;
        }
      }
    }
  }

  return resolved;
}
```

---

## 4. Interacciones

### 4.1 Implementación de Drag & Drop

**Enfoque con Pointer Events (recomendado para cross-platform):**

```typescript
function useNodeDrag(nodeId: string) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const nodeStartPos = useRef({ x: 0, y: 0 });

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    setIsDragging(true);

    // Capturar el pointer para recibir eventos fuera del elemento
    (event.target as Element).setPointerCapture(event.pointerId);

    // Guardar posiciones iniciales
    dragStartPos.current = { x: event.clientX, y: event.clientY };
    nodeStartPos.current = getNodePosition(nodeId);  // Obtener del estado
  }, [nodeId]);

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaX = (event.clientX - dragStartPos.current.x) / viewport.zoom;
    const deltaY = (event.clientY - dragStartPos.current.y) / viewport.zoom;

    const newPosition = {
      x: nodeStartPos.current.x + deltaX,
      y: nodeStartPos.current.y + deltaY,
    };

    // Aplicar grid snapping si está habilitado
    const snappedPosition = snapToGridEnabled
      ? snapToGrid(newPosition, gridSize)
      : newPosition;

    updateNodePosition(nodeId, snappedPosition);
  }, [isDragging, nodeId, viewport.zoom]);

  const onPointerUp = useCallback((event: React.PointerEvent) => {
    setIsDragging(false);
    (event.target as Element).releasePointerCapture(event.pointerId);
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp, isDragging };
}
```

**Drag & Drop desde palette (sidebar):**
```typescript
function useDragFromPalette() {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = (event: React.DragEvent, containerRef: HTMLElement) => {
    event.preventDefault();

    const nodeType = event.dataTransfer.getData('application/reactflow');
    const rect = containerRef.getBoundingClientRect();

    const position = screenToFlowPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }, viewport);

    const newNode = {
      id: generateId(),
      type: nodeType,
      position,
      data: {},
    };

    addNode(newNode);
  };

  return { onDragStart, onDrop };
}
```

### 4.2 Selección Múltiple (Marquee Selection)

```typescript
function useMarqueeSelection() {
  const [selectionBox, setSelectionBox] = useState<{
    start: { x: number, y: number };
    end: { x: number, y: number };
    visible: boolean;
  }>({ start: { x: 0, y: 0 }, end: { x: 0, y: 0 }, visible: false });

  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);

  const onMouseDown = useCallback((event: React.MouseEvent) => {
    // Solo iniciar si es clic en el canvas (no en un nodo)
    if (event.target !== canvasRef.current) return;

    const pos = screenToFlowPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }, viewport);

    setSelectionBox({ start: pos, end: pos, visible: true });
  }, []);

  const onMouseMove = useCallback((event: React.MouseEvent) => {
    if (!selectionBox.visible) return;

    const pos = screenToFlowPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }, viewport);

    setSelectionBox(box => ({ ...box, end: pos }));
  }, [selectionBox.visible]);

  const onMouseUp = useCallback(() => {
    if (!selectionBox.visible) return;

    // Calcular nodos dentro del rectángulo
    const box = {
      minX: Math.min(selectionBox.start.x, selectionBox.end.x),
      maxX: Math.max(selectionBox.start.x, selectionBox.end.x),
      minY: Math.min(selectionBox.start.y, selectionBox.end.y),
      maxY: Math.max(selectionBox.start.y, selectionBox.end.y),
    };

    const selected = nodes.filter(node =>
      node.position.x >= box.minX &&
      node.position.x + (node.width || 150) <= box.maxX &&
      node.position.y >= box.minY &&
      node.position.y + (node.height || 50) <= box.maxY
    ).map(n => n.id);

    setSelectedNodes(selected);
    setSelectionBox(box => ({ ...box, visible: false }));
  }, [selectionBox, nodes]);

  return {
    selectionBox: selectionBox.visible ? selectionBox : null,
    selectedNodes,
    onMouseDown,
    onMouseMove,
    onMouseUp,
  };
}

// Componente visual de marquee
function MarqueeBox({ start, end }: { start: { x: number, y: number }, end: { x: number, y: number } }) {
  const rect = {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        backgroundColor: 'rgba(0, 123, 255, 0.1)',
        border: '1px solid rgba(0, 123, 255, 0.5)',
        pointerEvents: 'none',
      }}
    />
  );
}
```

### 4.3 Resize de Nodos

```typescript
function useNodeResize(nodeId: string, minWidth = 100, minHeight = 50) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);
  const startDimensions = useRef({ width: 0, height: 0, x: 0, y: 0 });
  const startMousePos = useRef({ x: 0, y: 0 });

  const handles = [
    { id: 'nw', cursor: 'nw-resize', x: 0, y: 0 },
    { id: 'ne', cursor: 'ne-resize', x: 100, y: 0 },
    { id: 'sw', cursor: 'sw-resize', x: 0, y: 100 },
    { id: 'se', cursor: 'se-resize', x: 100, y: 100 },
  ];

  const onResizeStart = useCallback((handleId: string, event: React.PointerEvent) => {
    setIsResizing(true);
    setResizeHandle(handleId);
    startMousePos.current = { x: event.clientX, y: event.clientY };

    const node = getNode(nodeId);
    startDimensions.current = {
      width: node.width || 150,
      height: node.height || 50,
      x: node.position.x,
      y: node.position.y,
    };

    (event.target as Element).setPointerCapture(event.pointerId);
  }, [nodeId]);

  const onResizeMove = useCallback((event: React.PointerEvent) => {
    if (!isResizing || !resizeHandle) return;

    const deltaX = (event.clientX - startMousePos.current.x) / viewport.zoom;
    const deltaY = (event.clientY - startMousePos.current.y) / viewport.zoom;

    let newWidth = startDimensions.current.width;
    let newHeight = startDimensions.current.height;
    let newX = startDimensions.current.x;
    let newY = startDimensions.current.y;

    // Ajustar según el handle
    if (resizeHandle.includes('e')) newWidth += deltaX;
    if (resizeHandle.includes('s')) newHeight += deltaY;
    if (resizeHandle.includes('w')) {
      newWidth -= deltaX;
      newX += deltaX;
    }
    if (resizeHandle.includes('n')) {
      newHeight -= deltaY;
      newY += deltaY;
    }

    // Aplicar límites mínimos
    if (newWidth >= minWidth && newHeight >= minHeight) {
      updateNode(nodeId, {
        width: newWidth,
        height: newHeight,
        position: { x: newX, y: newY },
      });
    }
  }, [isResizing, resizeHandle, nodeId]);

  const onResizeEnd = useCallback((event: React.PointerEvent) => {
    setIsResizing(false);
    setResizeHandle(null);
    (event.target as Element).releasePointerCapture(event.pointerId);
  }, []);

  return { handles, onResizeStart, onResizeMove, onResizeEnd, isResizing };
}
```

### 4.4 Creación de Conexiones

```typescript
function useConnection() {
  const [connectionStart, setConnectionStart] = useState<{
    nodeId: string;
    handleId: string;
    handleType: 'source' | 'target';
    x: number;
    y: number;
  } | null>(null);

  const [connectionEnd, setConnectionEnd] = useState<{ x: number, y: number } | null>(null);

  const onConnectionStart = useCallback((
    nodeId: string,
    handleId: string,
    handleType: 'source' | 'target',
    position: { x: number, y: number }
  ) => {
    setConnectionStart({ nodeId, handleId, handleType, ...position });
    setConnectionEnd(position);
  }, []);

  const onConnectionMove = useCallback((event: React.PointerEvent) => {
    if (!connectionStart) return;

    const pos = screenToFlowPosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    }, viewport);

    setConnectionEnd(pos);
  }, [connectionStart]);

  const onConnectionEnd = useCallback((
    targetNodeId: string,
    targetHandleId: string,
    targetHandleType: 'source' | 'target'
  ) => {
    if (!connectionStart) return;

    // Verificar compatibilidad
    if (connectionStart.handleType === targetHandleType) {
      // No conectar source→source o target→target
      resetConnection();
      return;
    }

    // Determinar source y target
    const edge: Edge = connectionStart.handleType === 'source'
      ? {
          id: generateId(),
          source: connectionStart.nodeId,
          sourceHandle: connectionStart.handleId,
          target: targetNodeId,
          targetHandle: targetHandleId,
        }
      : {
          id: generateId(),
          source: targetNodeId,
          sourceHandle: targetHandleId,
          target: connectionStart.nodeId,
          targetHandle: connectionStart.handleId,
        };

    // Validar (ej: no ciclos en DAG)
    if (validateConnection(edge)) {
      addEdge(edge);
    }

    resetConnection();
  }, [connectionStart]);

  const resetConnection = () => {
    setConnectionStart(null);
    setConnectionEnd(null);
  };

  return {
    connectionStart,
    connectionEnd,
    onConnectionStart,
    onConnectionMove,
    onConnectionEnd,
    resetConnection,
  };
}

// Visualización de conexión en progreso
function ConnectionLine({
  sourceX,
  sourceY,
  targetX,
  targetY,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}) {
  const [path] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  });

  return (
    <path
      d={path}
      stroke="#007bff"
      strokeWidth={2}
      fill="none"
      strokeDasharray="5,5"
    />
  );
}
```

---

## 5. Renderizado de Conexiones

### 5.1 Tipos de Curvas

**Bézier Curves (Default en React Flow):**
```typescript
// Cubic Bézier: M startX startY C cp1x cp1y, cp2x cp2y, endX endY
function getBezierPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Bottom,
  targetPosition = Position.Top,
  curvature = 0.25,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition?: Position;
  targetPosition?: Position;
  curvature?: number;
}): [string, number, number, number, number] {
  // Distancia horizontal entre puntos
  const distanceX = Math.abs(targetX - sourceX);

  // Calcular puntos de control basados en la dirección
  const cp1x = sourceX + (sourcePosition === Position.Right ? distanceX * curvature : -distanceX * curvature);
  const cp1y = sourceY;
  const cp2x = targetX + (targetPosition === Position.Left ? -distanceX * curvature : distanceX * curvature);
  const cp2y = targetY;

  const path = `M ${sourceX} ${sourceY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetX} ${targetY}`;

  // Calcular punto central para labels
  const centerX = 0.5 * (3 * cp1x + 3 * cp2x + sourceX + targetX) / 4;
  const centerY = 0.5 * (3 * cp1y + 3 * cp2y + sourceY + targetY) / 4;

  // Offset del path
  const offsetX = Math.abs(targetX - sourceX) / 2;
  const offsetY = Math.abs(targetY - sourceY) / 2;

  return [path, centerX, centerY, offsetX, offsetY];
}
```

**Straight Lines:**
```typescript
function getStraightPath({
  sourceX, sourceY, targetX, targetY
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
}): [string, number, number, number, number] {
  const path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;
  const offsetX = Math.abs(targetX - sourceX) / 2;
  const offsetY = Math.abs(targetY - sourceY) / 2;

  return [path, centerX, centerY, offsetX, offsetY];
}
```

**Step Lines (Orthogonal):**
```typescript
function getSmoothStepPath({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Bottom,
  targetPosition = Position.Top,
  borderRadius = 5,
}: {
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition?: Position;
  targetPosition?: Position;
  borderRadius?: number;
}): string {
  const isHorizontal = sourcePosition === Position.Left || sourcePosition === Position.Right;

  // Punto de control intermedio
  const midX = isHorizontal
    ? (sourceX + targetX) / 2
    : sourcePosition === Position.Right
      ? Math.max(sourceX, targetX) + 50
      : Math.min(sourceX, targetX) - 50;

  const midY = !isHorizontal
    ? (sourceY + targetY) / 2
    : sourcePosition === Position.Bottom
      ? Math.max(sourceY, targetY) + 50
      : Math.min(sourceY, targetY) - 50;

  // Construir path con esquinas redondeadas
  // ... (lógica de construcción de path con arcos)

  return `M ${sourceX} ${sourceY} L ${midX} ${midY} L ${targetX} ${targetY}`;
}
```

### 5.2 Cálculo de Puntos de Control

```typescript
// Versión mejorada con control de tensión
function calculateControlPoints(
  source: { x: number, y: number },
  target: { x: number, y: number },
  sourceDir: 'left' | 'right' | 'top' | 'bottom',
  targetDir: 'left' | 'right' | 'top' | 'bottom',
  tension: number = 0.5
): [number, number, number, number] {
  const deltaX = target.x - source.x;
  const deltaY = target.y - source.y;

  let cp1x = source.x;
  let cp1y = source.y;
  let cp2x = target.x;
  let cp2y = target.y;

  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY) * tension;

  switch (sourceDir) {
    case 'right':
      cp1x = source.x + distance;
      cp1y = source.y;
      break;
    case 'left':
      cp1x = source.x - distance;
      cp1y = source.y;
      break;
    case 'bottom':
      cp1x = source.x;
      cp1y = source.y + distance;
      break;
    case 'top':
      cp1x = source.x;
      cp1y = source.y - distance;
      break;
  }

  switch (targetDir) {
    case 'right':
      cp2x = target.x + distance;
      cp2y = target.y;
      break;
    case 'left':
      cp2x = target.x - distance;
      cp2y = target.y;
      break;
    case 'bottom':
      cp2x = target.x;
      cp2y = target.y + distance;
      break;
    case 'top':
      cp2x = target.x;
      cp2y = target.y - distance;
      break;
  }

  return [cp1x, cp1y, cp2x, cp2y];
}
```

### 5.3 Routing Automático

```typescript
// Evitar colisiones con nodos (algoritmo simplificado)
function routeEdgeAroundNodes(
  source: { x: number, y: number },
  target: { x: number, y: number },
  nodes: Node[],
  padding: number = 20
): Array<{ x: number, y: number }> {
  const waypoints: Array<{ x: number, y: number }> = [source];
  let current = source;

  // Check direct line intersection
  const intersectingNodes = nodes.filter(node =>
    lineIntersectsNode(source, target, node, padding)
  );

  if (intersectingNodes.length === 0) {
    return [source, target];
  }

  // Simple detour: go around the first intersecting node
  const obstacle = intersectingNodes[0];
  const obstacleCenter = {
    x: obstacle.position.x + (obstacle.width || 150) / 2,
    y: obstacle.position.y + (obstacle.height || 50) / 2,
  };

  // Decidir por dónde rodear (arriba o abajo)
  const goAbove = source.y < obstacleCenter.y;
  const detourY = goAbove
    ? obstacle.position.y - padding
    : obstacle.position.y + (obstacle.height || 50) + padding;

  waypoints.push({ x: source.x, y: detourY });
  waypoints.push({ x: target.x, y: detourY });
  waypoints.push(target);

  return waypoints;
}

// Convertir waypoints a path SVG con esquinas redondeadas
function waypointsToPath(waypoints: Array<{ x: number, y: number }>, radius: number = 10): string {
  if (waypoints.length < 2) return '';

  let path = `M ${waypoints[0].x} ${waypoints[0].y}`;

  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1];
    const curr = waypoints[i];
    const next = waypoints[i + 1];

    if (!next) {
      // Último segmento
      path += ` L ${curr.x} ${curr.y}`;
    } else {
      // Esquina redondeada
      const angle = Math.atan2(next.y - curr.y, next.x - curr.x) -
                    Math.atan2(curr.y - prev.y, curr.x - prev.x);

      // Calcular puntos de tangencia para el arco
      const r = Math.min(radius, Math.hypot(curr.x - prev.x, curr.y - prev.y) / 2);
      // ... (cálculo de arco)

      path += ` L ${curr.x} ${curr.y}`;
    }
  }

  return path;
}
```

### 5.4 Animated Connections (Flow Animation)

```typescript
// Animación de partículas fluyendo a través de la arista
function AnimatedEdge({ path, color = '#007bff', speed = 1 }: {
  path: string;
  color?: string;
  speed?: number;
}) {
  return (
    <g>
      {/* Línea base */}
      <path
        d={path}
        stroke={color}
        strokeWidth={2}
        fill="none"
        opacity={0.3}
      />

      {/* Línea animada */}
      <path
        d={path}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeDasharray="10 20"
        style={{
          animation: `flow ${2 / speed}s linear infinite`,
        }}
      />

      <style>{`
        @keyframes flow {
          from {
            stroke-dashoffset: 30;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </g>
  );
}

// Versión con gradiente animado
function GradientAnimatedEdge({ path }: { path: string }) {
  const gradientId = useId();

  return (
    <g>
      <defs>
        <linearGradient id={gradientId}>
          <stop offset="0%" stopColor="transparent">
            <animate
              attributeName="offset"
              from="0"
              to="1"
              dur="1s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="50%" stopColor="#007bff">
            <animate
              attributeName="offset"
              from="0.5"
              to="1.5"
              dur="1s"
              repeatCount="indefinite"
            />
          </stop>
          <stop offset="100%" stopColor="transparent">
            <animate
              attributeName="offset"
              from="1"
              to="2"
              dur="1s"
              repeatCount="indefinite"
            />
          </stop>
        </linearGradient>
      </defs>

      <path
        d={path}
        stroke={`url(#${gradientId})`}
        strokeWidth={3}
        fill="none"
      />
    </g>
  );
}
```

---

## 6. Estado

### 6.1 Estado Normalizado (Flat vs Nested)

**Estructura recomendada (estado flat):**
```typescript
// Estado normalizado (mejor para performance y actualizaciones)
interface NormalizedGraphState {
  // Entidades indexadas por ID
  nodes: Record<string, Node>;
  edges: Record<string, Edge>;

  // Arrays de IDs para orden/preservación
  nodeIds: string[];
  edgeIds: string[];

  // Estado UI separado
  ui: {
    selectedNodeIds: string[];
    selectedEdgeIds: string[];
    viewport: Viewport;
    connecting: {
      sourceNodeId: string | null;
      sourceHandleId: string | null;
      mousePosition: { x: number, y: number } | null;
    };
  };
}

// Helper para denormalizar cuando se necesita
function getNodesArray(state: NormalizedGraphState): Node[] {
  return state.nodeIds.map(id => state.nodes[id]).filter(Boolean);
}

function getEdgesArray(state: NormalizedGraphState): Edge[] {
  return state.edgeIds.map(id => state.edges[id]).filter(Boolean);
}
```

**Operaciones de actualización:**
```typescript
// Agregar nodo (inmutable)
function addNode(state: NormalizedGraphState, node: Node): NormalizedGraphState {
  return {
    ...state,
    nodes: { ...state.nodes, [node.id]: node },
    nodeIds: [...state.nodeIds, node.id],
  };
}

// Actualizar nodo (inmutable)
function updateNode(
  state: NormalizedGraphState,
  nodeId: string,
  updates: Partial<Node>
): NormalizedGraphState {
  const node = state.nodes[nodeId];
  if (!node) return state;

  return {
    ...state,
    nodes: {
      ...state.nodes,
      [nodeId]: { ...node, ...updates },
    },
  };
}

// Eliminar nodo y sus aristas conectadas
function removeNode(state: NormalizedGraphState, nodeId: string): NormalizedGraphState {
  const { [nodeId]: removed, ...remainingNodes } = state.nodes;

  // Encontrar aristas conectadas
  const connectedEdgeIds = state.edgeIds.filter(id => {
    const edge = state.edges[id];
    return edge.source === nodeId || edge.target === nodeId;
  });

  // Eliminar aristas
  const remainingEdges = { ...state.edges };
  connectedEdgeIds.forEach(id => delete remainingEdges[id]);

  return {
    ...state,
    nodes: remainingNodes,
    nodeIds: state.nodeIds.filter(id => id !== nodeId),
    edges: remainingEdges,
    edgeIds: state.edgeIds.filter(id => !connectedEdgeIds.includes(id)),
  };
}
```

### 6.2 Undo/Redo con Command Pattern

```typescript
// Comandos base
interface Command {
  type: string;
  execute(): void;
  undo(): void;
  redo?(): void;  // Opcional, default es execute
}

// Implementación de comandos específicos
class AddNodeCommand implements Command {
  type = 'ADD_NODE';
  private node: Node;
  private previousState: NormalizedGraphState;
  private store: GraphStore;

  constructor(node: Node, store: GraphStore) {
    this.node = node;
    this.store = store;
    this.previousState = store.getState();
  }

  execute(): void {
    this.store.setState(addNode(this.previousState, this.node));
  }

  undo(): void {
    this.store.setState(removeNode(this.previousState, this.node.id));
  }
}

class MoveNodeCommand implements Command {
  type = 'MOVE_NODE';
  private nodeId: string;
  private fromPosition: { x: number, y: number };
  private toPosition: { x: number, y: number };
  private store: GraphStore;

  constructor(
    nodeId: string,
    from: { x: number, y: number },
    to: { x: number, y: number },
    store: GraphStore
  ) {
    this.nodeId = nodeId;
    this.fromPosition = from;
    this.toPosition = to;
    this.store = store;
  }

  execute(): void {
    this.store.updateNode(this.nodeId, { position: this.toPosition });
  }

  undo(): void {
    this.store.updateNode(this.nodeId, { position: this.fromPosition });
  }
}

// Historial de comandos
class CommandHistory {
  private history: Command[] = [];
  private currentIndex: number = -1;
  private maxSize: number = 100;

  execute(command: Command): void {
    // Eliminar comandos "futuros" si estamos en medio del historial
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    command.execute();
    this.history.push(command);
    this.currentIndex++;

    // Limitar tamaño del historial
    if (this.history.length > this.maxSize) {
      this.history.shift();
      this.currentIndex--;
    }
  }

  undo(): void {
    if (this.currentIndex >= 0) {
      const command = this.history[this.currentIndex];
      command.undo();
      this.currentIndex--;
    }
  }

  redo(): void {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      const command = this.history[this.currentIndex];
      (command.redo || command.execute).call(command);
    }
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}

// Batch commands (para operaciones complejas)
class BatchCommand implements Command {
  type = 'BATCH';
  private commands: Command[];

  constructor(commands: Command[]) {
    this.commands = commands;
  }

  execute(): void {
    this.commands.forEach(cmd => cmd.execute());
  }

  undo(): void {
    // Undo en orden inverso
    [...this.commands].reverse().forEach(cmd => cmd.undo());
  }
}
```

### 6.3 Serialización a JSON

```typescript
interface SerializedGraph {
  version: string;
  nodes: Node[];
  edges: Edge[];
  viewport: Viewport;
  metadata?: {
    name?: string;
    created?: string;
    modified?: string;
  };
}

function serializeGraph(state: NormalizedGraphState): string {
  const serializable: SerializedGraph = {
    version: '1.0',
    nodes: getNodesArray(state),
    edges: getEdgesArray(state),
    viewport: state.ui.viewport,
    metadata: {
      modified: new Date().toISOString(),
    },
  };

  return JSON.stringify(serializable, null, 2);
}

function deserializeGraph(json: string): NormalizedGraphState {
  const parsed: SerializedGraph = JSON.parse(json);

  // Convertir a estado normalizado
  const nodes: Record<string, Node> = {};
  const nodeIds: string[] = [];

  parsed.nodes.forEach(node => {
    nodes[node.id] = node;
    nodeIds.push(node.id);
  });

  const edges: Record<string, Edge> = {};
  const edgeIds: string[] = [];

  parsed.edges.forEach(edge => {
    edges[edge.id] = edge;
    edgeIds.push(edge.id);
  });

  return {
    nodes,
    edges,
    nodeIds,
    edgeIds,
    ui: {
      selectedNodeIds: [],
      selectedEdgeIds: [],
      viewport: parsed.viewport || { x: 0, y: 0, zoom: 1 },
      connecting: { sourceNodeId: null, sourceHandleId: null, mousePosition: null },
    },
  };
}

// Validación de versión y migración
function migrateGraph(serialized: any): SerializedGraph {
  const version = serialized.version || '0.0';

  switch (version) {
    case '0.0':
      // Migrar de formato antiguo
      return {
        ...serialized,
        version: '1.0',
        nodes: serialized.nodes.map((n: any) => ({
          ...n,
          type: n.type || 'default',
        })),
      };
    case '1.0':
    default:
      return serialized;
  }
}
```

---

## 7. Desafíos Comunes

### 7.1 Z-Index y Orden de Renderizado

```typescript
// Estrategia de layering consistente
const Z_INDEX = {
  GRID: 0,           // Fondo del grid
  EDGES: 1,          // Conexiones
  NODES_DEFAULT: 2,  // Nodos normales
  NODES_SELECTED: 10,  // Nodos seleccionados (encima de normales)
  NODES_DRAGGING: 20, // Nodo siendo arrastrado (encima de todo)
  CONNECTION_LINE: 30, // Línea de conexión en progreso
  TOOLTIPS: 40,      // Tooltips y overlays
  CONTEXT_MENU: 50,  // Menú contextual
};

// Implementación en React Flow con estilos
function getNodeZIndex(node: Node, isSelected: boolean, isDragging: boolean): number {
  if (isDragging) return Z_INDEX.NODES_DRAGGING;
  if (isSelected) return Z_INDEX.NODES_SELECTED;
  return Z_INDEX.NODES_DEFAULT;
}

// Solución para nodos anidados (parent-child)
// Los hijos deben estar SIEMPRE encima de los padres
function getNestedZIndex(node: Node, allNodes: Node[]): number {
  let zIndex = Z_INDEX.NODES_DEFAULT;
  let current = node;

  // Subir el z-index según la profundidad en la jerarquía
  while (current.parentId) {
    zIndex += 5;  // Incremento por nivel
    current = allNodes.find(n => n.id === current.parentId)!;
  }

  return zIndex;
}

// CSS stacking context
const nodeStyles = {
  base: {
    position: 'absolute',
    zIndex: Z_INDEX.NODES_DEFAULT,
    transform: 'translate(var(--x), var(--y))',
  },
  selected: {
    zIndex: Z_INDEX.NODES_SELECTED,
    boxShadow: '0 0 0 2px #007bff',
  },
  dragging: {
    zIndex: Z_INDEX.NODES_DRAGGING,
    pointerEvents: 'none',  // Permite detectar elementos debajo
    opacity: 0.8,
  },
};
```

### 7.2 Nested Graphs (Grupos/Containers)

```typescript
interface NestedNode extends Node {
  parentId?: string;
  extent?: 'parent' | undefined;
  expandParent?: boolean;  // Expandir padre cuando el hijo crece
}

// Algoritmo de layout para sub-flows
function calculateSubFlowLayout(parentNode: Node, children: Node[]): Node[] {
  const padding = 20;
  const spacing = 10;

  // Layout simple: fila horizontal
  let currentX = padding;
  const centerY = (parentNode.height || 200) / 2;

  return children.map((child, index) => {
    const updated = {
      ...child,
      position: {
        x: currentX,
        y: centerY - (child.height || 50) / 2,
      },
      parentId: parentNode.id,
      extent: 'parent' as const,
    };

    currentX += (child.width || 150) + spacing;
    return updated;
  });
}

// Actualizar tamaño del padre basado en hijos
function expandParentToFitChildren(
  parentNode: Node,
  children: Node[],
  padding: number = 20
): Node {
  const bounds = calculateChildrenBounds(children);

  return {
    ...parentNode,
    width: Math.max(parentNode.width || 200, bounds.width + padding * 2),
    height: Math.max(parentNode.height || 200, bounds.height + padding * 2),
  };
}

// Colapsar/Expandir grupo
function toggleGroupCollapsed(
  groupNode: Node,
  children: Node[],
  collapsed: boolean
): { groupNode: Node, children: Node[] } {
  if (collapsed) {
    // Ocultar hijos y reducir tamaño del grupo
    return {
      groupNode: {
        ...groupNode,
        style: { ...groupNode.style, width: 50, height: 50 },
        data: { ...groupNode.data, collapsed: true },
      },
      children: children.map(c => ({ ...c, hidden: true })),
    };
  } else {
    // Restaurar tamaño y mostrar hijos
    const expandedWidth = 400;  // Calcular basado en contenido
    const expandedHeight = 300;

    return {
      groupNode: {
        ...groupNode,
        width: expandedWidth,
        height: expandedHeight,
        data: { ...groupNode.data, collapsed: false },
      },
      children: children.map(c => ({ ...c, hidden: false })),
    };
  }
}
```

### 7.3 Performance con 100+ Nodos

**Estrategias de optimización:**

```typescript
// 1. Virtualización - solo renderizar nodos visibles
function useVisibleNodes(nodes: Node[], viewport: Viewport, containerSize: { width: number, height: number }) {
  const visibleViewport = useMemo(() =>
    getVisibleViewport(containerSize.width, containerSize.height, viewport),
    [containerSize, viewport]
  );

  return useMemo(() =>
    nodes.filter(node => isNodeVisible(node, 150, 50, visibleViewport)),
    [nodes, visibleViewport]
  );
}

// 2. Memoización de componentes
const NodeComponent = React.memo(function NodeComponent({ node, ...props }: NodeProps) {
  // Solo re-renderiza si las props relevantes cambian
  return (
    <div style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)` }}>
      {/* Contenido del nodo */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada
  return (
    prevProps.node.position.x === nextProps.node.position.x &&
    prevProps.node.position.y === nextProps.node.position.y &&
    prevProps.node.selected === nextProps.node.selected &&
    shallowEqual(prevProps.node.data, nextProps.node.data)
  );
});

// 3. Canvas para renderizado masivo (alternativa a DOM)
function useCanvasRenderer(nodes: Node[], edges: Edge[], viewport: Viewport) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;

    // Limpiar
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Aplicar transformación del viewport
    ctx.save();
    ctx.translate(viewport.x, viewport.y);
    ctx.scale(viewport.zoom, viewport.zoom);

    // Renderizar aristas (líneas simples)
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2 / viewport.zoom;
    edges.forEach(edge => {
      const source = nodes.find(n => n.id === edge.source);
      const target = nodes.find(n => n.id === edge.target);
      if (!source || !target) return;

      ctx.beginPath();
      ctx.moveTo(source.position.x, source.position.y);
      ctx.lineTo(target.position.x, target.position.y);
      ctx.stroke();
    });

    // Renderizar nodos (rectángulos simples)
    nodes.forEach(node => {
      ctx.fillStyle = node.selected ? '#007bff' : '#fff';
      ctx.fillRect(node.position.x, node.position.y, 150, 50);
      ctx.strokeStyle = '#ccc';
      ctx.strokeRect(node.position.x, node.position.y, 150, 50);
    });

    ctx.restore();
  }, [nodes, edges, viewport]);

  return canvasRef;
}

// 4. Level-of-Detail (LOD) rendering
function getNodeLOD(zoom: number): 'full' | 'simplified' | 'minimal' {
  if (zoom > 0.5) return 'full';
  if (zoom > 0.2) return 'simplified';
  return 'minimal';
}

function NodeWithLOD({ node, zoom }: { node: Node, zoom: number }) {
  const lod = getNodeLOD(zoom);

  switch (lod) {
    case 'full':
      return <FullNode node={node} />;
    case 'simplified':
      return <SimplifiedNode node={node} />;  // Sin controles interactivos
    case 'minimal':
      return <MinimalNode node={node} />;      // Solo rectángulo coloreado
  }
}

// 5. Web Workers para layout pesado
function useWorkerLayout(nodes: Node[], edges: Edge[]) {
  const [layoutedNodes, setLayoutedNodes] = useState(nodes);
  const workerRef = useRef<Worker>();

  useEffect(() => {
    // Crear worker inline
    const workerCode = `
      self.onmessage = (e) => {
        const { nodes, edges } = e.data;
        // Ejecutar algoritmo de layout (dagre, etc.)
        const result = calculateLayout(nodes, edges);
        self.postMessage(result);
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    workerRef.current = new Worker(URL.createObjectURL(blob));

    workerRef.current.onmessage = (e) => {
      setLayoutedNodes(e.data);
    };

    return () => workerRef.current?.terminate();
  }, []);

  const triggerLayout = useCallback(() => {
    workerRef.current?.postMessage({ nodes, edges });
  }, [nodes, edges]);

  return { layoutedNodes, triggerLayout };
}

// 6. Debounce/throttle de actualizaciones
function useDebouncedNodeUpdates(updateFn: (nodes: Node[]) => void, delay: number = 100) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback((nodes: Node[]) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => updateFn(nodes), delay);
  }, [updateFn, delay]);
}
```

### 7.4 Otros Desafíos y Soluciones

**Accesibilidad (A11y):**
```typescript
// Navegación por teclado
const keyboardHandlers = {
  ArrowUp: (selectedNodes, nodes) => selectNodeAbove(selectedNodes[0], nodes),
  ArrowDown: (selectedNodes, nodes) => selectNodeBelow(selectedNodes[0], nodes),
  ArrowLeft: (selectedNodes, nodes) => selectNodeLeft(selectedNodes[0], nodes),
  ArrowRight: (selectedNodes, nodes) => selectNodeRight(selectedNodes[0], nodes),
  Delete: (selectedNodes, deleteNodes) => deleteNodes(selectedNodes),
  Tab: (selectedNodes, nodes) => cycleToNextNode(selectedNodes[0], nodes),
};
```

**Touch/Mobile:**
```typescript
// Soporte para gestos táctiles
function useTouchGestures() {
  const [pinchDistance, setPinchDistance] = useState(0);
  const [initialZoom, setInitialZoom] = useState(1);

  const onTouchStart = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch to zoom
      const distance = getTouchDistance(e.touches);
      setPinchDistance(distance);
      setInitialZoom(viewport.zoom);
    }
  };

  const onTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const scale = distance / pinchDistance;
      setViewport(prev => ({ ...prev, zoom: initialZoom * scale }));
    }
  };

  return { onTouchStart, onTouchMove };
}
```

---

## Conclusiones

### Qué es más difícil de implementar desde cero

| Dificultad | Aspecto | Razón |
|------------|---------|-------|
| **ALTA** | Edge routing automático | Requiere algoritmos complejos de pathfinding para evitar colisiones |
| **ALTA** | Undo/Redo performante | Necesita capturar estado inmutable sin degradar performance |
| **MEDIA-ALTA** | Layout automático | Integrar bibliotecas externas (dagre, d3-force) con sincronización de estado |
| **MEDIA** | Sistema de coordenadas | Transformaciones correctas entre screen/world con zoom y pan |
| **MEDIA** | Drag & Drop smooth | Pointer events, snapping, colisiones en tiempo real |
| **MEDIA** | Nested graphs | Z-index correcto, expansión/colapso, layout recursivo |
| **BAJA** | Bézier curves | Fórmulas matemáticas bien documentadas |
| **BAJA** | Selección múltiple | Intersectar rectángulos es computacionalmente simple |

### Recomendaciones para implementación

1. **Usar bibliotecas existentes para layout**: Dagre para DAGs, d3-force para física
2. **Estado normalizado desde el inicio**: Evita problemas de sincronización más adelante
3. **Command pattern para undo/redo**: Permite batching y history compleja
4. **Canvas para >100 nodos**: DOM no escala bien para grandes volúmenes
5. **Pointer events en lugar de mouse events**: Mejor soporte touch y más consistente
6. **Memoización agresiva**: React.memo, useMemo para nodos y aristas
7. **Viewport culling**: No renderizar lo que no se ve

### Bibliotecas recomendadas

| Biblioteca | Propósito | Bundle Size |
|------------|-----------|-------------|
| `@xyflow/react` | Node editor completo | ~80KB |
| `@dagrejs/dagre` | Layout de grafos dirigidos | ~40KB |
| `d3-force` | Layout físico/force-directed | ~15KB |
| `elkjs` | Layout avanzado (edge routing) | ~1.4MB |
| `zustand` | State management | ~3KB |

---

**Referencias consultadas:**
- React Flow documentation (https://reactflow.dev)
- Dagre documentation (https://github.com/dagrejs/dagre)
- D3-Force documentation (https://d3js.org/d3-force)
- Godot GraphNode API (https://docs.godotengine.org)
- ELK Graph Data Structure (https://eclipse.dev/elk)
