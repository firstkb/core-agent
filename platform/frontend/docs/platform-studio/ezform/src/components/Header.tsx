import React from 'react';
import { Box, Button } from '@mui/material';
import { useFormContext } from '../hook/useFormContext';

interface HeaderProps {
    onSubmit?: (dataSchema: any, uiSchema: any) => void;
}

const Header: React.FC<HeaderProps> = ({ onSubmit }) => {
    const { getSchemas } = useFormContext();

    const handleSave = () => {
        const { dataSchema, uiSchema } = getSchemas();
        if (onSubmit) {
            onSubmit(dataSchema, uiSchema);
        }
    };

    return (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 2, borderBottom: '1px solid #ccc', height: '64px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box component="img" src="/assets/ezform.svg" alt="Logo" className='toolbar-logo' />
            </Box>
            <Button color='primary' type="button" variant="contained" size='small' onClick={handleSave} sx={{ fontSize: '0.75em', minWidth: '60px', fontWeight: '600', maxHeight: '37px' }}>
                Save
            </Button>
        </Box>
    );
};

export default Header;