import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AuthService from '../services/AuthService';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '@mui/material/styles';
import { Button, TextField, Switch, Link, Typography, Box, FormControlLabel, Grid } from '@mui/material';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { VideoLibrary as VideoLibraryIcon } from '@mui/icons-material'
import VideoModal from '../components/VideoModal';
import Logger from "../logger/Logger";
import { QRCodeSVG } from 'qrcode.react';

const QRCodeDisplay: React.FC = () => {
    const currentUrl = window.location.href;
    return <QRCodeSVG value={currentUrl} size={80} bgColor="transparent" fgColor='white' />;
};

type LoginBanner = {
    level: 'info' | 'warning' | 'error';
    message: string;
    from?: string;
    to?: string;
};

function Login() {
    const theme = useTheme();
    const mode = theme.palette.mode;
    const [codeSent, setCodeSent] = useState(false);
    const [textError, setTextError] = useState('');
    const [codeValue, setCodeValue] = useState('');
    const [methodValue, setMethodValue] = useState('email');
    const [inputValue, setInputValue] = useState(''); //akoien@esafetysystems.com
    const [isLoading, setIsLoading] = useState(false);
    const currentYear = new Date().getFullYear();
    const { saveToken } = useAuth();
    const { t } = useTranslation(); //i18n
    const isOnline = useOnlineStatus();
    const [logoSrc, setLogoSrc] = useState("/assets/logo-light.svg");
    const emailInputRef = useRef<HTMLInputElement>(null);
    const phoneInputRef = useRef<HTMLInputElement>(null);
    const clientId = localStorage.getItem('clientId');
    const [videoModalOpen, setVideoModalOpen] = useState(false);
    const env = __APP_ENV__?.toLowerCase();
    const isDev = env === 'dev';
    const [banner, setBanner] = useState<LoginBanner | null>(null);
    const aspUrl = localStorage.getItem('aspUrl');

    useEffect(() => {
        setLogoSrc(`/client/logo-${mode === 'dark' ? 'dark' : 'light'}.svg`);

    }, [mode]);

    useEffect(() => {
        if (methodValue === 'email' && emailInputRef.current) {
            emailInputRef.current.focus();
        } else if (methodValue === 'phone' && phoneInputRef.current) {
            phoneInputRef.current.focus();
        }
    }, [methodValue]);

    useEffect(() => {
        if (!isOnline) return;
        if (!aspUrl || !clientId) return;

        const controller = new AbortController();

        const base = aspUrl.replace(/\/+$/, '');
        const url = `${base}/smart/message/default.asp?clientId=${encodeURIComponent(
            clientId
        )}&ts=${Date.now()}`;

        fetch(url, {
            signal: controller.signal,
            cache: 'no-store',
        })
            .then(async (res) => {
                if (!res.ok) {
                    setBanner(null);
                    return;
                }
                const data: LoginBanner = await res.json();

                if (!data.message || data.message.trim() === '') {
                    setBanner(null);
                    return;
                }

                const now = new Date();
                if (data.from && new Date(data.from) > now) return;
                if (data.to && new Date(data.to) < now) return;

                setBanner(data);
            })
            .catch(() => {
                setBanner(null);
            });

        return () => controller.abort();
    }, [isOnline, aspUrl, clientId]);

    // Banner + modal state
    const [helpModalOpen, setHelpModalOpen] = useState(false);
    const [helpUrl, setHelpUrl] = useState<string | null>(null);

    const toBase64 = (s: string) => {
        return btoa(unescape(encodeURIComponent(s)));
    };

    // Format "M/D/YYYY h:mm:ss AM/PM"
    const formatServerTime = (d: Date) => {
        //const pad = (n: number) => n.toString();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const year = d.getFullYear();
        let hours = d.getHours();
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const seconds = d.getSeconds().toString().padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        if (hours === 0) hours = 12;
        return `${month}/${day}/${year} ${hours}:${minutes}:${seconds} ${ampm}`;
    };

    // Build ETS XML payload (then base64)
    const buildEtsData = (clientIdStr: string, method: 'email' | 'phone', value: string) => {
        const now = new Date();
        const site = window.location.hostname;
        const qEmail = method === 'email' ? encodeURIComponent(value) : '';
        const qPhone = method === 'phone' ? encodeURIComponent(value) : '';
        const query =
            method === 'email'
                ? `act=code&client=${clientIdStr}&method=email&email=${qEmail}`
                : `act=code&client=${clientIdStr}&method=phone&phone=${qPhone}`;

        const xml =
            `<data><systemid><![CDATA[${clientIdStr}]]></systemid><company><![CDATA[]]></company><company_phone><![CDATA[]]></company_phone><company_email><![CDATA[]]></company_email><module><![CDATA[SHARE]]></module><page><![CDATA[SHARE]]></page><action><![CDATA[]]></action><table><![CDATA[]]></table><query><![CDATA[${query}]]></query><url><![CDATA[/App/${clientIdStr}/Default.asp]]></url><site><![CDATA[${site}]]></site><servertime><![CDATA[${formatServerTime(now)}]]></servertime><time><![CDATA[0.000]]></time><users_id><![CDATA[]]></users_id><users_fname><![CDATA[]]></users_fname><users_lname><![CDATA[]]></users_lname><users_email><![CDATA[${method === 'email' ? value : ''}]]></users_email><users_phone><![CDATA[${method === 'phone' ? value : ''}]]></users_phone><users_admin><![CDATA[False]]></users_admin><users_etsadmin><![CDATA[False]]></users_etsadmin><users_company_id><![CDATA[]]></users_company_id><users_company_name><![CDATA[]]></users_company_name></data>`;
        return toBase64(xml);
    };

    // Open help modal with iframe URL
    const openTroubleModal = () => {
        if (!clientId) return;
        const ets = buildEtsData(clientId, methodValue as 'email' | 'phone', inputValue.trim());
        const url = `https://ramp.esafetysystems.com/Share/ETS.asp?app=smart&title=no&etsdata=${encodeURIComponent(ets)}`;
        setHelpUrl(url);
        setHelpModalOpen(true);
    };

    const handleImageError = () => {
        setLogoSrc(`/assets/logo-light.svg`);
    };

    const toggleMethod = (method: string) => {
        setMethodValue(method);
        setInputValue('');
    };

    const sendCode = async () => {
        if (!isOnline) {
            setTextError(t('general.offline'));
            return;
        }
        if (!clientId) {
            setTextError(t('login.error.emptyClientId'));
            return;
        }
        if (!inputValue.trim()) {
            setTextError(methodValue === 'email' ? t('login.error.emptyEmail') : t('login.error.emptyPhone'));
            return;
        }
        setIsLoading(true);
        setTextError('');
        Logger.debug('Code sent to:', inputValue);
        await AuthService.initiateAuth(
            methodValue,
            clientId,
            inputValue,
            (result) => {
                if ('challengeName' in result) {
                    Logger.debug('Challenge received:', result);
                } else {
                    Logger.debug('Code sent to:', inputValue);
                    setTextError('');
                    setCodeSent(true);
                    setIsLoading(false);
                }
            },
            (error) => {
                setTextError(t('login.error.authFailed') + ': ' + error.message);
                setIsLoading(false);
            }
        );
    };

    const verifyCode = async () => {
        if (!isOnline) {
            setTextError(t('general.offline'));
            return;
        }
        if (!codeValue.trim()) {
            setTextError(t('login.error.emptyCode'));
            return;
        }
        setIsLoading(true);
        setTextError('');
        Logger.debug('Code verified for:', inputValue);
        await AuthService.confirmAuth(
            codeValue,
            (result) => {
                setTextError('');
                setCodeSent(false);
                setIsLoading(false);
                setCodeValue('');
                setInputValue('');
                saveToken(result.getAccessToken().getJwtToken(), result.getIdToken().getJwtToken(), result.getRefreshToken().getToken());
            },
            () => {
                setTextError(`${t('login.error.varifyFailed')}: ${t('login.error.codeNotCorrect')}`); // + error.message
                setCodeSent(false);
                setIsLoading(false);
                setCodeValue('');
                setIsLoading(false);
            }
        );
    };

    /*const changeLanguage = (language: string) => {
        i18n.changeLanguage(language).then();
    };*/

    return (
        <>
            <div className="login-page"
                style={{
                    backgroundColor: '#1e63b8',
                    minHeight: '100vh',
                    height: '100dvh',
                    overflowY: 'auto',
                    paddingTop: 20,
                    paddingBottom: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <div style={{ width: '100%', maxWidth: 520, margin: 'auto' }}>
                    {banner && (
                        <Box
                            sx={{
                                m: 2,
                                p: 2,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 1.5,
                                backgroundColor:
                                    banner.level === 'error'
                                        ? '#FDECEA'
                                        : banner.level === 'warning'
                                            ? '#FFF4E5'
                                            : '#E5F6FD',
                                border:
                                    banner.level === 'error'
                                        ? '1px solid #F5A3A3'
                                        : banner.level === 'warning'
                                            ? '1px solid #FFB74D'
                                            : '1px solid #81D4FA',
                                color:
                                    banner.level === 'error'
                                        ? '#C62828'
                                        : banner.level === 'warning'
                                            ? '#EF6C00'
                                            : '#01579B',
                            }}
                        >
                            <Box
                                sx={{ fontSize: '0.9rem' }}
                                dangerouslySetInnerHTML={{ __html: banner.message }}
                            />
                        </Box>
                    )}
                    <div style={{ marginBottom: 20, textAlign: 'center' }}>
                        <Typography style={{ color: 'white', fontSize: '1.3rem', fontWeight: 'normal' }}>{t('login.tagLine')}</Typography>
                    </div>
                    <Box className="login-panel" sx={{
                        position: 'relative',
                        ...(isDev
                            ? {
                                '&::before': {
                                    content: '"TEST VERSION"',
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    transform: 'translate(-50%, -50%) rotate(-30deg)',
                                    fontSize: '4rem',
                                    fontWeight: 'bold',
                                    color: 'rgba(186, 16, 16, 0.18)',
                                    whiteSpace: 'nowrap',
                                    pointerEvents: 'none',
                                    zIndex: 0,
                                },
                                '& > *': {
                                    position: 'relative',
                                    zIndex: 1,
                                },
                            }
                            : {}),
                    }}>
                        <Box component="img" src={logoSrc} onError={handleImageError} alt="Logo" sx={{ width: 150, height: 50 }} />
                        <Typography variant="h6" style={{ marginTop: 10, display: 'block' }}>{t('login.title')}</Typography>
                        <Typography style={{ color: 'gray' }}>{t('login.info')}</Typography>
                        {textError && (
                            <>
                                <Box
                                    sx={{
                                        mt: 2,
                                        p: 2,
                                        borderRadius: 2,
                                        backgroundColor: '#FFF3F3',
                                        border: '1px solid #F5A3A3',
                                        color: '#E03B3B',
                                        textAlign: 'center'
                                    }}
                                >
                                    <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.2 }}>
                                        {methodValue === 'email'
                                            ? 'This email address is currently not registered, please try again or register through your company administrator'
                                            : 'This phone number is currently not registered, please try again or register through your company administrator'}
                                    </Typography>

                                    <Button
                                        variant="contained"
                                        onClick={openTroubleModal}
                                        sx={{
                                            mt: 2,
                                            textTransform: 'none',
                                            borderRadius: '10px',
                                            px: 3,
                                            backgroundColor: '#EC8B2E',
                                            '&:hover': { backgroundColor: '#D27925' }
                                        }}
                                    >
                                        Trouble with Signin?
                                    </Button>
                                </Box>
                                {/*<Typography style={{ marginTop: 10, color: 'red', display: 'block' }}>{textError}</Typography>*/}
                            </>
                        )}
                        {!clientId && (
                            <TextField variant="standard" fullWidth label={t('login.enterClientId')} value={clientId} disabled={codeSent} style={{ marginTop: 20 }} />
                        )}
                        <div style={{ marginTop: 20 }}>
                            <Grid container spacing={2} alignItems="flex-end">
                                <Grid item xs={12} sm={3}>
                                    <FormControlLabel
                                        control={<Switch checked={methodValue === 'email'} disabled={codeSent} onChange={() => toggleMethod('email')} />}
                                        label="Email"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={9}>
                                    <TextField
                                        inputRef={emailInputRef}
                                        fullWidth
                                        type='email'
                                        variant="standard"
                                        label={t('login.enterEmail')}
                                        value={methodValue === 'email' ? inputValue : ''}
                                        onChange={(event) => setInputValue(event.target.value)}
                                        disabled={methodValue === 'phone' || codeSent}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={3}>
                                    <FormControlLabel
                                        control={<Switch checked={methodValue === 'phone'} disabled={codeSent} onChange={() => toggleMethod('phone')} />}
                                        label="Phone"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={9}>
                                    <TextField
                                        inputRef={phoneInputRef}
                                        fullWidth
                                        variant="standard"
                                        label={t('login.enterPhone')}
                                        value={methodValue === 'phone' ? inputValue : ''}
                                        onChange={(event) => setInputValue(event.target.value)}
                                        disabled={methodValue === 'email' || codeSent}
                                    />
                                </Grid>
                            </Grid>
                        </div>
                        {!codeSent ? (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                                <Button variant="contained" onClick={sendCode} disabled={isLoading}>
                                    {isLoading ? t('login.button.loading') : t('login.button.sendCode')}
                                </Button>
                            </div>
                        ) : (
                            <div style={{ marginTop: 20 }}>
                                <Grid container spacing={2} justifyContent="flex-end" alignItems="center">
                                    <Grid item xs={12} sm={true}>
                                        <TextField
                                            fullWidth
                                            variant="standard"
                                            label={t('login.enterCode')}
                                            value={codeValue}
                                            onChange={(event) => setCodeValue(event.target.value)}
                                            disabled={!codeSent}
                                        />
                                    </Grid>
                                    <Grid item>
                                        <Button
                                            variant="contained"
                                            onClick={verifyCode}
                                            disabled={isLoading}
                                        >
                                            {isLoading ? t('login.button.loadingVerify') : t('login.button.verifyCode')}
                                        </Button>
                                    </Grid>
                                </Grid>
                            </div>
                        )}
                    </Box>
                    { /* <div className="lang-line">
                    <Link component="button" onClick={() => changeLanguage('en')} style={{ textDecoration: i18n.language === 'en' ? 'underline' : 'none' }}>English</Link> | <Link component="button" onClick={() => changeLanguage('es')} style={{ textDecoration: i18n.language === 'es' ? 'underline' : 'none' }}>Español</Link>
                </div> */}
                    <div style={{ marginTop: 20, textAlign: 'center' }}>
                        <Link
                            onClick={(e) => {
                                e.preventDefault();
                                setVideoModalOpen(true);
                            }}
                            underline="hover"
                            style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: 'white', textDecoration: 'none', borderRadius: '5px', border: '1px solid white', padding: '5px 10px' }}
                        >
                            <VideoLibraryIcon style={{ marginRight: 4 }} />
                            Video Tutorial
                        </Link>
                    </div>
                    <div style={{ marginTop: 20, textAlign: 'center' }}>
                        <QRCodeDisplay />
                    </div>
                    <div style={{ marginTop: 20, textAlign: 'center' }}>
                        <Typography style={{ color: 'white', fontSize: '0.8rem', fontWeight: 'normal' }}>&copy; {currentYear} eSafety Systems. All rights reserved.</Typography>
                    </div>
                </div>
            </div>
            <VideoModal open={videoModalOpen} isOnline={isOnline} onClose={() => setVideoModalOpen(false)} />
            <Dialog
                open={helpModalOpen}
                onClose={() => setHelpModalOpen(false)}
                fullWidth
                PaperProps={{
                    sx: {
                        m: 0.75,
                        //maxWidth: 800,
                    },
                }}
                sx={{
                    '& .MuiDialog-container': { p: 0.75 },
                }}
            >
                <DialogTitle sx={{ m: 0, px: 2, py: 1, lineHeight: 2.0 }}>
                    Help with Sign-in
                    <IconButton
                        aria-label="close"
                        onClick={() => setHelpModalOpen(false)}
                        sx={{ position: 'absolute', right: 8, top: 8, color: (t) => t.palette.grey[500] }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent dividers sx={{ p: 0, height: '60vh' }}>
                    {helpUrl && (
                        <iframe
                            title="signin-help"
                            src={helpUrl}
                            style={{ width: '100%', height: '100%', border: 0 }}
                            allow="fullscreen"
                        />
                    )}
                </DialogContent>
            </Dialog >
        </>
    );


}

export default Login;