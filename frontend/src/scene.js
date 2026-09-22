import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class OceanScene {
  constructor(container) {
    this.container = container;
    this.scene = new THREE.Scene();

    // Deep ocean gradient background
    this.scene.background = new THREE.Color(0x0a1628);

    // ── Camera ──
    const width  = container.clientWidth;
    const height = container.clientHeight;
    const aspect = width / height;

    // Use PerspectiveCamera for proper 3D depth perception
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 2000);
    this.camera.position.set(120, 100, 180);
    this.camera.lookAt(50, 25, 25);

    // ── Renderer ──
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
    container.appendChild(this.renderer.domElement);

    // ── OrbitControls (rotate/zoom/pan) ──
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(50, 50, 25);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.minDistance = 30;
    this.controls.maxDistance = 500;
    this.controls.maxPolarAngle = Math.PI * 0.85;
    this.controls.update();

    // ── Lighting ──
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(150, 200, 120);
    mainLight.castShadow = true;
    this.scene.add(mainLight);

    const ambientLight = new THREE.AmbientLight(0x88aacc, 0.5);
    this.scene.add(ambientLight);

    const fillLight = new THREE.DirectionalLight(0x4488ff, 0.4);
    fillLight.position.set(-100, -50, -80);
    this.scene.add(fillLight);

    // Subtle hemisphere light for ocean feel
    const hemiLight = new THREE.HemisphereLight(0x87ceeb, 0x1a3a5c, 0.3);
    this.scene.add(hemiLight);

    // ── Ocean floor plane ──
    const floorGeo = new THREE.PlaneGeometry(120, 120);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0d2137,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(50, 50, -2);  // just below z=0 (max depth)
    floor.name = 'oceanFloor';
    this.scene.add(floor);

    // ── Subtle grid helper ──
    const gridHelper = new THREE.GridHelper(120, 12, 0x1a3a5c, 0x112233);
    gridHelper.position.set(50, 50, -1);
    gridHelper.rotation.x = Math.PI / 2;
    this.scene.add(gridHelper);

    // ── Axis labels ──
    this._addAxisLabels();

    // ── Bounding box outline ──
    this._addBoundingBox();

    // ── Fog for depth effect ──
    this.scene.fog = new THREE.FogExp2(0x0a1628, 0.003);

    // ── Handle resize ──
    window.addEventListener('resize', () => this.onWindowResize());

    console.log('✅ Ocean scene configured (OrbitControls enabled)');
  }

  _addAxisLabels() {
    const makeLabel = (text, position, color = 0x6699cc) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 48;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, 128, 48);
      ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
      ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 64, 24);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.copy(position);
      sprite.scale.set(16, 6, 1);
      this.scene.add(sprite);
    };

    makeLabel('Lat →', new THREE.Vector3(110, 0, 25), 0x66bbff);
    makeLabel('Lon →', new THREE.Vector3(0, 110, 25), 0x66ffbb);
    makeLabel('Depth ↓', new THREE.Vector3(-8, 0, 55), 0xff8866);
  }

  _addBoundingBox() {
    const boxGeo = new THREE.BoxGeometry(100, 100, 50);
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x335577,
      transparent: true,
      opacity: 0.35
    });
    const wireframe = new THREE.LineSegments(edges, lineMat);
    wireframe.position.set(50, 50, 25);
    wireframe.name = 'boundingBox';
    this.scene.add(wireframe);
  }

  onWindowResize() {
    const width  = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;

    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  render() {
    this.controls.update();   // required for damping
    this.renderer.render(this.scene, this.camera);
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  getControls() {
    return this.controls;
  }

  dispose() {
    this.controls.dispose();
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