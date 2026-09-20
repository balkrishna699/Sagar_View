import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * Render pre-computed isosurfaces instead of points
 * (Requires Person 4 to generate .gltf files from Python)
 */
export class IsosurfaceRenderer {
  constructor(oceanScene) {
    this.oceanScene = oceanScene;
    this.isosurfaces = [];  // Array of loaded meshes
    this.currentTimeIndex = 0;
  }
  
  // Load pre-computed isosurfaces for a time step
  async loadIsosurfaces(timeIndex) {
    this.clearIsosurfaces();

    // Expect files like: isosurface_time_0_temp_20.gltf
    const urls = [
      `/data/isosurfaces/time_${timeIndex}_temp_10.gltf`,
      `/data/isosurfaces/time_${timeIndex}_temp_15.gltf`,
      `/data/isosurfaces/time_${timeIndex}_temp_20.gltf`,
      `/data/isosurfaces/time_${timeIndex}_temp_25.gltf`,
      `/data/isosurfaces/time_${timeIndex}_temp_30.gltf`,
    ];

    const loader = new GLTFLoader();
    let loadedCount = 0;

    for (const url of urls) {
      try {
        const response = await fetch(url, { method: 'HEAD' }).catch(() => null);
        if (!response || !response.ok) {
          continue;
        }

        const gltf = await new Promise((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });

        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            const temp = parseInt(url.match(/temp_(\d+)/)[1], 10);
            child.material = new THREE.MeshPhongMaterial({
              color: this.getColorForTemp(temp),
              emissive: 0x333333,
              shininess: 100
            });
          }
        });

        this.oceanScene.getScene().add(gltf.scene);
        this.isosurfaces.push(gltf.scene);
        loadedCount += 1;
      } catch (error) {
        // Missing or invalid generated isosurface files are non-fatal for the viewer.
      }
    }

    if (loadedCount === 0) {
      console.info('ℹ️ No isosurface files available for this timestep; rendering point cloud only.');
    }
  }
  
  getColorForTemp(temp) {
    const normalized = (temp - 10) / (32 - 10);
    const hue = 0.66 * (1 - normalized);
    const color = new THREE.Color();
    color.setHSL(hue, 1, 0.5);
    return color;
  }
  
  clearIsosurfaces() {
    this.isosurfaces.forEach((scene) => {
      this.oceanScene.getScene().remove(scene);
      scene.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
    });
    this.isosurfaces = [];
  }
  
  // Smooth animation between time steps
  async animateToTimeIndex(newIndex) {
    await this.loadIsosurfaces(newIndex);
    this.currentTimeIndex = newIndex;
  }
}