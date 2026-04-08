# Canvas API Nativa de JavaScript e Integración con React

## Reporte Técnico Detallado

**Fecha**: 2026-04-07  
**Propósito**: Investigación para proyecto de Node Editor

---

## 1. Canvas 2D Context API Básico

### 1.1 Obtención del Contexto 2D

```javascript
// Obtener el elemento canvas
const canvas = document.getElementById('myCanvas');

// Obtener contexto 2D (con opciones de optimización)
const ctx = canvas.getContext('2d', {
  alpha: false,          // Desactivar transparencia para mejor performance
  desynchronized: true   // Reducir latencia (Chrome/Edge)
});
```

### 1.2 Dibujo de Formas Básicas

#### Rectángulos
```javascript
// Dibujar rectángulo relleno
ctx.fillStyle = '#3498db';
ctx.fillRect(x, y, width, height);

// Dibujar borde de rectángulo
ctx.strokeStyle = '#2c3e50';
ctx.lineWidth = 2;
ctx.strokeRect(x, y, width, height);

// Limpiar área
ctx.clearRect(x, y, width, height);
```

#### Círculos y Arcos
```javascript
// Dibujar círculo completo
ctx.beginPath();
ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
ctx.fillStyle = '#e74c3c';
ctx.fill();
ctx.stroke();

// Arco parcial (ángulos en radianes)
ctx.beginPath();
ctx.arc(x, y, radius, startAngle, endAngle, counterclockwise);
ctx.stroke();
```

#### Paths Personalizados
```javascript
// Path complejo con líneas y curvas
ctx.beginPath();
ctx.moveTo(startX, startY);                    // Mover sin dibujar
ctx.lineTo(endX, endY);                        // Línea recta
ctx.quadraticCurveTo(cpX, cpY, endX, endY);    // Curva Bézier cuadrática
ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, endX, endY);  // Curva cúbica
ctx.closePath();
ctx.fill();
ctx.stroke();

// Usar Path2D para paths reutilizables
const path = new Path2D();
path.moveTo(0, 0);
path.lineTo(100, 100);
path.rect(50, 50, 100, 100);
ctx.stroke(path);
```

### 1.3 Dibujo de Texto

```javascript
// Configurar fuentes
ctx.font = 'bold 16px Sora, sans-serif';
ctx.textAlign = 'center';      // 'left', 'right', 'center', 'start', 'end'
ctx.textBaseline = 'middle';     // 'top', 'hanging', 'middle', 'alphabetic', 'bottom'

// Dibujar texto
ctx.fillStyle = '#2D3C53';
ctx.fillText('Hola Mundo', x, y);

// Dibujar contorno de texto
ctx.strokeStyle = '#F57E24';
ctx.lineWidth = 1;
ctx.strokeText('Hola Mundo', x, y);

// Medir texto antes de dibujar
const metrics = ctx.measureText('Hola Mundo');
const width = metrics.width;
const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
```

### 1.4 Carga y Dibujo de Imágenes

```javascript
// Cargar imagen
const img = new Image();
img.src = 'ruta/imagen.png';
img.onload = () => {
  // Dibujar imagen completa
  ctx.drawImage(img, x, y);

  // Dibujar recorte de imagen
  ctx.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

  // Escalar al dibujar
  ctx.drawImage(img, x, y, targetWidth, targetHeight);
};

// Crear patrón con imagen
img.onload = () => {
  const pattern = ctx.createPattern(img, 'repeat'); // 'repeat-x', 'repeat-y', 'no-repeat'
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
};
```

### 1.5 Estilos Avanzados

#### Gradients
```javascript
// Gradiente lineal
const linearGradient = ctx.createLinearGradient(x0, y0, x1, y1);
linearGradient.addColorStop(0, '#F57E24');
linearGradient.addColorStop(0.5, '#FF9800');
linearGradient.addColorStop(1, '#FFB74D');
ctx.fillStyle = linearGradient;
ctx.fillRect(0, 0, 200, 100);

// Gradiente radial
const radialGradient = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
radialGradient.addColorStop(0, 'rgba(245, 126, 36, 1)');
radialGradient.addColorStop(1, 'rgba(245, 126, 36, 0)');
ctx.fillStyle = radialGradient;
ctx.beginPath();
ctx.arc(100, 100, 50, 0, 2 * Math.PI);
ctx.fill();
```

#### Sombras
```javascript
ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
ctx.shadowBlur = 10;
ctx.shadowOffsetX = 4;
ctx.shadowOffsetY = 4;
ctx.fillRect(50, 50, 100, 100);

// Resetear sombras después de usar
ctx.shadowColor = 'transparent';
ctx.shadowBlur = 0;
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 0;
```

#### Opacidad y Composición
```javascript
// Global alpha (afecta todo lo dibujado)
ctx.globalAlpha = 0.5;
ctx.fillRect(0, 0, 100, 100);
ctx.globalAlpha = 1.0; // Reset

// Modos de composición
ctx.globalCompositeOperation = 'source-over';  // Default: dibujar encima
ctx.globalCompositeOperation = 'destination-out'; // Borrar donde se dibuja
ctx.globalCompositeOperation = 'multiply';   // Modos de mezcla
```

---

## 2. Integración con React

### 2.1 Patrón Básico: useRef + useEffect

```typescript
import { useRef, useEffect } from 'react';

export function CanvasComponent() {
  // Ref tipado para acceso al elemento canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Obtener contexto 2D
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Lógica de dibujo
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#3498db';
    ctx.fillRect(10, 10, 100, 100);

    // Cleanup opcional (raramente necesario para canvas 2D)
    return () => {
      // Cancelar animaciones o limpiar recursos si es necesario
    };
  }, []); // Array vacío = solo al montar

  return <canvas ref={canvasRef} width={800} height={600} />;
}
```

### 2.2 Patrón Recomendado: Custom Hook

```typescript
// hooks/useCanvas.ts
import { useRef, useEffect, useCallback } from 'react';

interface UseCanvasOptions {
  width: number;
  height: number;
  onDraw: (ctx: CanvasRenderingContext2D, frame: number) => void;
  animate?: boolean;
}

export function useCanvas({ width, height, onDraw, animate = false }: UseCanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const rafRef = useRef<number>();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    onDraw(ctx, frameRef.current++);

    if (animate) {
      rafRef.current = requestAnimationFrame(draw);
    }
  }, [onDraw, animate]);

  useEffect(() => {
    draw();

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [draw]);

  // Exponer método para forzar redraw
  const redraw = useCallback(() => {
    if (!animate) {
      draw();
    }
  }, [draw, animate]);

  return { canvasRef, redraw };
}

// Uso
function NodeCanvas({ nodes }) {
  const { canvasRef, redraw } = useCanvas({
    width: 800,
    height: 600,
    onDraw: (ctx) => {
      ctx.clearRect(0, 0, 800, 600);

      // Dibujar conexiones
      nodes.forEach(node => {
        ctx.fillStyle = node.color;
        ctx.fillRect(node.x, node.y, node.width, node.height);
      });
    }
  });

  return <canvas ref={canvasRef} width={800} height={600} />;
}
```

### 2.3 Sincronización Estado React <-> Canvas

```typescript
import { useRef, useEffect, useState, useCallback } from 'react';

interface Node {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

export function NodeEditor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]); // Estado mutable para el canvas
  const [selectedNode, setSelectedNode] = useState<string | null>(null); // Estado React

  // Sincronizar: Estado React -> Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Función de renderizado
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      nodesRef.current.forEach(node => {
        // Dibujar nodo
        ctx.fillStyle = node.id === selectedNode ? '#3498db' : node.color;
        ctx.fillRect(node.x, node.y, node.width, node.height);

        // Borde si está seleccionado
        if (node.id === selectedNode) {
          ctx.strokeStyle = '#F57E24';
          ctx.lineWidth = 2;
          ctx.strokeRect(node.x, node.y, node.width, node.height);
        }
      });
    };

    render();
  }, [selectedNode]); // Re-render cuando cambia selección

  // Handler de click (Canvas -> Estado React)
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Hit testing
    const clickedNode = nodesRef.current.find(node =>
      x >= node.x &&
      x <= node.x + node.width &&
      y >= node.y &&
      y <= node.y + node.height
    );

    setSelectedNode(clickedNode?.id ?? null);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      onClick={handleCanvasClick}
    />
  );
}
```

### 2.4 Prevención de Re-renders Innecesarios

```typescript
import { useRef, useEffect, memo } from 'react';

// Estrategia 1: Separar componente canvas del resto de UI
const CanvasLayer = memo(({ onDraw, width, height }: CanvasLayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    onDraw(ctx);
  }, [onDraw]);

  return <canvas ref={canvasRef} width={width} height={height} />;
});

// Estrategia 2: Usar useRef para datos que no necesitan trigger re-render
function SmartNodeEditor() {
  const nodesRef = useRef<Node[]>([]);
  const connectionsRef = useRef<Connection[]>([]);
  const selectedIdRef = useRef<string | null>(null);

  // Estado React SOLO para UI controls
  const [uiState, setUiState] = useState({ tool: 'select', zoom: 1 });

  // Función de dibujo referenciada estable
  const drawFrame = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Usar refs para lectura (no causa re-render)
    connectionsRef.current.forEach(conn => drawConnection(ctx, conn));
    nodesRef.current.forEach(node => {
      const isSelected = node.id === selectedIdRef.current;
      drawNode(ctx, node, isSelected);
    });
  }, []);

  // El canvas solo recibe la función de dibujo
  return (
    <div>
      <CanvasLayer onDraw={drawFrame} width={800} height={600} />
      <Toolbar
        tool={uiState.tool}
        onToolChange={(tool) => setUiState(s => ({ ...s, tool }))}
      />
    </div>
  );
}
```

---

## 3. Eventos en Canvas

### 3.1 Manejo de Eventos Básicos

```typescript
function InteractiveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  // Calcular coordenadas relativas al canvas
  const getCanvasCoordinates = (e: MouseEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pos = getCanvasCoordinates(e);
    isDraggingRef.current = true;
    lastPosRef.current = pos;

    // Hit testing aquí
    const clickedElement = findElementAt(pos.x, pos.y);
    if (clickedElement) {
      selectElement(clickedElement);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const pos = getCanvasCoordinates(e);
    const dx = pos.x - lastPosRef.current.x;
    const dy = pos.y - lastPosRef.current.y;

    // Actualizar posición del elemento arrastrado
    updateSelectedPosition(dx, dy);
    lastPosRef.current = pos;

    // Solicitar redraw
    requestRedraw();
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
}
```

### 3.2 Hit Testing (Detección de Elementos)

```typescript
// Método 1: Bounding boxes (más rápido)
interface Element {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function hitTestBoundingBox(x: number, y: number, elements: Element[]): Element | null {
  // Iterar al revés para detectar elementos superiores primero
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i];
    if (
      x >= el.x &&
      x <= el.x + el.width &&
      y >= el.y &&
      y <= el.y + el.height
    ) {
      return el;
    }
  }
  return null;
}

// Método 2: Path2D con isPointInPath (para formas complejas)
function hitTestPath(x: number, y: number, ctx: CanvasRenderingContext2D, paths: Path2D[]): boolean {
  for (const path of paths) {
    if (ctx.isPointInPath(path, x, y)) {
      return true;
    }
    // También detectar borde
    if (ctx.isPointInStroke(path, x, y)) {
      return true;
    }
  }
  return false;
}

// Método 3: Canvas de hit invisible (para escenas complejas)
class HitTester {
  private hitCanvas: HTMLCanvasElement;
  private hitCtx: CanvasRenderingContext2D;
  private elementMap: Map<string, string> = new Map(); // color -> id

  constructor(width: number, height: number) {
    this.hitCanvas = document.createElement('canvas');
    this.hitCanvas.width = width;
    this.hitCanvas.height = height;
    this.hitCtx = this.hitCanvas.getContext('2d', { willReadFrequently: true })!;
  }

  registerElement(id: string, drawFn: (ctx: CanvasRenderingContext2D, color: string) => void) {
    // Generar color único
    const color = this.generateUniqueColor();
    this.elementMap.set(color, id);

    // Dibujar en canvas de hit
    this.hitCtx.save();
    drawFn(this.hitCtx, color);
    this.hitCtx.restore();
  }

  getElementAt(x: number, y: number): string | null {
    const pixel = this.hitCtx.getImageData(x, y, 1, 1).data;
    const color = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;
    return this.elementMap.get(color) ?? null;
  }

  private generateUniqueColor(): string {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    return `rgb(${r}, ${g}, ${b})`;
  }
}
```

### 3.3 Drag and Drop Completo

```typescript
interface DraggableNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function useDraggableCanvas(nodes: DraggableNode[]) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    isDragging: false,
    dragNodeId: null as string | null,
    dragOffsetX: 0,
    dragOffsetY: 0,
    nodes: nodes
  });

  // Actualizar ref cuando cambian props
  useEffect(() => {
    stateRef.current.nodes = nodes;
  }, [nodes]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Encontrar nodo bajo el cursor
    const node = [...stateRef.current.nodes]
      .reverse()
      .find(n => x >= n.x && x <= n.x + n.width && y >= n.y && y <= n.y + n.height);

    if (node) {
      stateRef.current.isDragging = true;
      stateRef.current.dragNodeId = node.id;
      stateRef.current.dragOffsetX = x - node.x;
      stateRef.current.dragOffsetY = y - node.y;

      // Capturar pointer para seguir fuera del canvas
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const state = stateRef.current;
    if (!state.isDragging || !state.dragNodeId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - state.dragOffsetX;
    const y = e.clientY - rect.top - state.dragOffsetY;

    // Actualizar posición del nodo
    const nodeIndex = state.nodes.findIndex(n => n.id === state.dragNodeId);
    if (nodeIndex >= 0) {
      state.nodes[nodeIndex].x = x;
      state.nodes[nodeIndex].y = y;
      onNodesChange?.([...state.nodes]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(e.pointerId);
    }
    stateRef.current.isDragging = false;
    stateRef.current.dragNodeId = null;
  };

  return {
    canvasRef,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp
    }
  };
}
```

---

## 4. High-DPI / Retina Displays

### 4.1 El Problema

Por defecto, un canvas de 300x150 píxeles CSS se renderiza a 300x150 píxeles reales. En pantallas Retina (devicePixelRatio = 2 o 3), esto produce imágenes borrosas porque un píxel CSS se mapea a múltiples píxeles físicos sin aprovechar la densidad extra.

### 4.2 Solución: Escalado con devicePixelRatio

```typescript
function setupHighDPICanvas(
  canvas: HTMLCanvasElement,
  cssWidth: number,
  cssHeight: number
): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;

  // 1. Configurar tamaño interno (píxeles reales)
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;

  // 2. Configurar tamaño CSS (píxeles lógicos)
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  // 3. Escalar contexto para que las coordenadas sean en píxeles CSS
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpr, dpr);

  return ctx;
}

// Uso en React
function HighDPICanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = setupHighDPICanvas(canvas, 800, 600);

    // Ahora todas las coordenadas son en píxeles CSS
    ctx.fillRect(10, 10, 100, 100); // Se verá nítido en Retina
  }, []);

  return <canvas ref={canvasRef} />;
}
```

### 4.3 Hook Completo para High-DPI

```typescript
import { useRef, useEffect, useCallback } from 'react';

interface UseHighDPICanvasOptions {
  width: number;
  height: number;
  onDraw: (ctx: CanvasRenderingContext2D, dpr: number) => void;
}

export function useHighDPICanvas({ width, height, onDraw }: UseHighDPICanvasOptions) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dprRef = useRef(1);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const dpr = window.devicePixelRatio || 1;
    dprRef.current = dpr;

    // Tamaño interno en píxeles reales
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Tamaño CSS
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(dpr, dpr);
    return ctx;
  }, [width, height]);

  useEffect(() => {
    const ctx = setupCanvas();
    if (!ctx) return;

    onDraw(ctx, dprRef.current);

    // Manejar cambios de zoom/dpr
    const handleDprChange = () => {
      const newDpr = window.devicePixelRatio;
      if (newDpr !== dprRef.current) {
        const newCtx = setupCanvas();
        if (newCtx) {
          onDraw(newCtx, newDpr);
        }
      }
    };

    window.addEventListener('resize', handleDprChange);
    return () => window.removeEventListener('resize', handleDprChange);
  }, [onDraw, setupCanvas]);

  return canvasRef;
}
```

### 4.4 Consideraciones para DPR Fraccionario

```typescript
function getOptimalDPR(): number {
  const dpr = window.devicePixelRatio || 1;

  // En algunos casos, DPR fraccionarios (ej: 1.5, 2.25) pueden causar
  // problemas de sub-pixel rendering. Opcionalmente limitar a enteros:
  return Math.min(Math.floor(dpr), 3); // Max 3x para performance
}

// Para líneas nítidas en DPR fraccionario
function drawCrispLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
  // Ajustar a coordenadas de medio píxel para líneas de 1px nítidas
  const dpr = window.devicePixelRatio || 1;

  ctx.beginPath();
  if (dpr === 1) {
    ctx.moveTo(x1 + 0.5, y1 + 0.5);
    ctx.lineTo(x2 + 0.5, y2 + 0.5);
  } else {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
}
```

---

## 5. Performance

### 5.1 RequestAnimationFrame

```typescript
function useCanvasAnimation(onFrame: (ctx: CanvasRenderingContext2D, deltaTime: number) => void) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>();
  const lastTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      onFrame(ctx, deltaTime);

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [onFrame]);

  return canvasRef;
}

// Uso con throttling si es necesario
function NodeEditorWithAnimation() {
  const nodesRef = useRef<Node[]>([]);

  const canvasRef = useCanvasAnimation((ctx, deltaTime) => {
    // Limpiar
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Dibujar conexiones con animación
    nodesRef.current.forEach((node, i) => {
      // Animación de pulso basada en tiempo
      const pulse = Math.sin(Date.now() / 200) * 0.1 + 1;
      drawNode(ctx, node, pulse);
    });
  });

  return <canvas ref={canvasRef} width={800} height={600} />;
}
```

### 5.2 Optimizaciones de Renderizado

```typescript
// 1. Evitar sub-pixel rendering
const x = Math.floor(position.x);
const y = Math.floor(position.y);
ctx.fillRect(x, y, width, height);

// 2. Pre-renderizar elementos estáticos en offscreen canvas
const offscreenCache = new Map<string, HTMLCanvasElement>();

function getCachedNode(width: number, height: number, color: string): HTMLCanvasElement {
  const key = `${width}-${height}-${color}`;

  if (!offscreenCache.has(key)) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    // ... más dibujo

    offscreenCache.set(key, canvas);
  }

  return offscreenCache.get(key)!;
}

// Uso: dibujar desde cache
const cached = getCachedNode(100, 60, '#3498db');
ctx.drawImage(cached, node.x, node.y);

// 3. Layering: separar elementos estáticos y dinámicos
function LayeredCanvas() {
  const bgLayerRef = useRef<HTMLCanvasElement>(null);  // Fondo (raramente cambia)
  const mainLayerRef = useRef<HTMLCanvasElement>(null); // Nodos y conexiones
  const uiLayerRef = useRef<HTMLCanvasElement>(null);   // UI overlays

  useEffect(() => {
    // Renderizar background solo una vez
    const bgCtx = bgLayerRef.current?.getContext('2d');
    if (bgCtx) {
      renderBackground(bgCtx);
    }
  }, []);

  useEffect(() => {
    // Renderizar main layer cuando cambian datos
    const mainCtx = mainLayerRef.current?.getContext('2d');
    if (mainCtx) {
      renderNodesAndConnections(mainCtx);
    }
  }, [nodes, connections]);

  return (
    <div style={{ position: 'relative', width: 800, height: 600 }}>
      <canvas ref={bgLayerRef} style={{ position: 'absolute', zIndex: 1 }} />
      <canvas ref={mainLayerRef} style={{ position: 'absolute', zIndex: 2 }} />
      <canvas ref={uiLayerRef} style={{ position: 'absolute', zIndex: 3 }} />
    </div>
  );
}
```

### 5.3 OffscreenCanvas para Cálculos Pesados

```typescript
// Usar OffscreenCanvas en el main thread para cache
function createOffscreenBuffer(width: number, height: number) {
  if ('OffscreenCanvas' in window) {
    return new OffscreenCanvas(width, height);
  }
  // Fallback: canvas regular
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

// Uso en Web Worker para animaciones sin bloquear UI
// worker.ts
self.onmessage = function(e) {
  const { canvas, width, height } = e.data;

  // Recibir canvas offscreen transferido
  const offscreen = canvas as OffscreenCanvas;
  const ctx = offscreen.getContext('2d')!;

  function animate() {
    // Dibujar en worker (no bloquea main thread)
    ctx.clearRect(0, 0, width, height);
    // ... dibujo pesado

    self.postMessage({ frameComplete: true });
    requestAnimationFrame(animate);
  }

  animate();
};

// Main thread
function setupWorkerCanvas() {
  const canvas = document.querySelector('canvas')!;
  const offscreen = canvas.transferControlToOffscreen();

  const worker = new Worker('./canvas-worker.js');
  worker.postMessage({
    canvas: offscreen,
    width: canvas.width,
    height: canvas.height
  }, [offscreen]);
}
```

### 5.4 Checklist de Performance

| Técnica | Impacto | Cuándo Usar |
|---------|---------|-------------|
| `requestAnimationFrame` | Alto | Siempre para animaciones |
| Offscreen Canvas | Alto | Pre-renderizado, cálculos pesados |
| Layering | Medio | Escenas con elementos estáticos/dinámicos mixtos |
| Cache de Paths/Images | Alto | Elementos repetidos, formas complejas |
| `alpha: false` | Medio | Canvas sin transparencia |
| `willReadFrequently: true` | Bajo | Cuando se lee ImageData frecuentemente |
| Evitar float coords | Medio | Mejorar nitidez, evitar sub-pixel |
| CSS transforms > canvas scale | Alto | Escalar canvas completo |

---

## 6. Bibliotecas Auxiliares

### 6.1 Comparativa de Librerías Canvas

| Biblioteca | Enfoque | Mejor Para | Curva de Aprendizaje | Tamaño |
|------------|---------|------------|---------------------|--------|
| **Fabric.js** | Editor interactivo | Apps tipo Photoshop, editores de imagen | Media | ~300KB |
| **Konva.js** | Rendering 2D | Juegos, animaciones, visualizaciones | Baja | ~150KB |
| **react-konva** | React + Konva | Apps React con canvas interactivo | Baja | ~180KB total |
| **Paper.js** | Vector/Path | Ilustración, paths complejos, SVG-like | Media | ~200KB |
| **PixiJS** | Rendering WebGL | Juegos 2D, visualizaciones masivas | Media | ~300KB |
| **Three.js** | 3D WebGL | 3D, pero puede hacer 2D | Alta | ~500KB+ |

### 6.2 Konva.js / React-Konva

```typescript
// React-Konva permite usar Canvas con componentes React declarativos
import { Stage, Layer, Rect, Circle, Text, Line } from 'react-konva';
import { useState } from 'react';

function KonvaNodeEditor() {
  const [nodes, setNodes] = useState([
    { id: '1', x: 50, y: 50, width: 100, height: 60, color: '#F57E24' },
    { id: '2', x: 200, y: 150, width: 100, height: 60, color: '#2D3C53' }
  ]);

  return (
    <Stage width={800} height={600}>
      <Layer>
        {nodes.map(node => (
          <Rect
            key={node.id}
            x={node.x}
            y={node.y}
            width={node.width}
            height={node.height}
            fill={node.color}
            draggable
            onDragEnd={(e) => {
              setNodes(prev => prev.map(n =>
                n.id === node.id
                  ? { ...n, x: e.target.x(), y: e.target.y() }
                  : n
              ));
            }}
          />
        ))}

        {/* Línea de conexión */}
        <Line
          points={[150, 80, 200, 180]}
          stroke="#999"
          strokeWidth={2}
        />
      </Layer>
    </Stage>
  );
}
```

**Pros de react-konva:**
- API declarativa similar a React DOM
- Manejo automático de eventos (onClick, onDrag, etc.)
- Hit testing integrado
- Animaciones incorporadas
- Layering automático

**Contras:**
- Abstracción que puede limitar control fino
- Performance inferior a Canvas nativo optimizado
- Curva de aprendizaje de la API específica

### 6.3 Fabric.js

```typescript
import { fabric } from 'fabric';

function useFabricCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas>();

  useEffect(() => {
    if (!canvasRef.current) return;

    // Inicializar Fabric canvas
    fabricRef.current = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#f5f5f5'
    });

    // Crear objetos interactivos
    const rect = new fabric.Rect({
      left: 100,
      top: 100,
      fill: '#F57E24',
      width: 100,
      height: 60,
      selectable: true,
      draggable: true
    });

    const text = new fabric.Text('Nodo 1', {
      left: 110,
      top: 120,
      fontSize: 14,
      fill: 'white'
    });

    fabricRef.current.add(rect, text);

    // Eventos
    fabricRef.current.on('object:moving', (e) => {
      console.log('Moviendo:', e.target);
    });

    return () => {
      fabricRef.current?.dispose();
    };
  }, []);

  return canvasRef;
}
```

**Pros de Fabric.js:**
- Muy completo para editores visuales
- Selección múltiple nativa
- Transformaciones (resize, rotate) integradas
- Exportación a SVG/JSON
- Maduro y estable

**Contras:**
- Más pesado que alternativas
- API menos "React-friendly"
- Más difícil de integrar con estado de React

### 6.4 Paper.js

```typescript
// Paper.js se centra en paths vectoriales y curvas Bézier
import paper from 'paper';

function usePaperCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    paper.setup(canvasRef.current);

    // Crear path complejo
    const path = new paper.Path();
    path.strokeColor = '#F57E24';
    path.strokeWidth = 2;

    path.add(new paper.Point(100, 100));
    path.add(new paper.Point(150, 150));
    path.arcTo(new paper.Point(200, 100));

    // Hit testing con paths
    path.onClick = () => {
      path.selected = !path.selected;
    };

    paper.view.draw();

    return () => {
      paper.project.clear();
    };
  }, []);

  return canvasRef;
}
```

**Pros de Paper.js:**
- Excelente para paths y curvas
- Operaciones booleanas en paths
- Simulación física integrada
- Precisión matemática

**Contras:**
- Más orientado a ilustración que a UI
- Menos documentación para casos de uso interactivo

### 6.5 Cuándo Usar Biblioteca vs Canvas Nativo

**Usar Biblioteca (Konva/Fabric/Paper) cuando:**
- El proyecto tiene timeline ajustado
- Se necesitan interacciones complejas (drag, resize, rotate) rápidamente
- El equipo no tiene experiencia profunda con Canvas
- La performance "suficiente" es aceptable
- Se prioriza velocidad de desarrollo sobre control fino

**Usar Canvas Nativo cuando:**
- Se necesita máxima performance (ej: miles de elementos)
- Se requiere control total sobre el renderizado
- El proyecto es a largo plazo con requerimientos únicos
- Se necesitan optimizaciones específicas del dominio
- El equipo tiene experiencia con Canvas

---

## Conclusiones para Proyecto de Node Editor

### Viabilidad: **Alta**

Canvas API nativa es completamente viable para un node editor, con las siguientes consideraciones:

### Curva de Aprendizaje

| Aspecto | Dificultad | Tiempo Estimado |
|---------|-----------|-----------------|
| API Canvas básica | Baja | 1-2 días |
| Integración React | Media | 2-3 días |
| Eventos y Hit Testing | Media | 2-3 días |
| High-DPI handling | Baja | 1 día |
| Performance optimization | Alta | 3-5 días |
| Node editor completo | Media-Alta | 1-2 semanas |

### Recomendación de Arquitectura

1. **Fase 1 (MVP)**: Canvas nativo con custom hook `useCanvas`
2. **Fase 2 (Optimización)**: Implementar layering y caching
3. **Fase 3 (Escalado)**: Evaluar `react-konva` si las interacciones se vuelven muy complejas

### Patrones Clave para Node Editor

```typescript
// Estructura recomendada
interface NodeEditorState {
  // Datos (en ref, no state)
  nodes: Map<string, Node>;
  connections: Connection[];
  selectedIds: Set<string>;

  // Viewport
  zoom: number;
  pan: { x: number; y: number };

  // Interacción
  isDragging: boolean;
  dragStart: { x: number; y: number };
}

// Separación de responsabilidades:
// 1. Data Layer: nodes/connections refs
// 2. Render Layer: Canvas component
// 3. Interaction Layer: event handlers
// 4. UI Layer: React controls (toolbar, panels)
```

### Performance Targets Asequibles

- **< 100 nodos**: Canvas nativo simple
- **100-500 nodos**: Canvas nativo con caching
- **500-2000 nodos**: Canvas nativo optimizado (layering, dirty rectangles)
- **> 2000 nodos**: Considerar WebGL (PixiJS/Three.js) o virtualización

### Riesgos Identificados

1. **Zoom/Pan complejos**: Requieren transformaciones de coordenadas cuidadosas
2. **Hit testing a escala**: Necesita optimización (quadtree o grid espacial)
3. **Re-renders**: Separar estado del canvas del estado de UI
4. **Memoria**: Liberar recursos de canvas al desmontar

---

## Recursos Adicionales

- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [MDN Optimizing Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas)
- [React-Konva Docs](https://konvajs.org/docs/react/index.html)
- [Fabric.js Docs](http://fabricjs.com/docs/)
- [HTML5 Canvas Deep Dive](https://simonsarris.com/canvas-moving-selectable-shapes/)
