import React, { useEffect, useState } from 'react';
import { useAppContext } from '../AppContext';
import Two from 'two.js';
import TwoDimensionalSolutionRenderer from '../Renderers/TwoDimensionalSolutionRenderer.js';
import GraphicsContainer from './GraphicsContainer';
import PeriodicTable from '../Object Model/PeriodicTable';
import BondTable from '../Object Model/BondTable';
import Atom from '../Object Model/Atom.js';
import Bond from '../Object Model/Bond.js';

function MoleculeDrawingView({ solution }) {
    const { 
        selectedElement, selectedBondType, 
        deleteEnabled, moveEnabled, 
        anchorEnabled, colorEnabled, 
        gridEnabled, addAlert } = useAppContext();
    const [renderer, setRenderer] = useState(null);

    useEffect(() => {
        const rendererInstance = new TwoDimensionalSolutionRenderer();
        setRenderer(rendererInstance);
    
        return () => {
          rendererInstance.dispose();
          setRenderer(null);
        };
    }, [setRenderer]);

    useEffect(() => {
        if(renderer) {
            let panning = false;
            let prevX, prevY;
            let selectedAtom, hoveredAtom, draggedAtom;
            let selectedBond, hoveredBond;

            const getSolutionCoordinates = (clientX, clientY) => {
                const translation = renderer.getTranslation();
                const scale = renderer.getScale();
                const rect = renderer.domElement.getBoundingClientRect();
                const width = renderer.getWidth();
                const height = renderer.getHeight();
                const normalizedX = (clientX - rect.left) / width;
                const normalizedY = (clientY - rect.top) / height;
                const solutionX = (normalizedX - translation.x / width) / scale;
                const solutionY = (normalizedY - translation.y / height) / scale;
                return new Two.Vector(solutionX, solutionY);
            };

            let animationFrameId;
            const animate = () => {
                animationFrameId = requestAnimationFrame(animate);

                try {
                    const solutionCoords = getSolutionCoordinates(prevX, prevY);
                    const shouldRenderCurrentBond = !deleteEnabled && !moveEnabled && !anchorEnabled;
                    const currentX = shouldRenderCurrentBond ? solutionCoords.x : null;
                    const currentY = shouldRenderCurrentBond ? solutionCoords.y : null;

                    renderer.renderSolution(solution,
                        selectedAtom, hoveredAtom, 
                        selectedBond, hoveredBond,
                        currentX, currentY, selectedBondType,
                        colorEnabled, gridEnabled);
                } catch (error) {
                    addAlert(error.message, 'error');
                }
            };

            animate();

            const checkAtomCollision = (clientX, clientY) => {
                const solutionCoords = getSolutionCoordinates(clientX, clientY);
                const canvasClientCoords = renderer.getCanvasCoordinates(solutionCoords.x, solutionCoords.y);

                for (const atom of solution.getAtoms()) {
                    const [x, y] = atom.getPosition();
                    const atomicRadius = atom.getRadius();
        
                    const canvasAtomCoords = renderer.getCanvasCoordinates(x, y);
                    const canvasRadius = renderer.getCanvasAtomRadius(atomicRadius);
        
                    const distance = canvasClientCoords.distanceTo(canvasAtomCoords);
        
                    if (distance < canvasRadius) {
                        return atom;
                    }
                }

                return null;
            };

            const pointToSegmentDistance = (p, a, b) => {
                const ab = Two.Vector.sub(a, b);
                const ap = Two.Vector.sub(a, p);
        
                if (ab.lengthSquared() === 0) {
                    return ap.length();
                }
        
                const projection = ap.dot(ab) / ab.lengthSquared();
                const t = Math.max(0, Math.min(1, projection));

                const closest = Two.Vector.sub(a, ab.clone().multiplyScalar(t));
                return p.distanceTo(closest);
            };

            const checkBondCollision = (clientX, clientY) => {
                const solutionCoords = getSolutionCoordinates(clientX, clientY);
                const canvasClientCoords = renderer.getCanvasCoordinates(solutionCoords.x, solutionCoords.y);
        
                for (const bond of solution.getBonds()) {
                    const [x1, y1] = bond.getAtom1().getPosition();
                    const [x2, y2] = bond.getAtom2().getPosition();
                    const bondType = bond.getType();
        
                    const canvasAtom1Coords = renderer.getCanvasCoordinates(x1, y1);
                    const canvasAtom2Coords = renderer.getCanvasCoordinates(x2, y2);
                    const lineWidth = renderer.getCanvasBondWidth(bondType) + 1;
        
                    const distance = pointToSegmentDistance(canvasClientCoords, canvasAtom1Coords, canvasAtom2Coords);

                    if (distance < lineWidth) {
                        return bond;
                    }
                }
        
                return null;
            };

            const cycleBondType = async (selectedBond) => {
                try {
                    const bondTable = await BondTable.load();
                    const bondType = selectedBond.getType();
                    const element1 = selectedBond.getAtom1().getSymbol();
                    const element2 = selectedBond.getAtom2().getSymbol();
                    let bondInfo;
                
                    switch(bondType) {
                        case 'Single':
                            bondInfo = bondTable.getBondInformation(element1, element2, 'Double');
                            if (bondInfo) {
                                selectedBond.update(bondInfo);
                            }
                            break;
                        case 'Double':
                            bondInfo = bondTable.getBondInformation(element1, element2, 'Triple');
                            if (bondInfo) {
                                selectedBond.update(bondInfo);
                            } else {
                                bondInfo = bondTable.getBondInformation(element1, element2, 'Single');
                                selectedBond.update(bondInfo);
                            }
                            break;
                        case 'Triple':
                            bondInfo = bondTable.getBondInformation(element1, element2, 'Single');
                            selectedBond.update(bondInfo);
                            break;
                        default:
                            addAlert(`${bondType} is not a supported bond type!`, 'error');
                            break;
                    }
                } catch(error) {
                    addAlert(error.message, 'error');
                }
            };

            const checkBondCoherence = async () => {
                try {
                    if (!selectedAtom || !hoveredAtom || selectedAtom === hoveredAtom) {
                        return;
                    }
        
                    const bondType = selectedBondType;
                    if (!bondType) {
                        addAlert('Please select a bond type!', 'info');
                        return;
                    }
        
                    const bondTable = await BondTable.load();
                    const element1 = selectedAtom.getSymbol();
                    const element2 = hoveredAtom.getSymbol();
                    const bondInfo = bondTable.getBondInformation(element1, element2, bondType);
        
                    if (!bondInfo) {
                        addAlert(`${element1}-${element2} is an invalid ${bondType.toLowerCase()} bond!`, 'warning');
                        return;
                    }
        
                    if (selectedAtom.bondedWith(hoveredAtom)) {
                        addAlert(`Bond already exists between ${element1} and ${element2}!`, 'warning');
                        return;
                    }
        
                    solution.addBond(new Bond(selectedAtom, hoveredAtom, 
                        bondInfo.getBondLength(), 
                        bondInfo.getBondEnergy(), 
                        bondInfo.getBondType()));
                } catch (error) {
                    addAlert(error.message, 'error');
                }
            };
    
            const onClick = async (event) => {
                if (!deleteEnabled && !moveEnabled && !anchorEnabled) {
                    if (!selectedElement) { 
                        addAlert('Please select an element!', 'info');
                        return;
                    }

                    try {
                        const rng = (min, max) => Math.random() * (max - min) + min;
                        const periodicTable = await PeriodicTable.load();
                        const solutionCoords = getSolutionCoordinates(event.clientX, event.clientY);
                        const element = periodicTable.getElement(selectedElement);
        
                        const hoveredAtom = new Atom([solutionCoords.x, solutionCoords.y, rng(-0.01, 0.01)],
                            element.getSymbol(),
                            element.getAtomicNumber(),
                            element.getAtomicMass(),
                            element.getAtomicRadius(),
                            element.getColor()
                        );
                        solution.addAtom(hoveredAtom);
                    } catch (error) {
                        addAlert(error.message, 'error');
                    }
                }
            };

            const onScroll = (event) => {
                event.preventDefault();
                const scale = renderer.getScale() +
                    event.deltaY > 0 ? -0.05 : 
                    event.deltaY < 0 ? 0.05 : 0;
                renderer.setScale(Math.max(scale, 0.1));
            };

            const onMouseDown = async (event) => {
                selectedAtom = checkAtomCollision(event.clientX, event.clientY);
                selectedBond = checkBondCollision(event.clientX, event.clientY);

                if (selectedAtom && anchorEnabled) {
                    const isAnchored = selectedAtom.isAnchored();
                    selectedAtom.setAnchor(!isAnchored);
                } else if (selectedAtom && moveEnabled) {
                    draggedAtom = selectedAtom;
                    draggedAtom.setAnchor(true);
                } else if (selectedAtom && deleteEnabled) {
                    solution.removeAtom(selectedAtom);
                    selectedAtom = null;
                } else if (selectedBond && deleteEnabled) {
                    solution.removeBond(selectedBond);
                    selectedBond = null;
                } else if (!selectedAtom && selectedBond) {
                    await cycleBondType(selectedBond);
                } else if (event.button === 2) {
                    event.preventDefault();
                    panning = true;
                }

                prevX = event.clientX;
                prevY = event.clientY;
            };

            const onMouseUp = async (event) => {
                if (!deleteEnabled && !moveEnabled && !anchorEnabled &&
                    selectedAtom && hoveredAtom && selectedAtom !== hoveredAtom) {
                    await checkBondCoherence();
                } else if (draggedAtom) {
                    draggedAtom.setAnchor(false);
                    draggedAtom = null;
                } else if (event.button === 2) {
                    panning = false;
                }

                selectedAtom = null;
                selectedBond = null;
            };

            const onMouseMove = (event) => {
                event.preventDefault();

                hoveredAtom = checkAtomCollision(event.clientX, event.clientY);
                hoveredBond = checkBondCollision(event.clientX, event.clientY);

                if (panning && renderer) {
                    const dx =  event.clientX - prevX;
                    const dy = event.clientY - prevY;
                    const delta = new Two.Vector(dx, dy);
                    const translation = Two.Vector.add(renderer.getTranslation(), delta);
                    renderer.setTranslation(translation);
                } else if (moveEnabled && selectedAtom) {
                    const solutionCoords = getSolutionCoordinates(event.clientX, event.clientY);
                    selectedAtom.setXPosition(solutionCoords.x);
                    selectedAtom.setYPosition(solutionCoords.y);
                }

                prevX = event.clientX;
                prevY = event.clientY;
            };

            const onContextMenu = (event) => {
                event.preventDefault();
            };

            renderer.domElement.addEventListener('click', onClick);
            renderer.domElement.addEventListener('wheel', onScroll);
            renderer.domElement.addEventListener('mousedown', onMouseDown);
            renderer.domElement.addEventListener('mousemove', onMouseMove);
            renderer.domElement.addEventListener('contextmenu', onContextMenu);

            window.addEventListener('mouseup', onMouseUp);

            return () => {
                cancelAnimationFrame(animationFrameId);

                renderer.domElement.removeEventListener('click', onClick);
                renderer.domElement.removeEventListener('wheel', onScroll);
                renderer.domElement.removeEventListener('mousedown', onMouseDown);
                renderer.domElement.removeEventListener('mousemove', onMouseMove);
                renderer.domElement.removeEventListener('contextmenu', onContextMenu);

                window.removeEventListener('mouseup', onMouseUp);
            };
        }
    }, [solution, renderer, selectedElement, selectedBondType, deleteEnabled, moveEnabled, anchorEnabled, colorEnabled, gridEnabled, addAlert]);

    return <GraphicsContainer renderer={renderer}/>;
}

export default MoleculeDrawingView;
