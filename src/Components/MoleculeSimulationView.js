import React, { useRef, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import * as THREE from 'three';
import { ArcballControls } from 'three/examples/jsm/controls/ArcballControls.js';
import GraphicsContainer from './GraphicsContainer';

function MoleculeSimulationView({ solution }) {
  const { simulationEnabled } = useAppContext();
  const simulationEnabledRef = useRef(simulationEnabled);

  const rendererRef = useRef(new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" }));

  useEffect(() => {
    const renderer = rendererRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const controls = new ArcballControls(camera, renderer.domElement)

    //renderer.setClearColor(0xffffff);
    renderer.setPixelRatio(window.devicePixelRatio);

    controls.minDistance = 1;
    controls.maxDistance = 100;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    camera.position.set(0, 0, 5);
    controls.update();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(-5, 0, 5);
    camera.add(directionalLight);

    const getSceneCoordinates = (solutionX, solutionY, solutionZ) => {
      const scale = 7.5;
      const sceneX = solutionX * scale;
      const sceneY = -solutionY * scale;
      const sceneZ = solutionZ * scale;
      return [sceneX, sceneY, sceneZ];
    };

    const getSceneRadius = (atomicRadius) => {
      const sceneRadius = 0.2 + 0.4 * atomicRadius;
      return sceneRadius;
    };

    const getSceneCylinderRadius = () => {
      return 0.03;
    };

    const clearScene = () => {
      while(scene.children.length > 0){ 
        const child = scene.children[0];
        
        if (child.isMesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          
          if (child.material) {
            child.material.dispose();
          }
        }
        
        scene.remove(child); 
      }
    };

    const setupLights = () => {
      scene.add(ambientLight);
      scene.add(camera);
    };

    const renderSingleBond = (startX, startY, startZ, endX, endY, endZ) => {
      const [sceneStartX, sceneStartY, sceneStartZ] = getSceneCoordinates(startX, startY, startZ);
      const [sceneEndX, sceneEndY, sceneEndZ] = getSceneCoordinates(endX, endY, endZ);
      const sceneCylinderRadius = getSceneCylinderRadius();

      const start = new THREE.Vector3(sceneStartX, sceneStartY, sceneStartZ);
      const end = new THREE.Vector3(sceneEndX, sceneEndY, sceneEndZ);
      
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();

      const orientation = new THREE.Matrix4();
      orientation.lookAt(start, end, new THREE.Object3D().up);
      orientation.setPosition(new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5));
      orientation.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));

      const geometry = new THREE.CylinderGeometry(sceneCylinderRadius, sceneCylinderRadius, length, 32);
      const material = new THREE.MeshPhongMaterial({ color: 'white', shininess: 50 });

      const cylinder = new THREE.Mesh(geometry, material);
      cylinder.applyMatrix4(orientation);
      scene.add(cylinder);
    };

    const renderDoubleBond = (startX, startY, startZ, endX, endY, endZ) => {
      const [sceneStartX, sceneStartY, sceneStartZ] = getSceneCoordinates(startX, startY, startZ);
      const [sceneEndX, sceneEndY, sceneEndZ] = getSceneCoordinates(endX, endY, endZ);
      const sceneCylinderRadius = getSceneCylinderRadius();

      const start = new THREE.Vector3(sceneStartX, sceneStartY, sceneStartZ);
      const end = new THREE.Vector3(sceneEndX, sceneEndY, sceneEndZ);
      
      const direction = new THREE.Vector3().subVectors(end, start);
      const offset= new THREE.Vector3(-direction.y, direction.x, direction.z).normalize().multiplyScalar(0.1);
      const length = direction.length();

      const a1 = new THREE.Vector3().addVectors(start, offset);
      const b1 = new THREE.Vector3().addVectors(end, offset);

      const a2 = new THREE.Vector3().subVectors(start, offset);
      const b2 = new THREE.Vector3().subVectors(end, offset);

      const orientation = new THREE.Matrix4();
      orientation.lookAt(start, end, new THREE.Object3D().up);
      orientation.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));

      const geometry = new THREE.CylinderGeometry(sceneCylinderRadius, sceneCylinderRadius, length, 32);
      const material = new THREE.MeshPhongMaterial({ color: 'white', shininess: 50 });

      orientation.setPosition(new THREE.Vector3().addVectors(a1, b1).multiplyScalar(0.5));
      const cylinder1 = new THREE.Mesh(geometry, material);
      cylinder1.applyMatrix4(orientation);
      scene.add(cylinder1);

      orientation.setPosition(new THREE.Vector3().addVectors(a2, b2).multiplyScalar(0.5));
      const cylinder2 = new THREE.Mesh(geometry, material);
      cylinder2.applyMatrix4(orientation);
      scene.add(cylinder2);
    };

    const renderTripleBond = (startX, startY, startZ, endX, endY, endZ) => {
      const [sceneStartX, sceneStartY, sceneStartZ] = getSceneCoordinates(startX, startY, startZ);
      const [sceneEndX, sceneEndY, sceneEndZ] = getSceneCoordinates(endX, endY, endZ);
      const sceneCylinderRadius = getSceneCylinderRadius();

      const start = new THREE.Vector3(sceneStartX, sceneStartY, sceneStartZ);
      const end = new THREE.Vector3(sceneEndX, sceneEndY, sceneEndZ);
      
      const direction = new THREE.Vector3().subVectors(end, start);
      const offset= new THREE.Vector3(-direction.y, direction.x, direction.z).normalize().multiplyScalar(0.1);
      const length = direction.length();

      const a1 = new THREE.Vector3().addVectors(start, offset);
      const b1 = new THREE.Vector3().addVectors(end, offset);

      const a2 = new THREE.Vector3().subVectors(start, offset);
      const b2 = new THREE.Vector3().subVectors(end, offset);

      const orientation = new THREE.Matrix4();
      orientation.lookAt(start, end, new THREE.Object3D().up);
      orientation.setPosition(new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5));
      orientation.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));

      const geometry = new THREE.CylinderGeometry(sceneCylinderRadius, sceneCylinderRadius, length, 32);
      const material = new THREE.MeshPhongMaterial({ color: 'white', shininess: 50 });

      const cylinder = new THREE.Mesh(geometry, material);
      cylinder.applyMatrix4(orientation);
      scene.add(cylinder);

      orientation.setPosition(new THREE.Vector3().addVectors(a1, b1).multiplyScalar(0.5));
      const cylinder1 = new THREE.Mesh(geometry, material);
      cylinder1.applyMatrix4(orientation);
      scene.add(cylinder1);

      orientation.setPosition(new THREE.Vector3().addVectors(a2, b2).multiplyScalar(0.5));
      const cylinder2 = new THREE.Mesh(geometry, material);
      cylinder2.applyMatrix4(orientation);
      scene.add(cylinder2);
    };

    const renderBond = (bond) => {
      const bondType = bond.getType();
      const [startX, startY, startZ] = bond.getAtom1().getPosition();
      const [endX, endY, endZ] = bond.getAtom2().getPosition();
        switch(bondType) {
          case 'Single':
            renderSingleBond(startX, startY, startZ, endX, endY, endZ);
            break;
          case 'Double':
            renderDoubleBond(startX, startY, startZ, endX, endY, endZ);
            break;
          case 'Triple':
            renderTripleBond(startX, startY, startZ, endX, endY, endZ);
            break;
          default:
            break;
      }
    };

    const renderAtom = (atom) => {
      const [x, y, z] = atom.getPosition();
      const color = atom.getColor();
      const atomicRadius = atom.getAtomicRadius();

      const [sceneX, sceneY, sceneZ] = getSceneCoordinates(x, y, z);
      const sceneRadius = getSceneRadius(atomicRadius);

      const geometry = new THREE.SphereGeometry(sceneRadius, 32, 32);
      const material = new THREE.MeshPhongMaterial({ color: color, shininess: 50 });

      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(sceneX, sceneY, sceneZ);
      scene.add(sphere);
    };

    const renderLonePair = (lonePair) => {
      const bond = lonePair.getBonds().values().next().value;
      if (bond) {
        const atom = bond.getOtherAtom(lonePair);

        const [startX, startY, startZ] = atom.getPosition();
        const [x, y, z] = lonePair.getPosition();

        const [sceneStartX, sceneStartY, sceneStartZ] = getSceneCoordinates(startX, startY, startZ);
        const [sceneX, sceneY, sceneZ] = getSceneCoordinates(x, y, z);

        const start = new THREE.Vector3(sceneStartX, sceneStartY, sceneStartZ);
        const end = new THREE.Vector3(sceneX, sceneY, sceneZ);

        const direction = new THREE.Vector3().subVectors(end, start).normalize().multiplyScalar(0.1);
        const offset= new THREE.Vector3(-direction.y, direction.x, direction.z);

        const geometry = new THREE.SphereGeometry(0.05, 32, 32);
        const material = new THREE.MeshPhongMaterial({ color: 'white', shininess: 50 });

        const sphere1 = new THREE.Mesh(geometry, material);
        sphere1.position.copy(end).add(offset).add(direction);
        scene.add(sphere1);

        const sphere2 = new THREE.Mesh(geometry, material);
        sphere2.position.copy(end).sub(offset).add(direction);
        scene.add(sphere2);
      }
    }

    const renderMolecules = () => {
      solution.getAtoms().forEach(atom => {
        if (atom.getSymbol() == '..') {
          renderLonePair(atom);
        } else {
          renderAtom(atom);
        }
      });
      solution.getBonds().forEach(bond => renderBond(bond));
    };

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      clearScene();
      setupLights();

      if (simulationEnabledRef.current) {
        solution.simulationStep();
      }
      renderMolecules();
      
      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    const onContextMenu = (event) => {
      event.preventDefault();
    };

    renderer.domElement.addEventListener('contextmenu', onContextMenu);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearScene();

      renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      renderer.dispose();
      controls.dispose();
    };
  }, [solution]);

  useEffect(() => {
    simulationEnabledRef.current = simulationEnabled;
  }, [simulationEnabled]);

  const onResize = (width, height) => {
    const renderer = rendererRef.current;
    renderer.setSize(width, height);
  };

  return <GraphicsContainer renderer={rendererRef.current} onResize={onResize}/>;
}

export default MoleculeSimulationView;
