import React from 'react';
import { useAppContext } from '../AppContext';
import Snackbar from '@mui/material/Snackbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

function Toast() {
    const { toastOpen, setToastOpen } = useAppContext();

    const handleClose = (event, reason) => {
          setToastOpen(false);
    };

    const action = (
          <React.Fragment>
                <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
                      <CloseIcon fontSize="small" />
                </IconButton>
          </React.Fragment>
        );
  
    return (
          <Snackbar open={toastOpen} autoHideDuration={6000} message="Invalid Bond!" action={action}/>
    );
}

export default Toast;
