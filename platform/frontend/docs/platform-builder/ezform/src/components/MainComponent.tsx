// MainComponent.tsx
import React from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import FieldList from './FieldList/FieldList';
import FormBuilder from './FormBuilder/FormBuilder';
import '../index.css';
import SettingsPanel from './SettingsPanel/SettingsPanel';
import { FieldType, FormProvider } from '../context/FormContext';
import { useFormContext } from '../hook/useFormContext'
import { DndContext } from '@dnd-kit/core';

interface MainComponentProps {
    addFieldTypes?: FieldType[];
    scheme?: string;
    schemeUI?: string;
    onSubmit?: (dataSchema: any, uiSchema: any) => void;
}

const MainComponent: React.FC<MainComponentProps> = ({ addFieldTypes = [], scheme = "", schemeUI = "", onSubmit }) => {
    return (
        <FormProvider
            addFieldTypes={addFieldTypes}
            scheme={scheme}
            schemeUI={schemeUI}
        >
            <Box sx={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
                <Header onSubmit={onSubmit} />
                <DndContextProvider />
            </Box>
        </FormProvider>
    );
};

const DndContextProvider: React.FC = () => {
    const { addField } = useFormContext();

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        if (over && over.id === 'form-canvas') {
            addField(active.id);
        }
    };

    return (
        <DndContext
            onDragEnd={handleDragEnd}
        >
            <Box sx={{ display: 'flex', flexGrow: 1 }}>
                <FieldList />
                <FormBuilder />
                <SettingsPanel />
            </Box>
        </DndContext>
    );
};

export default MainComponent;