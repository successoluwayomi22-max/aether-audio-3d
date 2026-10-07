import * as THREE from 'three';

/**
 * Cinematic studio lighting tailored to:
 * Charcoal (#121518), Soft Olive (#8a9a86), and Whitesmoke (#f5f5f5)
 */
export class Lighting {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'StudioLighting';

    this.createLights();
  }

  createLights() {
    // 1. Ambient Light — Charcoal fill with subtle olive hue
    this.ambient = new THREE.AmbientLight(0x1a201c, 2.0);
    this.group.add(this.ambient);

    // 2. Key Directional Light — Crisp Whitesmoke from front-top-left
    this.keyLight = new THREE.DirectionalLight(0xf5f5f5, 3.4);
    this.keyLight.position.set(-3.5, 5.5, 4.5);
    this.keyLight.castShadow = window.innerWidth >= 768;
    this.group.add(this.keyLight);

    // 3. Rim Light 1 — Soft Olive Edge Illumination from top-right-rear
    this.rimLightOlive = new THREE.DirectionalLight(0xa3b49f, 4.2);
    this.rimLightOlive.position.set(4.5, 4.0, -2.5);
    this.group.add(this.rimLightOlive);

    // 4. Rim Light 2 — Deep Olive/Charcoal from bottom-left-rear
    this.rimLightCharcoal = new THREE.DirectionalLight(0x7c8d78, 2.6);
    this.rimLightCharcoal.position.set(-4.5, -2.5, -2.0);
    this.group.add(this.rimLightCharcoal);

    // 5. Specular Point Light — Whitesmoke highlight for ceramic clearcoat reflections
    this.frontPoint = new THREE.PointLight(0xffffff, 2.2, 14);
    this.frontPoint.position.set(0.6, 1.2, 3.8);
    this.group.add(this.frontPoint);

    // 6. Accent Underlight — Soft olive ambient glow from beneath
    this.underPoint = new THREE.PointLight(0x8a9a86, 1.4, 9);
    this.underPoint.position.set(0, -2.2, 0.5);
    this.group.add(this.underPoint);
  }

  updateScrollProgress(t) {
    this.rimLightOlive.intensity = 4.2 + Math.sin(t * Math.PI) * 1.4;
    this.frontPoint.position.x = 0.6 + t * 0.6;
  }
}
