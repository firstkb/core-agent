import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardActionArea, CardMedia, Typography, Grid, Box, Snackbar, Alert } from '@mui/material';
import { RequestContext } from "../contexts/RequestContext";
import { useClientConfig } from '../hooks/useClientConfig';
import { useDatabase } from '../hooks/useDatabase';
import { buildModules, IShareLink, IMenuItem } from '../utils/buildModules';
import { OnlineStatusContext } from "../contexts/OnlineStatusContext";
import { useContext, useEffect, useMemo, useState } from 'react';
import Logger from '../logger/Logger';

const cardSx = {
  height: '100%',
  borderRadius: '7px',
  boxShadow: '0px 3px 4px 0px rgba(0,0,0,0.03)',
};

const ribbonSx = {
  position: 'absolute',
  top: '10%',
  right: 0,
  px: '10px',
  py: '5px',
  bgcolor: '#1E2538',
  color: '#fff',
  fontSize: '13px',
  fontWeight: 600,
  borderRadius: '4px 0 0 4px',
};

function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { schemes } = useClientConfig();
  const db = useDatabase();
  const isOnline = useContext(OnlineStatusContext);
  const request = useContext(RequestContext);
  const [shareLinks, setShareLinks] = useState<IShareLink[]>([]);
  const [countsById, setCountsById] = useState<Record<string, string>>({});
  const [localCounts, setLocalCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!schemes) return;

    const ids = Object.values(schemes)
      .filter((s) => s.info.active === 'true')
      .map((s) => s.info.id);

    (async () => {
      try {
        const counts = await db?.formRepo.countByPageIds(ids);
        if (counts) setLocalCounts(counts);
      } catch (e) {
        Logger.debug('local count error', e);
      }
    })();
  }, [schemes, db]);

  const modules = useMemo(
    () => buildModules(schemes, shareLinks.map((sl) => ({
      ...sl,
      count: countsById[sl.id] ?? '-',
    })), localCounts),
    [schemes, shareLinks, countsById, localCounts],
  );

  useEffect(() => {
    if (!isOnline || !request || shareLinks.length === 0) return;
    const parts = shareLinks.map((sl) => `${sl.part}`);
    (async () => {
      try {
        const rsp = await request.sendRequest('/ezdata/count', { parts }, 'POST', false, true);

        const next: Record<string, string> = {};
        Object.entries(rsp).forEach(([key, val]: any) => {
          const id = key.slice(1);
          next[id] = val.count;
        });
        setCountsById(next);
      } catch (e) {
        Logger.debug('count request error', e);
      }
    })();
  }, [isOnline, request, shareLinks]);

  useEffect(() => {
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


  const [offlineAlert, setOfflineAlert] = useState(false);

  const clickHandler = (item: IMenuItem) => (
    e: React.MouseEvent<HTMLAnchorElement | HTMLDivElement>,
  ) => {
    if (item.type === 'scheme') {
      navigate(item.url);
    } else {
      if (item.needsOnline && !isOnline) {
        e.preventDefault();
        setOfflineAlert(true);
      }
    }
  };


  return (
    <div style={{ padding: 20 }}>
      <Typography variant="h5" gutterBottom>{t('general.dashboard')}</Typography>
      <Card className="card-info" style={{ marginBottom: '40px' }}>
        <Typography className="card-info-text">The power of early risk prevention</Typography>
      </Card>
      {modules.map(([moduleName, items]) => (
        <Box key={moduleName} sx={{ mb: 6 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {moduleName}
          </Typography>

          <Grid container spacing={2}>
            {items.map((it) => (
              <Grid item xs={12} sm={6} md={4} key={it.url}>
                <Card sx={cardSx}>
                  <CardActionArea
                    component={it.type === 'scheme' ? 'div' : 'a'}
                    href={it.type === 'share' ? it.url : undefined}
                    onClick={clickHandler(it)}
                    sx={{ opacity: it.type === 'share' && !isOnline ? 0.4 : 1 }}
                  >
                    {it.count && (
                      <Box sx={ribbonSx} dangerouslySetInnerHTML={{ __html: it.count }} />
                    )}

                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="left"
                      justifyContent="left"
                      sx={{ minHeight: 140, p: 2 }}
                    >
                      <CardMedia
                        component="img"
                        image={it.icon}
                        sx={{ width: 50, height: 50, mb: 2, mt: 2 }}
                      />
                      <Typography variant="subtitle1" align="left" sx={{ fontWeight: 600 }}>
                        {it.label}
                      </Typography>
                    </Box>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}
      <Snackbar
        open={offlineAlert}
        autoHideDuration={3000}
        onClose={() => setOfflineAlert(false)}
      >
        <Alert severity="warning" variant="filled" sx={{ color: '#fff' }}>
          No Internet connection. Please connect to the internet first.
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Dashboard;
