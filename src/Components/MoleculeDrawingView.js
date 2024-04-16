import React, { useRef, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import Two from 'two.js';
import GraphicsContainer from './GraphicsContainer';
import PeriodicTable from '../Object Model/PeriodicTable';
import BondTable from '../Object Model/BondTable'
import Atom from '../Object Model/Atom.js';
import Bond from '../Object Model/Bond.js';

function MoleculeDrawingView({ solution }) {
    const { selectedElement } = useAppContext();
    const selectedElementRef = useRef(selectedElement);
    const twoRef = useRef(new Two());

    useEffect(() => {
        const two = twoRef.current;

        let panning = false;
        let prevX, prevY;
        let selectedAtom, hoveredAtom;
        let selectedBond, hoveredBond;

        const getSolutionCoordinates = (clientX, clientY) => {
            const rect = two.renderer.domElement.getBoundingClientRect();
            const normalizedX = (clientX - rect.left) / rect.width;
            const normalizedY = (clientY - rect.top) / rect.height;
            const solutionX = (normalizedX - two.scene.translation.x / rect.width) / two.scene.scale;
            const solutionY = (normalizedY - two.scene.translation.y / rect.height) / two.scene.scale;
            return [solutionX, solutionY];
        };

        const getCanvasCoordinates = (solutionX, solutionY) => {
            const rect = two.renderer.domElement.getBoundingClientRect();
            const canvasX = solutionX * rect.width;
            const canvasY = solutionY * rect.height;
            return [canvasX, canvasY];
        };

        const getCanvasRadius = (atomicRadius) => {
            const canvasRadius = 10 + 20 * atomicRadius;
            return canvasRadius;
        };

        const getCanvasLineWidth = () => {
            return 10;
        }

        const renderSingleBond = (startX, startY, endX, endY, selected = false) => {
            const [canvasStartX, canvasStartY] = getCanvasCoordinates(startX, startY);
            const [canvasEndX, canvasEndY] = getCanvasCoordinates(endX, endY);

            const line = new Two.Line(canvasStartX, canvasStartY, canvasEndX, canvasEndY);
            line.stroke = selected ? 'grey' : 'white';
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
            circle.fill = color;
            if (atom == selectedAtom || atom == hoveredAtom) {
                circle.stroke = 'white'
                circle.linewidth = getCanvasLineWidth() / 2;
            } else {
                circle.noStroke();
            }
            two.add(circle);
    
            const text = new Two.Text(symbol, canvasX, canvasY);
            text.fill = 'black';
            text.alignment = 'center';
            text.baseline = 'middle';
            text.size = canvasRadius;
            two.add(text);
        };
    
        const update = () => {
            two.clear();
            
            renderCurrentBond();
            solution.getBonds().forEach(bond => renderBond(bond));
            solution.getAtoms().forEach(atom => renderAtom(atom));
        };

        const checkAtomCollision = (clientX, clientY) => {
            const [solutionX, solutionY] = getSolutionCoordinates(clientX, clientY);
            const [canvasClientX, canvasClientY] = getCanvasCoordinates(solutionX, solutionY);

            for (const atom of solution.getAtoms()) {
                const [x, y] = atom.getPosition();
                const atomicRadius = atom.getAtomicRadius();
        
                const [canvasAtomX, canvasAtomY] = getCanvasCoordinates(x, y);
                const canvasRadius = getCanvasRadius(atomicRadius);
        
                const dx = canvasClientX - canvasAtomX;
                const dy = canvasClientY - canvasAtomY;
                const euclideanDistance = Math.sqrt(dx * dx + dy * dy);
        
                if (euclideanDistance < canvasRadius) {
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

                const slope = (canvasAtom2Y - canvasAtom1Y) / (canvasAtom2X - canvasAtom1X);
                const intercept = canvasAtom1Y - slope * canvasAtom1X;

                const candidateY = slope * canvasClientX + intercept;
                const pointToLineDistance = Math.abs(canvasClientY - candidateY);

                if (pointToLineDistance < lineWidth) {
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
                event.deltaY > 0 ? -0.01 : 
                event.deltaY < 0 ? 0.01 : 0;
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

            if (event.button === 2) {
                panning = false;
            }
        };

        const onMouseMove = (event) => {
            hoveredAtom = checkAtomCollision(event.clientX, event.clientY);
            hoveredBond = checkBondCollision(event.clientX, event.clientY);

            if (panning) {
                const dx = (event.clientX - prevX); // two.scene.scale;
                const dy = (event.clientY - prevY); // two.scene.scale;
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

    const onResize = (width, height) => {
        const two = twoRef.current;
        two.width = width;
        two.height = height;
        two.scene.translation.set(width / 2, height / 2);
    }

    return <GraphicsContainer renderer={twoRef.current.renderer} onResize={onResize}/>;
}

export default MoleculeDrawingView;
