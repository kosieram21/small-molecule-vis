import React, { useRef, useEffect } from 'react';
import './GraphicsContainer.css'

function GraphicsContainer({ renderer, onResize }) {
    const mountPoint = useRef();

    useEffect(() => {
        mountPoint.current.appendChild(renderer.domElement);

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

        resizeObserver.observe(mountPoint.current);
    
        return () => {
            mountPoint.current.removeChild(renderer.domElement);
            resizeObserver.disconnect();
        };
      }, []);

    return <div ref={mountPoint} className='graphics-container'/>;
}

export default GraphicsContainer;
