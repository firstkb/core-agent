import { FC, ChangeEvent } from 'react';
import { FormControl, InputLabel, OutlinedInput, InputAdornment } from '@mui/material';
import { WidgetProps } from '@rjsf/utils';
import { toLocalISOString } from '../../utils/dateUtils';

export const DateNow: FC<WidgetProps> = ({ value, label, uiSchema, schema, Id, onChange }) => {
    const today = toLocalISOString();
    const isReadOnly = uiSchema && uiSchema['ui:readonly'];
    let effectiveValue = value || "";


    // Set default value to today's date if the schema default is 'now'
    if (schema.default === 'now' && (!value || value === "")) {
        effectiveValue = today;
    } else if (value) {
        effectiveValue = value.split('T')[0];
    }

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const inputValue = event.target.value;

        const date = new Date(inputValue);
        //const formattedDate = date.toISOString(); // Conver to ISO 8601 с T и Z
        const formattedDate = date.toISOString().slice(0, 19);

        onChange(formattedDate);
    };

    return (
        <FormControl fullWidth>
            <InputLabel htmlFor={Id}>{label || ""}</InputLabel>
            <OutlinedInput
                id={Id}
                name={Id}
                type="date"
                label={label || ""}
                value={effectiveValue}
                onChange={handleChange}
                disabled={isReadOnly}
                startAdornment={<InputAdornment position="start"> </InputAdornment>}
            />
        </FormControl>
    );
};
