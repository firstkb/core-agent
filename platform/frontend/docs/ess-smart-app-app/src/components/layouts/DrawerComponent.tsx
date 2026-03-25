import { FC, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal, Card, CardHeader, CardContent, CardActions, TextField, MenuItem, Alert, ListItemIcon, Avatar, Snackbar, ListSubheader } from '@mui/material';
import { ExpandLess, ExpandMore, Dashboard, Article, Sync, Support as SupportIcon } from '@mui/icons-material';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import IconButton from '@mui/material/IconButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ListItemButton from '@mui/material/ListItemButton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import { Close as CloseIcon } from '@mui/icons-material';
import { useClientConfig } from '../../hooks/useClientConfig';
import { OnlineStatusContext } from "../../contexts/OnlineStatusContext";
import { useNavigate } from 'react-router-dom';
import { useDatabase } from '../../hooks/useDatabase';
import { v4 as uuidv4 } from 'uuid';
import { Support } from '../../db/SupportRepo';
import Logger from '../../logger/Logger';
import { buildModules, IShareLink, IMenuItem } from '../../utils/buildModules'; //IMenuItem
import { SvgIcon, SvgIconProps } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/QuestionMark';

const CircleIcon = (props: SvgIconProps) => (
    <SvgIcon {...props} viewBox="0 0 14 14">
        <path fillRule="evenodd" clipRule="evenodd" d="M7 13C10.3137 13 13 10.3137 13 7C13 3.68629 10.3137 1 7 1C3.68629 1 1 3.68629 1 7C1 10.3137 3.68629 13 7 13ZM7 14C10.866 14 14 10.866 14 7C14 3.13401 10.866 0 7 0C3.13401 0 0 3.13401 0 7C0 10.866 3.13401 14 7 14Z" fill="#111217" />
        <path className='btn-svg-point' d="M9 7C9 8.10457 8.10457 9 7 9C5.89543 9 5 8.10457 5 7C5 5.89543 5.89543 5 7 5C8.10457 5 9 5.89543 9 7Z" fill="#464852" />
    </SvgIcon>
);

const SECTION_GENERAL = 'General' as const;
const SECTION_EZ_OFFLINE = 'EzForm (offline)' as const;
const SECTION_EZ_ONLINE = 'EzForm' as const;

type SectionKey = typeof SECTION_GENERAL | typeof SECTION_EZ_OFFLINE | typeof SECTION_EZ_ONLINE;

function resolveSection(items: IMenuItem[]): SectionKey {
    if (items.some(i => i.type === 'scheme')) return SECTION_EZ_OFFLINE;
    if (items.some(i => i.type === 'share')) return SECTION_EZ_ONLINE;
    return SECTION_GENERAL;                         // всё остальное — static
}

const DrawerComponent: FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const isOnline = useContext(OnlineStatusContext);
    const { t } = useTranslation();
    const db = useDatabase();
    const navigate = useNavigate();
    const { schemes } = useClientConfig();
    const [env, setEnv] = useState<string | null>(null);
    //const [openForms, setOpenForms] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [requestType, setRequestType] = useState('Error');
    const [requestPriority, setRequestPriority] = useState('Low');
    const [description, setDescription] = useState('');
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [descriptionError, setDescriptionError] = useState(false);
    //const [linkToShare, setLinkToShare] = useState('');
    const [shareLinks, setShareLinks] = useState<IShareLink[]>([]);
    const [showOfflineAlert, setShowOfflineAlert] = useState(false);
    const [openModule, setOpenModule] = useState<string | null>(null);

    const modules = useMemo(
        () => buildModules(schemes, shareLinks),
        [schemes, shareLinks],
    );

    type ModuleTuple = [string, IMenuItem[]];

    const sectioned = useMemo<Record<SectionKey, ModuleTuple[]>>(() => {
        const map: Record<SectionKey, ModuleTuple[]> = {
            [SECTION_GENERAL]: [],
            [SECTION_EZ_OFFLINE]: [],
            [SECTION_EZ_ONLINE]: [],
        };

        modules.forEach(([module, items]) => {
            map[resolveSection(items)].push([module, items]);
        });

        return map;
    }, [modules]);

    const sectionKeys: SectionKey[] = [
        SECTION_GENERAL,
        SECTION_EZ_OFFLINE,
        SECTION_EZ_ONLINE,
    ];

    useEffect(() => {
        const storedEnv = __APP_ENV__;
        setEnv(storedEnv ? storedEnv.toLowerCase() : null);
        const token = localStorage.getItem("aspKey") || null;
        const aspLink = localStorage.getItem("aspUrl") || null;
        const clientId = localStorage.getItem("clientId") || null;
        const shareLinksStr = localStorage.getItem("share_links") || null;

        if (token !== null && aspLink !== null && clientId !== null && shareLinksStr !== null) {
            //setLinkToShare(`${aspLink}/App/go-share/?t=${token}`);

            try {
                const parsed = JSON.parse(shareLinksStr);

                if (Array.isArray(parsed)) {
                    const allValid = parsed.every((item) => {
                        if (!item || typeof item !== 'object') return false;
                        if (typeof item.label !== 'string') return false;
                        if (typeof item.param !== 'string') return false;
                        if (item.icon && typeof item.icon !== 'string') return false;
                        return true;
                    });

                    if (allValid) {
                        setShareLinks(parsed);
                    } else {
                        Logger.debug("shareLinks is not an array of IShareLink objects");
                        setShareLinks([]);
                    }
                } else {
                    Logger.debug("shareLinks is not an array:", shareLinksStr);
                    setShareLinks([]);
                }
            } catch (error) {
                Logger.debug("Failed to parse shareLinks:", error);
                setShareLinks([]);
            }
        }
    }, []);

    const handleMenuItemClick = (path: string) => {
        navigate(path);
        onClose();
    };

    /*const handleToggleForms = () => {
        setOpenForms(!openForms);
    };*/

    const handleOpenModal = () => {
        onClose();
        setDescription('');
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
    };

    const handleSubmit = () => {
        if (description.trim() === '') {
            setDescriptionError(true);
            return;
        }
        setShowSuccessAlert(true);

        const guid = uuidv4().toUpperCase();
        const support: Support = {
            guid: guid,
            type: requestType,
            priority: requestPriority,
            description: description,
            version: __APP_VERSION__,
        };
        db?.supportRepo.add(guid, support);

        setTimeout(() => {
            setShowSuccessAlert(false);
            handleCloseModal();
        }, 2000);
    };

    const checkOnlineOrAlert = (event?: React.MouseEvent<HTMLElement>) => {
        if (!isOnline) {
            if (event) {
                event.preventDefault();
            }
            setShowOfflineAlert(true);
            return false;
        }
        return true;
    };

    const handleCloseOfflineAlert = () => {
        setShowOfflineAlert(false);
    };


    return (
        <>
            <Drawer open={isOpen} onClose={onClose}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 2, width: '100%' }}>
                    <Typography variant="h6" sx={{ width: '100%' }}>{t("general.menu")}</Typography>
                    <IconButton sx={{ width: '20%', cursor: 'pointer' }} onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
                <List component="nav" sx={{ width: '250px' }}>
                    <ListItemButton onClick={() => handleMenuItemClick('/')}>
                        <ListItemIcon sx={{ minWidth: "35px" }}>
                            <Dashboard />
                        </ListItemIcon>
                        <ListItemText primary={t("general.dashboard")} />
                    </ListItemButton>
                    { /*<ListItemButton onClick={handleToggleForms}>
                        <ListItemIcon sx={{ minWidth: "35px" }}>
                            <Article />
                        </ListItemIcon>
                        <ListItemText primary={`Offline`} />
                        {openForms ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                    <Collapse in={openForms} timeout="auto" unmountOnExit>
                        <List component="div" sx={{ marginLeft: "0px" }} disablePadding>
                            {(schemes && typeof schemes === 'object' ? Object.values(schemes) : []).map((scheme: Scheme) => (
                                scheme.info.active === "true" ? (
                                    <ListItemButton key={scheme.info.id} sx={{ pl: 4 }} onClick={() => handleMenuItemClick(`/page/${scheme.info.id}`)}>
                                        <Avatar
                                            src={`${scheme.info.icon}`}
                                            sx={{ width: 24, height: 24, marginRight: 2 }}
                                        />
                                        <ListItemText primary={scheme.info.title} />
                                    </ListItemButton>
                                ) : null
                            ))}
                        </List>
                    </Collapse> */ }
                    {sectionKeys.map(sec =>
                        sectioned[sec].length ? (
                            <Box key={sec}>

                                <ListSubheader disableSticky sx={{ pl: 0, pb: 0, lineHeight: '30px', color: 'text.secondary', borderBottom: '1px solid', borderBottomColor: '#DDD', margin: '15px 20px' }}>
                                    {sec}
                                </ListSubheader>

                                {sectioned[sec].map(([module, items]) => (
                                    <Box key={module}>
                                        <ListItemButton onClick={() => setOpenModule(prev => (prev === module ? null : module))}>
                                            <ListItemIcon sx={{ minWidth: 35 }}><Article /></ListItemIcon>
                                            <ListItemText primary={module} />
                                            {openModule === module ? <ExpandLess /> : <ExpandMore />}
                                        </ListItemButton>

                                        <Collapse in={openModule === module} unmountOnExit>
                                            <List component="div" disablePadding sx={{ ml: 0 }}>
                                                {items.map((it: IMenuItem) =>
                                                    it.type === 'scheme' ? (
                                                        <ListItemButton
                                                            key={it.url}
                                                            className="btn-svg"
                                                            onClick={() => handleMenuItemClick(it.url)}
                                                        >
                                                            <Avatar sx={{ ml: 2, width: 14, height: 14, mr: 1, bgcolor: 'transparent' }}>
                                                                <CircleIcon sx={{ width: 14, height: 14 }} />
                                                            </Avatar>
                                                            <ListItemText primary={it.label} />
                                                        </ListItemButton>
                                                    ) : (
                                                        <ListItemButton
                                                            key={it.url}
                                                            className="btn-svg"
                                                            component="a"
                                                            href={it.url}
                                                            sx={{ opacity: it.needsOnline && !isOnline ? 0.4 : 1 }}
                                                            onClick={e => {
                                                                if (it.needsOnline && !checkOnlineOrAlert(e)) e.preventDefault();
                                                            }}
                                                        >
                                                            <Avatar sx={{ ml: 2, width: 14, height: 14, mr: 1, bgcolor: 'transparent' }}>
                                                                <CircleIcon sx={{ width: 14, height: 14 }} />
                                                            </Avatar>
                                                            <ListItemText primary={it.label} />
                                                        </ListItemButton>
                                                    )
                                                )}
                                            </List>
                                        </Collapse>
                                    </Box>
                                ))}

                            </Box>
                        ) : null
                    )}
                    <ListSubheader disableSticky sx={{ pl: 0, pb: 0, lineHeight: '30px', color: 'text.secondary', borderBottom: '1px solid', borderBottomColor: '#DDD', margin: '15px 20px' }}>
                        Help
                    </ListSubheader>
                    <ListItemButton onClick={() => handleOpenModal()}>
                        <ListItemIcon sx={{ minWidth: "35px" }}>
                            <SupportIcon />
                        </ListItemIcon>
                        <ListItemText primary={t("general.request")} />
                    </ListItemButton>
                    <ListItemButton onClick={() => handleMenuItemClick('/sync/')}>
                        <ListItemIcon sx={{ minWidth: "35px" }}>
                            <Sync />
                        </ListItemIcon>
                        <ListItemText primary={t("general.sync_table")} />
                    </ListItemButton>
                    <ListItemButton onClick={() => handleMenuItemClick('/tutorial/')}>
                        <ListItemIcon sx={{ minWidth: "35px" }}>
                            <HelpOutlineIcon />
                        </ListItemIcon>
                        <ListItemText primary="Tutorials" />
                    </ListItemButton>
                </List >
                <Box sx={{ p: 2, mt: 'auto', pb: 3 }}>
                    <Typography variant="caption">{t("general.version")}: {__APP_VERSION__} {env}</Typography>
                </Box>
            </Drawer >
            <Modal
                open={modalOpen}
                onClose={handleCloseModal}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
                <Card sx={{ maxWidth: 500, width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <CardHeader title="Contact Support" />
                    <CardContent sx={{ flexGrow: 1 }}>
                        {showSuccessAlert ? (
                            <Alert severity="success">
                                {isOnline ? "Your request has been sent." : "Your request will be sent when the connection is restored."}
                            </Alert>
                        ) : (
                            <Box component="form" noValidate>
                                <TextField
                                    select
                                    label="Request Type"
                                    value={requestType}
                                    onChange={(e) => setRequestType(e.target.value)}
                                    fullWidth
                                    required
                                    margin="normal"
                                >
                                    <MenuItem value="Error">Error</MenuItem>
                                    <MenuItem value="Request">Request</MenuItem>
                                    <MenuItem value="New Development">New Development</MenuItem>
                                </TextField>
                                <TextField
                                    select
                                    label="Request Priority"
                                    value={requestPriority}
                                    onChange={(e) => setRequestPriority(e.target.value)}
                                    fullWidth
                                    required
                                    margin="normal"
                                >
                                    <MenuItem value="Low">Low</MenuItem>
                                    <MenuItem value="Medium">Medium</MenuItem>
                                    <MenuItem value="High">High</MenuItem>
                                    <MenuItem value="Critical">Critical</MenuItem>
                                </TextField>
                                <TextField
                                    label="Description"
                                    value={description}
                                    onChange={(e) => {
                                        setDescription(e.target.value);
                                        if (e.target.value.trim() !== '') setDescriptionError(false);
                                    }}
                                    fullWidth
                                    required
                                    multiline
                                    rows={4}
                                    margin="normal"
                                    error={descriptionError}
                                    helperText={descriptionError ? "Description is required." : ""}
                                />
                            </Box>
                        )}
                    </CardContent>
                    {!showSuccessAlert && (
                        <CardActions sx={{ justifyContent: 'space-between' }}>
                            <Button variant="contained" onClick={handleCloseModal} color="secondary">
                                Cancel
                            </Button>
                            <Button variant="contained" onClick={handleSubmit} color="primary">
                                Submit
                            </Button>
                        </CardActions>
                    )}
                </Card>
            </Modal>
            <Snackbar
                open={showOfflineAlert}
                autoHideDuration={3000}
                onClose={handleCloseOfflineAlert}
            >
                <Alert
                    onClose={handleCloseOfflineAlert}
                    severity="warning"
                    variant="filled"
                    sx={{ color: '#FFF' }}
                >
                    No Internet connection. Please connect to the internet first.
                </Alert>
            </Snackbar>
        </>
    );
};

export default DrawerComponent;
