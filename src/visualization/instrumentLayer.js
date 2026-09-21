import * as THREE from "three";

import {
  getAllInstruments
} from "../data/instrumentData.js";


/*
 * Dimensions must match the ocean volume
 * used by main.js.
 */
const VOLUME_WIDTH = 13.5;
const VOLUME_HEIGHT = 8.0;
const VOLUME_DEPTH = 13.5;


/*
 * Convert geographic coordinates into
 * the 3D coordinate system used by the
 * ocean volume.
 *
 * X = longitude
 * Y = depth
 * Z = latitude
 */
function longitudeToX(
  longitude,
  oceanGrid
) {
  const min =
    oceanGrid.longitude[0];

  const max =
    oceanGrid.longitude[
      oceanGrid.longitude.length - 1
    ];

  return (
    ((longitude - min) /
      (max - min)) -
    0.5
  ) * VOLUME_WIDTH;
}


function latitudeToZ(
  latitude,
  oceanGrid
) {
  const min =
    oceanGrid.latitude[0];

  const max =
    oceanGrid.latitude[
      oceanGrid.latitude.length - 1
    ];

  return (
    ((latitude - min) /
      (max - min)) -
    0.5
  ) * VOLUME_DEPTH;
}


function depthToY(
  depth,
  oceanGrid
) {
  const maxDepth =
    oceanGrid.depth[
      oceanGrid.depth.length - 1
    ];

  /*
   * 0 m = surface
   * 5000 m = bottom
   */
  return (
    VOLUME_HEIGHT / 2 -
    (depth / maxDepth) *
      VOLUME_HEIGHT
  );
}


/*
 * Create the visual representation of
 * one Argo float.
 */
function createArgoMarker() {

  const group =
    new THREE.Group();


  /*
   * Main instrument body.
   */
  const bodyGeometry =
    new THREE.SphereGeometry(
      0.16,
      20,
      20
    );

  const bodyMaterial =
    new THREE.MeshBasicMaterial({
      color: 0xffc928
    });

  const body =
    new THREE.Mesh(
      bodyGeometry,
      bodyMaterial
    );

  group.add(body);


  /*
   * Outer observation ring.
   *
   * This makes the instrument easier
   * to see inside the volume.
   */
  const ringGeometry =
    new THREE.TorusGeometry(
      0.32,
      0.035,
      12,
      32
    );

  const ringMaterial =
    new THREE.MeshBasicMaterial({
      color: 0x58e6ff,

      transparent: true,

      opacity: 0.9
    });

  const ring =
    new THREE.Mesh(
      ringGeometry,
      ringMaterial
    );

  ring.rotation.x =
    -Math.PI / 2;

  group.add(ring);


  /*
   * Small vertical observation stem.
   */
  const stemGeometry =
    new THREE.CylinderGeometry(
      0.025,
      0.025,
      0.75,
      8
    );

  const stemMaterial =
    new THREE.MeshBasicMaterial({
      color: 0xffdf65,

      transparent: true,

      opacity: 0.8
    });

  const stem =
    new THREE.Mesh(
      stemGeometry,
      stemMaterial
    );

  stem.position.y = -0.4;

  group.add(stem);


  return group;
}


/*
 * Creates all instrument markers.
 *
 * Returns an object containing:
 *
 * group
 * instruments
 * marker lookup
 * selection functions
 */
export function createInstrumentLayer(
  scene,
  oceanGrid
) {

  const group =
    new THREE.Group();

  group.name =
    "InstrumentLayer";


  const instruments =
    getAllInstruments();


  /*
   * Keep a direct connection between
   * the data record and its 3D marker.
   */
  const markerMap =
    new Map();


  instruments.forEach(
    instrument => {

      let marker;


      if (
        instrument.type ===
        "Argo Float"
      ) {

        marker =
          createArgoMarker();

      } else {

        /*
         * Generic fallback marker.
         */
        marker =
          new THREE.Mesh(
            new THREE.SphereGeometry(
              0.15,
              16,
              16
            ),

            new THREE.MeshBasicMaterial({
              color: 0xffffff
            })
          );
      }


      /*
       * Convert geographic position
       * to 3D position.
       */
      const x =
        longitudeToX(
          instrument.longitude,
          oceanGrid
        );

      const y =
        depthToY(
          instrument.depth,
          oceanGrid
        );

      const z =
        latitudeToZ(
          instrument.latitude,
          oceanGrid
        );


      marker.position.set(
        x,
        y,
        z
      );


      /*
       * Store instrument information
       * directly on the Three.js object.
       *
       * This will make click selection
       * much easier later.
       */
      marker.userData = {
        instrumentId:
          instrument.id,

        instrumentType:
          instrument.type,

        instrument
      };


      group.add(marker);

      markerMap.set(
        instrument.id,
        marker
      );
    }
  );


  scene.add(group);


  /*
   * Select an instrument.
   */
  function selectInstrument(
    instrumentId
  ) {

    markerMap.forEach(
      marker => {

        /*
         * Return every marker to its
         * normal size.
         */
        marker.scale.set(
          1,
          1,
          1
        );

      }
    );


    const selectedMarker =
      markerMap.get(
        instrumentId
      );


    if (!selectedMarker) {
      return null;
    }


    /*
     * Make selected instrument larger.
     */
    selectedMarker.scale.set(
      1.6,
      1.6,
      1.6
    );


    return selectedMarker.userData
      .instrument;
  }


  /*
   * Clear current selection.
   */
  function clearSelection() {

    markerMap.forEach(
      marker => {

        marker.scale.set(
          1,
          1,
          1
        );

      }
    );

  }


  return {
    group,

    instruments,

    markerMap,

    selectInstrument,

    clearSelection
  };
}