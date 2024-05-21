import React, { useRef, useEffect } from 'react';
import './GraphicsContainer.css'

function GraphicsContainer({ renderer, onResize }) {
    const mountPointRef = useRef();

    useEffect(() => {
        if (renderer) {
            mountPointRef.current.appendChild(renderer.domElement);
        }

        const debounce = (func, wait) => {
            let timeout;
            return (...args) => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    func(...args);
                }, wait);
            };
        };

        const resizeObserver = new ResizeObserver(debounce(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                onResize(width, height);
            }
        }, 1));

        resizeObserver.observe(mountPointRef.current);
        
    
        return () => {
            if (renderer) {
                mountPointRef.current.removeChild(renderer.domElement);
            }
            resizeObserver.disconnect();
        };
      }, [renderer, onResize]);

    return <div ref={mountPointRef} className='graphics-container'/>;
}

export default GraphicsContainer;
