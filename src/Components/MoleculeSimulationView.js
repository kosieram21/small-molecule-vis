import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import GraphicsContainer from './GraphicsContainer';

function MoleculeSimulationView({ solution }) {
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(new THREE.PerspectiveCamera(75, 1, 0.1, 1000));
  const rendererRef = useRef(new THREE.WebGLRenderer());

  useEffect(() => {
    const scene = sceneRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;

    camera.position.z = 5;

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

    const renderAtom = (atom) => {
      const [x, y, z] = atom.getPosition();
      const symbol = atom.getSymbol();
      const color = atom.getColor();
        
      const geometry = new THREE.SphereGeometry();
      const material = new THREE.MeshBasicMaterial({ color: color, wireframe: true})
      const sphere = new THREE.Mesh(geometry, material);

      scene.add(sphere);
    };

    let animationFrameId;
    const animate = () => {
      clearScene();
      solution.getAtoms().forEach(atom => renderAtom(atom));
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
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  return <GraphicsContainer renderer={rendererRef.current} onResize={onResize}/>;
}

export default MoleculeSimulationView;
