/**
 * Projects 3D anchor positions to 2D HUD callout tags.
 * Displays interactive telemetry during Section 3 (3D Product Rotation / Inspection).
 */
export class HUDOverlay {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;
    this.pins = {
      driver: document.getElementById('hud-pin-driver'),
      mic: document.getElementById('hud-pin-mic'),
      vent: document.getElementById('hud-pin-vent')
    };
  }

  update(scrollProgress) {
    // HUD callouts active during Section 3 (Inspection phase: t = 0.32 to 0.54)
    const isInspectionStage = (scrollProgress >= 0.32 && scrollProgress <= 0.54);

    if (!isInspectionStage || window.innerWidth < 900) {
      Object.values(this.pins).forEach(pin => {
        if (pin) pin.classList.remove('visible');
      });
      return;
    }

    const anchors = this.sceneManager.earbuds.anchors;

    const coordsDriver = this.sceneManager.getScreenCoordinates(anchors.driver);
    const coordsMic = this.sceneManager.getScreenCoordinates(anchors.mic);
    const coordsVent = this.sceneManager.getScreenCoordinates(anchors.vent);

    this.updatePin(this.pins.driver, coordsDriver);
    this.updatePin(this.pins.mic, coordsMic);
    this.updatePin(this.pins.vent, coordsVent);
  }

  updatePin(pinElement, coords) {
    if (!pinElement) return;

    if (coords.visible) {
      pinElement.classList.add('visible');
      pinElement.style.transform = `translate3d(${coords.x}px, ${coords.y}px, 0)`;
    } else {
      pinElement.classList.remove('visible');
    }
  }
}
