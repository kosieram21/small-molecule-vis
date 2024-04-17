import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const [selectedElement, setSelectedElement] = useState("");
    const [selectedBond, setSelectedBond] = useState("");
    const [gridEnabled, setGridEnabled] = useState(true);
    
    const value = { 
        selectedElement, setSelectedElement, 
        selectedBond, setSelectedBond, 
        gridEnabled, setGridEnabled 
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);