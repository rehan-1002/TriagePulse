const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Crisp medical pulse SVG
const svgIcon = `
<svg width="512" height="512" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="110" fill="#09090B"/>
  <rect x="16" y="16" width="480" height="480" rx="96" stroke="url(#paint0_linear)" stroke-width="8"/>
  <circle cx="256" cy="256" r="190" fill="url(#paint1_radial)" opacity="0.35"/>
  
  <!-- Subtle Cross Backlight -->
  <rect x="232" y="140" width="48" height="232" rx="12" fill="#059669" opacity="0.25"/>
  <rect x="140" y="232" width="232" height="48" rx="12" fill="#059669" opacity="0.25"/>

  <!-- Glowing Heart Pulse Line -->
  <path d="M96 266H168L198 180L238 334L284 136L322 284L352 238L376 266H416" 
        stroke="#10B981" 
        stroke-width="26" 
        stroke-linecap="round" 
        stroke-linejoin="round"
        filter="url(#glow)"/>
        
  <!-- Core Solid Line -->
  <path d="M96 266H168L198 180L238 334L284 136L322 284L352 238L376 266H416" 
        stroke="#FFFFFF" 
        stroke-width="12" 
        stroke-linecap="round" 
        stroke-linejoin="round"/>

  <!-- High Acuity Pulse Beacon Dot -->
  <circle cx="284" cy="136" r="14" fill="#34D399" filter="url(#glow)"/>
  <circle cx="284" cy="136" r="8" fill="#FFFFFF"/>

  <defs>
    <filter id="glow" x="70" y="110" width="372" height="250" filterUnits="userSpaceOnUse">
      <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="paint0_linear" x1="16" y1="16" x2="496" y2="496" gradientUnits="userSpaceOnUse">
      <stop stop-color="#10B981"/>
      <stop offset="1" stop-color="#047857" stop-opacity="0.2"/>
    </linearGradient>
    <radialGradient id="paint1_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(256 256) rotate(90) scale(200)">
      <stop stop-color="#10B981" stop-opacity="0.8"/>
      <stop offset="1" stop-color="#10B981" stop-opacity="0"/>
    </radialGradient>
  </defs>
</svg>
`;

// Save base SVG
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgIcon.trim());

async function generatePngs() {
  const svgBuffer = Buffer.from(svgIcon);

  // 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192x192.png'));

  // 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512x512.png'));

  // Maskable 192x192 (with extra padding safe zone)
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable-192x192.png'));

  // Maskable 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-maskable-512x512.png'));

  // Apple Touch Icon (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));

  // Favicon 32x32
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(iconsDir, 'favicon-32x32.png'));

  console.log('✅ PWA Icons successfully generated in public/icons/');
}

generatePngs().catch(console.error);
