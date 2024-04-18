import React, { useState, useEffect } from 'react';
import './Toolbar.css';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Switch from '@mui/material/Switch';
import { useAppContext } from '../AppContext';
import PeriodicTable from '../Object Model/PeriodicTable';
import BondTable from '../Object Model/BondTable'

function Toolbar() {
  const [elementOptions, setElementOptions] = useState([]);
  const [bondOptions, setBondOptions] = useState([]);
  const { setSelectedElement, setSelectedBond, gridEnabled, setGridEnabled } = useAppContext();

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

  const elementComboBoxOnChange = (event, selectedOption) => {
    setSelectedElement(selectedOption ? selectedOption.value : selectedOption);
  };

  const bondComboBoxOnChange = (event, selectedOption) => {
    setSelectedBond(selectedOption ? selectedOption.value : selectedOption);
  }

  const gridCheckBoxOnChange = (event) => {
    setGridEnabled(event.target.checked);
  }

  return (
    <div className='toolbar'>
      <Autocomplete className='combo-box' options={elementOptions} onChange={elementComboBoxOnChange}
        renderInput={(params) => <TextField {...params} label="Element" variant="standard" />}/>
      <Autocomplete className='combo-box' options={bondOptions} onChange={bondComboBoxOnChange}
        renderInput={(params) => <TextField {...params} label="Bond" variant="standard"/>}/>
      <FormControlLabel className='check-box' label="Grid" labelPlacement="start"
        control={<Checkbox checked={gridEnabled} onChange={gridCheckBoxOnChange}/>}/>
      <FormControlLabel className='switch' label="Simulation" labelPlacement="start"
        control={<Switch/>}/>
    </div>
  );
}

export default Toolbar;
