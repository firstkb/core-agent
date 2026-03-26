import React from 'react';
import { TextField, MenuItem } from '@mui/material';
import { Field } from '../../../context/FormContext';
import { useFormContext } from '../../../hook/useFormContext';

interface Props {
    field: Field;
    setting: any;
    fieldKey: string;
}

const SelectSettings: React.FC<Props> = ({ field, setting, fieldKey }) => {
    const { updateField } = useFormContext();

    const handleSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        updateField(field.id, {
            settings: {
                ...field.settings,
                [name]: {
                    ...field.settings?.[name],
                    default: value,
                },
            },
        });
    };

    return (
        <TextField
            select
            label={setting.title || fieldKey}
            name={fieldKey}
            key={fieldKey}
            value={setting.default || ''}
            onChange={handleSettingChange}
            fullWidth
            margin="normal"
        >
            {setting.options?.map((option: any) => (
                <MenuItem key={option} value={option}>
                    {option}
                </MenuItem>
            ))}
        </TextField>
    );
};

export default SelectSettings;