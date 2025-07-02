import React from 'react';
import { Box, CircularProgress } from '@mui/material';

const Loader = () => (
  <Box sx={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    bgcolor: 'rgba(255,255,255,0.5)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <CircularProgress size={60} thickness={5} />
  </Box>
);

export default Loader; 