import { useMemo, useState } from 'react';
import { useClientConfig } from '../hooks/useClientConfig';
import {
    Box, Typography, List, ListItem, ListItemText, Button
} from '@mui/material';
import VideoModal from '../components/VideoModal';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function TutorialPage() {
    const { schemes, helpVideo } = useClientConfig();
    const isOnline = useOnlineStatus();

    const tutorials = useMemo(() => {
        if (!helpVideo || !schemes) return [];

        return Object.entries(helpVideo)
            .filter(([v]) => v)
            .map(([key, url]) => {
                const pageId = key.replace('helpv_', '');
                const scheme = schemes[Number(pageId)];
                const title = scheme?.info?.title || `Page ${pageId}`;

                return {
                    id: pageId,
                    title,
                    description: `Video tutorial for ${title}`,
                    url,
                };
            });
    }, [helpVideo, schemes]);

    const [open, setOpen] = useState(false);
    const [videoUrl, setUrl] = useState('');

    return (
        <>
            <Box sx={{ py: 2, px: 2, maxWidth: 600, mx: 'auto' }}>
                <Typography variant="h5" gutterBottom>Tutorials</Typography>


                {tutorials.map(t => (
                    <List
                        key={t.id}
                        sx={{ bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1, mt: 3 }}>
                        <ListItem
                            key={t.id}
                            secondaryAction={
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={() => { setUrl(t.url); setOpen(true); }}
                                    sx={{ textTransform: 'none' }}
                                >
                                    Watch video
                                </Button>
                            }
                        >
                            <ListItemText primary={t.title} secondary={t.description} />
                        </ListItem>
                    </List>
                ))}

            </Box>

            {videoUrl && (
                <VideoModal
                    open={open}
                    videoUrl={videoUrl}
                    isOnline={isOnline}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}