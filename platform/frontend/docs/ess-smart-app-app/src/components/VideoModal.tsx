import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton, Box, CircularProgress, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type VideoModalProps = {
    open: boolean;
    onClose: () => void;
    videoUrl?: string;
    isOnline?: boolean;
};

const VideoModal: React.FC<VideoModalProps> = ({ open, onClose, videoUrl: propVideoUrl, isOnline }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const defaultVideoUrl = '/locales/tutorial.mp4?v=2.0.1';
    const customVideoUrl = '/client/tutorial.mp4';
    const [videoUrl, setVideoUrl] = useState(defaultVideoUrl);
    const [loading, setLoading] = useState(true);

    const online = typeof isOnline === 'boolean' ? isOnline : true;

    useEffect(() => {
        if (propVideoUrl) {
            setVideoUrl(propVideoUrl);
            setLoading(false);
        } else {
            if (!online) {
                setLoading(false);
                return;
            }
            const checkCustomVideo = async () => {
                try {
                    const response = await fetch(customVideoUrl, { method: 'HEAD' });
                    const contentType = response.headers.get('content-type') || '';
                    if (response.ok && !contentType.includes('text/html') && contentType.includes('video')) {
                        setVideoUrl(customVideoUrl);
                    } else {
                        setVideoUrl(defaultVideoUrl);
                    }
                } catch (error) {
                    setVideoUrl(defaultVideoUrl);
                } finally {
                    setLoading(false);
                }
            };
            checkCustomVideo();
        }
    }, [propVideoUrl, online]);

    useEffect(() => {
        if (!open && videoRef.current) {
            videoRef.current.pause();
            videoRef.current.currentTime = 0;
        }
    }, [open]);

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2 }}>
                Video Tutorial
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 12,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0, position: 'relative' }}>
                {!online ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: { xs: '430px', md: '430px' } }}>
                        <Typography variant="h6" sx={{ textAlign: 'center', padding: '0 10px' }}>To view the video, you need an internet connection.</Typography>
                    </Box>
                ) : (
                    loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: { xs: '430px', md: '430px' } }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Box
                            component="video"
                            ref={videoRef}
                            width="100%"
                            controls
                            autoPlay
                            sx={{
                                display: 'block',
                                height: { xs: '430px', md: '430px' },
                            }}
                        >
                            <source src={videoUrl} type="video/mp4" />
                        </Box>
                    )
                )}
            </DialogContent>
        </Dialog>
    );
};

export default VideoModal;