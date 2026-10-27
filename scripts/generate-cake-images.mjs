import fs from 'node:fs';
import path from 'node:path';

const outDir = 'D:/Bài Tập Cô Dung/cv.worktrees/project-explanation-request/public/images';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function svgWrap(bgGradient, content) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500" width="100%" height="100%">
  <defs>
    ${bgGradient}
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#4a1525" flood-opacity="0.12"/>
    </filter>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>
  <rect width="500" height="500" rx="32" fill="url(#bg)"/>
  <!-- Sparkles -->
  <path d="M70,80 Q70,95 85,95 Q70,95 70,110 Q70,95 55,95 Q70,95 70,80 Z" fill="#ffffff" opacity="0.6"/>
  <path d="M420,110 Q420,122 432,122 Q420,122 420,134 Q420,122 408,122 Q420,122 420,110 Z" fill="#ffffff" opacity="0.6"/>
  <path d="M80,380 Q80,390 90,390 Q80,390 80,400 Q80,390 70,390 Q80,390 80,380 Z" fill="#ffffff" opacity="0.5"/>
  <g filter="url(#shadow)">
    <!-- Plate / Stand -->
    <ellipse cx="250" cy="405" rx="175" ry="32" fill="#ffffff" opacity="0.95"/>
    <ellipse cx="250" cy="403" rx="160" ry="26" fill="#fdf2f4"/>
    ${content}
  </g>
</svg>`;
}

const cakeSvgs = {
  'banh-kem-dau-tay-kem-tuoi': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff1f2"/>
      <stop offset="100%" stop-color="#fce7f3"/>
    </linearGradient>
    <linearGradient id="cakeBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffdfa"/>
      <stop offset="100%" stop-color="#ffe4e6"/>
    </linearGradient>`,
    `<!-- Cake base -->
    <rect x="130" y="240" width="240" height="135" rx="18" fill="url(#cakeBody)"/>
    <!-- Cream filling middle layer -->
    <rect x="130" y="295" width="240" height="14" fill="#fb7185" opacity="0.8"/>
    <!-- Cream drips -->
    <path d="M125,245 C140,265 155,255 170,268 C185,250 200,262 215,255 C230,270 245,252 260,265 C275,250 290,268 305,255 C320,268 335,252 350,264 C365,255 375,245 375,245 L375,235 L125,235 Z" fill="#ffffff"/>
    <ellipse cx="250" cy="235" rx="125" ry="38" fill="#ffffff"/>
    <!-- Strawberries -->
    <g transform="translate(195, 175) scale(0.9)">
      <path d="M30,50 Q10,25 35,5 Q60,25 40,50 Z" fill="#e11d48"/>
      <!-- Seeds -->
      <circle cx="28" cy="22" r="1.5" fill="#fef08a"/>
      <circle cx="38" cy="24" r="1.5" fill="#fef08a"/>
      <circle cx="34" cy="35" r="1.5" fill="#fef08a"/>
      <!-- Leaf -->
      <path d="M35,6 Q20,-6 15,2 Q35,6 35,6 Q50,-6 55,2 Z" fill="#16a34a"/>
    </g>
    <g transform="translate(235, 165) scale(1.1)">
      <path d="M30,50 Q10,25 35,5 Q60,25 40,50 Z" fill="#f43f5e"/>
      <circle cx="28" cy="22" r="1.5" fill="#fef08a"/>
      <circle cx="38" cy="24" r="1.5" fill="#fef08a"/>
      <circle cx="34" cy="35" r="1.5" fill="#fef08a"/>
      <path d="M35,6 Q20,-6 15,2 Q35,6 35,6 Q50,-6 55,2 Z" fill="#15803d"/>
    </g>
    <g transform="translate(280, 185) scale(0.8)">
      <path d="M30,50 Q10,25 35,5 Q60,25 40,50 Z" fill="#e11d48"/>
      <circle cx="28" cy="22" r="1.5" fill="#fef08a"/>
      <circle cx="38" cy="24" r="1.5" fill="#fef08a"/>
      <circle cx="34" cy="35" r="1.5" fill="#fef08a"/>
      <path d="M35,6 Q20,-6 15,2 Q35,6 35,6 Q50,-6 55,2 Z" fill="#16a34a"/>
    </g>
    <!-- Cream rosettes -->
    <circle cx="160" cy="235" r="16" fill="#fff1f2"/>
    <circle cx="340" cy="235" r="16" fill="#fff1f2"/>
    <circle cx="250" cy="245" r="18" fill="#fff1f2"/>`
  ),

  'banh-kem-socola-belgium': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fdf4ff"/>
      <stop offset="100%" stop-color="#fae8ff"/>
    </linearGradient>
    <linearGradient id="chocoGanache" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#4a2818"/>
      <stop offset="100%" stop-color="#2d150b"/>
    </linearGradient>`,
    `<!-- Cake base -->
    <rect x="130" y="240" width="240" height="135" rx="18" fill="url(#chocoGanache)"/>
    <rect x="130" y="295" width="240" height="12" fill="#78350f"/>
    <!-- Chocolate drips -->
    <path d="M125,245 C140,278 150,260 165,285 C180,255 195,280 210,260 C225,290 240,258 255,282 C270,255 285,288 300,262 C315,285 330,258 345,280 C360,262 375,245 375,245 L375,235 L125,235 Z" fill="#3b1d11"/>
    <ellipse cx="250" cy="235" rx="125" ry="38" fill="#3b1d11"/>
    <!-- Gold / chocolate curl toppings -->
    <ellipse cx="250" cy="230" rx="90" ry="22" fill="#4a2818"/>
    <!-- Chocolate curls -->
    <path d="M220,185 C240,170 260,200 280,180" stroke="#f59e0b" stroke-width="8" stroke-linecap="round" fill="none"/>
    <circle cx="210" cy="220" r="14" fill="#6d28d9"/>
    <circle cx="290" cy="220" r="14" fill="#6d28d9"/>
    <circle cx="250" cy="210" r="18" fill="#d97706"/>
    <!-- Gold dust -->
    <circle cx="230" cy="225" r="3" fill="#fef08a"/>
    <circle cx="270" cy="225" r="3" fill="#fef08a"/>
    <circle cx="250" cy="195" r="4" fill="#fef08a"/>`
  ),

  'banh-kem-tra-xanh-matcha': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f0fdf4"/>
      <stop offset="100%" stop-color="#dcfce7"/>
    </linearGradient>`,
    `<!-- Cake base -->
    <rect x="130" y="240" width="240" height="135" rx="18" fill="#4d7c0f"/>
    <rect x="130" y="295" width="240" height="14" fill="#fef08a"/>
    <!-- Matcha cream top -->
    <ellipse cx="250" cy="240" rx="120" ry="36" fill="#65a30d"/>
    <!-- Red bean toppings -->
    <ellipse cx="235" cy="225" rx="12" ry="8" fill="#881337"/>
    <ellipse cx="260" cy="222" rx="11" ry="7" fill="#881337"/>
    <ellipse cx="248" cy="235" rx="12" ry="8" fill="#701a75"/>
    <!-- Cream swirls -->
    <circle cx="170" cy="235" r="15" fill="#f7fee7"/>
    <circle cx="330" cy="235" r="15" fill="#f7fee7"/>
    <circle cx="250" cy="205" r="18" fill="#f7fee7"/>
    <path d="M245,190 C250,180 255,180 260,190" stroke="#65a30d" stroke-width="4" fill="none"/>`
  ),

  'banh-kem-hoa-hong-vai': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff1f2"/>
      <stop offset="100%" stop-color="#ffe4e6"/>
    </linearGradient>`,
    `<!-- Cake base -->
    <rect x="130" y="240" width="240" height="135" rx="18" fill="#fecdd3"/>
    <rect x="130" y="295" width="240" height="12" fill="#fda4af"/>
    <ellipse cx="250" cy="240" rx="120" ry="36" fill="#fff1f2"/>
    <!-- Lychee and rose petals -->
    <circle cx="250" cy="210" r="24" fill="#fb7185"/>
    <path d="M250,195 C235,195 235,225 250,225 C265,225 265,195 250,195 Z" fill="#e11d48"/>
    <!-- Rose petals -->
    <ellipse cx="210" cy="230" rx="18" ry="12" fill="#fda4af" transform="rotate(-20 210 230)"/>
    <ellipse cx="290" cy="230" rx="18" ry="12" fill="#fda4af" transform="rotate(20 290 230)"/>
    <!-- Lychee fruits -->
    <circle cx="215" cy="225" r="14" fill="#ffffff" stroke="#f43f5e" stroke-width="2"/>
    <circle cx="285" cy="225" r="14" fill="#ffffff" stroke="#f43f5e" stroke-width="2"/>`
  ),

  'bento-cake-vintage-pastel': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fdf2f8"/>
      <stop offset="100%" stop-color="#fce7f3"/>
    </linearGradient>`,
    `<!-- Bento Box Paper Container -->
    <rect x="110" y="260" width="280" height="120" rx="24" fill="#f5ebe0" stroke="#e6ccb2" stroke-width="4"/>
    <!-- Bento Cake -->
    <rect x="150" y="220" width="200" height="110" rx="16" fill="#fbcfe8"/>
    <ellipse cx="250" cy="220" rx="100" ry="32" fill="#fdf2f8"/>
    <!-- Cute Smile Face & Lettering -->
    <circle cx="225" cy="215" r="4" fill="#db2777"/>
    <circle cx="275" cy="215" r="4" fill="#db2777"/>
    <!-- Rosy cheeks -->
    <circle cx="215" cy="223" r="6" fill="#f472b6" opacity="0.6"/>
    <circle cx="285" cy="223" r="6" fill="#f472b6" opacity="0.6"/>
    <path d="M240,224 Q250,232 260,224" stroke="#db2777" stroke-width="3" stroke-linecap="round" fill="none"/>
    <text x="250" y="195" font-family="'DM Sans', cursive, sans-serif" font-size="16" font-weight="700" fill="#be185d" text-anchor="middle">Happy Day ♡</text>
    <!-- Border pipe rosettes -->
    <circle cx="160" cy="220" r="10" fill="#f472b6"/>
    <circle cx="340" cy="220" r="10" fill="#f472b6"/>`
  ),

  'bento-cake-socola-marshmallow': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#fae8ff"/>
    </linearGradient>`,
    `<rect x="110" y="260" width="280" height="120" rx="24" fill="#f5ebe0" stroke="#e6ccb2" stroke-width="4"/>
    <rect x="150" y="220" width="200" height="110" rx="16" fill="#582f0e"/>
    <ellipse cx="250" cy="220" rx="100" ry="32" fill="#7f4f24"/>
    <!-- Marshmallows -->
    <rect x="220" y="190" width="24" height="20" rx="6" fill="#ffffff" transform="rotate(-15 220 190)"/>
    <rect x="255" y="190" width="24" height="20" rx="6" fill="#fce7f3" transform="rotate(10 255 190)"/>
    <rect x="235" y="210" width="24" height="20" rx="6" fill="#fed7aa" transform="rotate(-5 235 210)"/>`
  ),

  'bento-cake-tra-sua-tran-chau': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffedd5"/>
      <stop offset="100%" stop-color="#fef3c7"/>
    </linearGradient>`,
    `<rect x="110" y="260" width="280" height="120" rx="24" fill="#f5ebe0" stroke="#e6ccb2" stroke-width="4"/>
    <rect x="150" y="220" width="200" height="110" rx="16" fill="#d97706"/>
    <!-- Cream drip -->
    <path d="M150,225 Q175,250 200,225 Q225,260 250,225 Q275,255 300,225 Q325,250 350,225 L350,210 L150,210 Z" fill="#fffbeb"/>
    <ellipse cx="250" cy="210" rx="100" ry="32" fill="#fffbeb"/>
    <!-- Boba pearls -->
    <circle cx="230" cy="205" r="9" fill="#1c1917"/>
    <circle cx="250" cy="210" r="9" fill="#1c1917"/>
    <circle cx="270" cy="202" r="9" fill="#1c1917"/>
    <circle cx="240" cy="195" r="8" fill="#292524"/>
    <circle cx="260" cy="192" r="8" fill="#292524"/>`
  ),

  'mousse-xoai-chanh-leo': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fef9c3"/>
      <stop offset="100%" stop-color="#fef08a"/>
    </linearGradient>`,
    `<!-- Mousse cylinder -->
    <rect x="140" y="230" width="220" height="145" rx="16" fill="#fde047"/>
    <!-- Cookie biscuit crust -->
    <rect x="140" y="345" width="220" height="30" rx="4" fill="#b45309"/>
    <!-- Mirror glaze top -->
    <ellipse cx="250" cy="230" rx="110" ry="34" fill="#eab308"/>
    <!-- Mango slices on top -->
    <path d="M210,210 Q250,185 290,210 Q250,245 210,210 Z" fill="#f97316"/>
    <path d="M225,220 Q250,200 275,220 Q250,250 225,220 Z" fill="#fb923c"/>
    <circle cx="280" cy="230" r="3" fill="#1c1917"/>
    <circle cx="230" cy="225" r="3" fill="#1c1917"/>
    <circle cx="265" cy="215" r="2.5" fill="#1c1917"/>`
  ),

  'mousse-viet-quat-kem-cheese': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f5d0fe"/>
      <stop offset="100%" stop-color="#fae8ff"/>
    </linearGradient>`,
    `<rect x="140" y="230" width="220" height="145" rx="16" fill="#c084fc"/>
    <rect x="140" y="345" width="220" height="30" rx="4" fill="#a16207"/>
    <ellipse cx="250" cy="230" rx="110" ry="34" fill="#7e22ce"/>
    <!-- Blueberries -->
    <circle cx="230" cy="215" r="14" fill="#3b0764"/>
    <circle cx="260" cy="210" r="15" fill="#3b0764"/>
    <circle cx="245" cy="228" r="13" fill="#4c1d95"/>
    <circle cx="275" cy="225" r="12" fill="#581c87"/>
    <circle cx="228" cy="213" r="3" fill="#c084fc"/>
    <circle cx="258" cy="208" r="3" fill="#c084fc"/>`
  ),

  'mousse-bap-non-kem-dua': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fefce8"/>
      <stop offset="100%" stop-color="#fef9c3"/>
    </linearGradient>`,
    `<rect x="140" y="230" width="220" height="145" rx="16" fill="#fef08a"/>
    <rect x="140" y="345" width="220" height="30" rx="4" fill="#ca8a04"/>
    <ellipse cx="250" cy="230" rx="110" ry="34" fill="#ffffff"/>
    <!-- Corn kernels and coconut flakes -->
    <ellipse cx="235" cy="220" rx="10" ry="7" fill="#eab308"/>
    <ellipse cx="255" cy="215" rx="9" ry="7" fill="#facc15"/>
    <ellipse cx="245" cy="230" rx="10" ry="6" fill="#eab308"/>
    <ellipse cx="270" cy="225" rx="8" ry="6" fill="#facc15"/>`
  ),

  'tiramisu-y-truyen-thong': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>`,
    `<!-- Square or round glass dish -->
    <rect x="130" y="230" width="240" height="145" rx="14" fill="#fef3c7"/>
    <!-- Ladyfinger coffee layers -->
    <rect x="130" y="270" width="240" height="22" fill="#78350f"/>
    <rect x="130" y="330" width="240" height="22" fill="#78350f"/>
    <!-- Cocoa dusted top -->
    <ellipse cx="250" cy="230" rx="120" ry="34" fill="#451a03"/>
    <!-- Mascarpone mounds -->
    <circle cx="180" cy="225" r="16" fill="#5c2606"/>
    <circle cx="215" cy="222" r="18" fill="#5c2606"/>
    <circle cx="250" cy="220" r="18" fill="#5c2606"/>
    <circle cx="285" cy="222" r="18" fill="#5c2606"/>
    <circle cx="320" cy="225" r="16" fill="#5c2606"/>`
  ),

  'tiramisu-matcha-mascarpone': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f0fdf4"/>
      <stop offset="100%" stop-color="#dcfce7"/>
    </linearGradient>`,
    `<rect x="130" y="230" width="240" height="145" rx="14" fill="#f7fee7"/>
    <rect x="130" y="270" width="240" height="22" fill="#4d7c0f"/>
    <rect x="130" y="330" width="240" height="22" fill="#4d7c0f"/>
    <ellipse cx="250" cy="230" rx="120" ry="34" fill="#3f6212"/>
    <circle cx="190" cy="225" r="16" fill="#4d7c0f"/>
    <circle cx="230" cy="220" r="18" fill="#4d7c0f"/>
    <circle cx="270" cy="220" r="18" fill="#4d7c0f"/>
    <circle cx="310" cy="225" r="16" fill="#4d7c0f"/>`
  ),

  'tiramisu-hop-thiec-cao-cap': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f1f5f9"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>`,
    `<!-- Tin Box -->
    <rect x="120" y="240" width="260" height="130" rx="20" fill="#94a3b8" stroke="#cbd5e1" stroke-width="6"/>
    <rect x="125" y="245" width="250" height="120" rx="16" fill="#451a03"/>
    <!-- Mascarpone dollops inside tin -->
    <circle cx="170" cy="280" r="22" fill="#5c2606"/>
    <circle cx="220" cy="280" r="22" fill="#5c2606"/>
    <circle cx="270" cy="280" r="22" fill="#5c2606"/>
    <circle cx="320" cy="280" r="22" fill="#5c2606"/>
    <circle cx="195" cy="315" r="22" fill="#5c2606"/>
    <circle cx="245" cy="315" r="22" fill="#5c2606"/>
    <circle cx="295" cy="315" r="22" fill="#5c2606"/>
    <text x="250" y="225" font-family="'DM Sans', sans-serif" font-size="16" font-weight="700" fill="#475569" text-anchor="middle">PREMIUM TIN 450G</text>`
  ),

  'banh-kem-tao-hinh-fondant': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fae8ff"/>
      <stop offset="100%" stop-color="#f5d0fe"/>
    </linearGradient>`,
    `<!-- Fondant smooth cake -->
    <rect x="130" y="240" width="240" height="135" rx="14" fill="#fdf4ff" stroke="#e879f9" stroke-width="2"/>
    <ellipse cx="250" cy="240" rx="120" ry="34" fill="#fae8ff"/>
    <!-- Fondant teddy / crown / sculpture -->
    <circle cx="250" cy="190" r="32" fill="#d97706"/>
    <!-- Ears -->
    <circle cx="225" cy="165" r="12" fill="#b45309"/>
    <circle cx="275" cy="165" r="12" fill="#b45309"/>
    <!-- Snout & Eyes -->
    <ellipse cx="250" cy="198" rx="14" ry="10" fill="#fef3c7"/>
    <circle cx="250" cy="194" r="4" fill="#1c1917"/>
    <circle cx="240" cy="184" r="3" fill="#1c1917"/>
    <circle cx="260" cy="184" r="3" fill="#1c1917"/>
    <!-- Fondant ribbon on cake base -->
    <rect x="130" y="360" width="240" height="15" fill="#d946ef"/>`
  ),

  'banh-kem-tang-sang-trong': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff1f2"/>
      <stop offset="100%" stop-color="#fdf2f8"/>
    </linearGradient>`,
    `<!-- Tier 1 bottom -->
    <rect x="120" y="270" width="260" height="110" rx="12" fill="#fffdfa"/>
    <ellipse cx="250" cy="270" rx="130" ry="32" fill="#fce7f3"/>
    <!-- Tier 2 top -->
    <rect x="160" y="180" width="180" height="95" rx="10" fill="#fffdfa"/>
    <ellipse cx="250" cy="180" rx="90" ry="24" fill="#fce7f3"/>
    <!-- Crown on top -->
    <path d="M215,175 L225,140 L240,160 L250,130 L260,160 L275,140 L285,175 Z" fill="#eab308" stroke="#ca8a04" stroke-width="2"/>
    <!-- Pearls garland -->
    <circle cx="170" cy="270" r="5" fill="#fdf2f8" stroke="#db2777" stroke-width="1"/>
    <circle cx="190" cy="274" r="5" fill="#fdf2f8" stroke="#db2777" stroke-width="1"/>
    <circle cx="210" cy="276" r="5" fill="#fdf2f8" stroke="#db2777" stroke-width="1"/>
    <circle cx="230" cy="278" r="5" fill="#fdf2f8" stroke="#db2777" stroke-width="1"/>
    <circle cx="250" cy="279" r="5" fill="#fdf2f8" stroke="#db2777" stroke-width="1"/>
    <circle cx="270" cy="278" r="5" fill="#fdf2f8" stroke="#db2777" stroke-width="1"/>
    <circle cx="290" cy="276" r="5" fill="#fdf2f8" stroke="#db2777" stroke-width="1"/>
    <circle cx="310" cy="274" r="5" fill="#fdf2f8" stroke="#db2777" stroke-width="1"/>
    <circle cx="330" cy="270" r="5" fill="#fdf2f8" stroke="#db2777" stroke-width="1"/>`
  ),

  'banh-kem-ve-hinh-theo-anh': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ecfeff"/>
      <stop offset="100%" stop-color="#cffafe"/>
    </linearGradient>`,
    `<!-- Bento / cake top view or perspective -->
    <rect x="130" y="230" width="240" height="145" rx="18" fill="#ecfeff"/>
    <ellipse cx="250" cy="230" rx="120" ry="36" fill="#ffffff"/>
    <!-- Chibi sketch -->
    <circle cx="250" cy="205" r="28" fill="#ffedd5"/>
    <!-- Hair -->
    <path d="M222,200 Q250,170 278,200 Q250,185 222,200 Z" fill="#78350f"/>
    <!-- Eyes and smile -->
    <circle cx="240" cy="208" r="3" fill="#1e293b"/>
    <circle cx="260" cy="208" r="3" fill="#1e293b"/>
    <path d="M245,218 Q250,224 255,218" stroke="#1e293b" stroke-width="2" fill="none"/>
    <circle cx="234" cy="214" r="4" fill="#f43f5e" opacity="0.6"/>
    <circle cx="266" cy="214" r="4" fill="#f43f5e" opacity="0.6"/>
    <text x="250" y="255" font-family="'DM Sans', cursive, sans-serif" font-size="14" font-weight="700" fill="#0891b2" text-anchor="middle">Custom Chibi Art</text>`
  ),

  'set-nen-so-nhu-vang': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fffbeb"/>
      <stop offset="100%" stop-color="#fef3c7"/>
    </linearGradient>`,
    `<!-- Golden Number Candle 1 and 8 -->
    <!-- Number 1 -->
    <path d="M190,200 L210,180 L210,340 L185,340 L235,340" stroke="#f59e0b" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <!-- Number 8 -->
    <circle cx="290" cy="230" r="30" stroke="#f59e0b" stroke-width="18" fill="none"/>
    <circle cx="290" cy="300" r="36" stroke="#f59e0b" stroke-width="18" fill="none"/>
    <!-- Wick and flame 1 -->
    <line x1="210" y1="170" x2="210" y2="155" stroke="#78350f" stroke-width="4"/>
    <path d="M210,125 Q225,145 210,155 Q195,145 210,125 Z" fill="#ef4444" filter="url(#softGlow)"/>
    <path d="M210,135 Q218,147 210,155 Q202,147 210,135 Z" fill="#fef08a"/>
    <!-- Wick and flame 8 -->
    <line x1="290" y1="190" x2="290" y2="175" stroke="#78350f" stroke-width="4"/>
    <path d="M290,145 Q305,165 290,175 Q275,165 290,145 Z" fill="#ef4444" filter="url(#softGlow)"/>
    <path d="M290,155 Q298,167 290,175 Q282,167 290,155 Z" fill="#fef08a"/>`
  ),

  'set-mu-sinh-nhat-pastel': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fdf2f8"/>
      <stop offset="100%" stop-color="#fce7f3"/>
    </linearGradient>`,
    `<!-- Party Hats -->
    <!-- Cone 1 -->
    <path d="M190,340 L240,170 L280,340 Z" fill="#f472b6"/>
    <!-- Pom pom -->
    <circle cx="240" cy="165" r="14" fill="#fbbf24"/>
    <circle cx="220" cy="250" r="6" fill="#ffffff"/>
    <circle cx="250" cy="270" r="6" fill="#ffffff"/>
    <circle cx="230" cy="310" r="6" fill="#ffffff"/>
    <!-- Cone 2 -->
    <path d="M260,350 L310,200 L350,350 Z" fill="#38bdf8" opacity="0.9"/>
    <circle cx="310" cy="195" r="12" fill="#f43f5e"/>
    <circle cx="290" cy="280" r="5" fill="#fef08a"/>
    <circle cx="320" cy="310" r="5" fill="#fef08a"/>`
  ),

  'hop-phu-kien-dao-dia-nen': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff1f2"/>
      <stop offset="100%" stop-color="#fed7aa"/>
    </linearGradient>`,
    `<!-- Plate stack -->
    <ellipse cx="200" cy="300" rx="60" ry="22" fill="#ffffff" stroke="#f43f5e" stroke-width="2"/>
    <ellipse cx="200" cy="290" rx="58" ry="20" fill="#fff1f2"/>
    <!-- Knife -->
    <path d="M250,210 L330,330 L315,340 L235,220 Z" fill="#cbd5e1" stroke="#94a3b8" stroke-width="2"/>
    <!-- Candles pack -->
    <rect x="290" y="240" width="8" height="70" rx="3" fill="#f472b6"/>
    <rect x="305" y="240" width="8" height="70" rx="3" fill="#60a5fa"/>
    <rect x="320" y="240" width="8" height="70" rx="3" fill="#facc15"/>`
  ),

  'bang-topper-chuc-mung': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fef9c3"/>
      <stop offset="100%" stop-color="#fef08a"/>
    </linearGradient>`,
    `<!-- Golden stick -->
    <line x1="250" y1="260" x2="250" y2="380" stroke="#ca8a04" stroke-width="8" stroke-linecap="round"/>
    <!-- Circular / Heart Topper -->
    <circle cx="250" cy="220" r="85" fill="#fef08a" stroke="#ca8a04" stroke-width="6"/>
    <text x="250" y="210" font-family="'Playfair Display', serif" font-size="22" font-weight="700" fill="#a16207" text-anchor="middle">Happy</text>
    <text x="250" y="240" font-family="'Playfair Display', serif" font-size="20" font-weight="700" fill="#a16207" text-anchor="middle">Birthday</text>`
  ),

  'cake-default': svgWrap(
    `<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fff1f2"/>
      <stop offset="100%" stop-color="#fce7f3"/>
    </linearGradient>`,
    `<rect x="130" y="240" width="240" height="135" rx="18" fill="#fffdfa"/>
    <ellipse cx="250" cy="240" rx="120" ry="36" fill="#fce7f3"/>
    <circle cx="250" cy="200" r="20" fill="#f43f5e"/>
    <circle cx="210" cy="210" r="14" fill="#fb7185"/>
    <circle cx="290" cy="210" r="14" fill="#fb7185"/>`
  )
};

for (const [id, svg] of Object.entries(cakeSvgs)) {
  fs.writeFileSync(path.join(outDir, `${id}.svg`), svg, 'utf8');
}
console.log(`Generated ${Object.keys(cakeSvgs).length} cake SVGs successfully.`);

