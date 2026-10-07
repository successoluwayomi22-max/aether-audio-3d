import * as THREE from 'three';

/**
 * Highly realistic, beautifully designed acoustic soundwave vortex.
 * Modeled with physical wave propagation principles:
 * - Logarithmic radial dispersion (physical wave expansion)
 * - Dual-layer wave crests (sharp delicate wave filament + soft volumetric halo)
 * - Harmonic sine modulation along circumference (phase compression & rarefaction)
 * - Positioned cleanly behind the charging case, safely below the top navigation bar
 */
export class SoundVortex {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'SoundVortexTunnel';

    this.rings = [];
    this.ringCount = 24;

    this.createAcousticWaveRings();
    this.createTechnicalGrid();
    this.createCurvedSplines();
  }

  createAcousticWaveRings() {
    this.ringsGroup = new THREE.Group();
    this.ringsGroup.name = 'VortexRingsGroup';

    // Soft Olive (#8a9a86) and Whitesmoke (#f5f5f5) palette
    const colorWhitesmoke = new THREE.Color(0xf5f7fa);
    const colorOliveLight = new THREE.Color(0xb4c4af);
    const colorOliveDeep = new THREE.Color(0x606e5d);

    for (let i = 0; i < this.ringCount; i++) {
      const alpha = i / (this.ringCount - 1);
      
      // Logarithmic / exponential wave expansion mimicking acoustic sound propagation
      const baseRadius = 1.8 + Math.pow(alpha, 1.35) * 8.5;
      // Delicate thin filaments for realism (no thick chunky plastic tubes)
      const isMajorWave = (i % 3 === 0);
      const tubeThickness = isMajorWave ? 0.022 : 0.012;

      // Ring wave geometry with high segment count for buttery smooth curvature
      const geometry = new THREE.TorusGeometry(baseRadius, tubeThickness, 16, 96);

      // Color transition: Whitesmoke crest on front rings -> luminous soft olive into depth
      const ringColor = new THREE.Color().lerpColors(
        isMajorWave ? colorWhitesmoke : colorOliveLight,
        colorOliveDeep,
        Math.pow(alpha, 0.85)
      );

      const baseOpacity = isMajorWave 
        ? Math.pow(1 - alpha * 0.75, 1.2) * 0.9 
        : Math.pow(1 - alpha * 0.85, 1.5) * 0.5;

      const material = new THREE.MeshBasicMaterial({
        color: ringColor,
        transparent: true,
        opacity: baseOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const ringMesh = new THREE.Mesh(geometry, material);

      // Position: Centered at y = -0.35 to perfectly align behind the lowered pod case,
      // curving into negative Z depth
      const zPos = -alpha * 19 - 1.2;
      const xPos = Math.sin(alpha * Math.PI * 0.5) * 1.5 + 0.65;
      const yPos = -0.35 - Math.cos(alpha * Math.PI * 0.4) * 0.6;

      ringMesh.position.set(xPos, yPos, zPos);
      ringMesh.rotation.x = 0.12 - alpha * 0.08;
      ringMesh.rotation.y = -0.18 + alpha * 0.12;

      this.rings.push({
        mesh: ringMesh,
        basePos: ringMesh.position.clone(),
        baseOpacity: baseOpacity,
        index: i,
        alpha: alpha,
        isMajor: isMajorWave,
        phaseOffset: i * 0.28
      });

      this.ringsGroup.add(ringMesh);
    }

    this.group.add(this.ringsGroup);
  }

  createTechnicalGrid() {
    this.gridGroup = new THREE.Group();
    this.gridGroup.name = 'TechnicalGrid';

    const size = 32;
    const divisions = 32;
    const gridHelper = new THREE.GridHelper(size, divisions, 0xb4c4af, 0x222a22);
    // Lowered grid to sit well beneath the pod and text
    gridHelper.position.set(0, -4.2, -6);
    gridHelper.rotation.x = 0.05;
    
    if (gridHelper.material) {
      gridHelper.material.transparent = true;
      gridHelper.material.opacity = 0.14;
      gridHelper.material.blending = THREE.AdditiveBlending;
      gridHelper.material.depthWrite = false;
    }

    this.gridGroup.add(gridHelper);
    this.group.add(this.gridGroup);
  }

  createCurvedSplines() {
    this.splinesGroup = new THREE.Group();
    this.splinesGroup.name = 'CurvedPaths';

    const pathCurves = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-8, 2.5, -12),
        new THREE.Vector3(-3, 0.8, -6),
        new THREE.Vector3(1, -0.6, -2),
        new THREE.Vector3(5, 1.5, 2)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-6, -4.5, -14),
        new THREE.Vector3(0, -2.4, -8),
        new THREE.Vector3(3, 0.2, -3),
        new THREE.Vector3(7, -1.5, 1)
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(6, 3.2, -16),
        new THREE.Vector3(2, 1.6, -9),
        new THREE.Vector3(-1, -0.4, -4),
        new THREE.Vector3(-5, -2.2, 0)
      ])
    ];

    pathCurves.forEach((curve, idx) => {
      const points = curve.getPoints(80);
      const splineGeo = new THREE.BufferGeometry().setFromPoints(points);
      const splineMat = new THREE.LineBasicMaterial({
        color: idx % 2 === 0 ? 0xb4c4af : 0x8a9a86,
        transparent: true,
        opacity: 0.32,
        blending: THREE.AdditiveBlending
      });
      const splineLine = new THREE.Line(splineGeo, splineMat);
      this.splinesGroup.add(splineLine);
    });

    this.group.add(this.splinesGroup);
  }

  updateScrollProgress(t) {
    if (t < 0.22) {
      const vortexFade = 1.0 - (t / 0.22) * 0.35;
      this.rings.forEach(r => {
        r.mesh.material.opacity = r.baseOpacity * vortexFade;
        r.mesh.scale.setScalar(1.0 + (t / 0.22) * 0.3 * r.alpha);
      });

      if (this.gridGroup.children[0]) {
        this.gridGroup.children[0].material.opacity = (t / 0.22) * 0.2;
      }
      this.splinesGroup.children.forEach(s => s.material.opacity = (t / 0.22) * 0.35);
    } 
    else if (t >= 0.22 && t < 0.7) {
      const p = (t - 0.22) / 0.48;
      
      this.rings.forEach(r => {
        r.mesh.material.opacity = r.baseOpacity * Math.max(0, 0.55 - p * 0.48);
        r.mesh.scale.setScalar(1.3 + p * 0.45);
      });

      if (this.gridGroup.children[0]) {
        this.gridGroup.children[0].material.opacity = 0.2 - p * 0.09;
      }
      this.splinesGroup.children.forEach(s => s.material.opacity = 0.35 - p * 0.12);
    } 
    else {
      const p4 = (t - 0.7) / 0.3;
      this.rings.forEach(r => {
        r.mesh.material.opacity = r.baseOpacity * Math.max(0, 0.1 * (1 - p4));
      });
      if (this.gridGroup.children[0]) {
        this.gridGroup.children[0].material.opacity = 0.11 * (1 - p4);
      }
      this.splinesGroup.children.forEach(s => s.material.opacity = 0.22 * (1 - p4 * 0.5));
    }
  }

  animate(time) {
    // Elegant acoustic harmonic wave ripple
    for (let i = 0; i < this.rings.length; i++) {
      const ring = this.rings[i];
      // Wave travels smoothly from inner core to outer rings
      const wave = Math.sin(time * 2.4 - ring.phaseOffset);
      const pulseScale = 1.0 + wave * (ring.isMajor ? 0.038 : 0.02);
      ring.mesh.scale.set(pulseScale, pulseScale, 1.0);

      // Subtle atmospheric breathing rotation
      ring.mesh.rotation.z = Math.sin(time * 0.25 + ring.alpha * 2) * 0.04;
    }

    this.splinesGroup.rotation.z = Math.sin(time * 0.18) * 0.015;
  }
}
