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

        const renderAtom = (atom) => {
            const [x, y] = atom.getPosition();
            const symbol = atom.getSymbol();
            const color = atom.getColor();
            const atomicRadius = atom.getAtomicRadius();

            const rect = two.renderer.domElement.getBoundingClientRect();
            const canvasX = x * rect.width;
            const canvasY = y * rect.height;
    
            const radius = 10 + (20 * atomicRadius);
            const circle = two.makeCircle(canvasX, canvasY, radius);
            circle.fill = color;
            circle.noStroke();
    
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
                    const element = periodicTable.getElement(selectedElementRef.current.value);
                    solution.addAtom(new Atom([normalizedX, normalizedY, 0], 
                        element.getSymbol(), 
                        element.getAtomicNumber(),
                        element.getAtomicRadius()));
                }
            });
        };

        two.bind('update', update);
        two.play();
        two.renderer.domElement.addEventListener('click', onClick);

        return () => {
            two.pause();
            two.unbind('update', update)
            two.clear();
            two.renderer.domElement.removeEventListener('click', onClick);
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
