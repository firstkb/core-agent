// Route.tsx
import { FC, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import PublicLayout from '../components/layouts/PublicLayout';
import PrivateLayout from '../components/layouts/PrivateLayout';

const Routes: FC = () => {
    const { isAuthenticated, checkAuth } = useAuth();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifyAuth = async () => {
            await checkAuth();
            setLoading(false);
        };
        verifyAuth();
    }, [checkAuth]);

    if (loading) {
        return (
            <div className="loader-container">
                <img src="/assets/logo-dark.svg" alt="Loading..." className="loader-logo" />
            </div>
        );
    }

    return isAuthenticated ? <PrivateLayout /> : <PublicLayout />;
};

export default Routes;