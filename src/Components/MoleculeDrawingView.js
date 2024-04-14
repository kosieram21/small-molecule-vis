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
            const canvasRadius = 10 + (20 * atomicRadius);
            return canvasRadius;
        };

        const renderCurrentBond = () => {
            if (selectedAtom) {
                const [startX, startY] = selectedAtom.getPosition();
                const [endX, endY] = getSolutionCoordinates(prevX, prevY);
                
                const [canvasStartX, canvasStartY] = getCanvasCoordinates(startX, startY);
                const [canvasEndX, canvasEndY] = getCanvasCoordinates(endX, endY);

                const line = new Two.Line(canvasStartX, canvasStartY, canvasEndX, canvasEndY);
                line.stroke = 'white';
                line.linewidth = 10;
                two.add(line);
            }
        };

        const renderBond = (bond) => {
            const [startX, startY] = bond.getAtom1().getPosition();
            const [endX, endY] = bond.getAtom2().getPosition();
                
            const [canvasStartX, canvasStartY] = getCanvasCoordinates(startX, startY);
            const [canvasEndX, canvasEndY] = getCanvasCoordinates(endX, endY);

            const line = new Two.Line(canvasStartX, canvasStartY, canvasEndX, canvasEndY);
            line.stroke = 'white';
            line.linewidth = 10;
            two.add(line);
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
                circle.linewidth = 5;
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
            return solution.getAtoms().find(atom => {
                const [x, y] = atom.getPosition();
                const atomicRadius = atom.getAtomicRadius();

                const [canvasAtomX, canvasAtomY] = getCanvasCoordinates(x, y);
                const canvasRadius = getCanvasRadius(atomicRadius);

                const dx = canvasClientX - canvasAtomX;
                const dy = canvasClientY - canvasAtomY;
                const euclidean_distance = Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
                return euclidean_distance < canvasRadius;
            });
        };

        const checkBondCoherence = () => {
            if (selectedAtom && hoveredAtom && selectedAtom != hoveredAtom) {
                BondTable.load().then(bondTable => {
                    const bondPair = bondTable.conatainsSingleBond(selectedAtom.getSymbol(), hoveredAtom.getSymbol());
                    if (bondPair) {
                        const bondInfo = bondTable.getSingleBond(bondPair);
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
        };

        const onMouseDown = (event) => {
            selectedAtom = checkAtomCollision(event.clientX, event.clientY);

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

            if (panning) {
                const dx = (event.clientX - prevX) / two.scene.scale;
                const dy = (event.clientY - prevY) / two.scene.scale;
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
    }

    return <GraphicsContainer renderer={twoRef.current.renderer} onResize={onResize}/>;
}

export default MoleculeDrawingView;
