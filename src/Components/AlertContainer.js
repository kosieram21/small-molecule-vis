import React, { useRef, useEffect } from 'react';
import { useAppContext } from '../AppContext';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import './AlertContainer.css'

function AlertContainer() {
      const { alerts, removeAlert } = useAppContext();
      const alertTimers = useRef({});
      
      const maxAlerts = 4;
      const alertDuration = 10000;

      useEffect(() => {
            if (alerts.length > maxAlerts) {
                  const extraAlerts = alerts.length - maxAlerts;
                  alerts.slice(0, extraAlerts).forEach(alert => removeAlert(alert.id));
            }

            alerts.forEach(alert => {
                  if (!alertTimers.current[alert.id]) {
                        alertTimers.current[alert.id] = setTimeout(() => {
                              removeAlert(alert.id);
                              delete alertTimers.current[alert.id];
                        }, alertDuration);
                  }
            });

            return () => {
                  const currentAlertIds = new Set(alerts.map(alert => alert.id));
                  Object.keys(alertTimers.current).forEach(timerKey => {
                        if (!currentAlertIds.has(parseInt(timerKey, 10))) {
                              clearTimeout(alertTimers.current[timerKey]);
                              delete alertTimers.current[timerKey];
                        }
                  });
            }
      }, [alerts, removeAlert]);

      return (
            <Stack className='alert-container' spacing={2}>
                  {alerts.slice(-maxAlerts).map((alert) => (
                        <Alert className='alert' key={alert.id} severity={alert.severity} onClose={() => removeAlert(alert.id)}>
                              {alert.message}
                        </Alert>
                  ))}
            </Stack>
      );
}

export default AlertContainer;
