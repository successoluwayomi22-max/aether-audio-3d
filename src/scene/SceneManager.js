import * as THREE from 'three';
import { EarbudsModel } from './EarbudsModel.js';
import { SoundVortex } from './SoundVortex.js';
import { Particles } from './Particles.js';
import { Lighting } from './Lighting.js';

export class SceneManager {
  constructor(container) {
    this.container = container;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Mouse & Drag state
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.drag = {
      isDragging: false,
      startX: 0,
      startY: 0,
      deltaX: 0,
      deltaY: 0,
      rotX: 0,
      rotY: 0
    };

    // Physics State: Second-Order Mass-Spring-Damper for authentic mechanical inertia
    this.physics = {
      progress: 0,
      velocity: 0,
      acceleration: 0,
      targetProgress: 0,
      springTension: 135.0, // k: spring stiffness
      damping: 18.0,        // c: viscous damping coefficient
      mass: 1.0,            // m: mass
      tiltX: 0,             // velocity-induced inertial pitch
      rollZ: 0              // velocity-induced aerodynamic roll
    };

    this.lastTime = 0;
    this.scrollProgress = 0;
    this.currentProgress = 0;
    this.targetProgress = 0;
    this.inspectMode = false;
    this.viewPaused = false;
    this.orbit = {
      yaw: 0,
      pitch: 0,
      yawVel: 0,
      pitchVel: 0,
      zoom: 1,
      targetZoom: 1,
      minZoom: 0.7,
      maxZoom: 1.9,
      pointers: new Map(),
      pinchStartDist: 0,
      pinchStartZoom: 1,
      lastMoveX: 0,
      lastMoveY: 0
    };
    this.baseCameraZ = 7.8;
    this.isMobile = this.width < 768 || /Mobi|Android/i.test(navigator.userAgent);
    this.inspectLocked = false;
    this.viewEnabled = true;
    this.zoom = 1;
    this.targetZoom = 1;
    this.pointers = new Map();
    this.pinchStartDistance = 0;
    this.pinchStartZoom = 1;
    this.inertia = { x: 0, y: 0 };
    this.onUserInteract = null;

    this.initScene();
    this.initRenderer();
    this.initEnvironment();
    this.initCamera();
    this.initObjects();
    this.bindEvents();
  }

  initScene() {
    this.scene = new THREE.Scene();
    // Deep Charcoal background
    this.scene.background = new THREE.Color(0x121518);
    this.scene.fog = new THREE.FogExp2(0x121518, 0.038);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.isMobile ? 1.5 : 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.30;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = !this.isMobile;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
  }

  initEnvironment() {
    // Generate a high-resolution 1024x512 procedural studio lighting environment map
    // tailored for pristine ceramic clearcoat specular reflections and soft LSR silicone light scattering
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    const canvas = document.createElement('canvas');
    const cw = this.isMobile ? 512 : 1024;
    const ch = this.isMobile ? 256 : 512;
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext('2d');
    const sx = cw / 1024;
    const sy = ch / 512;

    const baseGrad = ctx.createLinearGradient(0, 0, 0, ch);
    baseGrad.addColorStop(0, '#2d3832');
    baseGrad.addColorStop(0.35, '#191f1c');
    baseGrad.addColorStop(0.65, '#121518');
    baseGrad.addColorStop(1, '#0b0e10');
    ctx.fillStyle = baseGrad;
    ctx.fillRect(0, 0, cw, ch);

    const keySoftbox = ctx.createRadialGradient(512 * sx, 120 * sy, 10 * sx, 512 * sx, 120 * sy, 240 * sx);
    keySoftbox.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    keySoftbox.addColorStop(0.3, 'rgba(240, 245, 242, 0.7)');
    keySoftbox.addColorStop(0.7, 'rgba(180, 195, 185, 0.25)');
    keySoftbox.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = keySoftbox;
    ctx.beginPath();
    ctx.ellipse(512 * sx, 120 * sy, 360 * sx, 140 * sy, 0, 0, Math.PI * 2);
    ctx.fill();

    const leftStrip = ctx.createLinearGradient(120 * sx, 0, 260 * sx, 0);
    leftStrip.addColorStop(0, 'rgba(255, 255, 255, 0)');
    leftStrip.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
    leftStrip.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = leftStrip;
    ctx.fillRect(120 * sx, 80 * sy, 140 * sx, 320 * sy);

    const rightStrip = ctx.createLinearGradient(740 * sx, 0, 900 * sx, 0);
    rightStrip.addColorStop(0, 'rgba(164, 184, 160, 0)');
    rightStrip.addColorStop(0.5, 'rgba(178, 198, 172, 0.8)');
    rightStrip.addColorStop(1, 'rgba(164, 184, 160, 0)');
    ctx.fillStyle = rightStrip;
    ctx.fillRect(740 * sx, 90 * sy, 160 * sx, 300 * sy);

    const groundBounce = ctx.createRadialGradient(512 * sx, 450 * sy, 20 * sx, 512 * sx, 450 * sy, 300 * sx);
    groundBounce.addColorStop(0, 'rgba(195, 210, 190, 0.35)');
    groundBounce.addColorStop(0.5, 'rgba(140, 155, 140, 0.12)');
    groundBounce.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = groundBounce;
    ctx.beginPath();
    ctx.ellipse(512 * sx, 450 * sy, 420 * sx, 80 * sy, 0, 0, Math.PI * 2);
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.mapping = THREE.EquirectangularReflectionMapping;

    const envMap = pmremGenerator.fromEquirectangular(texture).texture;
    this.scene.environment = envMap;

    texture.dispose();
    pmremGenerator.dispose();
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 80);
    this.camera.position.set(0, 0, 7.8);
    this.scene.add(this.camera);

    this.cameraBasePos = this.camera.position.clone();
  }

  initObjects() {
    this.lighting = new Lighting();
    this.scene.add(this.lighting.group);

    this.soundVortex = new SoundVortex();
    this.scene.add(this.soundVortex.group);

    this.particles = new Particles(this.isMobile ? 420 : 900);
    this.scene.add(this.particles.group);

    this.earbuds = new EarbudsModel();
    this.scene.add(this.earbuds.group);
  }

  bindEvents() {
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.onResize(), 120);
    });

    window.addEventListener('pointermove', (e) => {
      this.mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
      this.onPointerMove(e);
    });

    const dom = this.renderer.domElement;
    dom.style.touchAction = 'none';
    dom.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    window.addEventListener('pointerup', (e) => this.onPointerUp(e));
    window.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    dom.addEventListener(
      'wheel',
      (e) => {
        if (!this.inspectMode && !e.ctrlKey) return;
        e.preventDefault();
        const next = this.orbit.targetZoom * (e.deltaY > 0 ? 0.94 : 1.06);
        this.orbit.targetZoom = Math.min(this.orbit.maxZoom, Math.max(this.orbit.minZoom, next));
      },
      { passive: false }
    );
  }

  pointerDistance() {
    const pts = [...this.orbit.pointers.values()];
    if (pts.length < 2) return 0;
    const dx = pts[0].x - pts[1].x;
    const dy = pts[0].y - pts[1].y;
    return Math.hypot(dx, dy);
  }

  onPointerDown(e) {
    const dom = this.renderer.domElement;
    this.orbit.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    this.drag.isDragging = this.orbit.pointers.size === 1;
    this.drag.startX = e.clientX;
    this.drag.startY = e.clientY;
    this.orbit.yawVel = 0;
    this.orbit.pitchVel = 0;
    if (this.orbit.pointers.size === 2) {
      this.orbit.pinchStartDist = this.pointerDistance();
      this.orbit.pinchStartZoom = this.orbit.targetZoom;
      this.drag.isDragging = false;
      this.setInspectMode(true);
    }
    try {
      dom.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    dom.style.cursor = 'grabbing';
  }

  onPointerMove(e) {
    if (!this.orbit.pointers.has(e.pointerId)) return;
    const prev = this.orbit.pointers.get(e.pointerId);
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    this.orbit.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (this.orbit.pointers.size === 2 && this.orbit.pinchStartDist > 0) {
      const dist = this.pointerDistance();
      const scale = dist / this.orbit.pinchStartDist;
      this.orbit.targetZoom = Math.min(
        this.orbit.maxZoom,
        Math.max(this.orbit.minZoom, this.orbit.pinchStartZoom * scale)
      );
      return;
    }

    if (this.drag.isDragging) {
      this.orbit.yaw += dx * 0.0055;
      this.orbit.pitch = Math.max(-0.85, Math.min(0.85, this.orbit.pitch + dy * 0.0045));
      this.orbit.lastMoveX = dx;
      this.orbit.lastMoveY = dy;
    }
  }

  onPointerUp(e) {
    if (!this.orbit.pointers.has(e.pointerId)) {
      this.drag.isDragging = false;
      this.renderer.domElement.style.cursor = 'default';
      return;
    }
    this.orbit.pointers.delete(e.pointerId);
    if (this.orbit.pointers.size < 2) {
      this.orbit.pinchStartDist = 0;
    }
    if (this.orbit.pointers.size === 0) {
      this.orbit.yawVel = this.orbit.lastMoveX * 0.018;
      this.orbit.pitchVel = this.orbit.lastMoveY * 0.014;
      this.orbit.lastMoveX = 0;
      this.orbit.lastMoveY = 0;
      this.drag.isDragging = false;
      this.renderer.domElement.style.cursor = 'default';
    }
  }

  setInspectMode(enabled) {
    this.inspectMode = Boolean(enabled);
    document.body.classList.toggle('inspect-mode', this.inspectMode);
    if (this.inspectMode) {
      this.targetProgress = 0.62;
      this.physics.targetProgress = 0.62;
    }
  }

  setViewEnabled(enabled) {
    this.viewEnabled = enabled !== false;
    this.container.style.visibility = this.viewEnabled ? 'visible' : 'hidden';
  }

  resetView() {
    this.orbit.yaw = 0;
    this.orbit.pitch = 0;
    this.orbit.yawVel = 0;
    this.orbit.pitchVel = 0;
    this.orbit.targetZoom = 1;
    this.orbit.zoom = 1;
    this.drag.deltaX = 0;
    this.drag.deltaY = 0;
    this.drag.rotX = 0;
    this.drag.rotY = 0;
  }

  setFinish(finish) {
    this.earbuds?.setFinish(finish);
  }

  setViewEnabled(enabled) {
    this.viewEnabled = Boolean(enabled);
    if (this.renderer?.domElement) {
      this.renderer.domElement.style.opacity = this.viewEnabled ? '1' : '0';
    }
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.baseCameraZ = this.width < 768 ? 10.0 : 7.8;
    this.camera.fov = this.width < 768 ? 48 : 40;
    this.camera.position.z = this.baseCameraZ / this.orbit.zoom;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, this.width < 768 ? 1.5 : 2));
    this.renderer.setSize(this.width, this.height);
  }

  setScrollProgress(progress) {
    if (this.inspectMode) return;
    this.physics.targetProgress = Math.min(Math.max(progress, 0), 1);
    this.targetProgress = this.physics.targetProgress;

    if (this.width < 900) {
      this.earbuds.group.position.x = 0;
    } else {
      this.earbuds.group.position.x = 0.25;
    }
  }

  toggleLid() {
    if (this.earbuds && typeof this.earbuds.toggleLid === 'function') {
      return this.earbuds.toggleLid();
    }
    return false;
  }

  getScreenCoordinates(object3D) {
    if (!object3D) return { x: 0, y: 0, visible: false };

    const vector = new THREE.Vector3();
    object3D.getWorldPosition(vector);

    vector.project(this.camera);

    const isBehind = vector.z > 1;
    const x = (vector.x * 0.5 + 0.5) * this.width;
    const y = (-(vector.y * 0.5) + 0.5) * this.height;

    return {
      x,
      y,
      visible: !isBehind && vector.x >= -1.1 && vector.x <= 1.1 && vector.y >= -1.1 && vector.y <= 1.1
    };
  }

  render(time) {
    // 1. Smooth progress interpolation matching the responsive first prompt
    const prevProgress = this.currentProgress;
    this.currentProgress += (this.targetProgress - this.currentProgress) * 0.085;
    this.scrollProgress = this.currentProgress;
    const velocity = (this.currentProgress - prevProgress) * 60;

    // 2. Aerodynamic banking and velocity-induced tilt
    const targetTiltX = -velocity * 0.18;
    const targetRollZ = velocity * 0.08;
    this.physics.tiltX += (targetTiltX - this.physics.tiltX) * 0.18;
    this.physics.rollZ += (targetRollZ - this.physics.rollZ) * 0.18;

    // 3. Update 3D subsystems with active scroll progress
    this.earbuds.updateScrollProgress(this.currentProgress, velocity);
    this.soundVortex.updateScrollProgress(this.currentProgress);
    this.particles.updateScrollProgress(this.currentProgress);
    this.lighting.updateScrollProgress(this.currentProgress);

    if (!this.drag.isDragging && this.orbit.pointers.size === 0) {
      this.orbit.yaw += this.orbit.yawVel;
      this.orbit.pitch = Math.max(-0.85, Math.min(0.85, this.orbit.pitch + this.orbit.pitchVel));
      this.orbit.yawVel *= 0.935;
      this.orbit.pitchVel *= 0.935;
      if (Math.abs(this.orbit.yawVel) < 0.0002) this.orbit.yawVel = 0;
      if (Math.abs(this.orbit.pitchVel) < 0.0002) this.orbit.pitchVel = 0;
    }
    this.orbit.zoom += (this.orbit.targetZoom - this.orbit.zoom) * 0.12;

    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    this.camera.position.x = this.mouse.x * 0.3;
    this.camera.position.y = -0.15 + this.mouse.y * 0.22;
    this.camera.position.z = this.baseCameraZ / this.orbit.zoom;
    this.camera.lookAt(0.2, -0.2, 0);

    this.earbuds.group.rotation.x = this.orbit.pitch + this.physics.tiltX;
    this.earbuds.group.rotation.y = this.orbit.yaw;
    this.earbuds.group.rotation.z = this.physics.rollZ;

    this.earbuds.animate(time, this.currentProgress, this.physics.velocity);
    this.soundVortex.animate(time);
    this.particles.animate(time);

    if (!this.viewEnabled) return;
    this.renderer.render(this.scene, this.camera);
  }
}
