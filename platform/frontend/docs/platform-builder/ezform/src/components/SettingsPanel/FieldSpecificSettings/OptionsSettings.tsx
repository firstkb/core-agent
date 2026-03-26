import React, { useState, useEffect } from 'react';
import { Box, TextField, Button } from '@mui/material';
import { Field } from '../../../context/FormContext';
import { useFormContext } from '../../../hook/useFormContext';

interface Props {
    field: Field;
    setting: any;
    fieldKey: string;
}

const OptionSettings: React.FC<Props> = ({ field, setting, fieldKey }) => {
    const { updateField } = useFormContext();
    const [options, setOptions] = useState<string[]>([]);

    useEffect(() => {
        if (setting.default && Array.isArray(setting.default)) {
            setOptions(setting.default as string[]);
        }
    }, [setting]);

    const handleOptionChange = (index: number, value: string) => {
        const updatedOptions = [...options];
        updatedOptions[index] = value;
        setOptions(updatedOptions);
        updateField(field.id, {
            settings: {
                ...field.settings,
                options: {
                    ...field.settings?.options,
                    default: updatedOptions,
                },
            },
        });
    };

    const handleAddOption = () => {
        setOptions([...options, '']);
    };

    const handleRemoveOption = (index: number) => {
        const updatedOptions = options.filter((_, i) => i !== index);
        setOptions(updatedOptions);
        updateField(field.id, {
            settings: {
                ...field.settings,
                options: {
                    ...field.settings?.options,
                    default: updatedOptions,
                },
            },
        });
    };

    return (
        <Box>
            <p style={{ fontWeight: 600 }}>{setting.title || fieldKey}</p>
            {options.map((option, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
                    <TextField
                        value={option}
                        key={fieldKey}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        fullWidth
                        size='small'
                        margin="normal"
                        sx={{ margin: '3px', padding: 0 }}
                    />
                    <Button onClick={() => handleRemoveOption(index)} color='error'>X</Button>
                </Box>
            ))}
            <Button onClick={handleAddOption} sx={{ marginTop: 1 }}>Add Option</Button>
        </Box>
    );
};

export default OptionSettings;