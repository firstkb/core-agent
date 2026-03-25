import { FC } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../../pages/Login';

const PublicLayout: FC = () => {

    /*
    const isInWebApp = (): boolean => {
        const isInWebAppiOS = window.navigator.standalone === true;
        const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches;
        return isInWebAppiOS || isInWebAppChrome;
    };

    useEffect(() => {
          if (!isInWebApp()) {
              window.sessionStorage.setItem('pwa-hide-install', 'false');
          }
      }, []);*/

    return (
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default PublicLayout;