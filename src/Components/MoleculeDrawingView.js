import React, { useRef, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import Two from 'two.js';
import GraphicsContainer from './GraphicsContainer';
import PeriodicTable from '../Object Model/PeriodicTable';
import BondTable from '../Object Model/BondTable';
import Atom from '../Object Model/Atom.js';
import Bond from '../Object Model/Bond.js';

const two = new Two();

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

    useEffect(() => {
        two.scene.translation.set(two.width / 2, two.height / 2);

        let panning = false;
        let prevX, prevY;
        let selectedAtom, hoveredAtom, draggedAtom;
        let selectedBond, hoveredBond;

        const getSolutionCoordinates = (clientX, clientY) => {
            const rect = two.renderer.domElement.getBoundingClientRect();
            const normalizedX = (clientX - rect.left) / two.width;
            const normalizedY = (clientY - rect.top) / two.height;
            const solutionX = (normalizedX - two.scene.translation.x / two.width) / two.scene.scale;
            const solutionY = (normalizedY - two.scene.translation.y / two.height) / two.scene.scale;
            return new Two.Vector(solutionX, solutionY);
        };

        const getCanvasCoordinates = (solutionX, solutionY) => {
            const canvasX = solutionX * two.width;
            const canvasY = solutionY * two.height;
            return new Two.Vector(canvasX, canvasY);
        };

        const getCanvasRadius = (atomicRadius) => {
            const canvasRadius = 20 + 50 * atomicRadius;
            return atomicRadius == 0 ? 0 : canvasRadius;
        };

        const getCanvasFontSize = (atomicRadius) => {
            const fontSize = 30 + 60 * atomicRadius;
            return fontSize;
        };

        const getTextColor = (atom) => {
            if (colorEnabledRef.current) {
                if (atom.getSymbol() === 'C' || atom.getSymbol() === '..') {
                    return 'black';
                } else if (atom.getSymbol() == 'H') {
                    return 'gray';
                } else {
                    return atom.getColor();
                }
            }
            return 'black';
        };

        const getCanvasLineWidth = () => {
            return 4;
        };

        const getHighlightColor = (isAnchored) => {
            return isAnchored ? 'rgba(255, 173, 173, 0.5)' : 'rgba(173, 216, 230, 0.5)'
        };

        const renderGrid = () => {
            if (gridEnabledRef.current) {
                const spacingX = two.width / 10;
                const spacingY = two.height / 10;
                const color = 'blue';
                const lineWidth = 1;
                const dash = [2, 4];

                const minX = (-two.scene.translation.x) / two.scene.scale;
                const maxX = (two.width - two.scene.translation.x) / two.scene.scale;
                const minY = (-two.scene.translation.y) / two.scene.scale;
                const maxY = (two.height - two.scene.translation.y) / two.scene.scale;

                const startX = Math.floor(minX / spacingX) * spacingX;
                const endX = Math.ceil(maxX / spacingX) * spacingX;
                const startY = Math.floor(minY / spacingY) * spacingY;
                const endY = Math.ceil(maxY / spacingY) * spacingY;
    
                for (let x = startX; x <= endX; x += spacingX) {
                    const line = new Two.Line(x, minY, x, maxY);
                    line.stroke = color;
                    line.linewidth = lineWidth;
                    line.dashes = dash;
                    two.add(line);
                }
    
                for (let y = startY; y <= endY; y += spacingY) {
                    const line = new Two.Line(minX, y, maxX, y);
                    line.stroke = color;
                    line.linewidth = lineWidth;
                    line.dashes = dash;
                    two.add(line);
                }
            }
        };

        const renderSingleBond = (startX, startY, endX, endY, radius1, radius2) => {
            const canvasStart = getCanvasCoordinates(startX, startY);
            const canvasEnd = getCanvasCoordinates(endX, endY);

            const canvasRadius1 = getCanvasRadius(radius1);
            const canvasRadius2 = getCanvasRadius(radius2);
            const canvasLineWidth = getCanvasLineWidth();

            const direction = Two.Vector.sub(canvasStart, canvasEnd).normalize();

            const a = Two.Vector.sub(canvasStart, direction.clone().multiplyScalar(canvasRadius1));
            const b = Two.Vector.add(canvasEnd, direction.clone().multiplyScalar(canvasRadius2));

            const line = new Two.Line(a.x, a.y, b.x, b.y);
            line.stroke = 'black';
            line.linewidth = canvasLineWidth;
            two.add(line);
        };

        const renderDoubleBond = (startX, startY, endX, endY, radius1, radius2) => {
            const canvasStart = getCanvasCoordinates(startX, startY);
            const canvasEnd = getCanvasCoordinates(endX, endY);

            const canvasRadius1 = getCanvasRadius(radius1);
            const canvasRadius2 = getCanvasRadius(radius2);
            const canvasLineWidth = getCanvasLineWidth();

            const direction = Two.Vector.sub(canvasStart, canvasEnd).normalize();
            const offset= new Two.Vector(-direction.y, direction.x).multiplyScalar(canvasLineWidth * 2);

            const a = Two.Vector.sub(canvasStart, direction.clone().multiplyScalar(canvasRadius1));
            const b = Two.Vector.add(canvasEnd, direction.clone().multiplyScalar(canvasRadius2));

            const a1 = Two.Vector.add(a, offset);
            const b1 = Two.Vector.add(b, offset);

            const a2 = Two.Vector.sub(a, offset);
            const b2 = Two.Vector.sub(b, offset);

            const line1 = new Two.Line(a1.x, a1.y, b1.x, b1.y);
            line1.stroke = 'black';
            line1.linewidth = canvasLineWidth;
            two.add(line1);
            
            const line2 = new Two.Line(a2.x, a2.y, b2.x, b2.y);
            line2.stroke = 'black';
            line2.linewidth = canvasLineWidth;
            two.add(line2);
        };

        const renderTripleBond = (startX, startY, endX, endY, radius1, radius2) => {
            const canvasStart = getCanvasCoordinates(startX, startY);
            const canvasEnd = getCanvasCoordinates(endX, endY);

            const canvasRadius1 = getCanvasRadius(radius1);
            const canvasRadius2 = getCanvasRadius(radius2);
            const canvasLineWidth = getCanvasLineWidth();

            const direction = Two.Vector.sub(canvasStart, canvasEnd).normalize();
            const offset= new Two.Vector(-direction.y, direction.x).multiplyScalar(canvasLineWidth * 2);

            const a = Two.Vector.sub(canvasStart, direction.clone().multiplyScalar(canvasRadius1));
            const b = Two.Vector.add(canvasEnd, direction.clone().multiplyScalar(canvasRadius2));

            const a1 = Two.Vector.add(a, offset);
            const b1 = Two.Vector.add(b, offset);

            const a2 = Two.Vector.sub(a, offset);
            const b2 = Two.Vector.sub(b, offset);

            const line1 = new Two.Line(a.x, a.y, b.x, b.y);
            line1.stroke = 'black';
            line1.linewidth = canvasLineWidth;
            two.add(line1);

            const line2 = new Two.Line(a1.x, a1.y, b1.x, b1.y);
            line2.stroke = 'black';
            line2.linewidth = canvasLineWidth;
            two.add(line2);
            
            const line3 = new Two.Line(a2.x, a2.y, b2.x, b2.y);
            line3.stroke = 'black';
            line3.linewidth = canvasLineWidth;
            two.add(line3);
        };

        const renderBondByType = (bondType, startX, startY, endX, endY, radius1, radius2) => {
            switch(bondType) {
                case 'Single':
                    renderSingleBond(startX, startY, endX, endY, radius1, radius2);
                    break;
                case 'Double':
                    renderDoubleBond(startX, startY, endX, endY, radius1, radius2);
                    break;
                case 'Triple':
                    renderTripleBond(startX, startY, endX, endY, radius1, radius2);
                    break;
                default:
                    break;
            }
        };

        const renderCurrentBond = () => {
            if (!deleteEnabledRef.current && !moveEnabledRef.current && !anchorEnabledRef.current && 
                selectedAtom && selectedAtom != hoveredAtom) {
                const bondType = selectedBondRef.current;
                const clientCoords = getSolutionCoordinates(prevX, prevY);
                if (bondType) {
                    const [startX, startY] = selectedAtom.getPosition();
                    const [endX, endY] = hoveredAtom ? hoveredAtom.getPosition() : [clientCoords.x, clientCoords.y];
                    const radius1 = selectedAtom.getAtomicRadius();
                    const radius2 = hoveredAtom ? hoveredAtom.getAtomicRadius() : 0;
                    renderBondByType(bondType, startX, startY, endX, endY, radius1, radius2);
                }
            }
        };

        const renderBond = (bond) => {
            const bondType = bond.getType();
            const [startX, startY] = bond.getAtom1().getPosition();
            const [endX, endY] = bond.getAtom2().getPosition();
            const radius1 = bond.getAtom1().getAtomicRadius();
            const radius2 = bond.getAtom2().getAtomicRadius();
            renderBondByType(bondType, startX, startY, endX, endY, radius1, radius2);
        };

        const renderAtom = (atom) => {
            const [x, y] = atom.getPosition();
            const symbol = atom.getSymbol();
            const atomicRadius = atom.getAtomicRadius();

            const canvasCoords = getCanvasCoordinates(x, y);
    
            const text = new Two.Text(symbol, canvasCoords.x, canvasCoords.y);
            text.fill = getTextColor(atom);
            text.alignment = 'center';
            text.baseline = 'middle';
            text.size = getCanvasFontSize(atomicRadius);
            two.add(text);
        };

        const renderBondHighlights = (bond) => {
            if (!selectedAtom && !hoveredAtom && (bond === selectedBond || bond === hoveredBond)) {
                const [startX, startY] = bond.getAtom1().getPosition();
                const [endX, endY] = bond.getAtom2().getPosition();

                const canvasStart = getCanvasCoordinates(startX, startY);
                const canvasEnd = getCanvasCoordinates(endX, endY);
                const canvasMid = Two.Vector.add(canvasStart, canvasEnd).divideScalar(2);
                const distance = canvasStart.distanceTo(canvasEnd);

                const rx = (distance / 2) - 17;
                const ry = getCanvasLineWidth() * 7;

                const highlight = new Two.Ellipse(canvasMid.x, canvasMid.y, rx, ry);
                highlight.fill = getHighlightColor();
                highlight.rotation = Two.Vector.angleBetween(canvasStart, canvasEnd);
                highlight.noStroke();
                two.add(highlight);
            }
        };

        const renderAtomHighlights = (atom) => {
            if (atom === selectedAtom || atom === hoveredAtom || atom.isAnchored()) {
                const [x, y] = atom.getPosition();
                const atomicRadius = atom.getAtomicRadius();

                const canvasCoords = getCanvasCoordinates(x, y);
                const canvasRadius = getCanvasRadius(atomicRadius);

                const highlight = new Two.Circle(canvasCoords.x, canvasCoords.y, canvasRadius);
                highlight.fill = getHighlightColor(atom.isAnchored());
                highlight.noStroke();
                two.add(highlight);
            }
        };

        const renderMolecules = () => {
            solution.getBonds().forEach(bond => renderBond(bond));
            solution.getAtoms().forEach(atom => renderAtom(atom));
        };

        const renderHighlights = () => {
            solution.getBonds().forEach(bond => renderBondHighlights(bond));
            solution.getAtoms().forEach(atom => renderAtomHighlights(atom));
        };
    
        const update = () => {
            two.clear();  
            renderGrid();
            renderCurrentBond();
            renderMolecules();
            renderHighlights();
        };

        const checkAtomCollision = (clientX, clientY) => {
            const solutionCoords = getSolutionCoordinates(clientX, clientY);
            const canvasClientCoords = getCanvasCoordinates(solutionCoords.x, solutionCoords.y);

            for (const atom of solution.getAtoms()) {
                const [x, y] = atom.getPosition();
                const atomicRadius = atom.getAtomicRadius();
        
                const canvasAtomCoords = getCanvasCoordinates(x, y);
                const canvasRadius = getCanvasRadius(atomicRadius);
        
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
            const canvasClientCoords = getCanvasCoordinates(solutionCoords.x, solutionCoords.y);
        
            for (const bond of solution.getBonds()) {
                const [x1, y1] = bond.getAtom1().getPosition();
                const [x2, y2] = bond.getAtom2().getPosition();
                const bondType = bond.getType();
        
                const canvasAtom1Coords = getCanvasCoordinates(x1, y1);
                const canvasAtom2Coords = getCanvasCoordinates(x2, y2);
                const scalar = 
                    bondType === 'Triple' ? 3 :
                    bondType === 'Double' ? 2 : 1;
                const lineWidth = (getCanvasLineWidth() + 1) * scalar;
        
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
            two.scene.scale +=
                event.deltaY > 0 ? -0.05 : 
                event.deltaY < 0 ? 0.05 : 0;
            two.scene.scale = Math.max(two.scene.scale, 0.1);
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
                selectedAtom && hoveredAtom && selectedAtom != hoveredAtom) {
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

            if (panning) {
                const dx =  event.clientX - prevX;
                const dy = event.clientY - prevY;
                two.scene.translation.set(
                    two.scene.translation.x + dx, 
                    two.scene.translation.y + dy
                );
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

        two.bind('update', update);
        two.play();

        two.renderer.domElement.addEventListener('click', onClick);
        two.renderer.domElement.addEventListener('wheel', onScroll);
        two.renderer.domElement.addEventListener('mousedown', onMouseDown);
        two.renderer.domElement.addEventListener('mousemove', onMouseMove);
        two.renderer.domElement.addEventListener('contextmenu', onContextMenu);

        window.addEventListener('mouseup', onMouseUp);

        return () => {
            two.pause();
            two.unbind('update', update)
            two.clear();
            
            two.renderer.domElement.removeEventListener('click', onClick);
            two.renderer.domElement.removeEventListener('wheel', onScroll);
            two.renderer.domElement.removeEventListener('mousedown', onMouseDown);
            two.renderer.domElement.removeEventListener('mousemove', onMouseMove);
            two.renderer.domElement.removeEventListener('contextmenu', onContextMenu);

            window.removeEventListener('mouseup', onMouseUp);
        };
    }, [solution]);

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

    const onResize = (width, height) => {
        const prevWidth = two.width || 1;
        const prevHeight = two.height || 1;

        const scaleWidth = width / prevWidth;
        const scaleHeight = height / prevHeight;

        two.scene.translation.set(
            two.scene.translation.x * scaleWidth,
            two.scene.translation.y * scaleHeight
        );

        two.width = width;
        two.height = height;
    };

    return <GraphicsContainer renderer={two.renderer} onResize={onResize}/>;
}

export default MoleculeDrawingView;
