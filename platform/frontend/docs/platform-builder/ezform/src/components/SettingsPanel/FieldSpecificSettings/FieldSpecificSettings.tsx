import React from 'react';
import { Field } from '../../../context/FormContext';
import TextSettings from './TextSettings';
import SelectSettings from './SelectSettings';
import OptionsSettings from './OptionsSettings';
import { Chip, Divider } from '@mui/material';

interface Props {
    field: Field;
}

const FieldSpecificSettings: React.FC<Props> = ({ field }) => {
    const renderDynamicControl = (fieldKey: string, setting: any) => {
        switch (setting.type) { // Используем setting.type вместо field.type
            case 'text':
                return <TextSettings key={fieldKey} field={field} fieldKey={fieldKey} setting={setting} />;
            case 'select':
            case 'combobox':
                return <SelectSettings key={fieldKey} field={field} fieldKey={fieldKey} setting={setting} />;
            case 'options':
                return <OptionsSettings key={fieldKey} field={field} fieldKey={fieldKey} setting={setting} />;
            default:
                return null;
        }
    };

    if (field.settings && Object.keys(field.settings).length > 0) {
        return (
            <>
                <Divider textAlign="center" sx={{ marginY: 2 }}><Chip label="SETTINGS" size="small" /></Divider>
                {Object.entries(field.settings).map(([fieldKey, setting]) =>
                    renderDynamicControl(fieldKey, setting)
                )}
            </>
        );
    } else {
        return null;
    }
};

export default FieldSpecificSettings;