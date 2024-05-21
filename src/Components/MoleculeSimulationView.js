import React, { useRef, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import * as THREE from 'three';
import { ArcballControls } from 'three/examples/jsm/controls/ArcballControls.js';
import GraphicsContainer from './GraphicsContainer';

class ThreeDimensionalSolutionRenderer {
  #renderer;
  #camera;
  #scene;
  #controls;

  #ambientLight;
  #directionalLight;

  domElement;

  constructor() {
    this.#renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.#renderer.setPixelRatio(window.devicePixelRatio);
    this.#renderer.domElement.addEventListener('contextmenu', this.#onContextMenu);
    this.domElement = this.#renderer.domElement;

    this.#camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.#camera.position.set(0, 0, 5);

    this.#scene = new THREE.Scene();

    this.#controls = new ArcballControls(this.#camera, this.#renderer.domElement);
    this.#controls.minDistance = 1;
    this.#controls.maxDistance = 100;
    this.#controls.enableDamping = true;
    this.#controls.dampingFactor = 0.05;
    this.#controls.update();

    this.#ambientLight = new THREE.AmbientLight(0xffffff, 0.5);

    this.#directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    this.#directionalLight.position.set(-5, 0, 5);
    this.#camera.add(this.#directionalLight);
  }

  dispose() {
    this.#clearScene();
    this.#renderer.domElement.removeEventListener('contextmenu', this.#onContextMenu);
    this.#renderer.dispose();
    this.#controls.dispose();
  }

  setSize(width, height) {
    this.#renderer.setSize(width, height);
  }

  #getSceneCoordinates(solutionX, solutionY, solutionZ) {
    const scale = 7.5;
    const sceneX = solutionX * scale;
    const sceneY = -solutionY * scale;
    const sceneZ = solutionZ * scale;
    return new THREE.Vector3(sceneX, sceneY, sceneZ);
  };

  #getSceneRadius(atomicRadius) {
    const sceneRadius = 0.2 + 0.4 * atomicRadius;
    return sceneRadius;
  };

  #clearScene() {
    while(this.#scene.children.length > 0){ 
      const child = this.#scene.children[0];
      
      if (child.isMesh) {
        if (child.geometry) {
          child.geometry.dispose();
        }
        
        if (child.material) {
          child.material.dispose();
        }
      }
      
      this.#scene.remove(child); 
    }
  }

  #setupLights() {
    this.#scene.add(this.#ambientLight);
    this.#scene.add(this.#camera);
  }

  #renderCylinder(start, end, offset = 0) {
    const direction = new THREE.Vector3().subVectors(end, start);
    const offsetDirection= new THREE.Vector3(-direction.y, direction.x, direction.z).normalize().multiplyScalar(offset);
    const length = direction.length();

    const a = new THREE.Vector3().addVectors(start, offsetDirection);
    const b = new THREE.Vector3().addVectors(end, offsetDirection);

    const orientation = new THREE.Matrix4();
    orientation.lookAt(start, end, new THREE.Object3D().up);
    orientation.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    orientation.setPosition(new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5));

    const radius = 0.03;
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 32);
    const material = new THREE.MeshPhongMaterial({ color: 'white', shininess: 50 });

    const cylinder = new THREE.Mesh(geometry, material);
    cylinder.applyMatrix4(orientation);
    this.#scene.add(cylinder);
  }

  #renderSingleBond(start, end) {
    this.#renderCylinder(start, end);
  };

  #renderDoubleBond(start, end) {
    this.#renderCylinder(start, end, 0.1);
    this.#renderCylinder(start, end, -0.1);
  };

  #renderTripleBond(start, end) {
    this.#renderCylinder(start, end, 0.1);
    this.#renderCylinder(start, end);
    this.#renderCylinder(start, end, -0.1);
  };

  #renderBond(bond) {
    const bondType = bond.getType();
    const [startX, startY, startZ] = bond.getAtom1().getPosition();
    const [endX, endY, endZ] = bond.getAtom2().getPosition();

    const start = this.#getSceneCoordinates(startX, startY, startZ);
    const end = this.#getSceneCoordinates(endX, endY, endZ);

    switch(bondType) {
      case 'Single':
        this.#renderSingleBond(start, end);
        break;
      case 'Double':
        this.#renderDoubleBond(start, end);
        break;
      case 'Triple':
        this.#renderTripleBond(start, end);
        break;
      default:
        break;
    }
  };

  #renderSphere(position, radius, color) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color: color, shininess: 50 });

    const sphere = new THREE.Mesh(geometry, material);
    sphere.position.copy(position);
    this.#scene.add(sphere);
  }

  #renderAtom(atom) {
    const [x, y, z] = atom.getPosition();
    const color = atom.getColor();
    const atomicRadius = atom.getRadius();

    const position = this.#getSceneCoordinates(x, y, z);
    const sceneRadius = this.#getSceneRadius(atomicRadius);

    this.#renderSphere(position, sceneRadius, color);
  };

  #renderLonePair(lonePair) {
    const bond = lonePair.getBonds().next().value;
    if (bond) {
      const atom = bond.getOtherAtom(lonePair);

      const [startX, startY, startZ] = atom.getPosition();
      const [x, y, z] = lonePair.getPosition();

      const start = this.#getSceneCoordinates(startX, startY, startZ);
      const end = this.#getSceneCoordinates(x, y, z);

      const direction = new THREE.Vector3().subVectors(end, start).normalize().multiplyScalar(0.1);
      const offset= new THREE.Vector3(-direction.y, direction.x, direction.z);

      const position1 = end.clone().add(offset).add(direction);
      this.#renderSphere(position1, 0.05, 'white');

      const position2 = end.clone().sub(offset).add(direction);
      this.#renderSphere(position2, 0.05, 'white');
    }
  }

  #renderMolecules(solution) {
    solution.getAtoms().forEach(atom => {
      if (atom.getSymbol() === '..') {
        this.#renderLonePair(atom);
      } else {
        this.#renderAtom(atom);
      }
    });
    solution.getBonds().forEach(bond => this.#renderBond(bond));
  }

  renderSolution(solution) {
    this.#clearScene();
    this.#setupLights();
    this.#renderMolecules(solution);
    this.#controls.update();
    this.#renderer.render(this.#scene, this.#camera);
  }

  #onContextMenu(event) {
    event.preventDefault();
  };
}

function MoleculeSimulationView({ solution }) {
  const { simulationEnabled, addAlert } = useAppContext();
  const simulationEnabledRef = useRef(simulationEnabled);

  const rendererRef = useRef(null);

  useEffect(() => {
    if (!rendererRef.current) {
      rendererRef.current = new ThreeDimensionalSolutionRenderer();
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.dispose();
        rendererRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      try {
        if (simulationEnabledRef.current) {
          solution.simulationStep();
        }
        if (rendererRef.current) {
          rendererRef.current.renderSolution(solution);
        }
      } catch (error) {
        addAlert(error.message, 'error');
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [solution, addAlert]);

  useEffect(() => {
    simulationEnabledRef.current = simulationEnabled;
  }, [simulationEnabled]);

  const onResize = (width, height) => {
    if (rendererRef.current) {
      rendererRef.current.setSize(width, height);
    }
  };

  return <GraphicsContainer renderer={rendererRef.current} onResize={onResize}/>;
}

export default MoleculeSimulationView;
