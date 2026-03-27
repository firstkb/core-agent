import React, { useEffect, useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import FieldSettingsTab from './FieldSettingsTab';
import FormSettingsTab from './FormSettingsTab';
import GridSettingsTab from './GridSettingsTab';
import { useFormContext } from '../../hook/useFormContext';

const SettingsPanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState(0);
    const { selectedFieldId, selectedParentId } = useFormContext();

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    useEffect(() => {
        setActiveTab(0);
    }, [selectedFieldId])

    const FieldLable = (selectedFieldId && selectedParentId && selectedFieldId === selectedParentId) ? "Container" : "Field";

    return (
        <Box sx={{ minWidth: 300, width: '20%', borderLeft: '1px solid #ccc', overflowY: 'auto' }}>
            <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
            >
                <Tab label={FieldLable} />
                <Tab label="Form" />
                <Tab label="Grid" />
                <Tab label="Action" />
            </Tabs>
            <Box sx={{ p: 2, background: '#F9FAFB' }}>
                {activeTab === 0 && <FieldSettingsTab />}
                {activeTab === 1 && <FormSettingsTab />}
                {activeTab === 2 && <GridSettingsTab />}
            </Box>
        </Box>
    );
};

export default SettingsPanel;