import * as THREE from 'three';
import { latLonDepthToScene } from './coordinates.js';

export class MarkerManager {
  constructor(oceanScene, grid) {
    this.oceanScene = oceanScene;
    this.grid = grid;
    this.markers = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    oceanScene.container.addEventListener('click', (e) => this.onMouseClick(e));
  }
  
  addMarker(lat, lon, depth) {
    const pos = latLonDepthToScene(lat, lon, depth, this.grid);
    
    const geometry = new THREE.SphereGeometry(2, 16, 16);
    const material = new THREE.MeshPhongMaterial({ 
      color: 0xff6b35,
      emissive: 0xff8c42
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(pos);
    mesh.userData = { lat, lon, depth };
    
    this.oceanScene.getScene().add(mesh);
    this.markers.push({ mesh, lat, lon, depth });
    
    console.log(`📍 Marker added: ${lat.toFixed(2)}, ${lon.toFixed(2)}, ${depth}m`);
  }
  
  onMouseClick(event) {
    const rect = this.oceanScene.container.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    
    this.raycaster.setFromCamera(this.mouse, this.oceanScene.camera);
    const intersects = this.raycaster.intersectObjects(this.markers.map(m => m.mesh));
    
    if (intersects.length > 0) {
      const hitMarker = intersects[0].object;
      const { lat, lon, depth } = hitMarker.userData;
      
      console.log(`✅ Marker clicked: lat=${lat.toFixed(2)}, lon=${lon.toFixed(2)}, depth=${depth}m`);
      
      window.dispatchEvent(new CustomEvent('markerClicked', {
        detail: { lat, lon, depth }
      }));
      
      hitMarker.material.color.set(0xffff00);
      setTimeout(() => hitMarker.material.color.set(0xff6b35), 200);
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