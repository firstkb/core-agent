import React from 'react';
import { TextField } from '@mui/material';
import { Field } from '../../../context/FormContext';
import { useFormContext } from '../../../hook/useFormContext';

interface Props {
    field: Field;
    setting: any;
    fieldKey: string;
}

const TextSettings: React.FC<Props> = ({ field, setting, fieldKey }) => {
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
        <>
            <TextField
                label={setting.title || fieldKey}
                value={setting.default || ''}
                name={fieldKey}
                key={fieldKey}
                onChange={handleSettingChange}
                fullWidth
                margin="normal"
            />
        </>
    );
};

export default TextSettings;