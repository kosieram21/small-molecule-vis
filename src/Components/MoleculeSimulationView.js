import React, { useRef, useEffect, useState } from 'react';
import { useAppContext } from '../AppContext';
import ThreeDimensionalSolutionRenderer from '../Renderers/ThreeDimensionalSolutionRenderer';
import GraphicsContainer from './GraphicsContainer';
import { ArcballControls } from 'three/examples/jsm/controls/ArcballControls.js';

function MoleculeSimulationView({ solution }) {
  const { simulationEnabled, addAlert } = useAppContext();
  const simulationEnabledRef = useRef(simulationEnabled);
  const [renderer, setRenderer] = useState(null);
  const [controls, setControls] = useState(null);

  useEffect(() => {
    const rendererInstance = new ThreeDimensionalSolutionRenderer();
    setRenderer(rendererInstance);

    const controlsInstance = new ArcballControls(rendererInstance.getCamera(), rendererInstance.domElement);
    controlsInstance.minDistance = 1;
    controlsInstance.maxDistance = 100;
    controlsInstance.enableDamping = true;
    controlsInstance.dampingFactor = 0.05;
    controlsInstance.update();
    setControls(controlsInstance);

    return () => {
      rendererInstance.dispose();
      setRenderer(null);

      controlsInstance.dispose();
      setControls(null);
    };
  }, [setRenderer, setControls]);

  useEffect(() => {
    if (renderer && controls) {
      let animationFrameId;
      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        try {
          if (simulationEnabledRef.current) {
            solution.simulationStep();
          }
          renderer.renderSolution(solution);
          controls.update();
        } catch (error) {
          addAlert(error.message, 'error');
        }
      };

      animate();

      const onContextMenu = (event) => {
        event.preventDefault();
      };

      renderer.domElement.addEventListener('contextmenu', onContextMenu);

      return () => {
        cancelAnimationFrame(animationFrameId);
        renderer.domElement.removeEventListener('contextmenu', onContextMenu);
      };
    }
  }, [solution, addAlert, renderer, controls]);

  useEffect(() => {
    simulationEnabledRef.current = simulationEnabled;
  }, [simulationEnabled]);

  return <GraphicsContainer renderer={renderer}/>;
}

export default MoleculeSimulationView;
