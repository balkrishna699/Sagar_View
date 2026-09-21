import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Chart from "chart.js/auto";

import { loadOceanData } from "./data/dataService.js";
import { createInstrumentLayer } from "./visualization/instrumentLayer.js";

import "./style.css";


/* =========================================================
   VOLUME
   ========================================================= */

const VOLUME_WIDTH = 13.5;
const VOLUME_HEIGHT = 8.0;
const VOLUME_DEPTH = 13.5;


/* =========================================================
   STATE
   ========================================================= */

let oceanGrid = null;

let scene;
let camera;
let renderer;
let controls;

let volumeGroup;
let sliceGroup;
let outlineGroup;
let markerGroup;
let depthSlicePlane;

let instrumentLayer;

let profileChart = null;

let selectedLat = 15;
let selectedLon = 75;
let selectedDepth = 2500;

let selectedVariable = "temperature";

let latitudeSlider;
let longitudeSlider;
let depthSlider;

let latitudeValue;
let longitudeValue;
let depthValue;

let profilePanel;
let depthSliceButton;

let animationClock = new THREE.Clock();

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();


/* =========================================================
   ROOT
   ========================================================= */

const app = document.createElement("div");

app.id = "app";

document.body.appendChild(app);


/* =========================================================
   HELPERS
   ========================================================= */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}


function lerp(a, b, t) {
  return a + (b - a) * t;
}


function getNearestIndex(values, target) {

  let bestIndex = 0;
  let bestDistance = Infinity;

  values.forEach((value, index) => {

    const distance =
      Math.abs(value - target);

    if (distance < bestDistance) {

      bestDistance = distance;
      bestIndex = index;

    }

  });

  return bestIndex;
}


function getCurrentSpeed(u, v) {

  if (
    !Number.isFinite(u) ||
    !Number.isFinite(v)
  ) {
    return 0;
  }

  return Math.sqrt(
    u * u + v * v
  );
}


function getCurrentDirection(u, v) {

  if (
    !Number.isFinite(u) ||
    !Number.isFinite(v)
  ) {
    return 0;
  }

  return (
    Math.atan2(v, u) *
    180 /
    Math.PI
  );
}


/* =========================================================
   VARIABLE INFO
   ========================================================= */

function getVariableInfo(variable) {

  if (variable === "temperature") {

    return {
      label: "Temperature",
      unit: "°C",
      min: -2,
      max: 30
    };

  }

  if (variable === "salinity") {

    return {
      label: "Salinity",
      unit: "PSU",
      min: 34.4,
      max: 35.1
    };

  }

  return {
    label: "Current Speed",
    unit: "m/s",
    min: 0,
    max: 0.8
  };
}


/* =========================================================
   SCALAR VALUE
   ========================================================= */

function getScalarValue(
  variable,
  depthIndex,
  latIndex,
  lonIndex
) {

  if (variable === "temperature") {

    return Number(
      oceanGrid.temperature[
        depthIndex
      ][latIndex][lonIndex]
    );

  }

  if (variable === "salinity") {

    return Number(
      oceanGrid.salinity[
        depthIndex
      ][latIndex][lonIndex]
    );

  }

  const u =
    Number(
      oceanGrid.uCurrent[
        depthIndex
      ][latIndex][lonIndex]
    );

  const v =
    Number(
      oceanGrid.vCurrent[
        depthIndex
      ][latIndex][lonIndex]
    );

  return getCurrentSpeed(u, v);
}


/* =========================================================
   COLOR
   ========================================================= */

function scalarToColor(value, variable) {

  const info =
    getVariableInfo(variable);

  let t =
    (
      value - info.min
    ) /
    (
      info.max - info.min
    );

  t = clamp(t, 0, 1);

  const stops = [

    {
      t: 0,
      color: [20, 45, 180]
    },

    {
      t: 0.25,
      color: [0, 190, 230]
    },

    {
      t: 0.50,
      color: [30, 190, 90]
    },

    {
      t: 0.75,
      color: [255, 220, 0]
    },

    {
      t: 1,
      color: [235, 40, 25]
    }

  ];


  for (
    let i = 0;
    i < stops.length - 1;
    i++
  ) {

    const a = stops[i];
    const b = stops[i + 1];

    if (
      t >= a.t &&
      t <= b.t
    ) {

      const localT =
        (
          t - a.t
        ) /
        (
          b.t - a.t
        );

      return [

        Math.round(
          lerp(
            a.color[0],
            b.color[0],
            localT
          )
        ),

        Math.round(
          lerp(
            a.color[1],
            b.color[1],
            localT
          )
        ),

        Math.round(
          lerp(
            a.color[2],
            b.color[2],
            localT
          )
        )

      ];

    }

  }

  return stops[stops.length - 1].color;
}


/* =========================================================
   HTML
   ========================================================= */

function createApplicationHTML() {

  app.innerHTML = `

    <div class="app-shell">

      <header class="topbar">

        <div>

          <h1>
            3D Ocean Data Explorer
          </h1>

          <p>
            Interactive ocean temperature, salinity and current visualization
          </p>

        </div>

        <button
          id="recenterButton"
          class="secondary-button"
        >
          ⟳ Recenter
        </button>

      </header>


      <section class="control-bar">

        <div class="control-group variable-control">

          <label>VARIABLE</label>

          <select id="variableSelect">

            <option value="temperature">
              Temperature
            </option>

            <option value="salinity">
              Salinity
            </option>

            <option value="current">
              Current Speed
            </option>

          </select>

        </div>


        <div class="control-group">

          <label>LATITUDE</label>

          <div class="slider-row">

            <input
              id="latitudeSlider"
              type="range"
              min="${oceanGrid.latitude[0]}"
              max="${oceanGrid.latitude[oceanGrid.latitude.length - 1]}"
              step="0.1"
              value="${selectedLat}"
            />

            <span id="latitudeValue">
              15.0°
            </span>

          </div>

        </div>


        <div class="control-group">

          <label>LONGITUDE</label>

          <div class="slider-row">

            <input
              id="longitudeSlider"
              type="range"
              min="${oceanGrid.longitude[0]}"
              max="${oceanGrid.longitude[oceanGrid.longitude.length - 1]}"
              step="0.1"
              value="${selectedLon}"
            />

            <span id="longitudeValue">
              75.0°
            </span>

          </div>

        </div>


        <div class="control-group">

          <label>DEPTH</label>

          <div class="slider-row">

            <input
              id="depthSlider"
              type="range"
              min="0"
              max="${oceanGrid.depth[oceanGrid.depth.length - 1]}"
              step="10"
              value="${selectedDepth}"
            />

            <span id="depthValue">
              2500 m
            </span>

          </div>

        </div>


        <button
          id="depthSliceButton"
          class="secondary-button"
        >
          Depth Slice
        </button>


        <button
          id="profileButton"
          class="secondary-button"
        >
          Profile Chart
        </button>

      </section>


      <main class="visual-area">

        <div class="depth-label surface-label">
          SURFACE • 0 m
        </div>


        <div id="threeContainer"></div>


        <div class="depth-label deep-label">
          DEEP OCEAN • 5000 m
        </div>


        <aside
          id="selectedPanel"
          class="selected-panel"
        >

          <h2>
            Selected Location
          </h2>

          <div class="location-grid">

            <span>Latitude</span>
            <strong id="panelLat">15.0°</strong>

            <span>Longitude</span>
            <strong id="panelLon">75.0°</strong>

            <span>Depth</span>
            <strong id="panelDepth">2500 m</strong>

          </div>


          <div class="measurement">

            <span>Temperature</span>

            <strong id="panelTemperature">
              —
            </strong>

          </div>


          <div class="measurement">

            <span>Salinity</span>

            <strong id="panelSalinity">
              —
            </strong>

          </div>


          <div class="measurement">

            <span>Current Speed</span>

            <strong id="panelCurrent">
              —
            </strong>

          </div>


          <div class="measurement">

            <span>Current Direction</span>

            <strong id="panelDirection">
              —
            </strong>

          </div>


          <p class="panel-note">

            Select an instrument or move through
            latitude, longitude and depth.

          </p>

        </aside>


        <div
          id="colorLegend"
          class="color-legend"
        ></div>


        <div class="orientation-help">

          <span>↔ Rotate</span>

          <span>↕ Tilt</span>

          <span>Scroll Zoom</span>

        </div>


        <div
          id="profilePanel"
          class="profile-panel hidden"
        >

          <div class="profile-header">

            <div>

              <h2>
                Vertical Observation Profile
              </h2>

              <p id="profileSubtitle">
                Depth profile at selected location
              </p>

            </div>

            <button id="closeProfileButton">
              ×
            </button>

          </div>


          <div class="profile-chart-area">

            <canvas id="profileCanvas"></canvas>

          </div>

        </div>

      </main>

    </div>

  `;
}


/* =========================================================
   UI
   ========================================================= */

function setupUIReferences() {

  const variableSelect =
    document.getElementById(
      "variableSelect"
    );

  latitudeSlider =
    document.getElementById(
      "latitudeSlider"
    );

  longitudeSlider =
    document.getElementById(
      "longitudeSlider"
    );

  depthSlider =
    document.getElementById(
      "depthSlider"
    );

  latitudeValue =
    document.getElementById(
      "latitudeValue"
    );

  longitudeValue =
    document.getElementById(
      "longitudeValue"
    );

  depthValue =
    document.getElementById(
      "depthValue"
    );

  profilePanel =
    document.getElementById(
      "profilePanel"
    );

  depthSliceButton =
    document.getElementById(
      "depthSliceButton"
    );


  variableSelect.addEventListener(
    "change",
    () => {

      selectedVariable =
        variableSelect.value;

      rebuildScalarSlices();

      updateLegend();

    }
  );


  latitudeSlider.addEventListener(
    "input",
    () => {

      selectedLat =
        Number(
          latitudeSlider.value
        );

      updateSelectedLocation();

      updateMarker();

    }
  );


  longitudeSlider.addEventListener(
    "input",
    () => {

      selectedLon =
        Number(
          longitudeSlider.value
        );

      updateSelectedLocation();

      updateMarker();

    }
  );


  depthSlider.addEventListener(
    "input",
    () => {

      selectedDepth =
        Number(
          depthSlider.value
        );

      updateSelectedLocation();

      updateMarker();

      updateDepthSlice();

    }
  );


  document
    .getElementById(
      "recenterButton"
    )
    .addEventListener(
      "click",
      recenterCamera
    );


  depthSliceButton.addEventListener(
    "click",
    () => {

      depthSlicePlane.visible =
        !depthSlicePlane.visible;

      depthSliceButton.classList.toggle(
        "active",
        depthSlicePlane.visible
      );

    }
  );


  document
    .getElementById(
      "profileButton"
    )
    .addEventListener(
      "click",
      () => {

        profilePanel.classList.remove(
          "hidden"
        );

        updateProfileChart();

      }
    );


  document
    .getElementById(
      "closeProfileButton"
    )
    .addEventListener(
      "click",
      () => {

        profilePanel.classList.add(
          "hidden"
        );

      }
    );
}


/* =========================================================
   THREE.JS
   ========================================================= */

function createRenderer() {

  const container =
    document.getElementById(
      "threeContainer"
    );


  scene =
    new THREE.Scene();

  scene.background =
    new THREE.Color(
      0x06101c
    );


  camera =
    new THREE.PerspectiveCamera(
      42,
      container.clientWidth /
      container.clientHeight,
      0.1,
      1000
    );


  camera.position.set(
    12.5,
    8.5,
    13.5
  );


  renderer =
    new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });


  renderer.setPixelRatio(
    Math.min(
      window.devicePixelRatio,
      2
    )
  );


  renderer.setSize(
    container.clientWidth,
    container.clientHeight
  );


  renderer.outputColorSpace =
    THREE.SRGBColorSpace;


  container.appendChild(
    renderer.domElement
  );


  controls =
    new OrbitControls(
      camera,
      renderer.domElement
    );


  controls.enableDamping = true;

  controls.dampingFactor = 0.075;

  controls.enablePan = false;

  controls.minDistance = 12;

  controls.maxDistance = 27;


  /*
   * Keep the surface on top.
   * Prevents confusing upside-down views.
   */

  controls.minPolarAngle = 0.62;

  controls.maxPolarAngle = 1.38;


  controls.minAzimuthAngle = -2.4;

  controls.maxAzimuthAngle = 2.4;


  controls.target.set(
    0,
    0,
    0
  );


  scene.add(
    new THREE.AmbientLight(
      0xffffff,
      1.4
    )
  );


  const light =
    new THREE.DirectionalLight(
      0xffffff,
      1.2
    );

  light.position.set(
    8,
    14,
    10
  );

  scene.add(light);


  window.addEventListener(
    "resize",
    onResize
  );
}


/* =========================================================
   VOLUME
   ========================================================= */

function createVolumeStructure() {

  volumeGroup =
    new THREE.Group();

  scene.add(
    volumeGroup
  );


  sliceGroup =
    new THREE.Group();

  volumeGroup.add(
    sliceGroup
  );


  outlineGroup =
    new THREE.Group();

  volumeGroup.add(
    outlineGroup
  );


  createVolumeOutline();

  createDepthSlicePlane();
}


function createVolumeOutline() {

  const geometry =
    new THREE.BoxGeometry(
      VOLUME_WIDTH,
      VOLUME_HEIGHT,
      VOLUME_DEPTH
    );


  const edges =
    new THREE.EdgesGeometry(
      geometry
    );


  const material =
    new THREE.LineBasicMaterial({
      color: 0x8fd8e8,
      transparent: true,
      opacity: 0.55
    });


  outlineGroup.add(
    new THREE.LineSegments(
      edges,
      material
    )
  );
}


function createDepthSlicePlane() {

  const geometry =
    new THREE.PlaneGeometry(
      VOLUME_WIDTH,
      VOLUME_DEPTH
    );


  const material =
    new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.13,
      side: THREE.DoubleSide,
      depthWrite: false
    });


  depthSlicePlane =
    new THREE.Mesh(
      geometry,
      material
    );


  depthSlicePlane.rotation.x =
    -Math.PI / 2;


  volumeGroup.add(
    depthSlicePlane
  );
}


/* =========================================================
   SCALAR SLICES
   ========================================================= */

function createSliceTexture(depthIndex) {

  const width =
    oceanGrid.longitude.length;

  const height =
    oceanGrid.latitude.length;


  const canvas =
    document.createElement(
      "canvas"
    );

  canvas.width = 256;
  canvas.height = 256;


  const context =
    canvas.getContext("2d");


  const cellWidth =
    canvas.width / width;

  const cellHeight =
    canvas.height / height;


  for (
    let latIndex = 0;
    latIndex < height;
    latIndex++
  ) {

    for (
      let lonIndex = 0;
      lonIndex < width;
      lonIndex++
    ) {

      const value =
        getScalarValue(
          selectedVariable,
          depthIndex,
          latIndex,
          lonIndex
        );


      const color =
        scalarToColor(
          value,
          selectedVariable
        );


      context.fillStyle =
        `rgb(
          ${color[0]},
          ${color[1]},
          ${color[2]}
        )`;


      context.fillRect(
        lonIndex * cellWidth,
        canvas.height -
          (latIndex + 1) *
          cellHeight,
        cellWidth + 1,
        cellHeight + 1
      );

    }

  }


  const texture =
    new THREE.CanvasTexture(
      canvas
    );


  texture.colorSpace =
    THREE.SRGBColorSpace;


  texture.minFilter =
    THREE.LinearFilter;

  texture.magFilter =
    THREE.LinearFilter;


  return texture;
}


function rebuildScalarSlices() {

  if (!sliceGroup) {
    return;
  }


  while (
    sliceGroup.children.length
  ) {

    const child =
      sliceGroup.children.pop();


    if (child.geometry) {
      child.geometry.dispose();
    }


    if (child.material) {

      if (child.material.map) {
        child.material.map.dispose();
      }

      child.material.dispose();
    }

  }


  const maxDepth =
    oceanGrid.depth[
      oceanGrid.depth.length - 1
    ];


  for (
    let depthIndex = 0;
    depthIndex <
    oceanGrid.depth.length;
    depthIndex++
  ) {

    const depth =
      oceanGrid.depth[
        depthIndex
      ];


    const texture =
      createSliceTexture(
        depthIndex
      );


    const material =
      new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.18,
        side: THREE.DoubleSide,
        depthWrite: false
      });


    const plane =
      new THREE.Mesh(
        new THREE.PlaneGeometry(
          VOLUME_WIDTH,
          VOLUME_DEPTH
        ),
        material
      );


    plane.rotation.x =
      -Math.PI / 2;


    plane.position.y =
      VOLUME_HEIGHT / 2 -
      (
        depth /
        maxDepth
      ) *
      VOLUME_HEIGHT;


    plane.renderOrder =
      oceanGrid.depth.length -
      depthIndex;


    sliceGroup.add(
      plane
    );

  }


  const body =
    new THREE.Mesh(

      new THREE.BoxGeometry(
        VOLUME_WIDTH,
        VOLUME_HEIGHT,
        VOLUME_DEPTH
      ),

      new THREE.MeshBasicMaterial({
        color: 0x0a4e73,
        transparent: true,
        opacity: 0.035,
        side: THREE.BackSide,
        depthWrite: false
      })

    );


  body.renderOrder = 1000;

  sliceGroup.add(body);
}


/* =========================================================
   MARKER
   ========================================================= */

function createMarker() {

  markerGroup =
    new THREE.Group();

  scene.add(
    markerGroup
  );


  const sphere =
    new THREE.Mesh(
      new THREE.SphereGeometry(
        0.22,
        32,
        32
      ),
      new THREE.MeshBasicMaterial({
        color: 0xffffff
      })
    );


  markerGroup.add(sphere);


  const ring =
    new THREE.Mesh(
      new THREE.TorusGeometry(
        0.42,
        0.055,
        12,
        48
      ),
      new THREE.MeshBasicMaterial({
        color: 0xffd34d
      })
    );


  ring.rotation.x =
    -Math.PI / 2;

  ring.name =
    "haloRing";


  markerGroup.add(ring);


  const outerRing =
    new THREE.Mesh(
      new THREE.TorusGeometry(
        0.68,
        0.025,
        10,
        48
      ),
      new THREE.MeshBasicMaterial({
        color: 0x5eeaff,
        transparent: true,
        opacity: 0.6
      })
    );


  outerRing.rotation.x =
    -Math.PI / 2;

  outerRing.name =
    "outerHaloRing";


  markerGroup.add(
    outerRing
  );


  updateMarker();
}


/* =========================================================
   COORDINATES
   ========================================================= */

function latToX(lat) {

  const min =
    oceanGrid.latitude[0];

  const max =
    oceanGrid.latitude[
      oceanGrid.latitude.length - 1
    ];


  return (
    (
      (
        lat - min
      ) /
      (
        max - min
      )
    ) -
    0.5
  ) *
  VOLUME_WIDTH;
}


function lonToZ(lon) {

  const min =
    oceanGrid.longitude[0];

  const max =
    oceanGrid.longitude[
      oceanGrid.longitude.length - 1
    ];


  return (
    (
      (
        lon - min
      ) /
      (
        max - min
      )
    ) -
    0.5
  ) *
  VOLUME_DEPTH;
}


function depthToY(depth) {

  const maxDepth =
    oceanGrid.depth[
      oceanGrid.depth.length - 1
    ];


  return (
    VOLUME_HEIGHT / 2 -
    (
      depth /
      maxDepth
    ) *
    VOLUME_HEIGHT
  );
}


/* =========================================================
   UPDATE MARKER
   ========================================================= */

function updateMarker() {

  if (!markerGroup) {
    return;
  }


  markerGroup.position.set(

    lonToZ(
      selectedLon
    ),

    depthToY(
      selectedDepth
    ),

    latToX(
      selectedLat
    )

  );


  updateDepthSlice();
}


/* =========================================================
   LOCATION PANEL
   ========================================================= */

function updateSelectedLocation() {

  const latIndex =
    getNearestIndex(
      oceanGrid.latitude,
      selectedLat
    );


  const lonIndex =
    getNearestIndex(
      oceanGrid.longitude,
      selectedLon
    );


  const depthIndex =
    getNearestIndex(
      oceanGrid.depth,
      selectedDepth
    );


  const actualLat =
    oceanGrid.latitude[
      latIndex
    ];

  const actualLon =
    oceanGrid.longitude[
      lonIndex
    ];

  const actualDepth =
    oceanGrid.depth[
      depthIndex
    ];


  const temperature =
    Number(
      oceanGrid.temperature[
        depthIndex
      ][latIndex][lonIndex]
    );


  const salinity =
    Number(
      oceanGrid.salinity[
        depthIndex
      ][latIndex][lonIndex]
    );


  const u =
    Number(
      oceanGrid.uCurrent[
        depthIndex
      ][latIndex][lonIndex]
    );


  const v =
    Number(
      oceanGrid.vCurrent[
        depthIndex
      ][latIndex][lonIndex]
    );


  const speed =
    getCurrentSpeed(u, v);


  const direction =
    getCurrentDirection(u, v);


  latitudeValue.textContent =
    `${selectedLat.toFixed(2)}°`;

  longitudeValue.textContent =
    `${selectedLon.toFixed(2)}°`;

  depthValue.textContent =
    `${selectedDepth.toFixed(0)} m`;


  document.getElementById(
    "panelLat"
  ).textContent =
    `${selectedLat.toFixed(2)}°`;


  document.getElementById(
    "panelLon"
  ).textContent =
    `${selectedLon.toFixed(2)}°`;


  document.getElementById(
    "panelDepth"
  ).textContent =
    `${selectedDepth.toFixed(0)} m`;


  document.getElementById(
    "panelTemperature"
  ).textContent =
    `${temperature.toFixed(2)} °C`;


  document.getElementById(
    "panelSalinity"
  ).textContent =
    `${salinity.toFixed(3)} PSU`;


  document.getElementById(
    "panelCurrent"
  ).textContent =
    `${speed.toFixed(3)} m/s`;


  document.getElementById(
    "panelDirection"
  ).textContent =
    `${direction.toFixed(1)}°`;
}


/* =========================================================
   MOVE TO INSTRUMENT
   ========================================================= */

function moveToInstrument(instrument) {

  selectedLat =
    Number(instrument.latitude);

  selectedLon =
    Number(instrument.longitude);

  selectedDepth =
    Number(instrument.depth);


  latitudeSlider.value =
    selectedLat;

  longitudeSlider.value =
    selectedLon;

  depthSlider.value =
    selectedDepth;


  updateSelectedLocation();

  updateMarker();


  /*
   * Make the exact instrument coordinates
   * visible rather than snapped grid coordinates.
   */

  document.getElementById(
    "panelLat"
  ).textContent =
    `${selectedLat.toFixed(2)}°`;


  document.getElementById(
    "panelLon"
  ).textContent =
    `${selectedLon.toFixed(2)}°`;


  document.getElementById(
    "panelDepth"
  ).textContent =
    `${selectedDepth.toFixed(0)} m`;


  updateProfileChart();
}


/* =========================================================
   DEPTH SLICE
   ========================================================= */

function updateDepthSlice() {

  if (!depthSlicePlane) {
    return;
  }


  depthSlicePlane.position.y =
    depthToY(
      selectedDepth
    );
}


/* =========================================================
   LEGEND
   ========================================================= */

function updateLegend() {

  const legend =
    document.getElementById(
      "colorLegend"
    );


  const info =
    getVariableInfo(
      selectedVariable
    );


  legend.innerHTML = `

    <div class="legend-title">
      ${info.label}
    </div>

    <div class="legend-gradient"></div>

    <div class="legend-values">

      <span>
        ${info.min}
      </span>

      <span>
        ${info.max}
      </span>

    </div>

  `;
}


/* =========================================================
   RECENTER
   ========================================================= */

function recenterCamera() {

  camera.position.set(
    12.5,
    8.5,
    13.5
  );


  controls.target.set(
    0,
    0,
    0
  );


  controls.update();
}


/* =========================================================
   IMPORTANT:
   VERTICAL DEPTH PROFILE
   ========================================================= */

function updateProfileChart() {

  const canvas =
    document.getElementById(
      "profileCanvas"
    );


  if (!canvas) {
    return;
  }


  const latIndex =
    getNearestIndex(
      oceanGrid.latitude,
      selectedLat
    );


  const lonIndex =
    getNearestIndex(
      oceanGrid.longitude,
      selectedLon
    );


  /*
   * We create three depth profiles
   * from the ocean grid at the selected
   * instrument/location.
   */

  const temperatureData = [];

  const salinityData = [];

  const currentData = [];


  oceanGrid.depth.forEach(
    (depth, depthIndex) => {

      const temperature =
        Number(
          oceanGrid.temperature[
            depthIndex
          ][latIndex][lonIndex]
        );


      const salinity =
        Number(
          oceanGrid.salinity[
            depthIndex
          ][latIndex][lonIndex]
        );


      const u =
        Number(
          oceanGrid.uCurrent[
            depthIndex
          ][latIndex][lonIndex]
        );


      const v =
        Number(
          oceanGrid.vCurrent[
            depthIndex
          ][latIndex][lonIndex]
        );


      const current =
        getCurrentSpeed(u, v);


      /*
       * IMPORTANT:
       *
       * x = variable
       * y = depth
       *
       * This makes depth vertical.
       */

      temperatureData.push({
        x: temperature,
        y: depth
      });


      salinityData.push({
        x: salinity,
        y: depth
      });


      currentData.push({
        x: current,
        y: depth
      });

    }
  );


  if (profileChart) {

    profileChart.destroy();

  }


  const subtitle =
    document.getElementById(
      "profileSubtitle"
    );


  subtitle.textContent =
    `Vertical profile near ${selectedLat.toFixed(2)}°N, ${selectedLon.toFixed(2)}°E`;


  profileChart =
    new Chart(
      canvas,
      {

        type: "scatter",


        data: {

          datasets: [

            {
              label:
                "Temperature (°C)",

              data:
                temperatureData,

              showLine:
                true,

              borderWidth:
                2,

              pointRadius:
                3,

              tension:
                0.25,

              xAxisID:
                "xTemperature"
            },


            {
              label:
                "Salinity (PSU)",

              data:
                salinityData,

              showLine:
                true,

              borderWidth:
                2,

              pointRadius:
                3,

              tension:
                0.25,

              xAxisID:
                "xSalinity"
            },


            {
              label:
                "Current Speed (m/s)",

              data:
                currentData,

              showLine:
                true,

              borderWidth:
                2,

              pointRadius:
                3,

              tension:
                0.25,

              xAxisID:
                "xCurrent"
            }

          ]

        },


        options: {

          responsive:
            true,

          maintainAspectRatio:
            false,


          interaction: {

            mode:
              "nearest",

            intersect:
              false

          },


          scales: {

            /*
             * THREE HORIZONTAL X AXES
             *
             * Different ocean variables have
             * different units/ranges.
             */

            xTemperature: {

              type:
                "linear",

              position:
                "top",

              title: {

                display:
                  true,

                text:
                  "Temperature (°C)"

              },

              grid: {

                drawOnChartArea:
                  true

              }

            },


            xSalinity: {

              type:
                "linear",

              position:
                "bottom",

              title: {

                display:
                  true,

                text:
                  "Salinity (PSU)"

              },

              grid: {

                drawOnChartArea:
                  false

              }

            },


            xCurrent: {

              type:
                "linear",

              position:
                "bottom",

              title: {

                display:
                  true,

                text:
                  "Current (m/s)"

              },

              grid: {

                drawOnChartArea:
                  false

              }

            },


            /*
             * THE IMPORTANT PART:
             *
             * Depth is the Y axis.
             *
             * 0 m is at the top.
             * Increasing depth goes downward.
             */

            y: {

              type:
                "linear",

              reverse:
                true,

              min:
                0,

              max:
                oceanGrid.depth[
                  oceanGrid.depth.length - 1
                ],

              title: {

                display:
                  true,

                text:
                  "Depth (m)"

              },

              ticks: {

                stepSize:
                  500

              }

            }

          },


          plugins: {

            legend: {

              display:
                true,

              position:
                "bottom"

            },

            tooltip: {

              callbacks: {

                title: context => {

                  if (
                    !context.length
                  ) {
                    return "";
                  }

                  return (
                    `Depth: ${
                      context[0].parsed.y
                    } m`
                  );

                }

              }

            }

          }

        }

      }
    );
}


/* =========================================================
   INSTRUMENT RAYCASTING
   ========================================================= */

function setupInstrumentSelection() {

  const container =
    document.getElementById(
      "threeContainer"
    );


  container.addEventListener(
    "click",
    event => {

      if (!instrumentLayer) {
        return;
      }


      const rect =
        renderer.domElement
          .getBoundingClientRect();


      mouse.x =
        (
          (
            event.clientX -
            rect.left
          ) /
          rect.width
        ) *
        2 -
        1;


      mouse.y =
        -(
          (
            event.clientY -
            rect.top
          ) /
          rect.height
        ) *
        2 +
        1;


      raycaster.setFromCamera(
        mouse,
        camera
      );


      const intersections =
        raycaster.intersectObjects(
          instrumentLayer
            .group
            .children,
          true
        );


      if (
        intersections.length === 0
      ) {
        return;
      }


      let object =
        intersections[0].object;


      while (
        object &&
        !object.userData.instrumentId
      ) {

        object =
          object.parent;

      }


      if (!object) {
        return;
      }


      const instrument =
        instrumentLayer
          .selectInstrument(
            object.userData.instrumentId
          );


      if (!instrument) {
        return;
      }


      /*
       * MAIN CONNECTION:
       *
       * instrument
       *     ↓
       * lat/lon/depth
       *     ↓
       * sliders
       *     ↓
       * selected marker
       *     ↓
       * profile
       */

      moveToInstrument(
        instrument
      );


      showInstrumentPanel(
        instrument
      );

    }
  );
}


/* =========================================================
   INSTRUMENT PANEL
   ========================================================= */

function showInstrumentPanel(
  instrument
) {

  const existing =
    document.getElementById(
      "instrumentPanel"
    );


  if (existing) {
    existing.remove();
  }


  const measurements =
    instrument.measurements;


  const currentSpeed =
    getCurrentSpeed(
      measurements.u_current,
      measurements.v_current
    );


  const currentDirection =
    getCurrentDirection(
      measurements.u_current,
      measurements.v_current
    );


  const panel =
    document.createElement(
      "div"
    );


  panel.id =
    "instrumentPanel";


  panel.innerHTML = `

    <div class="instrument-panel-header">

      <div>

        <div class="instrument-type">
          ${instrument.type}
        </div>

        <h2>
          ${instrument.id}
        </h2>

      </div>

      <button id="closeInstrumentPanel">
        ×
      </button>

    </div>


    <div class="instrument-status">

      <span></span>

      ${instrument.status}

    </div>


    <div class="instrument-location">

      <div>

        <span>Latitude</span>

        <strong>
          ${Number(
            instrument.latitude
          ).toFixed(2)}°
        </strong>

      </div>


      <div>

        <span>Longitude</span>

        <strong>
          ${Number(
            instrument.longitude
          ).toFixed(2)}°
        </strong>

      </div>


      <div>

        <span>Depth</span>

        <strong>
          ${Number(
            instrument.depth
          ).toFixed(0)} m
        </strong>

      </div>

    </div>


    <div class="instrument-measurements">

      <div>

        <span>Temperature</span>

        <strong>
          ${measurements.temperature.toFixed(2)}
          °C
        </strong>

      </div>


      <div>

        <span>Salinity</span>

        <strong>
          ${measurements.salinity.toFixed(3)}
          PSU
        </strong>

      </div>


      <div>

        <span>Current Speed</span>

        <strong>
          ${currentSpeed.toFixed(3)}
          m/s
        </strong>

      </div>


      <div>

        <span>Current Direction</span>

        <strong>
          ${currentDirection.toFixed(1)}
          °
        </strong>

      </div>

    </div>


    <button
      id="instrumentProfileButton"
      class="instrument-profile-button"
    >
      View Observation Profile
    </button>

  `;


  document
    .querySelector(
      ".visual-area"
    )
    .appendChild(
      panel
    );


  document
    .getElementById(
      "closeInstrumentPanel"
    )
    .addEventListener(
      "click",
      () => {

        panel.remove();

        instrumentLayer
          .clearSelection();

      }
    );


  document
    .getElementById(
      "instrumentProfileButton"
    )
    .addEventListener(
      "click",
      () => {

        profilePanel.classList.remove(
          "hidden"
        );

        updateProfileChart();

      }
    );
}


/* =========================================================
   RESIZE
   ========================================================= */

function onResize() {

  const container =
    document.getElementById(
      "threeContainer"
    );


  if (!container) {
    return;
  }


  camera.aspect =
    container.clientWidth /
    container.clientHeight;


  camera.updateProjectionMatrix();


  renderer.setSize(
    container.clientWidth,
    container.clientHeight
  );
}


/* =========================================================
   ANIMATION
   ========================================================= */

function animate() {

  requestAnimationFrame(
    animate
  );


  const elapsed =
    animationClock.getElapsedTime();


  controls.update();


  if (markerGroup) {

    const ring =
      markerGroup.getObjectByName(
        "haloRing"
      );


    const outerRing =
      markerGroup.getObjectByName(
        "outerHaloRing"
      );


    if (ring) {

      const pulse =
        1 +
        Math.sin(
          elapsed * 4
        ) *
        0.12;


      ring.scale.set(
        pulse,
        pulse,
        pulse
      );

    }


    if (outerRing) {

      const pulse =
        1 +
        Math.sin(
          elapsed * 2.5
        ) *
        0.2;


      outerRing.scale.set(
        pulse,
        pulse,
        pulse
      );

    }

  }


  renderer.render(
    scene,
    camera
  );
}


/* =========================================================
   INITIALISE
   ========================================================= */

async function initialise() {

  try {

    oceanGrid =
      await loadOceanData();


    selectedLat =
      oceanGrid.latitude[
        Math.floor(
          oceanGrid.latitude.length / 2
        )
      ];


    selectedLon =
      oceanGrid.longitude[
        Math.floor(
          oceanGrid.longitude.length / 2
        )
      ];


    selectedDepth = 2500;


    createApplicationHTML();

    setupUIReferences();

    createRenderer();

    createVolumeStructure();

    rebuildScalarSlices();

    createMarker();


    /*
     * PERSON 2
     */

    instrumentLayer =
      createInstrumentLayer(
        scene,
        oceanGrid
      );


    instrumentLayer
      .group
      .renderOrder = 2000;


    setupInstrumentSelection();


    updateSelectedLocation();

    updateLegend();

    animate();

  }

  catch (error) {

    console.error(error);


    app.innerHTML = `

      <div class="error-screen">

        <h1>
          Ocean visualization failed
        </h1>

        <p>
          ${error.message}
        </p>

      </div>

    `;

  }
}


initialise();