import React from 'react';
import { Box } from '@mui/material';
import FormCanvas from './FormCanvas';

const FormBuilder: React.FC = () => {
    return (
        <Box
            sx={{
                flexGrow: 1,
                overflowY: 'auto',
                maxHeight: 'calc(100vh - 64px)',
                padding: 2,
                background: '#F9FAFB',
            }}
        >
            <FormCanvas />
        </Box>
    );
};

export default FormBuilder;