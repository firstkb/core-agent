import React, { FC, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, IconButton, Typography, Menu, MenuItem, Avatar, Badge, Divider, Box, Stack } from '@mui/material';
import { Menu as MenuIcon, Wifi as WifiIcon, WifiOff as WifiOffIcon, Person as PersonIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { OnlineStatusContext } from '../../contexts/OnlineStatusContext';
import { AuthContext } from '../../contexts/AuthContext';
import { useDatabase } from '../../hooks/useDatabase';
import { User } from '../../db/UserRepo';


const StyledBadge = styled(Badge)(({ theme }) => ({
    '& .MuiBadge-badge': {
        backgroundColor: '#44b700',
        color: '#44b700',
        boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
        '&::after': {
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            animation: 'ripple 1.2s infinite ease-in-out',
            border: '1px solid currentColor',
            content: '""',
        },
    },
    '@keyframes ripple': {
        '0%': {
            transform: 'scale(.8)',
            opacity: 1,
        },
        '100%': {
            transform: 'scale(2.4)',
            opacity: 0,
        },
    },
}));

const CustomToolbar: FC<{ onDrawerOpen: () => void }> = ({ onDrawerOpen }) => {
    const isOnline = useContext(OnlineStatusContext);
    const auth = useContext(AuthContext);
    const db = useDatabase();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [logoSrc, setLogoSrc] = useState("/assets/logo-dark.svg");
    const [user, setUser] = useState<User | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    useEffect(() => {
        setLogoSrc(`/client/logo-dark.svg`);
    }, []);

    useEffect(() => {
        db?.userRepo.getUserData().then(setUser).catch(console.error);
    }, [db]);

    const handleImageError = () => {
        setLogoSrc("/assets/logo-dark.svg");
    };

    const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleSignOut = () => {
        auth?.signOut();
        handleClose();
    };

    const handleSetting = () => {
        navigate("/setting/");
        handleClose();
    }

    /*const handleNavigateClick = (path: string) => {
        navigate(path);
    };*/
    //onClick={() => handleNavigateClick('/')} sx={{ cursor: 'pointer' }}

    return (
        <AppBar position="fixed" className="app-bar">
            <Toolbar>
                <IconButton size="large" edge="start" color="inherit" aria-label="menu" onClick={onDrawerOpen}>
                    <MenuIcon />
                </IconButton>
                <Box sx={{ flexGrow: 1 }}>
                    <Box component="img" src={logoSrc} onError={handleImageError} alt="Logo" className='toolbar-logo' />
                </Box>
                <IconButton color="inherit">
                    {isOnline ? <WifiIcon /> : <WifiOffIcon />}
                </IconButton>
                <IconButton edge="end" onClick={handleMenu} color="inherit">
                    <PersonIcon />
                </IconButton>
                <Menu
                    id="menu-appbar"
                    anchorEl={anchorEl}
                    anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right',
                    }}
                    open={open}
                    onClose={handleClose}
                >
                    <MenuItem sx={{ '&:hover': { backgroundColor: 'transparent' }, cursor: 'default' }}>
                        <StyledBadge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} variant="dot">
                            <Avatar>{user ? user.firstName[0] : "?"}</Avatar>
                        </StyledBadge>
                        <Stack direction="column" spacing={0.5} sx={{ ml: 1 }}>
                            <Typography variant="body2">{user ? user.email : "Loading..."}</Typography>
                            {user && user.title !== '' && (
                                <Typography variant="body2">{user.title}</Typography>
                            )}
                        </Stack>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleSetting}>Settings</MenuItem>
                    <Divider />
                    <MenuItem onClick={handleSignOut}>{t("general.signOut")}</MenuItem>
                </Menu>
            </Toolbar>
        </AppBar>
    );
};

export default CustomToolbar;
