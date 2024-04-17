import React, { useRef, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import Two from 'two.js';
import GraphicsContainer from './GraphicsContainer';
import PeriodicTable from '../Object Model/PeriodicTable';
import BondTable from '../Object Model/BondTable';
import Atom from '../Object Model/Atom.js';
import Bond from '../Object Model/Bond.js';

function MoleculeDrawingView({ solution }) {
    const { selectedElement, selectedBond } = useAppContext();
    const selectedElementRef = useRef(selectedElement);
    const selectedBondRef = useRef(selectedBond);
    const twoRef = useRef(new Two());

    useEffect(() => {
        const two = twoRef.current;

        let panning = false;
        let prevX, prevY;
        let selectedAtom, hoveredAtom;
        let selectedBond, hoveredBond;

        const getSolutionCoordinates = (clientX, clientY) => {
            const rect = two.renderer.domElement.getBoundingClientRect();
            const normalizedX = (clientX - rect.left) / two.width;
            const normalizedY = (clientY - rect.top) / two.height;
            const solutionX = (normalizedX - two.scene.translation.x / two.width) / two.scene.scale;
            const solutionY = (normalizedY - two.scene.translation.y / two.height) / two.scene.scale;
            return [solutionX, solutionY];
        };

        const getCanvasCoordinates = (solutionX, solutionY) => {
            const canvasX = solutionX * two.width;
            const canvasY = solutionY * two.height;
            return [canvasX, canvasY];
        };

        const getCanvasRadius = (atomicRadius) => {
            const canvasRadius = 15 + 30 * atomicRadius;
            return canvasRadius;
        };

        const getCanvasFontSize = (atomicRadius) => {
            const fontSize = 20 + 40 * atomicRadius;
            return fontSize;
        };

        const getCanvasLineWidth = () => {
            return 5;
        };

        const getHighlightColor = () => {
            return 'rgba(173, 216, 230, 0.5)'
        };

        const euclideanDistance = (ax, ay, bx, by) => {
            const dx = bx - ax;
            const dy = by - ay;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance;
        };

        const pointToSegmentDistance = (px, py, ax, ay, bx, by) => {
            const dx = bx - ax;
            const dy = by - ay;
            const p2x = px - ax;
            const p2y = py - ay;
            const squaredNorm = dx * dx + dy * dy;
        
            if (squaredNorm === 0) {
                return Math.sqrt(p2x * p2x + p2y * p2y);
            }
        
            const t = Math.max(0, Math.min(1, (p2x * dx + p2y * dy) / squaredNorm));
            const closestX = (ax + t * dx);
            const closestY = (ay + t * dy);
            const distance = euclideanDistance(px, py, closestX, closestY);
        
            return distance;
        };

        const vectorOrientation = (ax, ay, bx, by) => {
            const dx = bx - ax;
            const dy = by - ay;
            const angle = Math.atan2(dy, dx);
            return angle;
        };

        const renderGrid = () => {
            const spacing = 50;
            const color = 'blue';
            const lineWidth = 1;
            const dash = [2, 4];

            const minX = (-two.scene.translation.x) / two.scene.scale;
            const maxX = (two.width - two.scene.translation.x) / two.scene.scale;
            const minY = (-two.scene.translation.y) / two.scene.scale;
            const maxY = (two.height - two.scene.translation.y) / two.scene.scale;

            const startX = Math.floor(minX / spacing) * spacing;
            const endX = Math.ceil(maxX / spacing) * spacing;
            const startY = Math.floor(minY / spacing) * spacing;
            const endY = Math.ceil(maxY / spacing) * spacing;
    
            for (let x = startX; x <= endX; x += spacing) {
                const line = new Two.Line(x, minY, x, maxY);
                line.stroke = color;
                line.linewidth = lineWidth;
                line.dashes = dash;
                two.add(line);
            }
    
            for (let y = startY; y <= endY; y += spacing) {
                const line = new Two.Line(minX, y, maxX, y);
                line.stroke = color;
                line.linewidth = lineWidth;
                line.dashes = dash;
                two.add(line);
            }
        };

        const renderSingleBond = (startX, startY, endX, endY) => {
            const [canvasStartX, canvasStartY] = getCanvasCoordinates(startX, startY);
            const [canvasEndX, canvasEndY] = getCanvasCoordinates(endX, endY);

            const line = new Two.Line(canvasStartX, canvasStartY, canvasEndX, canvasEndY);
            line.stroke = 'black';
            line.linewidth = getCanvasLineWidth();
            two.add(line);
        };

        const renderCurrentBond = () => {
            if (selectedAtom) {
                const [startX, startY] = selectedAtom.getPosition();
                const [endX, endY] = getSolutionCoordinates(prevX, prevY);
                renderSingleBond(startX, startY, endX, endY);
            }
        };

        const renderBond = (bond) => {
            const [startX, startY] = bond.getAtom1().getPosition();
            const [endX, endY] = bond.getAtom2().getPosition();
            const selected = bond == selectedBond || bond == hoveredBond;
            renderSingleBond(startX, startY, endX, endY, selected);
        };

        const renderAtom = (atom) => {
            const [x, y] = atom.getPosition();
            const symbol = atom.getSymbol();
            const color = atom.getColor();
            const atomicRadius = atom.getAtomicRadius();

            const [canvasX, canvasY] = getCanvasCoordinates(x, y);
            const canvasRadius = getCanvasRadius(atomicRadius);
            
            const circle = new Two.Circle(canvasX, canvasY, canvasRadius);
            circle.fill = 'white';
            circle.noStroke();
            two.add(circle);
    
            const text = new Two.Text(symbol, canvasX, canvasY);
            text.fill = color;
            text.alignment = 'center';
            text.baseline = 'middle';
            text.size = getCanvasFontSize(atomicRadius);
            two.add(text);
        };

        const renderBondHighlights = (bond) => {
            if (!selectedAtom && !hoveredAtom && (bond == selectedBond || bond == hoveredBond)) {
                const [startX, startY] = bond.getAtom1().getPosition();
                const [endX, endY] = bond.getAtom2().getPosition();

                const [canvasStartX, canvasStartY] = getCanvasCoordinates(startX, startY);
                const [canvasEndX, canvasEndY] = getCanvasCoordinates(endX, endY);

                const canvasMidX = (canvasStartX + canvasEndX) / 2;
                const canvasMidY = (canvasStartY + canvasEndY) / 2;
                const distance = euclideanDistance(canvasStartX, canvasStartY, canvasEndX, canvasEndY);

                const rx = (distance / 2) - 15;
                const ry = getCanvasLineWidth() * 4;

                const highlight = new Two.Ellipse(canvasMidX, canvasMidY, rx, ry);
                highlight.fill = getHighlightColor();
                highlight.rotation = vectorOrientation(canvasStartX, canvasStartY, canvasEndX, canvasEndY);
                highlight.noStroke();
                two.add(highlight);
            }
        };

        const renderAtomHighlights = (atom) => {
            if (atom == selectedAtom || atom == hoveredAtom) {
                const [x, y] = atom.getPosition();
                const atomicRadius = atom.getAtomicRadius();

                const [canvasX, canvasY] = getCanvasCoordinates(x, y);
                const canvasRadius = getCanvasRadius(atomicRadius);

                const highlight = new Two.Circle(canvasX, canvasY, canvasRadius);
                highlight.fill = getHighlightColor();
                highlight.noStroke();
                two.add(highlight);
            }
        };

        const renderHighlights = () => {
            solution.getBonds().forEach(bond => renderBondHighlights(bond));
            solution.getAtoms().forEach(atom => renderAtomHighlights(atom));
        }
    
        const update = () => {
            two.clear();

            renderGrid();

            solution.getBonds().forEach(bond => renderBond(bond));
            solution.getAtoms().forEach(atom => {
                if (atom != selectedAtom && atom != hoveredAtom) {
                    renderAtom(atom);
                }
            });
            
            renderCurrentBond();

            if (selectedAtom) {
                renderAtom(selectedAtom);
            }

            if (hoveredAtom) {
                renderAtom(hoveredAtom);
            }
            
            renderHighlights();
        };

        const checkAtomCollision = (clientX, clientY) => {
            const [solutionX, solutionY] = getSolutionCoordinates(clientX, clientY);
            const [canvasClientX, canvasClientY] = getCanvasCoordinates(solutionX, solutionY);

            for (const atom of solution.getAtoms()) {
                const [x, y] = atom.getPosition();
                const atomicRadius = atom.getAtomicRadius();
        
                const [canvasAtomX, canvasAtomY] = getCanvasCoordinates(x, y);
                const canvasRadius = getCanvasRadius(atomicRadius);
        
                const distance = euclideanDistance(canvasClientX, canvasClientY, canvasAtomX, canvasAtomY);
        
                if (distance < canvasRadius) {
                    return atom;
                }
            }

            return null;
        };

        const checkBondCollision = (clientX, clientY) => {
            const [solutionX, solutionY] = getSolutionCoordinates(clientX, clientY);
            const [canvasClientX, canvasClientY] = getCanvasCoordinates(solutionX, solutionY);
        
            for (const bond of solution.getBonds()) {
                const [x1, y1] = bond.getAtom1().getPosition();
                const [x2, y2] = bond.getAtom2().getPosition();
        
                const [canvasAtom1X, canvasAtom1Y] = getCanvasCoordinates(x1, y1);
                const [canvasAtom2X, canvasAtom2Y] = getCanvasCoordinates(x2, y2);
                const lineWidth = getCanvasLineWidth();
        
                const distance = pointToSegmentDistance(canvasClientX, canvasClientY, canvasAtom1X, canvasAtom1Y, canvasAtom2X, canvasAtom2Y);

                if (distance < lineWidth) {
                    return bond;
                }
            }
        
            return null;
        };

        const checkBondCoherence = () => {
            if (selectedAtom && hoveredAtom && selectedAtom != hoveredAtom) {
                BondTable.load().then(bondTable => {
                    const bondHandle = bondTable.conatainsSingleBond(selectedAtom.getSymbol(), hoveredAtom.getSymbol());
                    if (bondHandle) {
                        const bondInfo = bondTable.getSingleBondInformation(bondHandle);
                        solution.addBond(new Bond(selectedAtom, hoveredAtom,
                            bondInfo.getBondLength(),
                            bondInfo.getBondType()));
                    }
                    selectedAtom = null;
                });
            } else {
                selectedAtom = null;
            }
        };
    
        const onClick = (event) => {
            PeriodicTable.load().then(periodicTable => {
                if (selectedElementRef.current.value) {
                    const [solutionX, solutionY] = getSolutionCoordinates(event.clientX, event.clientY);
                    const element = periodicTable.getElement(selectedElementRef.current.value);
                    hoveredAtom = new Atom([solutionX, solutionY, 0], 
                        element.getSymbol(), 
                        element.getAtomicNumber(),
                        element.getAtomicRadius());
                    solution.addAtom(hoveredAtom);
                }
            });
        };

        const onScroll = (event) => {
            event.preventDefault();
            two.scene.scale +=
                event.deltaY > 0 ? -0.05 : 
                event.deltaY < 0 ? 0.05 : 0;
            two.scene.scale = Math.max(two.scene.scale, 0.1);
        };

        const onMouseDown = (event) => {
            selectedAtom = checkAtomCollision(event.clientX, event.clientY);
            selectedBond = checkBondCollision(event.clientX, event.clientY);

            if (event.shiftKey) {
                if (selectedAtom) {
                    solution.removeAtom(selectedAtom);
                    selectedAtom = null;
                }

                if (selectedBond) {
                    solution.removeBond(selectedBond);
                    selectedBond = null;
                }
            }

            if (event.button === 2) {
                event.preventDefault();
                panning = true;
            }

            prevX = event.clientX;
            prevY = event.clientY;
        };

        const onMouseUp = (event) => {
            checkBondCoherence();
            selectedBond = null;

            if (event.button === 2) {
                panning = false;
            }
        };

        const onMouseMove = (event) => {
            hoveredAtom = checkAtomCollision(event.clientX, event.clientY);
            hoveredBond = checkBondCollision(event.clientX, event.clientY);

            if (panning) {
                const dx = (event.clientX - prevX);
                const dy = (event.clientY - prevY);
                two.scene.translation.set(two.scene.translation.x + dx, two.scene.translation.y + dy);
            }

            prevX = event.clientX;
            prevY = event.clientY;
        }

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
    }, [selectedBond])

    const onResize = (width, height) => {
        const two = twoRef.current;
        two.width = width;
        two.height = height;
        two.scene.translation.set(width / 2, height / 2);
    }

    return <GraphicsContainer renderer={twoRef.current.renderer} onResize={onResize}/>;
}

export default MoleculeDrawingView;
