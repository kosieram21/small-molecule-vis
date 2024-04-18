import React from 'react';
import { useAppContext } from '../AppContext';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import './AlertContainer.css'

function AlertContainer() {
      const { alerts, removeAlert } = useAppContext();

      return (
            <Stack className='alert-container' spacing={2}>
                  {alerts.map((alert) => (
                        <Alert className='alert' key={alert.id} severity={alert.severity} onClose={() => removeAlert(alert.id)}>
                              {alert.message}
                        </Alert>
                  ))}
            </Stack>
      );
}

export default AlertContainer;
