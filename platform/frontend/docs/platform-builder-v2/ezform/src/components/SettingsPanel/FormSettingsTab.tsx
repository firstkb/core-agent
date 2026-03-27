import React from 'react';
import { Box, TextField } from '@mui/material';
import { useFormContext } from '../../hook/useFormContext';

const FormSettingsTab: React.FC = () => {
    const { formSettings, updateFormSettings } = useFormContext();

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateFormSettings({ [e.target.name]: e.target.value });
    };

    return (
        <Box>
            <TextField
                label="Form Title"
                name="formTitle"
                value={formSettings.formTitle || ''}
                onChange={handleFormChange}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Form Description"
                name="formDescription"
                value={formSettings.formDescription || ''}
                onChange={handleFormChange}
                fullWidth
                multiline
                rows={3}
                margin="normal"
            />
            {/* Добавьте другие настройки формы по мере необходимости */}
        </Box>
    );
};

export default FormSettingsTab;