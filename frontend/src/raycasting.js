import * as THREE from 'three';
import { latLonDepthToScene } from './coordinates.js';

export class MarkerManager {
  constructor(oceanScene, grid) {
    this.oceanScene = oceanScene;
    this.grid = grid;
    this.markers = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Tooltip overlay
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'ctrl-panel';
    this.tooltip.style.cssText = `
      display: none; position: absolute;
      padding: 8px 12px; font-size: 11px;
      pointer-events: none; z-index: 200;
    `;
    oceanScene.container.appendChild(this.tooltip);

    oceanScene.container.addEventListener('click', (e) => this.onMouseClick(e));
    oceanScene.container.addEventListener('mousemove', (e) => this.onMouseMove(e));
  }

  addMarker(lat, lon, depth) {
    const pos = latLonDepthToScene(lat, lon, depth, this.grid);

    const geometry = new THREE.SphereGeometry(1.8, 16, 16);
    const material = new THREE.MeshPhongMaterial({
      color: 0xff6b35,
      emissive: 0xff4500,
      emissiveIntensity: 0.4,
      shininess: 80,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(pos);
    mesh.userData = { lat, lon, depth };

    this.oceanScene.getScene().add(mesh);
    this.markers.push({ mesh, lat, lon, depth });

    console.log(`📍 Marker: ${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E, ${depth}m`);
  }

  onMouseClick(event) {
    const rect = this.oceanScene.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Use getCamera() for correct camera reference
    this.raycaster.setFromCamera(this.mouse, this.oceanScene.getCamera());
    const intersects = this.raycaster.intersectObjects(this.markers.map(m => m.mesh));

    if (intersects.length > 0) {
      const hitMarker = intersects[0].object;
      const { lat, lon, depth } = hitMarker.userData;

      console.log(`✅ Marker clicked: ${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E, ${depth}m`);

      window.dispatchEvent(new CustomEvent('markerClicked', {
        detail: { lat, lon, depth }
      }));

      // Flash effect
      const origColor = hitMarker.material.color.getHex();
      hitMarker.material.color.set(0xffff00);
      hitMarker.material.emissive.set(0xffff00);
      setTimeout(() => {
        hitMarker.material.color.set(origColor);
        hitMarker.material.emissive.set(0xff4500);
      }, 300);
    }
  }

  onMouseMove(event) {
    const rect = this.oceanScene.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.oceanScene.getCamera());
    const intersects = this.raycaster.intersectObjects(this.markers.map(m => m.mesh));

    if (intersects.length > 0) {
      const { lat, lon, depth } = intersects[0].object.userData;
      this.tooltip.style.display = 'block';
      this.tooltip.style.left = `${event.clientX - rect.left + 12}px`;
      this.tooltip.style.top = `${event.clientY - rect.top - 10}px`;
      this.tooltip.innerHTML = `<b>${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E</b><br/>Depth: ${depth}m`;
    } else {
      this.tooltip.style.display = 'none';
    }
  }

  clear() {
    this.markers.forEach(({ mesh }) => {
      this.oceanScene.getScene().remove(mesh);
      mesh.geometry?.dispose();
      mesh.material?.dispose();
    });
    this.markers = [];
  }
}