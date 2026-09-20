import * as THREE from 'three';

export class OceanScene {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f4f8);
    
    // Camera: orthographic for ocean grid visualization
    const width = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / height;
    
    this.camera = new THREE.OrthographicCamera(
      -100 * aspect, 100 * aspect, 100, -100, 0.1, 1000
    );
    this.camera.position.set(50, 50, 200);
    this.camera.lookAt(0, 0, 0);
    
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);
    
    // Lighting
    const light = new THREE.DirectionalLight(0xffffff, 1.0);
    light.position.set(150, 150, 100);
    light.castShadow = true;
    this.scene.add(light);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.5);
    fillLight.position.set(-150, -150, -100);
    this.scene.add(fillLight);

    console.log('✅ Lighting configured');
    
    // Grid helper for reference
    const gridHelper = new THREE.GridHelper(200, 20, 0xcccccc, 0xeeeeee);
    this.scene.add(gridHelper);
    
    // Handle resize
    window.addEventListener('resize', () => this.onWindowResize());
  }
  
  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.renderer.setSize(width, height);
  }
  
  render() {
    this.renderer.render(this.scene, this.camera);
  }
  
  getScene() {
    return this.scene;
  }
  
  dispose() {
    this.renderer.dispose();
  }
}

export function startRenderLoop(scene) {
  function animate() {
    requestAnimationFrame(animate);
    scene.render();
  }
  animate();
}