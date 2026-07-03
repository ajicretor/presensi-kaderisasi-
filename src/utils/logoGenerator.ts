/**
 * Utility to generate the official PC GP Ansor Kabupaten Bogor logo
 * as a high-quality PNG (rasterized Data URL).
 * This implements the design of 3 stylized figures, clock face, P leaf, and wave roots.
 */
export function generateAnsorLogoPng(): string {
  // Create an off-screen canvas with high resolution
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Set anti-aliasing and smooth drawing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const cx = 256;
  const cy = 256;

  // Create the primary beautiful blue-to-emerald gradient
  const grad = ctx.createLinearGradient(100, 420, 412, 92);
  grad.addColorStop(0, '#1d8ff8');   // Vibrant Blue
  grad.addColorStop(0.35, '#06b6d4'); // Cyan
  grad.addColorStop(0.7, '#0d9488');  // Teal
  grad.addColorStop(1, '#10b981');   // Emerald Green

  // Set default stroke and fill styles
  ctx.strokeStyle = grad;
  ctx.fillStyle = grad;

  // 1. Draw outer circle / frame
  // Left-side dashed outer track (from around 130 to 330 degrees)
  ctx.beginPath();
  ctx.lineWidth = 14;
  ctx.lineCap = 'round';
  ctx.setLineDash([24, 16]);
  ctx.arc(cx, cy, 210, Math.PI * 0.75, Math.PI * 1.75);
  ctx.stroke();

  // Reset dashes
  ctx.setLineDash([]);

  // Thin outer track on the left
  ctx.beginPath();
  ctx.lineWidth = 4;
  ctx.globalAlpha = 0.6;
  ctx.arc(cx, cy, 185, Math.PI * 0.72, Math.PI * 1.76);
  ctx.stroke();
  ctx.globalAlpha = 1.0;

  // Right-side solid outer arc wrapping around to bottom
  ctx.beginPath();
  ctx.lineWidth = 14;
  ctx.arc(cx, cy, 210, Math.PI * 1.75, Math.PI * 2.78);
  ctx.stroke();

  // 2. Clock face ticks radiating outwards
  const tickAngles = [
    -Math.PI / 6,      // -30 deg
    -Math.PI / 3,      // -60 deg
    -Math.PI * (2/3),  // -120 deg
    -Math.PI * (5/6),  // -150 deg
    0,                 // 0 deg
    Math.PI,           // 180 deg
    -Math.PI * 0.05,
    -Math.PI * 0.95
  ];

  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  tickAngles.forEach(angle => {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    ctx.beginPath();
    // Ticks are in a ring between radius 120 and 145
    ctx.moveTo(cx + cos * 115, cy + sin * 115);
    ctx.lineTo(cx + cos * 140, cy + sin * 140);
    ctx.stroke();
  });

  // 3. Flowing waves / fingers at the bottom (curving downwards & left)
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';

  // Curve 1
  ctx.beginPath();
  ctx.moveTo(180, 310);
  ctx.quadraticCurveTo(140, 360, 110, 410);
  ctx.stroke();

  // Curve 2
  ctx.beginPath();
  ctx.moveTo(210, 325);
  ctx.quadraticCurveTo(175, 390, 140, 430);
  ctx.stroke();

  // Curve 3
  ctx.beginPath();
  ctx.moveTo(240, 335);
  ctx.quadraticCurveTo(210, 420, 180, 450);
  ctx.stroke();

  // Curve 4
  ctx.beginPath();
  ctx.moveTo(270, 335);
  ctx.quadraticCurveTo(250, 435, 225, 462);
  ctx.stroke();

  // Curve 5
  ctx.beginPath();
  ctx.moveTo(300, 325);
  ctx.quadraticCurveTo(290, 430, 275, 452);
  ctx.stroke();

  // Curve 6
  ctx.beginPath();
  ctx.moveTo(330, 310);
  ctx.quadraticCurveTo(330, 410, 322, 430);
  ctx.stroke();

  // 4. Draw the three stylized human figures
  // Left Figure
  const lhx = 195;
  const lhy = 252;
  // Head
  ctx.beginPath();
  ctx.arc(lhx, lhy, 19, 0, Math.PI * 2);
  ctx.fill();
  // Body
  ctx.beginPath();
  ctx.moveTo(lhx, lhy + 25);
  ctx.quadraticCurveTo(150, 282, 120, 282); // Left arm
  ctx.quadraticCurveTo(170, 310, lhx + 2, 325); // Left arm under
  ctx.quadraticCurveTo(230, 345, 256, 385); // Body left side
  ctx.quadraticCurveTo(225, 330, lhx, lhy + 25); // Torso merging back
  ctx.closePath();
  ctx.fill();

  // Right Figure
  const rhx = 317;
  const rhy = 252;
  // Head
  ctx.beginPath();
  ctx.arc(rhx, rhy, 19, 0, Math.PI * 2);
  ctx.fill();
  // Body
  ctx.beginPath();
  ctx.moveTo(rhx, rhy + 25);
  ctx.quadraticCurveTo(362, 282, 392, 282); // Right arm
  ctx.quadraticCurveTo(342, 310, rhx - 2, 325); // Right arm under
  ctx.quadraticCurveTo(282, 345, 256, 385); // Body right side
  ctx.quadraticCurveTo(287, 330, rhx, rhy + 25); // Torso merging back
  ctx.closePath();
  ctx.fill();

  // Center Figure (Green, in front/overlapping)
  const chx = 256;
  const chy = 188;
  // Head
  ctx.beginPath();
  ctx.arc(chx, chy, 23, 0, Math.PI * 2);
  ctx.fill();
  // Body
  ctx.beginPath();
  ctx.moveTo(chx, chy + 28);
  ctx.quadraticCurveTo(205, 215, 165, 175); // Left arm top
  ctx.quadraticCurveTo(215, 240, 243, 270); // Left arm under
  ctx.quadraticCurveTo(256, 340, 256, 385); // Left body column
  ctx.quadraticCurveTo(256, 340, 269, 270); // Right body column
  ctx.quadraticCurveTo(297, 240, 347, 175); // Right arm under
  ctx.quadraticCurveTo(307, 215, chx, chy + 28); // Right arm top
  ctx.closePath();
  ctx.fill();

  // 5. Stylized 'P' feather logo at the top
  const px = 256;
  const py = 92;

  // Draw the P loop and feather flourish
  ctx.beginPath();
  ctx.lineWidth = 12;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  // Main curved spine of the P
  ctx.moveTo(px - 10, py + 45);
  ctx.quadraticCurveTo(px - 5, py - 5, px + 35, py - 35);
  ctx.stroke();

  // Leafy feathers branching off the P
  ctx.beginPath();
  ctx.moveTo(px + 30, py - 30);
  ctx.quadraticCurveTo(px - 10, py + 10, px - 15, py + 40);
  ctx.quadraticCurveTo(px - 5, py + 25, px + 5, py + 22);
  ctx.quadraticCurveTo(px + 15, py + 20, px + 28, py + 12);
  ctx.quadraticCurveTo(px + 8, py, px + 5, py - 10);
  ctx.closePath();
  ctx.fill();

  return canvas.toDataURL('image/png');
}
