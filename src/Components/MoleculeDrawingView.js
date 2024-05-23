import React, { useRef, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import Two from 'two.js';
import TwoDimensionalSolutionRenderer from '../Renderers/TwoDimensionalSolutionRenderer.js';
import GraphicsContainer from './GraphicsContainer';
import PeriodicTable from '../Object Model/PeriodicTable';
import BondTable from '../Object Model/BondTable';
import Atom from '../Object Model/Atom.js';
import Bond from '../Object Model/Bond.js';
import { render } from 'react-dom';

function MoleculeDrawingView({ solution }) {
    const { 
        selectedElement, selectedBond, 
        deleteEnabled, moveEnabled, 
        anchorEnabled, colorEnabled, 
        gridEnabled, addAlert } = useAppContext();
    const selectedElementRef = useRef(selectedElement);
    const selectedBondRef = useRef(selectedBond);
    const deleteEnabledRef = useRef(deleteEnabled);
    const moveEnabledRef = useRef(moveEnabled);
    const anchorEnabledRef = useRef(anchorEnabled);
    const colorEnabledRef = useRef(colorEnabled);
    const gridEnabledRef = useRef(gridEnabled);

    const rendererRef = useRef(null);

    useEffect(() => {
        if (!rendererRef.current) {
            rendererRef.current = new TwoDimensionalSolutionRenderer();
        }

        return () => {
            if (rendererRef.current) {
                rendererRef.current.dispose();
                rendererRef.current = null;
            }
        }
    }, []);

    useEffect(() => {
        let panning = false;
        let prevX, prevY;
        let selectedAtom, hoveredAtom, draggedAtom;
        let selectedBond, hoveredBond;

        const getSolutionCoordinates = (clientX, clientY) => {
            const translation = rendererRef.current.getTranslation();
            const scale = rendererRef.current.getScale();
            const rect = rendererRef.current.domElement.getBoundingClientRect();
            const width = rendererRef.current.getWidth();
            const height = rendererRef.current.getHeight();
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
                if (rendererRef.current) {
                    const solutionCoords = getSolutionCoordinates(prevX, prevY);
                    const shouldRenderCurrentBond = !deleteEnabledRef.current && !moveEnabledRef.current && !anchorEnabledRef.current;
                    const currentX = shouldRenderCurrentBond ? solutionCoords.x : null;
                    const currentY = shouldRenderCurrentBond ? solutionCoords.y : null;

                    rendererRef.current.renderSolution(solution,
                        selectedAtom, hoveredAtom, 
                        selectedBond, hoveredBond,
                        currentX, currentY, selectedBondRef.current,
                        colorEnabledRef.current, gridEnabledRef.current);
                }
            } catch (error) {
                addAlert(error.message, 'error');
            }
        };

        animate();

        const checkAtomCollision = (clientX, clientY) => {
            const solutionCoords = getSolutionCoordinates(clientX, clientY);
            const canvasClientCoords = rendererRef.current.getCanvasCoordinates(solutionCoords.x, solutionCoords.y);

            for (const atom of solution.getAtoms()) {
                const [x, y] = atom.getPosition();
                const atomicRadius = atom.getRadius();
        
                const canvasAtomCoords = rendererRef.current.getCanvasCoordinates(x, y);
                const canvasRadius = rendererRef.current.getCanvasRadius(atomicRadius);
        
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
            const canvasClientCoords = rendererRef.current.getCanvasCoordinates(solutionCoords.x, solutionCoords.y);
        
            for (const bond of solution.getBonds()) {
                const [x1, y1] = bond.getAtom1().getPosition();
                const [x2, y2] = bond.getAtom2().getPosition();
                const bondType = bond.getType();
        
                const canvasAtom1Coords = rendererRef.current.getCanvasCoordinates(x1, y1);
                const canvasAtom2Coords = rendererRef.current.getCanvasCoordinates(x2, y2);
                const scalar = 
                    bondType === 'Triple' ? 3 :
                    bondType === 'Double' ? 2 : 1;
                const lineWidth = (rendererRef.current.getCanvasLineWidth() + 1) * scalar;
        
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
        
                const bondType = selectedBondRef.current;
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
            if (!deleteEnabledRef.current && !moveEnabledRef.current && !anchorEnabledRef.current) {
                const selectedElement = selectedElementRef.current;
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
            if (rendererRef.current) {
                const scale = rendererRef.current.getScale() +
                    event.deltaY > 0 ? -0.05 : 
                    event.deltaY < 0 ? 0.05 : 0;
                rendererRef.current.setScale(Math.max(scale, 0.1));
            }
        };

        const onMouseDown = async (event) => {
            selectedAtom = checkAtomCollision(event.clientX, event.clientY);
            selectedBond = checkBondCollision(event.clientX, event.clientY);

            if (selectedAtom && anchorEnabledRef.current) {
                const isAnchored = selectedAtom.isAnchored();
                selectedAtom.setAnchor(!isAnchored);
            } else if (selectedAtom && moveEnabledRef.current) {
                draggedAtom = selectedAtom;
                draggedAtom.setAnchor(true);
            } else if (selectedAtom && deleteEnabledRef.current) {
                solution.removeAtom(selectedAtom);
                selectedAtom = null;
            } else if (selectedBond && deleteEnabledRef.current) {
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
            if (!deleteEnabledRef.current && !moveEnabledRef.current && !anchorEnabledRef.current &&
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

            if (panning && rendererRef.current) {
                const dx =  event.clientX - prevX;
                const dy = event.clientY - prevY;
                const delta = new Two.Vector(dx, dy);
                const translation = Two.Vector.add(rendererRef.current.getTranslation(), delta);
                rendererRef.current.setTranslation(translation);
            } else if (moveEnabledRef.current && selectedAtom) {
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

        if (rendererRef.current) {
            rendererRef.current.domElement.addEventListener('click', onClick);
            rendererRef.current.domElement.addEventListener('wheel', onScroll);
            rendererRef.current.domElement.addEventListener('mousedown', onMouseDown);
            rendererRef.current.domElement.addEventListener('mousemove', onMouseMove);
            rendererRef.current.domElement.addEventListener('contextmenu', onContextMenu);
        }

        window.addEventListener('mouseup', onMouseUp);

        return () => {
            cancelAnimationFrame(animationFrameId);
            
            if (rendererRef.current) {
                rendererRef.current.domElement.removeEventListener('click', onClick);
                rendererRef.current.domElement.removeEventListener('wheel', onScroll);
                rendererRef.current.domElement.removeEventListener('mousedown', onMouseDown);
                rendererRef.current.domElement.removeEventListener('mousemove', onMouseMove);
                rendererRef.current.domElement.removeEventListener('contextmenu', onContextMenu);
            }

            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [solution, addAlert]);

    useEffect(() => {
        selectedElementRef.current = selectedElement;
    }, [selectedElement]);

    useEffect(() => {
        selectedBondRef.current = selectedBond;
    }, [selectedBond]);

    useEffect(() => {
        deleteEnabledRef.current = deleteEnabled;
    }, [deleteEnabled]);

    useEffect(() => {
        moveEnabledRef.current = moveEnabled;
    }, [moveEnabled]);

    useEffect(() => {
        anchorEnabledRef.current = anchorEnabled;
    }, [anchorEnabled]);

    useEffect(() => {
        colorEnabledRef.current = colorEnabled;
    }, [colorEnabled]);

    useEffect(() => {
        gridEnabledRef.current = gridEnabled;
    }, [gridEnabled]);

    return <GraphicsContainer renderer={rendererRef.current}/>;
}

export default MoleculeDrawingView;
