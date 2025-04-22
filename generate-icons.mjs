import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp'; // 需要安装: npm install sharp

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const SOURCE_ICON = path.join(__dirname, 'client/public/icons/icon-placeholder.svg');
const OUTPUT_DIR = path.join(__dirname, 'client/public/icons');

/**
 * 生成所有尺寸的图标
 */
async function generateIcons() {
  console.log('正在生成PWA图标...');
  
  try {
    // 确保输出目录存在
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }
    
    // 读取源SVG图标
    const svgBuffer = fs.readFileSync(SOURCE_ICON);
    
    // 生成不同尺寸的图标
    for (const size of ICON_SIZES) {
      const outputFile = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);
      
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputFile);
        
      console.log(`✅ 已生成 ${size}x${size} 图标`);
    }
    
    // 生成一个maskable图标
    await sharp(svgBuffer)
      .resize(512, 512)
      .png()
      .toFile(path.join(OUTPUT_DIR, 'maskable-icon-512x512.png'));
      
    console.log('✅ 已生成 maskable 图标');
    
    console.log('所有图标生成完成！');
  } catch (error) {
    console.error('生成图标时出错:', error);
  }
}

// 执行生成
generateIcons();