import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const [selectedElement, setSelectedElement] = useState("");
    const [selectedBond, setSelectedBond] = useState("");
    const [deleteEnabled, setDeleteEnabled] = useState(false);
    const [moveEnabled, setMoveEnabled] = useState(false);
    const [anchorEnabled, setAnchorEnabled] = useState(false);
    const [gridEnabled, setGridEnabled] = useState(true);
    const [simulationEnabled, setSimulationEnabled] = useState(false);
    const [alerts, setAlerts] = useState([]);

    const addAlert = (message, severity = 'info') => {
        const newAlert = { id: new Date().getTime(), message, severity };
        setAlerts(alerts => [...alerts, newAlert]);
    };
    
    const removeAlert = (id) => {
        setAlerts(alerts => alerts.filter(alert => alert.id !== id));
    };
    
    const value = { 
        selectedElement, setSelectedElement, 
        selectedBond, setSelectedBond, 
        deleteEnabled, setDeleteEnabled,
        moveEnabled, setMoveEnabled,
        anchorEnabled, setAnchorEnabled,
        gridEnabled, setGridEnabled,
        simulationEnabled, setSimulationEnabled,
        alerts, addAlert, removeAlert
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
