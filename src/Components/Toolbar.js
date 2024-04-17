import React, { useState, useEffect } from 'react';
import './Toolbar.css';
import Select from 'react-select';
import { useAppContext } from '../AppContext';
import PeriodicTable from '../Object Model/PeriodicTable';
import BondTable from '../Object Model/BondTable'

function Toolbar() {
  const [elementOptions, setElementOptions] = useState([]);
  const [bondOptions, setBondOptions] = useState([]);
  const { setSelectedElement } = useAppContext();

  useEffect(() => {
    PeriodicTable.load().then(periodicTable => {
      const loadedOptions = periodicTable.getElements().map(element => ({
        value: element.getName(),
        label: element.getName(),
      }));
      setElementOptions(loadedOptions);
    });

    BondTable.load().then(bondTable => {
      const loadedOptions = bondTable.getBondTypes().map(bondType => ({
        value: bondType,
        label: bondType
      }));
      setBondOptions(loadedOptions);
    });
  }, []);

  const elementComboBoxOnChange = selectedOption => {
    setSelectedElement(selectedOption);
  };

  return (
    <div className='toolbar'>
      <span className='label'>Element:</span>
      <Select className='combo-box' options={elementOptions} onChange={elementComboBoxOnChange}/>
      <span className='label'>Bond:</span>
      <Select className='combo-box' options={bondOptions}/>
    </div>
  );
}

export default Toolbar;
