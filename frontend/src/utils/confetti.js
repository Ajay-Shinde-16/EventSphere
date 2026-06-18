/* ════════════════════════════════════════════════════════════════
   SHARED CONFETTI ANIMATION
   A small canvas-based confetti burst used to celebrate successful
   actions across the app. Extracted into its own file (instead of
   being copy-pasted) so EventDetail's "booking confirmed" celebration
   and ScanQR's "check-in successful" celebration always look and
   behave identically — one place to tweak colors/physics later.
════════════════════════════════════════════════════════════════ */

export function launchConfetti() {
  const colors = ['#00F2FE','#9B51E0','#05FF9B','#FFB300','#FF4081','#fff','#FF4081'];
  const count = 150;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;pointer-events:none;';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const pieces = Array.from({ length: count }, () => ({
    x: canvas.width / 2,
    y: canvas.height / 2,
    r: 4 + Math.random() * 8,
    d: Math.random() * count,
    color: colors[Math.floor(Math.random() * colors.length)],
    tilt: Math.floor(Math.random() * 10) - 10,
    tiltAngle: 0,
    tiltAngleInc: (Math.random() * 0.07) + 0.05,
    vx: (Math.random() - 0.5) * 18,
    vy: -(Math.random() * 15 + 8),
    gravity: 0.4,
    shape: Math.random() > 0.5 ? 'circle' : 'rect',
    opacity: 1,
  }));

  let frame = 0;
  const maxFrames = 180;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      if (p.shape === 'circle') {
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.tiltAngle);
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        ctx.restore();
      }
      ctx.fill();
      // Physics
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.tiltAngle += p.tiltAngleInc;
      p.vx *= 0.99;
      if (frame > 60) p.opacity -= 0.012;
    });
    ctx.globalAlpha = 1;
    frame++;
    if (frame < maxFrames) requestAnimationFrame(draw);
    else canvas.remove();
  }
  draw();
}