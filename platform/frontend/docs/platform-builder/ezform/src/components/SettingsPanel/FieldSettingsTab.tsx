import React from 'react';
import { Box, TextField, FormControlLabel, Checkbox, Button, Divider, Chip, MenuItem } from '@mui/material';
import { useFormContext } from '../../hook/useFormContext';
import FieldSpecificSettings from './FieldSpecificSettings/FieldSpecificSettings';

const FieldSettingsTab: React.FC = () => {
    const { selectedField, updateField, removeField } = useFormContext();
    const displayOptions = ['Default', 'Read Only', 'Hidden'];

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedField) {
            updateField(selectedField.id, { [e.target.name]: e.target.value });
        }
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedField) {
            updateField(selectedField.id, { [e.target.name]: e.target.checked });
        }
    };

    const handleRemoveField = () => {
        if (window.confirm('Are you sure you want to remove this field?')) {
            removeField(selectedField?.id || '');
        }
    };

    if (!selectedField) {
        return (
            <Box>
                <p>Choose a field to configure</p>
            </Box>
        );
    }

    return (
        <Box>
            <Divider textAlign="center"><Chip label="GENERAL" size="small" /></Divider>
            <TextField
                label="Title"
                name="title"
                value={selectedField.title || ''}
                onChange={handleFieldChange}
                fullWidth
                margin="normal"
            />
            <TextField
                label="Default"
                name="default"
                value={selectedField.default || ''}
                onChange={handleFieldChange}
                fullWidth
                margin="normal"
            />
            <TextField
                select
                label="Display"
                name="display"
                value={selectedField.display || ''}
                onChange={handleFieldChange}
                fullWidth
                margin="normal"
            >
                {displayOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                        {option}
                    </MenuItem>
                ))}
            </TextField>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={selectedField.required || false}
                        onChange={handleCheckboxChange}
                        name="required"
                    />
                }
                label="Required Field"
            />

            <FieldSpecificSettings field={selectedField} />

            <Divider sx={{ marginTop: 3, marginBottom: 3 }} />
            <Button
                onClick={handleRemoveField}
                color='error'
                sx={{ mb: 2, mt: 1 }}
                variant="contained"
            >
                Remove
            </Button>
        </Box>
    );
};

export default FieldSettingsTab;