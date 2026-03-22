const sharp = require('sharp');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets', 'images');

const mainIconSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#DA532C"/>
      <stop offset="100%" style="stop-color:#E8764F"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="180" fill="url(#bg)"/>
  <rect x="182" y="332" width="660" height="440" rx="48" fill="white"/>
  <path d="M380 332 L430 252 L594 252 L644 332" fill="white"/>
  <circle cx="512" cy="552" r="160" fill="#152455"/>
  <circle cx="512" cy="552" r="110" fill="#1F2A45"/>
  <circle cx="512" cy="552" r="50" fill="#DA532C"/>
  <rect x="700" y="380" width="60" height="36" rx="8" fill="#152455" opacity="0.3"/>
</svg>`;

const foregroundSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect x="182" y="332" width="660" height="440" rx="48" fill="white"/>
  <path d="M380 332 L430 252 L594 252 L644 332" fill="white"/>
  <circle cx="512" cy="552" r="160" fill="#152455"/>
  <circle cx="512" cy="552" r="110" fill="#1F2A45"/>
  <circle cx="512" cy="552" r="50" fill="#DA532C"/>
  <rect x="700" y="380" width="60" height="36" rx="8" fill="#152455" opacity="0.3"/>
</svg>`;

const backgroundSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#DA532C"/>
      <stop offset="100%" style="stop-color:#E8764F"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
</svg>`;

const monochromeSvg = `
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect x="182" y="332" width="660" height="440" rx="48" fill="white"/>
  <path d="M380 332 L430 252 L594 252 L644 332" fill="white"/>
  <circle cx="512" cy="552" r="160" fill="black"/>
  <circle cx="512" cy="552" r="110" fill="white"/>
  <circle cx="512" cy="552" r="50" fill="black"/>
</svg>`;

async function generate() {
  await sharp(Buffer.from(mainIconSvg)).resize(1024, 1024).png().toFile(path.join(ASSETS, 'icon.png'));
  await sharp(Buffer.from(foregroundSvg)).resize(1024, 1024).png().toFile(path.join(ASSETS, 'android-icon-foreground.png'));
  await sharp(Buffer.from(backgroundSvg)).resize(1024, 1024).png().toFile(path.join(ASSETS, 'android-icon-background.png'));
  await sharp(Buffer.from(monochromeSvg)).resize(1024, 1024).png().toFile(path.join(ASSETS, 'android-icon-monochrome.png'));
  await sharp(Buffer.from(mainIconSvg)).resize(512, 512).png().toFile(path.join(ASSETS, 'splash-icon.png'));
  await sharp(Buffer.from(mainIconSvg)).resize(48, 48).png().toFile(path.join(ASSETS, 'favicon.png'));
  console.log('All icons generated successfully!');
}

generate().catch(console.error);
