import React, { useRef } from 'react';
import { AppContextProvider } from './AppContext';
import Toolbar from './Components/Toolbar';
import MoleculeDrawingView from './Components/MoleculeDrawingView';
import MoleculeSimulationView from './Components/MoleculeSimulationView';
import Toast from './Components/Toast.js'
import './App.css'
import Solution from './Object Model/Solution.js';

function App() {
      const solutionRef = useRef(new Solution());

	return (
            <AppContextProvider>
                  <div className='app'>
                        <Toolbar/>
                        <div className='molecule-viewer-flex'>
                              <MoleculeDrawingView solution={solutionRef.current}/>
                              <MoleculeSimulationView solution={solutionRef.current}/>
                        </div>
                        <Toast/>
                  </div>
            </AppContextProvider>
  	);
}

export default App;
