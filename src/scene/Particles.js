import * as THREE from 'three';

/**
 * Floating atmospheric particles with Soft Olive (#8a9a86) and Whitesmoke (#f5f5f5) palette.
 */
export class Particles {
  constructor(count = 1400) {
    this.count = count;
    this.group = new THREE.Group();
    this.group.name = 'AtmosphericParticles';

    this.createParticles();
  }

  createParticles() {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.count * 3);
    const colors = new Float32Array(this.count * 3);

    const oliveLight = new THREE.Color(0xb4c4af);
    const oliveSoft = new THREE.Color(0x8a9a86);
    const whiteSmoke = new THREE.Color(0xf5f5f5);

    for (let i = 0; i < this.count; i++) {
      const radius = 2 + Math.random() * 16;
      const theta = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 18;
      const z = (Math.random() - 0.5) * 28 - 4;

      positions[i * 3] = Math.cos(theta) * radius;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const rand = Math.random();
      let c;
      if (rand < 0.55) {
        c = oliveSoft;
      } else if (rand < 0.85) {
        c = oliveLight;
      } else {
        c = whiteSmoke;
      }

      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Circular glowing sprite texture with soft olive halo
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(245, 245, 245, 1)');
    grad.addColorStop(0.3, 'rgba(180, 196, 175, 0.85)');
    grad.addColorStop(0.7, 'rgba(138, 154, 134, 0.3)');
    grad.addColorStop(1, 'rgba(18, 21, 24, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.12,
      map: texture,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.points = new THREE.Points(geometry, material);
    this.group.add(this.points);
  }

  animate(time) {
    this.points.rotation.y = time * 0.025;
    this.points.rotation.x = Math.sin(time * 0.015) * 0.05;
  }

  updateScrollProgress(t) {
    this.points.position.z = t * 3.0;
  }
}
