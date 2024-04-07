import React, { useRef, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import Two from 'two.js';
import GraphicsContainer from './GraphicsContainer';
import PeriodicTable from '../Object Model/PeriodicTable';
import Atom from '../Object Model/Atom.js';

function MoleculeDrawingView({ solution }) {
    const { selectedElement } = useAppContext();
    const selectedElementRef = useRef(selectedElement);
    const twoRef = useRef(new Two());

    useEffect(() => {
        const two = twoRef.current;

        let panning = false;
        let prevX, prevY;

        const renderAtom = (atom) => {
            const [x, y] = atom.getPosition();
            const symbol = atom.getSymbol();
            const color = atom.getColor();
            const atomicRadius = atom.getAtomicRadius();

            const rect = two.renderer.domElement.getBoundingClientRect();
            const canvasX = x * rect.width;
            const canvasY = y * rect.height;
            const radius = 10 + (20 * atomicRadius);
            
            const circle = new Two.Circle(canvasX, canvasY, radius);
            circle.fill = color;
            circle.noStroke();
            two.add(circle);
    
            const text = new Two.Text(symbol, canvasX, canvasY);
            text.fill = 'black';
            text.alignment = 'center';
            text.baseline = 'middle';
            text.size = radius;
            two.add(text);
        };
    
        const update = () => {
            two.clear();
            solution.getAtoms().forEach(atom => renderAtom(atom));
        };
    
        const onClick = (event) => {
            PeriodicTable.load().then(periodicTable => {
                if (selectedElementRef.current.value) {
                    const rect = two.renderer.domElement.getBoundingClientRect();
                    const normalizedX = (event.clientX - rect.left) / rect.width;
                    const normalizedY = (event.clientY - rect.top) / rect.height;
                    const solutionX = (normalizedX - two.scene.translation.x / rect.width) / two.scene.scale;
                    const solutionY = (normalizedY - two.scene.translation.y / rect.height) / two.scene.scale;
                    const element = periodicTable.getElement(selectedElementRef.current.value);
                    solution.addAtom(new Atom([solutionX, solutionY, 0], 
                        element.getSymbol(), 
                        element.getAtomicNumber(),
                        element.getAtomicRadius()));
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
            if (event.button === 2) {
                event.preventDefault();
                panning = true;
                prevX = event.clientX;
                prevY = event.clientY;
            }
        };

        const onMouseUp = (event) => {
            if (event.button === 2) {
                panning = false;
            }
        };

        const onMouseMove = (event) => {
            if (panning) {
                const dx = (event.clientX - prevX) / two.scene.scale;
                const dy = (event.clientY - prevY) / two.scene.scale;
                two.scene.translation.set(two.scene.translation.x + dx, two.scene.translation.y + dy);
    
                prevX = event.clientX;
                prevY = event.clientY;
            }
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
