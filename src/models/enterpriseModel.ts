/**
 * USS Enterprise (NCC-1701) - Constitution Class / Movie-Accurate Reference
 * Photorealistic procedural 3D model with PBR metallic-roughness materials (#e8ecf2, metalness: 0.5, roughness: 0.25),
 * sealed Bussard collectors with solid rear backplates, flush embedded blue warp grilles,
 * grounded bridge teardrop fairing with integrated impulse engines,
 * 45-degree slanted solid neck, symmetrical closed clamshell shuttlebay,
 * and watertight closed monolithic hull meshes with zero open internal gaps.
 */

import * as THREE from 'three';

export type AlertMode = 'normal' | 'yellow' | 'red';
export type HullFinish = 'standard' | 'classic' | 'section31' | 'wireframe';

export interface EnterpriseController {
  group: THREE.Group;
  saucerGroup: THREE.Group;
  neckGroup: THREE.Group;
  engGroup: THREE.Group;
  pylonsGroup: THREE.Group;
  nacelleLeftGroup: THREE.Group;
  nacelleRightGroup: THREE.Group;
  getTorpedoOrigin: () => THREE.Vector3;
  getPhaserOrigins: () => [THREE.Vector3, THREE.Vector3];
  getSubsystemPosition: (name: string) => THREE.Vector3;
  setAlertMode: (mode: AlertMode) => void;
  setWarpActive: (active: boolean) => void;
  setHullFinish: (finish: HullFinish) => void;
  setExploded: (factor: number) => void;
  update: (deltaSeconds: number, elapsedSeconds: number) => void;
  dispose: () => void;
}

/**
 * Deterministic pseudo-random number for consistent Aztec paneling across frames
 */
function pseudoHash(x: number, y: number): number {
  const sin = Math.sin(x * 12.9898 + y * 78.233);
  return (sin * 43758.5453123) % 1;
}

/**
 * Generates an ultra-high resolution (4096 x 4096) procedural CanvasTexture
 * for the Saucer Dorsal Hull:
 * - Bright pearlescent silver-white (#e8ecf2) base coat with subtle two-tone Aztec tiles
 * - Very faint grid lines (light grey #d0d5dd at 15% opacity)
 * - "U.S.S. ENTERPRISE" and "NCC-1701" decals on the FORWARD (bow) half in front of the bridge
 * - Zero random black circles on the rear saucer
 * - Starfleet red pennant stripe and forward RCS thruster quads
 */
function createSaucerDorsalTexture(): THREE.CanvasTexture {
  const size = 4096;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  // 1. Base hull coat: Movie-accurate Starfleet pearlescent studio grey (PBR calibrated)
  ctx.fillStyle = '#a4aebc';
  ctx.fillRect(0, 0, size, size);

  // 2. Clear two-tone pearlescent Aztec paneling pattern with visible contrast
  const ringStep = 68;
  for (let r = 380; r < 2010; r += ringStep) {
    const sectors = Math.floor((r * Math.PI * 2) / 110);
    for (let s = 0; s < sectors; s++) {
      const a0 = (s / sectors) * Math.PI * 2;
      const a1 = ((s + 0.96) / sectors) * Math.PI * 2;

      const h1 = Math.abs(pseudoHash(r, s));
      const h2 = Math.abs(pseudoHash(r * 2.3, s * 1.9));

      if (h1 > 0.22) {
        ctx.beginPath();
        ctx.arc(cx, cy, r + ringStep * 0.94, a0, a1);
        ctx.arc(cx, cy, r + 2, a1, a0, true);
        ctx.closePath();

        // Multi-tone metallic Aztec armor plating
        if (h1 > 0.72) {
          ctx.fillStyle = 'rgba(235, 242, 252, 0.45)';
        } else if (h2 > 0.5) {
          ctx.fillStyle = 'rgba(195, 205, 220, 0.35)';
        } else {
          ctx.fillStyle = 'rgba(135, 148, 168, 0.32)';
        }
        ctx.fill();
      }

      if (h2 > 0.62) {
        const midA = (a0 + a1) * 0.5;
        ctx.beginPath();
        ctx.arc(cx, cy, r + ringStep * 0.5, a0, midA);
        ctx.arc(cx, cy, r + 3, midA, a0, true);
        ctx.closePath();
        ctx.fillStyle = 'rgba(125, 138, 158, 0.36)';
        ctx.fill();
      }
    }
  }

  // 3. Crisp concentric saucer grid seams (high-definition panel lines)
  ctx.strokeStyle = 'rgba(45, 55, 72, 0.55)';
  ctx.lineWidth = 2.5;
  const concentricRings = [
    380, 520, 660, 800, 940, 1080, 1220, 1360, 1500, 1640, 1780, 1920, 2010,
  ];
  concentricRings.forEach((r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // 4. Crisp radial saucer spoke grid seams
  ctx.strokeStyle = 'rgba(45, 55, 72, 0.45)';
  ctx.lineWidth = 2.0;
  const numSpokes = 64;
  for (let i = 0; i < numSpokes; i++) {
    const angle = (i / numSpokes) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle) * 380, cy + Math.sin(angle) * 380);
    ctx.lineTo(cx + Math.cos(angle) * 2010, cy + Math.sin(angle) * 2010);
    ctx.stroke();
  }

  // 5. Starfleet Red Pennant Framing Arcs on Forward Saucer (matching reference schematic)
  // Outer Pennant Arc (expanded to 1710 to frame the larger 295px registry font)
  const outerPennantR = 1710;
  ctx.strokeStyle = '#c41e24';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.arc(cx, cy, outerPennantR, Math.PI * 0.17, Math.PI * 0.83);
  ctx.stroke();

  // Inner Pennant Arc
  const innerPennantR = 1320;
  ctx.strokeStyle = '#c41e24';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(cx, cy, innerPennantR, Math.PI * 0.22, Math.PI * 0.78);
  ctx.stroke();

  // Golden Starfleet Delta Chevron Arrows at pennant tips
  [outerPennantR, innerPennantR].forEach((pR) => {
    [Math.PI * 0.175, Math.PI * 0.825].forEach((arrowAngle) => {
      const ax = cx + Math.cos(arrowAngle) * pR;
      const ay = cy + Math.sin(arrowAngle) * pR;
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(arrowAngle + Math.PI / 2);
      ctx.fillStyle = '#f0b020';
      ctx.beginPath();
      ctx.moveTo(-10, -16);
      ctx.lineTo(16, 0);
      ctx.lineTo(-10, 16);
      ctx.lineTo(-2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  });

  // 6. Forward Yellow/Amber RCS Thruster Quads with Micro Nozzles at Outer Rim
  const rcsAngles = [Math.PI * 0.28, Math.PI * 0.72, Math.PI * 1.28, Math.PI * 1.72];
  rcsAngles.forEach((ang) => {
    const rx = cx + Math.cos(ang) * 1940;
    const ry = cy + Math.sin(ang) * 1940;
    ctx.save();
    ctx.translate(rx, ry);
    ctx.rotate(ang + Math.PI / 2);
    ctx.fillStyle = '#e69022';
    ctx.fillRect(-18, -28, 36, 56);
    ctx.strokeStyle = '#683605';
    ctx.lineWidth = 2;
    ctx.strokeRect(-18, -28, 36, 56);
    // Dark nozzles
    ctx.fillStyle = '#0f1115';
    [-12, 12].forEach((ny) => {
      ctx.fillRect(-12, ny - 5, 10, 10);
      ctx.fillRect(2, ny - 5, 10, 10);
    });
    ctx.restore();
  });

  // 7. Proportional Curved Text Drawing Helper
  // Measures character widths and applies clean Starfleet kerning so every letter is crisp and distinct
  const drawCurvedText = (
    text: string,
    radius: number,
    centerAngle: number,
    extraLetterSpacingPx: number,
    font: string,
    color: string
  ) => {
    ctx.save();
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const chars = text.split('');
    const charWidths = chars.map((ch) => {
      if (ch === ' ') {
        return ctx.measureText('M').width * 0.35; // Clean natural word space
      }
      return ctx.measureText(ch).width;
    });

    // Calculate angular width per character using measured width + clean spacing
    const angularWidths = charWidths.map((w) => (w + extraLetterSpacingPx) / radius);
    const totalAngle = angularWidths.reduce((sum, a) => sum + a, 0);

    // Reading from left to right across the forward bow (+Z):
    let currentAngle = centerAngle + totalAngle / 2;

    for (let i = 0; i < chars.length; i++) {
      const halfA = angularWidths[i] / 2;
      const charAngle = currentAngle - halfA;
      currentAngle -= angularWidths[i];

      if (chars[i] !== ' ') {
        const x = cx + Math.cos(charAngle) * radius;
        const y = cy + Math.sin(charAngle) * radius;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(charAngle - Math.PI / 2);
        ctx.fillText(chars[i], 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();
  };

  // 8. FORWARD (BOW) DECALS - MOVIE-ACCURATE STARFLEET MARKINGS:
  // "NCC - 1701" - Main Starfleet Registry in bold crisp solid black on forward dorsal bow
  // Clean 18px letter spacing ensures 'N' and 'C' have distinct separation without any visual collision (no "NOC" illusion),
  // while keeping natural, authentic Starfleet word cohesion (no abnormal scattered gaps!)
  drawCurvedText(
    'NCC - 1701',
    1520,
    Math.PI / 2, // Centered directly on bow (+Z)
    18,
    'bold 240px "Arial", "Helvetica Neue", "Segoe UI", sans-serif',
    '#030508'
  );

  // "U.S.S. ENTERPRISE" on inner concentric arc in front of the bridge
  drawCurvedText(
    'U.S.S. ENTERPRISE',
    1175,
    Math.PI / 2, // In front of bridge
    10,
    'bold 125px "Arial", "Helvetica Neue", "Segoe UI", sans-serif',
    '#030508'
  );

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false; // Directly matches UV coordinates without inversion
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural Saucer Ventral Texture (Underside):
 * Movie-accurate studio grey (#a4aebc), multi-tone Aztec panels, crisp seams, and forward registry.
 */
function createSaucerVentralTexture(): THREE.CanvasTexture {
  const size = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#a4aebc';
  ctx.fillRect(0, 0, size, size);

  // Ventral Aztec paneling pattern
  const ringStep = 72;
  for (let r = 240; r < 960; r += ringStep) {
    const sectors = Math.floor((r * Math.PI * 2) / 100);
    for (let s = 0; s < sectors; s++) {
      const a0 = (s / sectors) * Math.PI * 2;
      const a1 = ((s + 0.95) / sectors) * Math.PI * 2;
      const h = Math.abs(pseudoHash(r * 1.7, s * 2.1));
      if (h > 0.28) {
        ctx.beginPath();
        ctx.arc(cx, cy, r + ringStep * 0.92, a0, a1);
        ctx.arc(cx, cy, r + 2, a1, a0, true);
        ctx.closePath();
        ctx.fillStyle = h > 0.7 ? 'rgba(235, 242, 252, 0.42)' : 'rgba(135, 148, 168, 0.32)';
        ctx.fill();
      }
    }
  }

  // Crisp concentric grid seams
  ctx.strokeStyle = 'rgba(45, 55, 72, 0.55)';
  ctx.lineWidth = 2.5;
  [250, 420, 600, 780, 920].forEach((r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Crisp radial grid seams
  ctx.strokeStyle = 'rgba(45, 55, 72, 0.45)';
  ctx.lineWidth = 2.0;
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 250, cy + Math.sin(a) * 250);
    ctx.lineTo(cx + Math.cos(a) * 920, cy + Math.sin(a) * 920);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural Nacelle Base Hull Texture:
 * Clean Aztec armor plating and longitudinal panel seams for the nacelle lathe body.
 */
function createNacelleBaseTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#a4aebc';
  ctx.fillRect(0, 0, width, height);

  // Aztec armor plating
  for (let x = 60; x < width - 60; x += 110) {
    for (let y = 30; y < height - 30; y += 70) {
      const h = Math.abs(pseudoHash(x * 1.5, y * 2.1));
      if (h > 0.32) {
        ctx.fillStyle = h > 0.72 ? 'rgba(235, 242, 252, 0.38)' : 'rgba(135, 148, 168, 0.3)';
        ctx.fillRect(x + 2, y + 2, 106, 66);
      }
    }
  }

  // Crisp longitudinal seams
  ctx.strokeStyle = 'rgba(45, 55, 72, 0.55)';
  ctx.lineWidth = 2.0;
  for (let y = 32; y < height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Circumferential panel seams
  for (let x = 120; x < width; x += 128) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Procedural Nacelle Red Strap & Black NCC-1701 Livery Texture:
 * Replicates user reference Image 2 with 100% fidelity:
 * Red chevrons (<< or >>), horizontal solid red strap, inline bold black "NCC-1701",
 * continuing red strap, and dark aft termination vent cap with vertical cooling slats.
 */
function createNacelleStrapTexture(isPort: boolean): THREE.CanvasTexture {
  const width = 2048;
  const height = 256;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Base hull coat: Movie-accurate Starfleet pearlescent studio grey
  ctx.fillStyle = '#a4aebc';
  ctx.fillRect(0, 0, width, height);

  // 2. Aztec armor plating
  for (let x = 40; x < width - 40; x += 110) {
    for (let y = 15; y < height - 15; y += 50) {
      const h = Math.abs(pseudoHash(x * 1.7, y * 2.3));
      if (h > 0.32) {
        ctx.fillStyle = h > 0.72 ? 'rgba(235, 242, 252, 0.40)' : 'rgba(135, 148, 168, 0.30)';
        ctx.fillRect(x + 2, y + 2, 106, 46);
      }
    }
  }

  // 3. Crisp horizontal panel seams
  ctx.strokeStyle = 'rgba(45, 55, 72, 0.50)';
  ctx.lineWidth = 2.0;
  [25, 230].forEach((y) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  });

  // Vertical panel seams
  for (let x = 160; x < width; x += 180) {
    ctx.beginPath();
    ctx.moveTo(x, 15);
    ctx.lineTo(x, height - 15);
    ctx.stroke();
  }

  const cy = height / 2; // 128
  const strapH = 48;
  const strapY = cy - strapH / 2;
  const redColor = '#c41414'; // Vibrant Starfleet red matching Image 2
  const blackColor = '#05070a'; // Deep solid black matching Image 2

  if (!isPort) {
    // Starboard orientation: Forward is on the LEFT, Aft is on the RIGHT (exact match to Image 2!)
    // 1. Red Double Chevrons << pointing to the left (forward towards bow)
    const drawChevronLeft = (tipX: number) => {
      ctx.fillStyle = redColor;
      ctx.beginPath();
      ctx.moveTo(tipX, cy);
      ctx.lineTo(tipX + 28, cy - strapH / 2);
      ctx.lineTo(tipX + 40, cy - strapH / 2);
      ctx.lineTo(tipX + 16, cy);
      ctx.lineTo(tipX + 40, cy + strapH / 2);
      ctx.lineTo(tipX + 28, cy + strapH / 2);
      ctx.closePath();
      ctx.fill();
    };

    drawChevronLeft(110);
    drawChevronLeft(145);

    // 2. Forward Red Strap
    const fwdStrapStart = 195;
    const fwdStrapEnd = 840;
    ctx.fillStyle = redColor;
    ctx.fillRect(fwdStrapStart, strapY, fwdStrapEnd - fwdStrapStart, strapH);

    // 3. Crisp Black Text "NCC-1701" in-line with the red strap
    ctx.save();
    ctx.font = '900 52px "Arial Black", "Impact", "Arial", sans-serif';
    ctx.fillStyle = blackColor;
    ctx.textBaseline = 'middle';

    const text = 'NCC-1701';
    let textX = 868;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      ctx.fillText(ch, textX, cy + 1);
      textX += ctx.measureText(ch).width + 6;
    }
    const textEnd = textX;
    ctx.restore();

    // 4. Aft Red Strap continuing after the text
    const aftStrapStart = textEnd + 24;
    const aftStrapEnd = 1860;
    ctx.fillStyle = redColor;
    ctx.fillRect(aftStrapStart, strapY, aftStrapEnd - aftStrapStart, strapH);

    // 5. Aft Dark Vent/Louver Cap at termination of red strap
    const ventX = aftStrapEnd + 10;
    const ventW = 56;
    const ventH = strapH + 6;
    const ventY = cy - ventH / 2;

    ctx.fillStyle = '#181d26';
    ctx.fillRect(ventX, ventY, ventW, ventH);
    ctx.strokeStyle = '#424c5e';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(ventX, ventY, ventW, ventH);

    // Vertical cooling slats
    for (let vx = ventX + 8; vx < ventX + ventW - 4; vx += 7) {
      ctx.strokeStyle = '#606c82';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(vx, ventY + 4);
      ctx.lineTo(vx, ventY + ventH - 4);
      ctx.stroke();
    }
  } else {
    // Port orientation: Forward is on the RIGHT, Aft is on the LEFT
    // Text reads normally left-to-right, chevrons point to the RIGHT (forward towards bow)
    // 1. Aft Dark Vent/Louver Cap at far left
    const ventX = 120;
    const ventW = 56;
    const ventH = strapH + 6;
    const ventY = cy - ventH / 2;

    ctx.fillStyle = '#181d26';
    ctx.fillRect(ventX, ventY, ventW, ventH);
    ctx.strokeStyle = '#424c5e';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(ventX, ventY, ventW, ventH);

    for (let vx = ventX + 8; vx < ventX + ventW - 4; vx += 7) {
      ctx.strokeStyle = '#606c82';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(vx, ventY + 4);
      ctx.lineTo(vx, ventY + ventH - 4);
      ctx.stroke();
    }

    // 2. Aft Red Strap
    const aftStrapStart = ventX + ventW + 10;
    const aftStrapEnd = 760;
    ctx.fillStyle = redColor;
    ctx.fillRect(aftStrapStart, strapY, aftStrapEnd - aftStrapStart, strapH);

    // 3. Crisp Black Text "NCC-1701" in-line with the red strap
    ctx.save();
    ctx.font = '900 52px "Arial Black", "Impact", "Arial", sans-serif';
    ctx.fillStyle = blackColor;
    ctx.textBaseline = 'middle';

    const text = 'NCC-1701';
    let textX = 788;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      ctx.fillText(ch, textX, cy + 1);
      textX += ctx.measureText(ch).width + 6;
    }
    const textEnd = textX;
    ctx.restore();

    // 4. Forward Red Strap continuing towards the bow
    const fwdStrapStart = textEnd + 24;
    const fwdStrapEnd = 1780;
    ctx.fillStyle = redColor;
    ctx.fillRect(fwdStrapStart, strapY, fwdStrapEnd - fwdStrapStart, strapH);

    // 5. Forward Red Double Chevrons >> pointing to the right (forward towards bow)
    const drawChevronRight = (tipX: number) => {
      ctx.fillStyle = redColor;
      ctx.beginPath();
      ctx.moveTo(tipX, cy);
      ctx.lineTo(tipX - 28, cy - strapH / 2);
      ctx.lineTo(tipX - 40, cy - strapH / 2);
      ctx.lineTo(tipX - 16, cy);
      ctx.lineTo(tipX - 40, cy + strapH / 2);
      ctx.lineTo(tipX - 28, cy + strapH / 2);
      ctx.closePath();
      ctx.fill();
    };

    drawChevronRight(1840);
    drawChevronRight(1875);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 16;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates an emissive window map: tiny glowing white/warm-yellow rectangular portholes
 */
function createHullSideTexture(): { map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture } {
  const width = 2048;
  const height = 512;

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d')!;

  const emisCanvas = document.createElement('canvas');
  emisCanvas.width = width;
  emisCanvas.height = height;
  const eCtx = emisCanvas.getContext('2d')!;

  dCtx.fillStyle = '#a4aebc';
  dCtx.fillRect(0, 0, width, height);

  eCtx.fillStyle = '#000000';
  eCtx.fillRect(0, 0, width, height);

  // Plating seams
  dCtx.strokeStyle = 'rgba(45, 55, 72, 0.55)';
  dCtx.lineWidth = 2.0;
  for (let y = 32; y < height; y += 48) {
    dCtx.beginPath();
    dCtx.moveTo(0, y);
    dCtx.lineTo(width, y);
    dCtx.stroke();
  }

  // Red Starfleet pennant stripe along engineering hull
  dCtx.fillStyle = '#c41e24';
  dCtx.fillRect(180, 228, 1680, 24);
  dCtx.fillStyle = '#030508';
  dCtx.font = '900 52px "Arial Black", sans-serif';
  dCtx.fillText('NCC - 1701', 420, 212);
  dCtx.fillText('NCC - 1701', 1420, 212);

  // Emissive Window Map: Tiny glowing white & warm-yellow portholes
  const windowRows = [110, 150, 285, 330, 380];
  windowRows.forEach((wy) => {
    for (let wx = 80; wx < width - 80; wx += 24) {
      if ((wx * wy) % 7 !== 0 && (wx + wy) % 5 !== 0) {
        const isWarm = (wx + wy) % 3 === 0;
        const winColor = isWarm ? '#fff8e2' : '#e0f4ff';
        dCtx.fillStyle = winColor;
        dCtx.fillRect(wx, wy, 10, 5);
        eCtx.fillStyle = winColor;
        eCtx.fillRect(wx, wy, 10, 5);
      }
    }
  });

  const map = new THREE.CanvasTexture(diffCanvas);
  const emissiveMap = new THREE.CanvasTexture(emisCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 16;
  emissiveMap.anisotropy = 16;
  return { map, emissiveMap };
}

/**
 * Creates the movie-accurate glowing Navigational Deflector Dish texture matching user Image 2:
 * An array of glowing cyan-white radial spoke lines ("lines lines as show in the images"),
 * outer luminous nodes, segmented brass/gold concentric core, and central dark aperture emitter.
 */
function createDeflectorTexture(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;

  // 1. Deep cinematic obsidian/space-blue backdrop
  ctx.fillStyle = '#020612';
  ctx.fillRect(0, 0, size, size);

  // Radial dark background gradient
  const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 490);
  bgGrad.addColorStop(0.0, '#0a1a30');
  bgGrad.addColorStop(0.35, '#051226');
  bgGrad.addColorStop(0.7, '#020917');
  bgGrad.addColorStop(1.0, '#01040a');
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, 480, 0, Math.PI * 2);
  ctx.fill();

  // 2. Outer luminous cyan glow corona behind the spokes
  const corona = ctx.createRadialGradient(cx, cy, 200, cx, cy, 460);
  corona.addColorStop(0.0, 'rgba(0, 180, 240, 0.05)');
  corona.addColorStop(0.6, 'rgba(0, 210, 255, 0.28)');
  corona.addColorStop(0.9, 'rgba(72, 230, 255, 0.45)');
  corona.addColorStop(1.0, 'rgba(0, 140, 220, 0.0)');
  ctx.fillStyle = corona;
  ctx.beginPath();
  ctx.arc(cx, cy, 465, 0, Math.PI * 2);
  ctx.fill();

  // 3. Prominent Radiant Cyan Spoke Lines ("lines lines as show in the images")
  const vanes = 48;
  const rInner = 175;
  const rOuter = 445;

  // Pass 1: Cyan bloom/halo behind each spoke line
  ctx.strokeStyle = 'rgba(0, 220, 255, 0.55)';
  ctx.lineWidth = 8.0;
  ctx.lineCap = 'round';
  for (let i = 0; i < vanes; i++) {
    const a = (i / vanes) * Math.PI * 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    ctx.beginPath();
    ctx.moveTo(cx + cos * rInner, cy + sin * rInner);
    ctx.lineTo(cx + cos * rOuter, cy + sin * rOuter);
    ctx.stroke();
  }

  // Pass 2: Intense razor-sharp white/cyan core line
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3.2;
  for (let i = 0; i < vanes; i++) {
    const a = (i / vanes) * Math.PI * 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    ctx.beginPath();
    ctx.moveTo(cx + cos * rInner, cy + sin * rInner);
    ctx.lineTo(cx + cos * rOuter, cy + sin * rOuter);
    ctx.stroke();

    // Glowing cyan-white node/emitter dot at the outer rim (Image 2)
    ctx.fillStyle = '#00f7ff';
    ctx.beginPath();
    ctx.arc(cx + cos * rOuter, cy + sin * rOuter, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx + cos * rOuter, cy + sin * rOuter, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Outer Concentric Connecting Cyan Ring at line tips
  ctx.strokeStyle = 'rgba(0, 230, 255, 0.85)';
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.arc(cx, cy, rOuter, 0, Math.PI * 2);
  ctx.stroke();

  // Outer dark rim lip
  ctx.strokeStyle = '#1a2636';
  ctx.lineWidth = 14.0;
  ctx.beginPath();
  ctx.arc(cx, cy, 470, 0, Math.PI * 2);
  ctx.stroke();

  // 5. Middle Segmented Brass/Gold Concentric Core Ring (Image 2)
  const rGoldInner = 90;
  const rGoldOuter = 175;
  const goldGrad = ctx.createRadialGradient(cx, cy, rGoldInner, cx, cy, rGoldOuter);
  goldGrad.addColorStop(0.0, '#d4af37');
  goldGrad.addColorStop(0.4, '#f5d77f');
  goldGrad.addColorStop(0.7, '#b8860b');
  goldGrad.addColorStop(1.0, '#7c5a08');
  ctx.fillStyle = goldGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, rGoldOuter, 0, Math.PI * 2);
  ctx.arc(cx, cy, rGoldInner, 0, Math.PI * 2, true);
  ctx.fill();

  // Radial spoke dividers across the gold ring (16 sectors as shown in Image 2)
  ctx.strokeStyle = 'rgba(30, 20, 5, 0.75)';
  ctx.lineWidth = 3.0;
  for (let s = 0; s < 16; s++) {
    const sa = (s / 16) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(sa) * rGoldInner, cy + Math.sin(sa) * rGoldInner);
    ctx.lineTo(cx + Math.cos(sa) * rGoldOuter, cy + Math.sin(sa) * rGoldOuter);
    ctx.stroke();
  }

  // Concentric micro-grooves inside gold ring
  [120, 150].forEach((rg) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, rg, 0, Math.PI * 2);
    ctx.stroke();
  });

  // Inner border of spokes (anchor ring)
  ctx.strokeStyle = '#00f7ff';
  ctx.lineWidth = 4.0;
  ctx.beginPath();
  ctx.arc(cx, cy, rInner, 0, Math.PI * 2);
  ctx.stroke();

  // 6. Central Dark Aperture Emitter Hub (Image 2)
  const hubGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, rGoldInner);
  hubGrad.addColorStop(0.0, '#001a33');
  hubGrad.addColorStop(0.5, '#050c18');
  hubGrad.addColorStop(0.9, '#1a2230');
  hubGrad.addColorStop(1.0, '#2d3748');
  ctx.fillStyle = hubGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, rGoldInner, 0, Math.PI * 2);
  ctx.fill();

  // Center dark aperture hole with bright focal cyan point
  ctx.fillStyle = '#020408';
  ctx.beginPath();
  ctx.arc(cx, cy, 38, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#00f7ff';
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Creates the glowing red/amber impulse engine exhaust honeycomb texture matching user Image 3:
 * Dual glowing red/orange exhaust grilles with dark hexagonal honeycomb matrix.
 */
function createImpulseHoneycombTexture(): { map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture } {
  const width = 512;
  const height = 256;

  const diffCanvas = document.createElement('canvas');
  diffCanvas.width = width;
  diffCanvas.height = height;
  const dCtx = diffCanvas.getContext('2d')!;

  const emisCanvas = document.createElement('canvas');
  emisCanvas.width = width;
  emisCanvas.height = height;
  const eCtx = emisCanvas.getContext('2d')!;

  // Glowing orange-red base fill
  const redGrad = dCtx.createLinearGradient(0, 0, width, height);
  redGrad.addColorStop(0.0, '#ff1a00');
  redGrad.addColorStop(0.5, '#ff4400');
  redGrad.addColorStop(1.0, '#ff8800');

  dCtx.fillStyle = redGrad;
  dCtx.fillRect(0, 0, width, height);
  eCtx.fillStyle = redGrad;
  eCtx.fillRect(0, 0, width, height);

  // Draw regular hexagonal honeycomb cells across the exhaust
  const hexRadius = 14;
  const hexH = Math.sqrt(3) * hexRadius;
  const hexW = 2 * hexRadius;
  const xStep = 1.5 * hexRadius;
  const yStep = hexH;

  dCtx.strokeStyle = '#12151c';
  dCtx.lineWidth = 3.5;
  eCtx.strokeStyle = '#05070a';
  eCtx.lineWidth = 3.5;

  for (let col = 0; col * xStep < width + hexW; col++) {
    const x = col * xStep;
    const yOffset = (col % 2) * (hexH / 2);
    for (let y = -hexH; y < height + hexH; y += yStep) {
      const cy = y + yOffset;

      // Hexagon path
      dCtx.beginPath();
      eCtx.beginPath();
      for (let side = 0; side < 6; side++) {
        const angle = (side / 6) * Math.PI * 2;
        const hx = x + Math.cos(angle) * hexRadius;
        const hy = cy + Math.sin(angle) * hexRadius;
        if (side === 0) {
          dCtx.moveTo(hx, hy);
          eCtx.moveTo(hx, hy);
        } else {
          dCtx.lineTo(hx, hy);
          eCtx.lineTo(hx, hy);
        }
      }
      dCtx.closePath();
      eCtx.closePath();
      dCtx.stroke();
      eCtx.stroke();

      // Glowing core in each honeycomb cell
      dCtx.fillStyle = '#ffbb33';
      dCtx.beginPath();
      dCtx.arc(x, cy, hexRadius * 0.42, 0, Math.PI * 2);
      dCtx.fill();

      eCtx.fillStyle = '#ffeedd';
      eCtx.beginPath();
      eCtx.arc(x, cy, hexRadius * 0.42, 0, Math.PI * 2);
      eCtx.fill();
    }
  }

  const map = new THREE.CanvasTexture(diffCanvas);
  const emissiveMap = new THREE.CanvasTexture(emisCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 16;
  emissiveMap.anisotropy = 16;
  return { map, emissiveMap };
}

/**
 * Creates the glowing blue warp energy plasma grille texture.
 */
function createWarpGrilleTexture(): { map: THREE.CanvasTexture; emissiveMap: THREE.CanvasTexture } {
  const width = 1024;
  const height = 128;

  const c1 = document.createElement('canvas');
  c1.width = width;
  c1.height = height;
  const ctx1 = c1.getContext('2d')!;

  const c2 = document.createElement('canvas');
  c2.width = width;
  c2.height = height;
  const ctx2 = c2.getContext('2d')!;

  const grad = ctx1.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0.0, '#0a2244');
  grad.addColorStop(0.25, '#33aaff');
  grad.addColorStop(0.5, '#77ddff');
  grad.addColorStop(0.75, '#33aaff');
  grad.addColorStop(1.0, '#0a2244');

  ctx1.fillStyle = grad;
  ctx1.fillRect(0, 0, width, height);

  ctx2.fillStyle = '#000000';
  ctx2.fillRect(0, 0, width, height);

  const gradEmis = ctx2.createLinearGradient(0, 0, 0, height);
  gradEmis.addColorStop(0.0, '#000000');
  gradEmis.addColorStop(0.3, '#0088ff');
  gradEmis.addColorStop(0.5, '#44ccff');
  gradEmis.addColorStop(0.7, '#0088ff');
  gradEmis.addColorStop(1.0, '#000000');
  ctx2.fillStyle = gradEmis;
  ctx2.fillRect(0, 0, width, height);

  // Grille micro-fins
  ctx1.strokeStyle = 'rgba(0, 15, 35, 0.7)';
  ctx1.lineWidth = 2.5;
  ctx2.strokeStyle = 'rgba(0, 0, 0, 0.85)';
  ctx2.lineWidth = 2.5;
  for (let x = 0; x < width; x += 16) {
    ctx1.beginPath();
    ctx1.moveTo(x, 0);
    ctx1.lineTo(x, height);
    ctx1.stroke();

    ctx2.beginPath();
    ctx2.moveTo(x, 0);
    ctx2.lineTo(x, height);
    ctx2.stroke();
  }

  const map = new THREE.CanvasTexture(c1);
  const emissiveMap = new THREE.CanvasTexture(c2);
  map.colorSpace = THREE.SRGBColorSpace;
  emissiveMap.colorSpace = THREE.SRGBColorSpace;
  return { map, emissiveMap };
}

/**
 * Builds the complete, photorealistic USS Enterprise (NCC-1701) 3D Model.
 */
export function createKelvinEnterprise(): EnterpriseController {
  const root = new THREE.Group();
  root.name = 'USS_Enterprise_NCC1701';

  const saucerTopTex = createSaucerDorsalTexture();
  const saucerBotTex = createSaucerVentralTexture();
  const nacelleBaseTex = createNacelleBaseTexture();
  const nacelleStrapStbdTex = createNacelleStrapTexture(false);
  const nacelleStrapPortTex = createNacelleStrapTexture(true);
  const hullSideTex = createHullSideTexture();
  const deflectorTex = createDeflectorTexture();
  const warpGrilleTex = createWarpGrilleTexture();
  const impulseHoneycombTex = createImpulseHoneycombTexture();

  // PBR Movie-Accurate Studio Materials (calibrated satin finish, no blinding washout)
  const primaryHullMat = new THREE.MeshStandardMaterial({
    color: 0xa4aebc,
    metalness: 0.22,
    roughness: 0.52,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
  });

  const dorsalHullMat = new THREE.MeshStandardMaterial({
    map: saucerTopTex,
    color: 0xffffff,
    metalness: 0.22,
    roughness: 0.52,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
  });

  const ventralHullMat = new THREE.MeshStandardMaterial({
    map: saucerBotTex,
    color: 0xffffff,
    metalness: 0.22,
    roughness: 0.52,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
  });

  const nacelleHullMat = new THREE.MeshStandardMaterial({
    map: nacelleBaseTex,
    color: 0xffffff,
    metalness: 0.22,
    roughness: 0.52,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
  });

  const nacelleStrapStbdMat = new THREE.MeshStandardMaterial({
    map: nacelleStrapStbdTex,
    color: 0xffffff,
    metalness: 0.18,
    roughness: 0.45,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
  });

  const nacelleStrapPortMat = new THREE.MeshStandardMaterial({
    map: nacelleStrapPortTex,
    color: 0xffffff,
    metalness: 0.18,
    roughness: 0.45,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
  });

  const darkTrimMat = new THREE.MeshStandardMaterial({
    color: 0x1e222a,
    metalness: 0.55,
    roughness: 0.38,
    side: THREE.DoubleSide,
  });

  const chromeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    metalness: 0.85,
    roughness: 0.22,
    side: THREE.DoubleSide,
  });

  const redStripeMat = new THREE.MeshStandardMaterial({
    color: 0xc41e24,
    metalness: 0.3,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });

  const hullWindowMat = new THREE.MeshStandardMaterial({
    map: hullSideTex.map,
    emissive: new THREE.Color(0xffffff),
    emissiveMap: hullSideTex.emissiveMap,
    emissiveIntensity: 0.55,
    metalness: 0.22,
    roughness: 0.52,
    envMapIntensity: 0.35,
    side: THREE.DoubleSide,
  });

  const warpBlueGlowMat = new THREE.MeshStandardMaterial({
    map: warpGrilleTex.map,
    color: 0x33aaff,
    emissive: new THREE.Color(0x0088ee),
    emissiveMap: warpGrilleTex.emissiveMap,
    emissiveIntensity: 2.2,
    roughness: 0.2,
    metalness: 0.1,
  });

  // Sealed translucent, frosted orange/amber hemisphere dome material
  const bussardShellMat = new THREE.MeshStandardMaterial({
    color: 0xff5511,
    emissive: new THREE.Color(0xff3300),
    emissiveIntensity: 1.8,
    roughness: 0.22,
    metalness: 0.15,
    transparent: true,
    opacity: 0.88,
  });

  // Glowing red/orange impulse engine material
  const impulseGlowMat = new THREE.MeshStandardMaterial({
    color: 0xff2200,
    emissive: new THREE.Color(0xff3300),
    emissiveIntensity: 2.8,
    roughness: 0.2,
  });

  const alertStrobeMat = new THREE.MeshStandardMaterial({
    color: 0xff1111,
    emissive: new THREE.Color(0x000000),
    emissiveIntensity: 0,
    roughness: 0.2,
  });

  // Navigational beacon lights
  const portNavMat = new THREE.MeshStandardMaterial({
    color: 0xff0000,
    emissive: new THREE.Color(0xff0000),
    emissiveIntensity: 4.5,
  });
  const stbdNavMat = new THREE.MeshStandardMaterial({
    color: 0x00ff44,
    emissive: new THREE.Color(0x00ff44),
    emissiveIntensity: 4.5,
  });
  const strobeWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xffffff),
    emissiveIntensity: 0.0,
  });

  const allMaterials = [
    primaryHullMat,
    dorsalHullMat,
    ventralHullMat,
    nacelleHullMat,
    nacelleStrapStbdMat,
    nacelleStrapPortMat,
    darkTrimMat,
    chromeMat,
    redStripeMat,
    hullWindowMat,
    warpBlueGlowMat,
    bussardShellMat,
    impulseGlowMat,
    alertStrobeMat,
    portNavMat,
    stbdNavMat,
    strobeWhiteMat,
  ];

  // Helper function to apply Planar UV Mapping to curved saucer geometry with flipY=false
  const applySaucerPlanarUV = (geo: THREE.BufferGeometry, maxRadius = 6.52) => {
    const pos = geo.attributes.position;
    const count = pos.count;
    const uvs = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      // u: 0 (port) to 1 (starboard)
      uvs[i * 2] = x / (2 * maxRadius) + 0.5;
      // v: 0 (aft stern) to 1 (forward bow)
      uvs[i * 2 + 1] = z / (2 * maxRadius) + 0.5;
    }
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  };

  // 1. PRIMARY HULL (SAUCER SECTION) - SOLID WATERTIGHT MESH
  const saucerGroup = new THREE.Group();
  saucerGroup.name = 'PrimaryHull_Saucer';
  const initialSaucerPos = new THREE.Vector3(0, 2.35, 4.8);
  saucerGroup.position.copy(initialSaucerPos);
  root.add(saucerGroup);

  // Upper Dorsal Saucer Surface - Solid apex at center (0, 0.86), no hollow hole!
  const dorsalPoints: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 0.86), // CLOSED SOLID APEX AT CENTER
    new THREE.Vector2(0.85, 0.85),
    new THREE.Vector2(1.25, 0.82),
    new THREE.Vector2(2.15, 0.72),
    new THREE.Vector2(2.35, 0.52),
    new THREE.Vector2(4.2, 0.42),
    new THREE.Vector2(6.25, 0.22),
    new THREE.Vector2(6.5, 0.1),
  ];
  const dorsalGeo = new THREE.LatheGeometry(dorsalPoints, 128);
  applySaucerPlanarUV(dorsalGeo, 6.5);
  const dorsalMesh = new THREE.Mesh(dorsalGeo, dorsalHullMat);
  saucerGroup.add(dorsalMesh);

  // Lower Ventral Saucer Surface - Solid apex at center (0, -0.72), no hollow hole!
  const ventralPoints: THREE.Vector2[] = [
    new THREE.Vector2(6.5, -0.06),
    new THREE.Vector2(6.32, -0.14),
    new THREE.Vector2(4.8, -0.28),
    new THREE.Vector2(2.4, -0.45),
    new THREE.Vector2(1.15, -0.68),
    new THREE.Vector2(0.0, -0.72), // CLOSED SOLID APEX AT CENTER
  ];
  const ventralGeo = new THREE.LatheGeometry(ventralPoints, 128);
  applySaucerPlanarUV(ventralGeo, 6.5);
  const ventralMesh = new THREE.Mesh(ventralGeo, ventralHullMat);
  saucerGroup.add(ventralMesh);

  // Saucer Outer Rim Band with Illuminated Deck Windows - Watertight cylinder
  const rimBandGeo = new THREE.CylinderGeometry(6.505, 6.505, 0.16, 128, 1, false);
  const rimBandMesh = new THREE.Mesh(rimBandGeo, hullWindowMat);
  rimBandMesh.position.y = 0.02;
  saucerGroup.add(rimBandMesh);

  // Navigation Running Lights on Saucer Rim
  const portSaucerLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), portNavMat);
  portSaucerLight.position.set(-6.48, 0.05, 0);
  saucerGroup.add(portSaucerLight);

  const stbdSaucerLight = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), stbdNavMat);
  stbdSaucerLight.position.set(6.48, 0.05, 0);
  saucerGroup.add(stbdSaucerLight);

  // GROUNDED BRIDGE MODULE & SLEEK TEARDROP FAIRING
  // Lowered Y-position so it sits flush directly on top of the saucer with ZERO gap!
  // Conical base radius reduced by 40% into a sleek teardrop fairing!
  const bridgeTeardropGroup = new THREE.Group();
  bridgeTeardropGroup.position.set(0, 0.84, -0.05);
  saucerGroup.add(bridgeTeardropGroup);

  // Tier 1: Sleek teardrop fairing base (reduced by 40% from previous cone)
  const tearBaseGeo = new THREE.CylinderGeometry(0.52, 0.82, 0.22, 48);
  tearBaseGeo.scale(0.85, 1.0, 1.55); // Elongated along Z into a streamlined teardrop
  const tearBaseMesh = new THREE.Mesh(tearBaseGeo, primaryHullMat);
  tearBaseMesh.position.set(0, 0.11, -0.15);
  bridgeTeardropGroup.add(tearBaseMesh);

  // Tier 2: Mid bridge superstructure collar
  const midBridgeGeo = new THREE.CylinderGeometry(0.42, 0.52, 0.14, 48);
  midBridgeGeo.scale(0.9, 1.0, 1.25);
  const midBridgeMesh = new THREE.Mesh(midBridgeGeo, primaryHullMat);
  midBridgeMesh.position.set(0, 0.26, -0.05);
  bridgeTeardropGroup.add(midBridgeMesh);

  // Tier 3: Command Bridge Dome
  const bridgeDomeGeo = new THREE.SphereGeometry(0.38, 36, 20, 0, Math.PI * 2, 0, Math.PI * 0.5);
  bridgeDomeGeo.scale(0.95, 0.55, 1.15);
  const bridgeDomeMesh = new THREE.Mesh(bridgeDomeGeo, chromeMat);
  bridgeDomeMesh.position.set(0, 0.33, -0.02);
  bridgeTeardropGroup.add(bridgeDomeMesh);

  // Synchronized White Strobe Beacon on Bridge Dome Apex
  const bridgeStrobe = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 16), strobeWhiteMat);
  bridgeStrobe.position.set(0, 0.55, -0.02);
  bridgeTeardropGroup.add(bridgeStrobe);

  // Forward Bridge Viewscreen
  const viewscreen = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.1), warpBlueGlowMat);
  viewscreen.position.set(0, 0.28, 0.45);
  bridgeTeardropGroup.add(viewscreen);

  // 2. DEDICATED REAR SAUCER IMPULSE PROPULSION UNIT (Matching user Image 3!)
  // Located at the exact aft rim of the saucer section directly above the connecting neck
  const impulseGroup = new THREE.Group();
  impulseGroup.name = 'Saucer_Impulse_Thrusters';
  impulseGroup.position.set(0, 0.08, -6.15);
  saucerGroup.add(impulseGroup);

  // 1. Sleek, low-profile impulse cowl / fairing housing
  const impulseHousingGeo = new THREE.BoxGeometry(3.6, 0.44, 1.05);
  const impulseHousingMesh = new THREE.Mesh(impulseHousingGeo, darkTrimMat);
  impulseHousingMesh.position.set(0, 0.14, 0);
  impulseGroup.add(impulseHousingMesh);

  // Upper aerodynamic beveled lip blending into saucer dorsal slope
  const upperLipGeo = new THREE.BoxGeometry(3.2, 0.14, 0.75);
  const upperLipMesh = new THREE.Mesh(upperLipGeo, primaryHullMat);
  upperLipMesh.position.set(0, 0.36, 0.1);
  impulseGroup.add(upperLipMesh);

  // 2. Dual Honeycomb Exhaust Grilles (Left & Right) matching Image 3
  const honeycombMat = new THREE.MeshStandardMaterial({
    map: impulseHoneycombTex.map,
    emissive: new THREE.Color(0xff3300),
    emissiveMap: impulseHoneycombTex.emissiveMap,
    emissiveIntensity: 3.6,
    roughness: 0.25,
    metalness: 0.2,
  });
  allMaterials.push(honeycombMat);

  [-0.92, 0.92].forEach((tx) => {
    // Glowing honeycomb thruster face facing aft (-Z)
    const grilleMesh = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.26, 0.06), honeycombMat);
    grilleMesh.position.set(tx, 0.14, -0.53);
    impulseGroup.add(grilleMesh);

    // Beveled frame surrounding each thruster port
    const frameGeo = new THREE.BoxGeometry(1.22, 0.34, 0.08);
    const frameMesh = new THREE.Mesh(frameGeo, darkTrimMat);
    frameMesh.position.set(tx, 0.14, -0.50);
    impulseGroup.add(frameMesh);
  });

  // 3. Central Dark Trapezoidal Divider Wedge between thrusters (Image 3)
  const dividerGeo = new THREE.BoxGeometry(0.38, 0.42, 0.22);
  const dividerMesh = new THREE.Mesh(dividerGeo, darkTrimMat);
  dividerMesh.position.set(0, 0.14, -0.51);
  impulseGroup.add(dividerMesh);

  // 4. Horizontal Accent Slats extending to port and starboard along the saucer rim (Image 3)
  [-2.15, 2.15].forEach((sx) => {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.10, 0.08), darkTrimMat);
    slat.position.set(sx, 0.14, -0.49);
    impulseGroup.add(slat);
  });

  // 5. Twin Downward Spotlights illuminating the neck spine (Image 3)
  [-0.38, 0.38].forEach((lx) => {
    const spotFixture = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.09, 0.12, 16),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: new THREE.Color(0xddeeff),
        emissiveIntensity: 4.5,
      })
    );
    spotFixture.position.set(lx, -0.08, -0.25);
    spotFixture.rotation.x = 0.35;
    impulseGroup.add(spotFixture);

    const downLight = new THREE.PointLight(0xaaddff, 0.45, 6.5);
    downLight.position.set(lx, -0.22, -0.35);
    impulseGroup.add(downLight);
  });

  // Ventral Planetary Sensor Dome
  const ventralDomeGeo = new THREE.SphereGeometry(1.15, 36, 20, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5);
  const ventralDome = new THREE.Mesh(ventralDomeGeo, chromeMat);
  ventralDome.position.set(0, -0.52, 0);
  ventralDome.scale.set(1, 0.45, 1);
  saucerGroup.add(ventralDome);

  const ventralRingGeo = new THREE.CylinderGeometry(1.55, 1.35, 0.18, 48, 1, false);
  const ventralRing = new THREE.Mesh(ventralRingGeo, hullWindowMat);
  ventralRing.position.set(0, -0.58, 0);
  saucerGroup.add(ventralRing);

  // Ventral Phaser Strips
  [-2.8, 2.8].forEach((px) => {
    const phaserStrip = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.25), darkTrimMat);
    phaserStrip.position.set(px, -0.4, 2.5);
    phaserStrip.rotation.y = px > 0 ? -0.4 : 0.4;
    saucerGroup.add(phaserStrip);
  });

  // 3. DORSAL CONNECTING NECK - ORGANIC 3D LOFTED AERODYNAMIC WING (Matching Images 4 & 5!)
  // Features a streamlined airfoil cross-section with an hourglass waist that flares gracefully
  // into the secondary hull at the bottom and into the saucer underside at the top.
  const neckGroup = new THREE.Group();
  neckGroup.name = 'ConnectingNeck';
  root.add(neckGroup);

  // Generate continuous, smooth 3D lofted aerodynamic neck geometry
  const createSculptedKelvinNeckGeo = (): THREE.BufferGeometry => {
    const slicesY = 32;
    const radialSegments = 36;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    const yBottom = -0.45; // Deep inside secondary hull
    const yTop = 2.45;     // Deep inside saucer underside

    for (let iy = 0; iy <= slicesY; iy++) {
      const t = iy / slicesY;
      const y = yBottom + t * (yTop - yBottom);

      // Forward cutwater position (Z) sweeps from 2.22 to 3.65 (Images 4 & 5)
      const zFront = 2.22 + 1.43 * Math.pow(t, 0.82);

      // Aft trailing edge position (Z) sweeps from -0.35 to -1.25
      const zBack = -0.35 - 0.90 * Math.pow(t, 0.92);

      const chordLen = zFront - zBack;
      const zMid = (zFront + zBack) * 0.5;

      // Elegant flared hourglass waist (Image 5)
      // Slender at t=0.52 (width ~0.52), gracefully flaring outward to ~1.30 at top and bottom
      const waistFactor = Math.pow(Math.abs(t - 0.52) * 2, 2.2);
      const halfWidth = 0.26 + 0.38 * waistFactor;

      for (let ir = 0; ir <= radialSegments; ir++) {
        const u = ir / radialSegments;
        const angle = u * Math.PI * 2;
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);

        // Z coordinates: front is +1 (cosA=1), back is -1 (cosA=-1)
        let localZ = 0;
        if (cosA >= 0) {
          localZ = cosA * (zFront - zMid);
        } else {
          localZ = -cosA * (zBack - zMid);
        }
        const worldZ = zMid + localZ;

        // Streamlined teardrop profile (thickness tapers to 0 at sharp front/rear edges)
        const chordPos = THREE.MathUtils.clamp((worldZ - zBack) / chordLen, 0, 1);
        const tearFactor = 4.0 * chordPos * (1.0 - chordPos);
        const profileTear = Math.pow(Math.max(0, tearFactor), 0.55);
        const worldX = sinA * halfWidth * profileTear;

        positions.push(worldX, y, worldZ);
        uvs.push(u, t);
      }
    }

    for (let iy = 0; iy < slicesY; iy++) {
      for (let ir = 0; ir < radialSegments; ir++) {
        const a = iy * (radialSegments + 1) + ir;
        const b = (iy + 1) * (radialSegments + 1) + ir;
        const c = (iy + 1) * (radialSegments + 1) + (ir + 1);
        const d = iy * (radialSegments + 1) + (ir + 1);

        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  };

  const sculptedNeckGeo = createSculptedKelvinNeckGeo();
  const neckMesh = new THREE.Mesh(sculptedNeckGeo, primaryHullMat);
  neckGroup.add(neckMesh);

  // Forward Photon Torpedo Launcher Bay (Image 5)
  // Integrated recessed pod on forward cutwater throat above the deflector dish
  const torpedoBayGeo = new THREE.BoxGeometry(0.38, 0.44, 0.46);
  const torpedoBayMesh = new THREE.Mesh(torpedoBayGeo, darkTrimMat);
  torpedoBayMesh.position.set(0, 0.82, 2.72);
  neckGroup.add(torpedoBayMesh);

  // Twin launcher tube nozzles with glowing cyan/blue launcher cores (Image 5)
  [-0.11, 0.11].forEach((tx) => {
    const tubeNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.16, 16), darkTrimMat);
    tubeNozzle.rotation.x = Math.PI / 2;
    tubeNozzle.position.set(tx, 0.82, 2.92);
    neckGroup.add(tubeNozzle);

    const tubeCore = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), warpBlueGlowMat);
    tubeCore.position.set(tx, 0.82, 2.96);
    neckGroup.add(tubeCore);
  });

  // Micro Illuminated Deck Windows on Neck Flanks (Matching Image 4)
  const neckWindowMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xddeeff),
    emissiveIntensity: 3.5,
  });
  allMaterials.push(neckWindowMat);

  // Tier 1 windows (lower deck)
  [-0.27, 0.27].forEach((sideX) => {
    [-0.1, 0.4, 0.9, 1.4].forEach((wz) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.045, 0.12), neckWindowMat);
      win.position.set(sideX, 1.05, wz);
      neckGroup.add(win);
    });
  });

  // Tier 2 windows (upper deck)
  [-0.32, 0.32].forEach((sideX) => {
    [0.1, 0.6, 1.1, 1.6, 2.1].forEach((wz) => {
      const win = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.045, 0.12), neckWindowMat);
      win.position.set(sideX, 1.55, wz);
      neckGroup.add(win);
    });
  });

  // 3. SECONDARY HULL (ENGINEERING SECTION, DEFLECTOR DISH & SYMMETRICAL SHUTTLEBAY)
  const engGroup = new THREE.Group();
  engGroup.name = 'SecondaryHull_Engineering';
  const initialEngPos = new THREE.Vector3(0, -1.45, -1.1);
  engGroup.position.copy(initialEngPos);
  root.add(engGroup);

  // Closed watertight lathe mesh with recessed cylindrical forward deflector opening (Image 2)
  const engPoints: THREE.Vector2[] = [
    new THREE.Vector2(0.0, 3.25), // Recessed inner hub of deflector housing
    new THREE.Vector2(1.18, 3.48), // Inner recessed dish perimeter
    new THREE.Vector2(1.42, 3.75), // Inner beveled wall of cowl opening
    new THREE.Vector2(1.52, 3.82), // Forward-most front outer lip of opening (Image 2)
    new THREE.Vector2(1.64, 3.65), // Outer hull shoulder
    new THREE.Vector2(1.72, 2.4),
    new THREE.Vector2(1.68, 0.5),
    new THREE.Vector2(1.48, -1.8),
    new THREE.Vector2(1.22, -3.6),
    new THREE.Vector2(0.95, -4.45),
    new THREE.Vector2(0.0, -4.5), // SOLID SEALED AFT APEX
  ];

  const engHullGeo = new THREE.LatheGeometry(engPoints, 64);
  engHullGeo.rotateX(Math.PI / 2);
  const engHullMesh = new THREE.Mesh(engHullGeo, hullWindowMat);
  engGroup.add(engHullMesh);

  // MOVIE-ACCURATE KELVIN NAVIGATIONAL DEFLECTOR (Matching user Image 2!)
  // Features 36 luminous cyan radial spokes with outer emitter beads, concentric rings, and electric-blue glow
  const deflectorAssembly = new THREE.Group();
  deflectorAssembly.name = 'Kelvin_Deflector_Assembly';
  deflectorAssembly.position.set(0, 0, 3.65);
  engGroup.add(deflectorAssembly);

  // 1. Concave Dark Metallic Backing Dish
  const backingDishGeo = new THREE.SphereGeometry(1.36, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.42);
  backingDishGeo.rotateX(-Math.PI / 2);
  const backingDishMat = new THREE.MeshStandardMaterial({
    color: 0x060c18,
    metalness: 0.55,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });
  const backingDish = new THREE.Mesh(backingDishGeo, backingDishMat);
  backingDish.scale.set(1, 1, 0.32);
  deflectorAssembly.add(backingDish);

  // 2. Inner Glowing Electric-Blue Core Disc (Image 2)
  const coreDiscGeo = new THREE.CircleGeometry(0.52, 48);
  const coreDiscMat = new THREE.MeshStandardMaterial({
    color: 0x0077ee,
    emissive: new THREE.Color(0x00a8ff),
    emissiveIntensity: 3.8,
    roughness: 0.2,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });
  const coreDisc = new THREE.Mesh(coreDiscGeo, coreDiscMat);
  coreDisc.position.z = 0.04;
  deflectorAssembly.add(coreDisc);

  // Dark central aperture iris in the very center of the core (Image 2)
  const irisGeo = new THREE.CircleGeometry(0.18, 32);
  const irisMat = new THREE.MeshBasicMaterial({ color: 0x02050c });
  const iris = new THREE.Mesh(irisGeo, irisMat);
  iris.position.z = 0.05;
  deflectorAssembly.add(iris);

  // Center focal cyan-white emitter bead
  const centerFocalMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0x00f7ff),
    emissiveIntensity: 5.5,
  });
  const centerBead = new THREE.Mesh(new THREE.SphereGeometry(0.065, 16, 16), centerFocalMat);
  centerBead.position.z = 0.08;
  deflectorAssembly.add(centerBead);

  // 3. Inner Glowing Cyan Torus Ring (Image 2)
  const innerRingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0x00f7ff),
    emissiveIntensity: 4.8,
    roughness: 0.1,
  });
  const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.024, 16, 64), innerRingMat);
  innerRing.position.z = 0.06;
  deflectorAssembly.add(innerRing);

  // 4. Outer Glowing Cyan Torus Ring (Image 2)
  const outerRingMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0x00f7ff),
    emissiveIntensity: 4.5,
    roughness: 0.1,
  });
  const outerRing = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.022, 16, 64), outerRingMat);
  outerRing.position.z = 0.12;
  deflectorAssembly.add(outerRing);

  // 5. Array of 36 Luminous Cyan Radial Spokes ("lines lines as show in the images")
  const numSpokes = 36;
  const rInner = 0.52;
  const rOuter = 1.22;
  const spokeLen = rOuter - rInner;
  const rMid = (rInner + rOuter) * 0.5;

  const spokeMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0x00f7ff),
    emissiveIntensity: 5.0,
    roughness: 0.1,
    metalness: 0.1,
  });
  const beadMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0x00f7ff),
    emissiveIntensity: 5.5,
  });

  const spokeGeo = new THREE.CylinderGeometry(0.016, 0.016, spokeLen, 8);
  const beadGeo = new THREE.SphereGeometry(0.038, 12, 12);

  for (let s = 0; s < numSpokes; s++) {
    const angle = (s / numSpokes) * Math.PI * 2;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    // Spoke rod
    const spoke = new THREE.Mesh(spokeGeo, spokeMat);
    spoke.position.set(cos * rMid, sin * rMid, 0.08);
    // Orient cylinder radially: default cylinder is aligned with Y
    spoke.rotation.z = angle - Math.PI / 2;
    deflectorAssembly.add(spoke);

    // Outer luminous emitter node bead on the perimeter ring (Image 2)
    const bead = new THREE.Mesh(beadGeo, beadMat);
    bead.position.set(cos * rOuter, sin * rOuter, 0.12);
    deflectorAssembly.add(bead);
  }

  // 6. Stepped Dark Bezel Collar Ring surrounding the deflector cowl
  const deflectorCollar = new THREE.Mesh(new THREE.TorusGeometry(1.38, 0.08, 16, 64), darkTrimMat);
  deflectorCollar.position.z = 0.15;
  deflectorAssembly.add(deflectorCollar);

  // 7. Radiant Cinematic Electric Cyan Beam Point Light
  const deflectorPointLight = new THREE.PointLight(0x00d8ff, 0.95, 10.0);
  deflectorPointLight.position.set(0, 0, 0.45);
  deflectorAssembly.add(deflectorPointLight);

  // REAR SHUTTLEBAY & SYMMETRICAL CLOSED CLAMSHELL DOORS
  // Watertight symmetrical closed dome without clipping artifacts
  const shuttlebayGroup = new THREE.Group();
  shuttlebayGroup.position.set(0, 0.12, -4.46);
  engGroup.add(shuttlebayGroup);

  // Smooth Overhanging Hangar Cowl Arch (no cutouts, watertight)
  const cowlShape = new THREE.Shape();
  cowlShape.absarc(0, 0, 1.05, 0, Math.PI, false);
  cowlShape.lineTo(-1.05, -0.2);
  cowlShape.lineTo(-1.18, -0.2);
  cowlShape.absarc(0, 0, 1.18, Math.PI, 0, true);
  cowlShape.lineTo(1.05, -0.2);
  cowlShape.closePath();

  const cowlExtrude = new THREE.ExtrudeGeometry(cowlShape, {
    depth: 1.2,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.04,
    bevelThickness: 0.04,
  });
  const hangarArch = new THREE.Mesh(cowlExtrude, primaryHullMat);
  hangarArch.position.set(0, 0.08, 0.1);
  shuttlebayGroup.add(hangarArch);

  // Symmetrical Closed Clamshell Dome Cap (watertight solid)
  const clamshellDomeGeo = new THREE.SphereGeometry(0.95, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
  clamshellDomeGeo.rotateX(-Math.PI / 2);
  clamshellDomeGeo.scale(0.96, 0.82, 0.38);
  const clamshellMat = new THREE.MeshStandardMaterial({
    color: 0x181c24,
    metalness: 0.7,
    roughness: 0.3,
  });
  const clamshellDome = new THREE.Mesh(clamshellDomeGeo, clamshellMat);
  clamshellDome.position.set(0, 0, -0.02);
  shuttlebayGroup.add(clamshellDome);

  // Vertical Center Parting Seam dividing the two clamshell doors
  const clamshellSeam = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.45, 0.46), darkTrimMat);
  clamshellSeam.position.set(0, 0, -0.05);
  shuttlebayGroup.add(clamshellSeam);

  // Horizontal Symmetrical Landing Runway Strip
  const runwayGeo = new THREE.BoxGeometry(0.24, 0.04, 1.5);
  const runwayMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: new THREE.Color(0xffe088),
    emissiveIntensity: 2.5,
  });
  allMaterials.push(runwayMat);
  const runwayMesh = new THREE.Mesh(runwayGeo, runwayMat);
  runwayMesh.position.set(0, -0.56, 0.65);
  shuttlebayGroup.add(runwayMesh);

  // Ventral Strobe Beacon on Engineering Hull Keel
  const keelStrobe = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), strobeWhiteMat);
  keelStrobe.position.set(0, -1.72, 0.5);
  engGroup.add(keelStrobe);

  // 4. WARP NACELLES & PYLONS - SEAMLESS, EMBEDDED & WATERTIGHT
  const pylonsGroup = new THREE.Group();
  pylonsGroup.name = 'WarpPylons';
  root.add(pylonsGroup);

  const nacelleLeftGroup = new THREE.Group();
  nacelleLeftGroup.name = 'Nacelle_Port';
  // Positioned backward and elevated above saucer rim (matching studio miniature references!)
  const initialNacLeftPos = new THREE.Vector3(-4.5, 3.85, -7.2);
  nacelleLeftGroup.position.copy(initialNacLeftPos);
  root.add(nacelleLeftGroup);

  const nacelleRightGroup = new THREE.Group();
  nacelleRightGroup.name = 'Nacelle_Starboard';
  const initialNacRightPos = new THREE.Vector3(4.5, 3.85, -7.2);
  nacelleRightGroup.position.copy(initialNacRightPos);
  root.add(nacelleRightGroup);

  const bussardRotors: THREE.Object3D[] = [];
  const bussardLights: THREE.PointLight[] = [];

  [-1, 1].forEach((side) => {
    // 1. Mathematically anchored Pylon Strut (ZERO gap, sweeping upward, outward and backward)
    // Anchored in upper rear flank of secondary hull to underside forward-mid nacelle
    const P_root = new THREE.Vector3(side * 1.15, -0.45, -2.9);
    const P_tip = new THREE.Vector3(side * 4.4, 3.35, -6.2);
    const dir = new THREE.Vector3().subVectors(P_tip, P_root);
    const pylonLen = dir.length();
    const mid = new THREE.Vector3().addVectors(P_root, P_tip).multiplyScalar(0.5);

    // Solid aerodynamic airfoil strut deeply penetrating secondary hull & nacelle
    const pylonGeo = new THREE.BoxGeometry(0.34, pylonLen + 0.9, 1.6);
    const pylonMesh = new THREE.Mesh(pylonGeo, primaryHullMat);
    const pylonQuat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize()
    );
    pylonMesh.quaternion.copy(pylonQuat);
    pylonMesh.position.copy(mid);
    pylonsGroup.add(pylonMesh);

    // Solid Root Fairing Cuff embedding into secondary hull flank
    const rootCuff = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.82, 2.1), primaryHullMat);
    rootCuff.position.set(side * 1.35, -0.45, -2.9);
    rootCuff.rotation.z = -side * 0.48;
    rootCuff.rotation.y = side * 0.18;
    pylonsGroup.add(rootCuff);

    // Solid Nacelle Saddle Fairing embedding into nacelle cylinder keel
    const nacSaddle = new THREE.Mesh(new THREE.BoxGeometry(0.70, 0.70, 2.0), primaryHullMat);
    nacSaddle.position.set(side * 4.4, 3.35, -6.2);
    nacSaddle.rotation.z = -side * 0.25;
    pylonsGroup.add(nacSaddle);

    // Glowing Cyan-Blue Warp Energy Grills along inner face of the pylon
    const pylonGrillGeo = new THREE.BoxGeometry(0.10, pylonLen * 0.65, 0.32);
    const pylonGrill = new THREE.Mesh(pylonGrillGeo, warpBlueGlowMat);
    pylonGrill.quaternion.copy(pylonQuat);
    pylonGrill.position.copy(mid);
    pylonGrill.position.x += side * 0.17; // Flush on inward-facing strut surface
    pylonsGroup.add(pylonGrill);

    const targetNacelleGroup = side === -1 ? nacelleLeftGroup : nacelleRightGroup;

    // Solid closed cylindrical nacelle body (with livery texture)
    // Starts at front cap (0, 5.2) and closes at rear cap (0, -5.2)
    const nacPoints: THREE.Vector2[] = [
      new THREE.Vector2(0.0, 5.2), // SOLID SEALED FRONT APEX
      new THREE.Vector2(1.05, 5.2), // EXACT FRONT RADIUS = 1.05
      new THREE.Vector2(1.05, 4.85),
      new THREE.Vector2(1.05, 2.3),
      new THREE.Vector2(1.02, 2.15),
      new THREE.Vector2(0.98, -1.5),
      new THREE.Vector2(0.84, -4.4),
      new THREE.Vector2(0.64, -5.4),
      new THREE.Vector2(0.35, -5.2),
      new THREE.Vector2(0.0, -5.2), // SOLID SEALED REAR APEX
    ];

    const nacBodyGeo = new THREE.LatheGeometry(nacPoints, 64);
    nacBodyGeo.rotateX(Math.PI / 2);
    const nacBodyMesh = new THREE.Mesh(nacBodyGeo, nacelleHullMat);
    targetNacelleGroup.add(nacBodyMesh);

    // BUSSARD COLLECTOR (MATCH EXACT FRONT RADIUS = 1.05 & SEAL THE REAR)
    // 1. Solid opaque metallic-grey backplate disc at the base (z = 5.16)
    // Completely hides the internal glow and rotor blades when viewed from behind!
    const backplateGeo = new THREE.CylinderGeometry(1.04, 1.04, 0.08, 48);
    backplateGeo.rotateX(Math.PI / 2);
    const backplateMesh = new THREE.Mesh(backplateGeo, primaryHullMat);
    backplateMesh.position.set(0, 0, 5.16);
    targetNacelleGroup.add(backplateMesh);

    // 2. Bussard Forward Collar Ring matching exact nacelle radius (no wider than the tube!)
    const bussardCollar = new THREE.Mesh(new THREE.TorusGeometry(1.01, 0.04, 24, 64), chromeMat);
    bussardCollar.position.z = 5.18;
    targetNacelleGroup.add(bussardCollar);

    // 3. Orange Bussard Collector Hemisphere Dome matching exact front radius 1.05
    const bussardDomeGeo = new THREE.SphereGeometry(1.045, 48, 24, 0, Math.PI * 2, 0, Math.PI * 0.5);
    bussardDomeGeo.rotateX(Math.PI / 2);
    const bussardDome = new THREE.Mesh(bussardDomeGeo, bussardShellMat);
    bussardDome.position.z = 5.18;
    targetNacelleGroup.add(bussardDome);

    // 4. Internal Glowing Amber Point Light sealed inside the dome
    const bussardLight = new THREE.PointLight(0xff4400, 0.22, 3.5);
    bussardLight.position.set(0, 0, 5.25);
    targetNacelleGroup.add(bussardLight);
    bussardLights.push(bussardLight);

    // 5. Internal Spinning Rotor Blades inside the sealed dome
    const rotorGroup = new THREE.Group();
    rotorGroup.position.z = 5.25;
    targetNacelleGroup.add(rotorGroup);
    bussardRotors.push(rotorGroup);

    const coreBulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 24, 24),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: new THREE.Color(0xffaa00),
        emissiveIntensity: 2.6,
      })
    );
    coreBulb.position.z = 0.1;
    rotorGroup.add(coreBulb);

    const numBlades = 12;
    for (let b = 0; b < numBlades; b++) {
      const bladeAngle = (b / numBlades) * Math.PI * 2;
      const blade = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.82, 0.18),
        new THREE.MeshStandardMaterial({
          color: 0xff6600,
          emissive: new THREE.Color(0xff2200),
          emissiveIntensity: 2.2,
        })
      );
      blade.position.set(Math.cos(bladeAngle) * 0.42, Math.sin(bladeAngle) * 0.42, 0.04);
      blade.rotation.z = bladeAngle + 0.35;
      rotorGroup.add(blade);
    }

    // 1. MOVIE-ACCURATE NACELLE FLANKS (Replicating user Image 1 & Image 2!)
    // Helper to generate the exact red strap with in-line bold black NCC-1701 and chevrons
    const createStrapMesh = (xPos: number, facesPositiveX: boolean) => {
      const geo = new THREE.BufferGeometry();
      const zFront = 3.8;
      const zAft = -4.4;
      const yTop = 0.35;
      const yBot = -0.03;

      const pos = new Float32Array([
        xPos, yTop, zFront, // 0: top-front
        xPos, yBot, zFront, // 1: bot-front
        xPos, yBot, zAft,   // 2: bot-aft
        xPos, yTop, zAft,   // 3: top-aft
      ]);

      const uvs = facesPositiveX
        ? new Float32Array([
            0, 0, // top-front
            0, 1, // bot-front
            1, 1, // bot-aft
            1, 0, // top-aft
          ])
        : new Float32Array([
            1, 0, // top-front is right of texture (U=1)
            1, 1, // bot-front is right of texture (U=1)
            0, 1, // bot-aft is left of texture (U=0)
            0, 0, // top-aft is left of texture (U=0)
          ]);

      const indices = facesPositiveX
        ? [0, 1, 2, 0, 2, 3]
        : [0, 3, 2, 0, 2, 1];

      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      const mat = facesPositiveX ? nacelleStrapStbdMat : nacelleStrapPortMat;
      return new THREE.Mesh(geo, mat);
    };

    // Mount movie-accurate red strap & black NCC-1701 banner on BOTH flanks of each nacelle
    targetNacelleGroup.add(createStrapMesh(-1.058, false)); // Port-facing flank (faces -X)
    targetNacelleGroup.add(createStrapMesh(1.058, true));  // Starboard-facing flank (faces +X)

    // Outboard Chamfer Bevels (Upper & Lower) giving the movie-accurate faceted cross section
    const outboardDir = side;
    const outboardX = outboardDir * 1.055;
    const zFront = 3.8;
    const zAft = -4.4;
    const yTop = 0.35;
    const yBot = -0.03;

    // Upper chamfer
    const upChamferGeo = new THREE.BufferGeometry();
    const upChamferPos = new Float32Array([
      outboardX, yTop, zFront,
      outboardDir * 0.88, 0.82, zFront,
      outboardDir * 0.88, 0.82, zAft,
      outboardX, yTop, zAft,
    ]);
    upChamferGeo.setAttribute('position', new THREE.BufferAttribute(upChamferPos, 3));
    upChamferGeo.setIndex(outboardDir === -1 ? [0, 3, 2, 0, 2, 1] : [0, 1, 2, 0, 2, 3]);
    upChamferGeo.computeVertexNormals();
    targetNacelleGroup.add(new THREE.Mesh(upChamferGeo, primaryHullMat));

    // Lower chamfer
    const botChamferGeo = new THREE.BufferGeometry();
    const botChamferPos = new Float32Array([
      outboardX, yBot, zFront,
      outboardX, yBot, zAft,
      outboardDir * 0.88, -0.82, zAft,
      outboardDir * 0.88, -0.82, zFront,
    ]);
    botChamferGeo.setAttribute('position', new THREE.BufferAttribute(botChamferPos, 3));
    botChamferGeo.setIndex(outboardDir === -1 ? [0, 1, 2, 0, 2, 3] : [0, 3, 2, 0, 2, 1]);
    botChamferGeo.computeVertexNormals();
    targetNacelleGroup.add(new THREE.Mesh(botChamferGeo, primaryHullMat));

    // 3D Physical Cooling Louver Trench on the Outboard Flank
    const louverTrench = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 5.2), darkTrimMat);
    louverTrench.position.set(outboardDir * 1.045, -0.32, -0.4);
    targetNacelleGroup.add(louverTrench);

    // Horizontal radiator cooling slats
    for (let sy = -0.045; sy <= 0.045; sy += 0.03) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.010, 5.16), primaryHullMat);
      slat.position.set(outboardDir * 1.052, -0.32 + sy, -0.4);
      targetNacelleGroup.add(slat);
    }

    // 3D Physical Forward and Aft RCS Quad Housings on Outboard Shoulder
    [
      { z: 3.2, y: 0.58 },
      { z: -3.8, y: 0.58 },
    ].forEach((rcs) => {
      const rcsBox = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.18), darkTrimMat);
      rcsBox.position.set(outboardDir * 1.01, rcs.y, rcs.z);
      targetNacelleGroup.add(rcsBox);

      const rcsFace = new THREE.Mesh(
        new THREE.BoxGeometry(0.02, 0.12, 0.14),
        new THREE.MeshStandardMaterial({
          color: 0xe69022,
          emissive: new THREE.Color(0x8a4502),
          emissiveIntensity: 0.4,
        })
      );
      rcsFace.position.set(outboardDir * 1.07, rcs.y, rcs.z);
      targetNacelleGroup.add(rcsFace);
    });

    // 2. INBOARD WARP FIELD CHILLER GRILLES (Along lower inboard flank, matching Image 1!)
    const inboardDir = -side;
    const grilleInnerX = inboardDir * 0.98;
    const grilleY = -0.22;

    // Glowing cyan plasma strip
    const plasmaStrip = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 4.6), warpBlueGlowMat);
    plasmaStrip.position.set(grilleInnerX, grilleY, -0.5);
    targetNacelleGroup.add(plasmaStrip);

    // Embedded dark trench backing
    const trench = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.26, 4.64), darkTrimMat);
    trench.position.set(inboardDir * 0.95, grilleY, -0.5);
    targetNacelleGroup.add(trench);

    // Fine vertical chiller ribs / cooling bars
    for (let gz = -2.6; gz <= 1.6; gz += 0.32) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.24, 0.04), darkTrimMat);
      rib.position.set(inboardDir * 0.985, grilleY, gz);
      targetNacelleGroup.add(rib);
    }

    // Ambient Warp Point Light illuminating inner pylons and engineering hull
    const warpInnerLight = new THREE.PointLight(0x00d8ff, 0.35, 5.0);
    warpInnerLight.position.set(inboardDir * 1.15, grilleY, -0.5);
    targetNacelleGroup.add(warpInnerLight);

    // Aft Nacelle Navigation Beacon
    const aftNavLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      side === -1 ? portNavMat : stbdNavMat
    );
    aftNavLight.position.set(0, 0.42, -5.2);
    targetNacelleGroup.add(aftNavLight);
  });

  // State
  let currentAlert: AlertMode = 'normal';
  let isWarpActive = false;

  // Exploded View positions
  const setExploded = (factor: number) => {
    saucerGroup.position.set(
      initialSaucerPos.x,
      initialSaucerPos.y + factor * 3.8,
      initialSaucerPos.z + factor * 3.2
    );
    neckGroup.position.set(0, factor * 1.5, factor * 1.2);
    engGroup.position.set(
      initialEngPos.x,
      initialEngPos.y - factor * 3.2,
      initialEngPos.z - factor * 1.0
    );
    pylonsGroup.position.set(0, -factor * 0.8, -factor * 1.2);
    nacelleLeftGroup.position.set(
      initialNacLeftPos.x - factor * 3.2,
      initialNacLeftPos.y + factor * 1.2,
      initialNacLeftPos.z - factor * 3.0
    );
    nacelleRightGroup.position.set(
      initialNacRightPos.x + factor * 3.2,
      initialNacRightPos.y + factor * 1.2,
      initialNacRightPos.z - factor * 3.0
    );
  };

  const setAlertMode = (mode: AlertMode) => {
    currentAlert = mode;
  };

  const setWarpActive = (active: boolean) => {
    isWarpActive = active;
  };

  const setHullFinish = (finish: HullFinish) => {
    switch (finish) {
      case 'standard':
        primaryHullMat.color.setHex(0xa4aebc);
        primaryHullMat.metalness = 0.22;
        primaryHullMat.roughness = 0.52;
        primaryHullMat.wireframe = false;
        dorsalHullMat.color.setHex(0xffffff);
        dorsalHullMat.metalness = 0.22;
        dorsalHullMat.roughness = 0.52;
        dorsalHullMat.wireframe = false;
        ventralHullMat.color.setHex(0xffffff);
        ventralHullMat.metalness = 0.22;
        ventralHullMat.roughness = 0.52;
        ventralHullMat.wireframe = false;
        nacelleHullMat.color.setHex(0xffffff);
        nacelleHullMat.metalness = 0.22;
        nacelleHullMat.roughness = 0.52;
        nacelleHullMat.wireframe = false;
        nacelleStrapStbdMat.color.setHex(0xffffff);
        nacelleStrapStbdMat.metalness = 0.18;
        nacelleStrapStbdMat.roughness = 0.45;
        nacelleStrapStbdMat.wireframe = false;
        nacelleStrapPortMat.color.setHex(0xffffff);
        nacelleStrapPortMat.metalness = 0.18;
        nacelleStrapPortMat.roughness = 0.45;
        nacelleStrapPortMat.wireframe = false;
        hullWindowMat.metalness = 0.22;
        hullWindowMat.roughness = 0.52;
        darkTrimMat.color.setHex(0x1e222a);
        darkTrimMat.wireframe = false;
        break;
      case 'classic':
        primaryHullMat.color.setHex(0xf0f3f8);
        primaryHullMat.metalness = 0.2;
        primaryHullMat.roughness = 0.45;
        primaryHullMat.wireframe = false;
        dorsalHullMat.wireframe = false;
        ventralHullMat.wireframe = false;
        nacelleStrapStbdMat.wireframe = false;
        nacelleStrapPortMat.wireframe = false;
        darkTrimMat.color.setHex(0x454e59);
        darkTrimMat.wireframe = false;
        break;
      case 'section31':
        primaryHullMat.color.setHex(0x12151a);
        primaryHullMat.metalness = 0.82;
        primaryHullMat.roughness = 0.22;
        primaryHullMat.wireframe = false;
        dorsalHullMat.wireframe = false;
        ventralHullMat.wireframe = false;
        nacelleStrapStbdMat.wireframe = false;
        nacelleStrapPortMat.wireframe = false;
        darkTrimMat.color.setHex(0x08090c);
        darkTrimMat.wireframe = false;
        break;
      case 'wireframe':
        primaryHullMat.color.setHex(0x00e1ff);
        primaryHullMat.wireframe = true;
        dorsalHullMat.wireframe = true;
        ventralHullMat.wireframe = true;
        nacelleStrapStbdMat.wireframe = true;
        nacelleStrapPortMat.wireframe = true;
        darkTrimMat.color.setHex(0x0077aa);
        darkTrimMat.wireframe = true;
        break;
    }
  };

  // Weapon Origins
  const tempVec = new THREE.Vector3();
  const getTorpedoOrigin = (): THREE.Vector3 => {
    tempVec.set(0, 0.5, 2.75);
    return neckGroup.localToWorld(tempVec.clone());
  };

  const getPhaserOrigins = (): [THREE.Vector3, THREE.Vector3] => {
    const left = saucerGroup.localToWorld(new THREE.Vector3(-2.8, -0.4, 2.5));
    const right = saucerGroup.localToWorld(new THREE.Vector3(2.8, -0.4, 2.5));
    return [left, right];
  };

  const getSubsystemPosition = (name: string): THREE.Vector3 => {
    switch (name.toLowerCase()) {
      case 'saucer':
        return saucerGroup.localToWorld(new THREE.Vector3(0, 0.5, 0));
      case 'bridge':
        return saucerGroup.localToWorld(new THREE.Vector3(0, 1.1, -0.05));
      case 'deflector':
        return engGroup.localToWorld(new THREE.Vector3(0, 0, 4.0));
      case 'bussard':
        return nacelleLeftGroup.localToWorld(new THREE.Vector3(0, 0, 5.2));
      case 'grills':
      case 'nacelles':
        return nacelleRightGroup.localToWorld(new THREE.Vector3(0, 0, 0));
      case 'impulse':
        return saucerGroup.localToWorld(new THREE.Vector3(0, 0.95, -1.15));
      case 'shuttlebay':
        return engGroup.localToWorld(new THREE.Vector3(0, 0.12, -4.5));
      default:
        return root.position.clone();
    }
  };

  // 5. ANIMATION CONTROLLER
  const update = (deltaSeconds: number, elapsedSeconds: number) => {
    const spinMultiplier = isWarpActive ? 3.5 : currentAlert === 'red' ? 2.2 : 1.0;
    if (bussardRotors.length >= 2) {
      bussardRotors[0].rotation.z += deltaSeconds * 2.8 * spinMultiplier;
      bussardRotors[1].rotation.z -= deltaSeconds * 2.8 * spinMultiplier;
    }

    // Synchronized Strobe Navigation Lights
    const strobeCycle = elapsedSeconds % 1.4;
    const isStrobeOn = strobeCycle < 0.12;
    strobeWhiteMat.emissiveIntensity = isStrobeOn ? 5.0 : 0.0;

    // Warp & Bussard Pulse
    const warpBase = isWarpActive ? 4.8 : 2.2;
    const pulse = 1.0 + Math.sin(elapsedSeconds * (isWarpActive ? 8.5 : 3.0)) * 0.12;
    warpBlueGlowMat.emissiveIntensity = warpBase * pulse;
    bussardShellMat.emissiveIntensity = (isWarpActive ? 2.8 : 1.8) * pulse;

    bussardLights.forEach((light) => {
      light.intensity = (isWarpActive ? 3.5 : 2.2) * pulse;
    });

    // Alert Modes
    if (currentAlert === 'red') {
      const strobe = Math.sin(elapsedSeconds * 6.5) > 0 ? 1 : 0;
      alertStrobeMat.emissive.setHex(0xff0000);
      alertStrobeMat.emissiveIntensity = strobe * 4.5;
      spokeMat.emissive.setHex(strobe ? 0xff2200 : 0x881100);
      deflectorPointLight.color.setHex(0xff2200);
    } else if (currentAlert === 'yellow') {
      alertStrobeMat.emissive.setHex(0xffaa00);
      alertStrobeMat.emissiveIntensity = 2.0 + Math.sin(elapsedSeconds * 4.0) * 1.5;
      spokeMat.emissive.setHex(0xffaa00);
      deflectorPointLight.color.setHex(0xffaa00);
    } else {
      alertStrobeMat.emissiveIntensity = 0;
      spokeMat.emissive.setHex(0x00f7ff);
      deflectorPointLight.color.setHex(0x00d8ff);
    }
  };

  const dispose = () => {
    saucerTopTex.dispose();
    saucerBotTex.dispose();
    nacelleBaseTex.dispose();
    nacelleStrapStbdTex.dispose();
    nacelleStrapPortTex.dispose();
    hullSideTex.map.dispose();
    hullSideTex.emissiveMap.dispose();
    deflectorTex.dispose();
    warpGrilleTex.map.dispose();
    warpGrilleTex.emissiveMap.dispose();
    allMaterials.forEach((m) => m.dispose());
  };

  return {
    group: root,
    saucerGroup,
    neckGroup,
    engGroup,
    pylonsGroup,
    nacelleLeftGroup,
    nacelleRightGroup,
    getTorpedoOrigin,
    getPhaserOrigins,
    getSubsystemPosition,
    setAlertMode,
    setWarpActive,
    setHullFinish,
    setExploded,
    update,
    dispose,
  };
}

/**
 * Creates dynamic high-speed Starfield and Warp Streaks
 */
export function createDynamicStarfield(starCount = 7500): {
  points: THREE.Points;
  lines: THREE.LineSegments;
  update: (speedMultiplier: number, delta: number) => void;
} {
  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const r = 180 + Math.random() * 520;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);

    const tint = Math.random();
    if (tint < 0.22) {
      colors[i * 3] = 0.75;
      colors[i * 3 + 1] = 0.88;
      colors[i * 3 + 2] = 1.0;
    } else if (tint < 0.78) {
      colors[i * 3] = 0.98;
      colors[i * 3 + 1] = 0.98;
      colors[i * 3 + 2] = 0.98;
    } else {
      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 0.92;
      colors[i * 3 + 2] = 0.75;
    }
  }

  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.95,
    vertexColors: true,
    transparent: true,
    opacity: 0.92,
  });

  const points = new THREE.Points(geo, mat);

  // Warp Streak Lines
  const streakCount = 1200;
  const lineGeo = new THREE.BufferGeometry();
  const linePos = new Float32Array(streakCount * 6);
  const lineRadius = new Float32Array(streakCount);
  const lineAngle = new Float32Array(streakCount);
  const lineZ = new Float32Array(streakCount);
  const lineSpeed = new Float32Array(streakCount);

  for (let i = 0; i < streakCount; i++) {
    const r = 8 + Math.random() * 120;
    const a = Math.random() * Math.PI * 2;
    const z = (Math.random() - 0.5) * 600;
    const spd = 120 + Math.random() * 240;

    lineRadius[i] = r;
    lineAngle[i] = a;
    lineZ[i] = z;
    lineSpeed[i] = spd;

    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;

    linePos[i * 6] = x;
    linePos[i * 6 + 1] = y;
    linePos[i * 6 + 2] = z;
    linePos[i * 6 + 3] = x;
    linePos[i * 6 + 4] = y;
    linePos[i * 6 + 5] = z + 12;
  }

  lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x99ddff,
    transparent: true,
    opacity: 0.0,
  });
  const lines = new THREE.LineSegments(lineGeo, lineMat);

  const update = (speedMultiplier: number, delta: number) => {
    points.rotation.y += delta * 0.012;

    const isWarp = speedMultiplier > 1.5;
    lineMat.opacity = THREE.MathUtils.damp(lineMat.opacity, isWarp ? 0.85 : 0.0, 4.0, delta);

    if (lineMat.opacity > 0.01) {
      const posAttr = lineGeo.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const tailLength = speedMultiplier * 14;

      for (let i = 0; i < streakCount; i++) {
        lineZ[i] += lineSpeed[i] * speedMultiplier * delta * 0.6;
        if (lineZ[i] > 300) {
          lineZ[i] = -300;
        }

        const x = Math.cos(lineAngle[i]) * lineRadius[i];
        const y = Math.sin(lineAngle[i]) * lineRadius[i];
        const z = lineZ[i];

        arr[i * 6] = x;
        arr[i * 6 + 1] = y;
        arr[i * 6 + 2] = z;

        arr[i * 6 + 3] = x;
        arr[i * 6 + 4] = y;
        arr[i * 6 + 5] = z + tailLength;
      }
      posAttr.needsUpdate = true;
    }
  };

  return { points, lines, update };
}
