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
    
            const circle = two.makeCircle(x, y, 25);
            circle.fill = color;
            circle.noStroke();
    
            const text = new Two.Text(symbol, x, y);
            text.fill = 'black';
            text.alignment = 'center';
            text.baseline = 'middle';
            text.size = 14;
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
                    const mouseX = event.clientX - rect.left;
                    const mouseY = event.clientY - rect.top;
                    const element = periodicTable.getElement(selectedElementRef.current.value);
                    solution.addAtom(new Atom([mouseX, mouseY, 0], element.getSymbol(), element.getAtomicNumber()));
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
