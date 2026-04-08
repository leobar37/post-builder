// Test script to verify post export and image dimensions
import dotenv from 'dotenv';
dotenv.config();

import { getBrowserlessService } from './api/services/browserless.service.js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Read CSS files
const baseCss = readFileSync(join(process.cwd(), 'src', 'base.css'), 'utf-8');
const componentsCss = readFileSync(join(process.cwd(), 'src', 'components.css'), 'utf-8');

// Simple test HTML for a 1080x1080 Instagram post
const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700;800&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    ${baseCss}
    ${componentsCss}
    
    body {
      width: 1080px;
      height: 1080px;
      margin: 0;
      padding: 0;
      overflow: hidden;
      background: linear-gradient(135deg, #fffaf4 0%, #fff 50%, #fffbf6 100%);
    }
    
    .test-post {
      width: 1080px;
      height: 1080px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px;
      box-sizing: border-box;
      position: relative;
    }
    
    .test-header {
      position: absolute;
      top: 48px;
      left: 56px;
      display: flex;
      align-items: center;
      gap: 14px;
    }
    
    .test-logo {
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #F57E24 0%, #FF9144 100%);
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .test-brand {
      font-family: 'Sora', sans-serif;
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
    }
    
    .test-badge {
      margin-left: auto;
      font-size: 12px;
      font-weight: 700;
      color: #b45309;
      background: rgba(245, 126, 36, 0.2);
      padding: 7px 16px;
      border-radius: 9999px;
      border: 1px solid rgba(245, 126, 36, 0.35);
      text-transform: uppercase;
      letter-spacing: 0.6px;
    }
    
    .test-content {
      text-align: center;
      margin-top: 100px;
    }
    
    .test-title {
      font-family: 'Sora', sans-serif;
      font-size: 72px;
      font-weight: 800;
      color: #1f2937;
      margin-bottom: 24px;
      line-height: 1.1;
    }
    
    .test-subtitle {
      font-family: 'Manrope', sans-serif;
      font-size: 32px;
      color: #374151;
      margin-bottom: 48px;
    }
    
    .test-stat {
      background: linear-gradient(135deg, rgba(245, 126, 36, 0.12), rgba(245, 126, 36, 0.05));
      border: 2px solid rgba(245, 126, 36, 0.25);
      border-radius: 20px;
      padding: 40px 80px;
      display: inline-block;
    }
    
    .test-stat-value {
      font-family: 'Sora', sans-serif;
      font-size: 96px;
      font-weight: 800;
      color: #F57E24;
      line-height: 1;
    }
    
    .test-stat-label {
      font-family: 'Manrope', sans-serif;
      font-size: 24px;
      color: #4b5563;
      margin-top: 8px;
    }
    
    .test-footer {
      position: absolute;
      bottom: 60px;
      left: 0;
      right: 0;
      text-align: center;
    }
    
    .test-cta {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, #F57E24 0%, #FF9144 100%);
      color: white;
      font-family: 'Manrope', sans-serif;
      font-size: 28px;
      font-weight: 700;
      padding: 24px 48px;
      border-radius: 16px;
      box-shadow: 0 14px 32px -6px rgba(245, 126, 36, 0.45);
    }
    
    .dimension-marker {
      position: absolute;
      bottom: 10px;
      right: 10px;
      font-family: 'Sora', sans-serif;
      font-size: 14px;
      color: rgba(0,0,0,0.3);
      background: rgba(255,255,255,0.8);
      padding: 4px 8px;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="test-post">
    <div class="test-header">
      <div class="test-logo">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M6.5 6.5h11M6.5 17.5h11M6 20v-6.5a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 .5.5V20M6 4v6.5a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 .5-.5V4"/>
        </svg>
      </div>
      <span class="test-brand">GymSpace</span>
      <span class="test-badge">TODO-EN-UNO</span>
    </div>
    
    <div class="test-content">
      <h1 class="test-title">Test Export</h1>
      <p class="test-subtitle">Verificando dimensiones correctas</p>
      
      <div class="test-stat">
        <div class="test-stat-value">1080×1080</div>
        <div class="test-stat-label">Dimensiones esperadas</div>
      </div>
    </div>
    
    <div class="test-footer">
      <div class="test-cta">¡Prueba gratuita! 🚀</div>
    </div>
    
    <div class="dimension-marker">1080×1080px</div>
  </div>
</body>
</html>
`;

async function testExport() {
  console.log('🧪 Iniciando test de exportación...\n');
  
  try {
    const browserlessService = getBrowserlessService();
    
    console.log('📸 Exportando post como PNG...');
    const buffer = await browserlessService.htmlToImage(testHtml, {
      width: 1080,
      height: 1080,
      type: 'png',
    });
    
    // Save the image
    const outputPath = join(process.cwd(), 'test-export-result.png');
    const fs = await import('fs');
    fs.writeFileSync(outputPath, buffer);
    
    console.log(`✅ Imagen exportada: ${outputPath}`);
    console.log(`📊 Tamaño del archivo: ${(buffer.length / 1024).toFixed(2)} KB\n`);
    
    // Verify image dimensions using image-size library or similar
    // For now, we'll just check the file was created
    const stats = fs.statSync(outputPath);
    console.log(`📁 File info:`);
    console.log(`   - Size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   - Created: ${stats.birthtime.toISOString()}`);
    
    // Try to get image dimensions if sharp is available
    try {
      const { default: sharp } = await import('sharp');
      const metadata = await sharp(outputPath).metadata();
      console.log(`\n📐 Dimensiones de la imagen:`);
      console.log(`   - Width: ${metadata.width}px`);
      console.log(`   - Height: ${metadata.height}px`);
      console.log(`   - Format: ${metadata.format}`);
      
      if (metadata.width === 1080 && metadata.height === 1080) {
        console.log(`\n✅ ¡DIMENSIONES CORRECTAS! (1080×1080)`);
      } else {
        console.log(`\n❌ ¡DIMENSIONES INCORRECTAS!`);
        console.log(`   Esperado: 1080×1080`);
        console.log(`   Obtenido: ${metadata.width}×${metadata.height}`);
      }
    } catch (sharpError) {
      console.log(`\n⚠️  No se pudo verificar dimensiones (sharp no instalado)`);
      console.log(`   Instala sharp con: npm install sharp`);
    }
    
    console.log(`\n🎉 Test completado!`);
    
  } catch (error) {
    console.error('\n❌ Error en el test:', error);
    process.exit(1);
  }
}

testExport();
