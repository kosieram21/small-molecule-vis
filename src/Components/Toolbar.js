import React, { useState, useEffect } from 'react';
import './Toolbar.css';
import Select from 'react-select';
import { useAppContext } from '../AppContext';
import PeriodicTable from '../Object Model/PeriodicTable';

function Toolbar() {
  const [options, setOptions] = useState([]);
  const { setSelectedElement } = useAppContext();

  useEffect(() => {
    PeriodicTable.load().then(periodicTable => {
      const loadedOptions = periodicTable.getElements().map(element => ({
        value: element.getName(),
        label: element.getName(),
      }));
      setOptions(loadedOptions);
    });
  }, []);

  const atomComboBoxOnChange = selectedOption => {
    setSelectedElement(selectedOption);
  };

  return (
    <div className='toolbar'>
      <span className='label'>Element:</span>
      <Select className='combo-box' options={options} onChange={atomComboBoxOnChange}/>
    </div>
  );
}

export default Toolbar;
