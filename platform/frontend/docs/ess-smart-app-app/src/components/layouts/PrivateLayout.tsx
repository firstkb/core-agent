import { FC, useState } from "react";
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import Toolbar from './ToolbarComponent';
import DrawerComponent from './DrawerComponent';
import Dashboard from '../../pages/Dashboard';
import TablePage from '../../pages/Table';
import Edit from '../../pages/Edit'
import { ClientConfigProvider } from '../../providers/ClientConfigProvider';
import { SyncServiceProvider } from '../../providers/SyncServiceProvider';
import TableSync from '../../pages/TableSync'
import SettingPage from '../../pages/Setting'
import TutorialPage from '../../pages/Tutorial';


const PrivateLayout: FC = () => {

    const [isDrawerOpen, setDrawerOpen] = useState(false);

    const handleDrawerOpen = () => {
        setDrawerOpen(true);
    };

    const handleDrawerClose = () => {
        setDrawerOpen(false);
    };

    return (
        <ClientConfigProvider>
            <SyncServiceProvider>
                <Toolbar onDrawerOpen={handleDrawerOpen} />
                <DrawerComponent isOpen={isDrawerOpen} onClose={handleDrawerClose} />
                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        pt: 1,
                        pb: 4,
                        marginTop: '55px', //calc(55px + env(safe-area-inset-top, 0px))
                        height: 'calc(100vh - 55px - env(safe-area-inset-bottom, 0px))',
                        overflow: 'auto',
                    }}
                >
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/page/:pageId/" element={<TablePage />} />
                        <Route path="/edit/:pageId/:formId/" element={<Edit />} />
                        <Route path="/sync/" element={<TableSync />} />
                        <Route path="/setting/" element={<SettingPage />} />
                        <Route path="/tutorial/" element={<TutorialPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Box>
            </SyncServiceProvider>
        </ClientConfigProvider>
    );
};

export default PrivateLayout;
