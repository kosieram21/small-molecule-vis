import React, { useState, useEffect } from 'react';
import './Toolbar.css';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteIcon from '@mui/icons-material/Delete';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import AnchorIcon from '@mui/icons-material/Anchor';
import PaletteIcon from '@mui/icons-material/Palette';
import Checkbox from '@mui/material/Checkbox';
import Switch from '@mui/material/Switch';
import { useAppContext } from '../AppContext';
import PeriodicTable from '../Object Model/PeriodicTable';
import BondTable from '../Object Model/BondTable'

function Toolbar({ solution }) {
  const [elementOptions, setElementOptions] = useState([]);
  const [bondOptions, setBondOptions] = useState([]);
  const { setSelectedElement, setSelectedBond, 
    deleteEnabled, setDeleteEnabled, 
    moveEnabled, setMoveEnabled,
    anchorEnabled, setAnchorEnabled,
    colorEnabled, setColorEnabled,
    gridEnabled, setGridEnabled, 
    simulationEnabled, setSimulationEnabled } = useAppContext();

  const elementComboBoxOnChange = (event, selectedOption) => {
    setSelectedElement(selectedOption ? selectedOption.value : selectedOption);
  };

  const bondTypeComboBoxOnChange = (event, selectedOption) => {
    setSelectedBond(selectedOption ? selectedOption.value : selectedOption);
  };

  const gridCheckBoxOnChange = (event) => {
    setGridEnabled(event.target.checked);
  };

  const simulationSwitchOnChange = (event) => {
    setSimulationEnabled(event.target.checked);
  };

  const clearButtonOnClick = () => {
    solution.clear();
  };

  const deleteButtonOnClick = () => {
    setDeleteEnabled(!deleteEnabled);
    setMoveEnabled(false);
    setAnchorEnabled(false);
  };

  const moveButtonOnClick = () => {
    setDeleteEnabled(false);
    setMoveEnabled(!moveEnabled);
    setAnchorEnabled(false);
  };

  const anchorButtonOnClick = () => {
    setDeleteEnabled(false);
    setMoveEnabled(false);
    setAnchorEnabled(!anchorEnabled);
  };

  const colorButtonOnClick = () => {
    setColorEnabled(!colorEnabled);
  };

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

  useEffect(() => {
    const onKeyDown = (event) => {
      const elementComboBox = document.getElementById("element-combo-box");
      const bondTypeComboBox = document.getElementById("bond-type-combo-box");
      if (document.activeElement !== elementComboBox && document.activeElement !== bondTypeComboBox) {
        switch (event.key) {
          case 'd':
          case 'D':
            deleteButtonOnClick();
            break;
          case 'm':
          case 'M':
            moveButtonOnClick();
            break;
          case 'a':
          case 'A':
            anchorButtonOnClick();
            break;
          case 'c':
          case 'C':
            colorButtonOnClick();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [deleteEnabled, moveEnabled, anchorEnabled, colorEnabled]);

  return (
    <div className='toolbar'>
      <Button className='text-button' startIcon={<ClearIcon />} onClick={clearButtonOnClick}>
        <span className="button-label">Clear</span>
      </Button>
      <Autocomplete className='combo-box' options={elementOptions} onChange={elementComboBoxOnChange}
        renderInput={(params) => (
          <TextField {...params} label="Element" variant="standard"  inputProps={{ ...params.inputProps, id: 'element-combo-box' }}/>)}/>
      <Autocomplete className='combo-box' options={bondOptions} onChange={bondTypeComboBoxOnChange}
        renderInput={(params) => (
          <TextField {...params} label="Bond Type" variant="standard" inputProps={{ ...params.inputProps, id: 'bond-type-combo-box' }}/>)}/>
      <Button className='icon-button' startIcon={<DeleteIcon />} onClick={deleteButtonOnClick} 
        color={deleteEnabled ? 'secondary' : 'primary'}/>
      <Button className='icon-button' startIcon={<OpenWithIcon />} onClick={moveButtonOnClick}
        color={moveEnabled ? 'secondary' : 'primary'}/>
      <Button className='icon-button' startIcon={<AnchorIcon />} onClick={anchorButtonOnClick}
        color={anchorEnabled ? 'secondary' : 'primary'}/>
      <Button className='icon-button' startIcon={<PaletteIcon />} onClick={colorButtonOnClick}
        color={colorEnabled ? 'secondary' : 'primary'}/>
      <FormControlLabel className='check-box' label="Grid" labelPlacement="start"
        control={<Checkbox checked={gridEnabled} onChange={gridCheckBoxOnChange}/>}/>
      <FormControlLabel className='switch' label="Simulation" labelPlacement="start"
        control={<Switch checked ={simulationEnabled} onChange={simulationSwitchOnChange}/>}/>
    </div>
  );
}

export default Toolbar;
