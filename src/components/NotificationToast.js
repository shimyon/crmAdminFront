import React from 'react';
import { Snackbar, Alert, AlertTitle } from '@mui/material';
import { CheckCircle, Error, Info, Warning } from '@mui/icons-material';

const NotificationToast = ({ open, message, type = 'info', title, onClose, autoHideDuration = 6000 }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle />;
      case 'error':
        return <Error />;
      case 'warning':
        return <Warning />;
      default:
        return <Info />;
    }
  };

  const getSeverity = () => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity={getSeverity()}
        icon={getIcon()}
        variant="filled"
        sx={{ width: '100%' }}
      >
        {title && <AlertTitle>{title}</AlertTitle>}
        {message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationToast; 