import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls';
import GraphicsContainer from './GraphicsContainer';

function MoleculeSimulationView({ solution }) {
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(new THREE.PerspectiveCamera(75, 1, 0.1, 1000));
  const rendererRef = useRef(new THREE.WebGLRenderer());
  const controlsRef = useRef(new OrbitControls(cameraRef.current, rendererRef.current.domElement))

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    //const controls = controlsRef.current;

    camera.position.set(0, 0, 5);

    //controls.enableDamping = true;
    //controls.dampingFactor = 0.05;
    //controls.update();

    const getSceneCoordinates = (solutionX, solutionY, solutionZ) => {
      const scale = 6;
      const sceneX = solutionX * scale - scale / 2;
      const sceneY = -solutionY * scale + scale / 2;
      const sceneZ = solutionZ * scale;
      return [sceneX, sceneY, sceneZ];
    };

    const getSceneRadius = (atomicRadius) => {
      const sceneRadius = 0.1 + 0.2 * atomicRadius;
      return sceneRadius;
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

    const renderSingleBond = (startX, startY, startZ, endX, endY, endZ) => {
      const [sceneStartX, sceneStartY, sceneStartZ] = getSceneCoordinates(startX, startY, startZ);
      const [sceneEndX, sceneEndY, sceneEndZ] = getSceneCoordinates(endX, endY, endZ);

      const start = new THREE.Vector3(sceneStartX, sceneStartY, sceneStartZ);
      const end = new THREE.Vector3(sceneEndX, sceneEndY, sceneEndZ);
      
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();

      const orientation = new THREE.Matrix4();
      orientation.lookAt(start, end, new THREE.Object3D().up);
      orientation.setPosition(new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5));
      orientation.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));

      const geometry = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
      const material = new THREE.MeshBasicMaterial({ color: 'white' });

      const cylinder = new THREE.Mesh(geometry, material);
      cylinder.applyMatrix4(orientation);
      scene.add(cylinder);
    };

    const renderBond = (bond) => {
      const [startX, startY, startZ] = bond.getAtom1().getPosition();
      const [endX, endY, endZ] = bond.getAtom2().getPosition();
      renderSingleBond(startX, startY, startZ, endX, endY, endZ);
    };

    const renderAtom = (atom) => {
      const [x, y, z] = atom.getPosition();
      const color = atom.getColor();
      const atomicRadius = atom.getAtomicRadius();

      const [sceneX, sceneY, sceneZ] = getSceneCoordinates(x, y, z);
      const sceneRadius = getSceneRadius(atomicRadius);

      const geometry = new THREE.SphereGeometry(sceneRadius);
      const material = new THREE.MeshBasicMaterial({ color: color, wireframe: true });
      
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(sceneX, sceneY, sceneZ);
      scene.add(sphere);
    };

    let animationFrameId;
    const animate = () => {
      clearScene();
      solution.getAtoms().forEach(atom => renderAtom(atom));
      solution.getBonds().forEach(bond => renderBond(bond));
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearScene();
      renderer.dispose();
    };
  }, [solution]);

  const onResize = (width, height) => {
    const renderer = rendererRef.current;
    renderer.setSize(width, height);
  }

  return <GraphicsContainer renderer={rendererRef.current} onResize={onResize}/>;
}

export default MoleculeSimulationView;
