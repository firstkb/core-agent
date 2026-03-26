import React from 'react';
import { Box } from '@mui/material';
import FieldList from './FieldList/FieldList';
import FormBuilder from './FormBuilder/FormBuilder';
import '../index.css'
import SettingsPanel from './SettingsPanel/SettingsPanel';
import { useFormContext } from '../hook/useFormContext';
import { DndContext } from '@dnd-kit/core';

const Builder: React.FC = () => {
    const { addField } = useFormContext();

    const handleDrop = (event: any) => {
        const { active, over } = event;
        if (over && over.id === 'form-canvas') {
            addField(active.id);
        }
    };

    return (
        <DndContext onDragEnd={handleDrop}>
            <Box sx={{ display: 'flex', flexGrow: 1 }}>
                <FieldList />
                <FormBuilder />
                <SettingsPanel />
            </Box>
        </DndContext>
    );
};

export default Builder;