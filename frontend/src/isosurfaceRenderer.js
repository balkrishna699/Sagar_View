import * as THREE from 'three';

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
    
    for (const url of urls) {
      try {
        const gltf = await new Promise((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });
        
        gltf.scene.traverse((child) => {
          if (child.isMesh) {
            // Apply color based on temperature level
            const temp = parseInt(url.match(/temp_(\d+)/)[1]);
            child.material = new THREE.MeshPhongMaterial({
              color: this.getColorForTemp(temp),
              emissive: 0x333333,
              shininess: 100
            });
          }
        });
        
        this.oceanScene.getScene().add(gltf.scene);
        this.isosurfaces.push(gltf.scene);
        
        console.log(`✅ Loaded isosurface: ${temp}°C`);
      } catch (error) {
        console.warn(`⚠️ Could not load ${url}:`, error);
      }
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