// FormField.tsx
import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useFormContext } from '../../hook/useFormContext';
import { Field } from '../../context/FormContext';

const FormField: React.FC<{ field: Field }> = ({ field }) => {
    const { selectField, selectParent, selectedField } = useFormContext();
    const isContainer = field.isContainer || (field.children && field.children.length > 0);

    const handleClick = () => {
        if (isContainer) {
            selectParent(field.id);
            selectField(field.id);
        } else {
            selectField(field.id);
        }
    };

    useEffect(() => {
        //console.log("FormField", selectedField);
    }, [selectedField])


    const normalStyle = {
        borderLeft: field.required ? '2px solid red' : (selectedField?.id === field.id ? '2px solid #1664C0' : '2px solid #ccc'),
        borderRadius: 0,
        padding: 4,
        marginBottom: 1,
        cursor: 'pointer',
        backgroundColor: selectedField?.id === field.id ? '#eef3f7' : '#F9FAFB',
    };

    return (
        <Box style={normalStyle} onClick={handleClick}>
            {isContainer ? (
                <>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {field.title || `Sub Form ${field.label}`}
                        {field.required ? <span style={{ color: 'red' }}>*</span> : ''}
                    </Typography>
                </>
            ) : (
                <Typography variant="body1">
                    {field.title || `Field ${field.label}`}
                    {field.required ? <span style={{ color: 'red' }}>*</span> : ''}: {field.default || ""}
                    <span style={{ float: 'right', color: 'gray', fontStyle: 'italic' }}>
                        {field.label}
                    </span>
                </Typography>
            )}
        </Box>
    );
};

export default FormField;