import React, { createContext, useContext, useState } from 'react';

const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
    const [selectedElement, setSelectedElement] = useState("");
    const [selectedBond, setSelectedBond] = useState("");
    const [gridEnabled, setGridEnabled] = useState(true);
    const [alerts, setAlerts] = useState([]);
    
    const addAlert = (message, severity = 'info') => {
        const newAlert = { id: new Date().getTime(), message, severity };
        setAlerts(alerts => {
            const newAlerts = [...alerts, newAlert];
            return newAlerts.length > 4 ? newAlerts.slice(1) : newAlerts;
        });
    };
    
    const removeAlert = (id) => {
        setAlerts(alerts => alerts.filter(alert => alert.id !== id));
    };
    
    const value = { 
        selectedElement, setSelectedElement, 
        selectedBond, setSelectedBond, 
        gridEnabled, setGridEnabled,
        alerts, addAlert, removeAlert
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);