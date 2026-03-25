import { useMemo } from 'react';

export const useIsDesktop = () => {
    return useMemo(() => {
        const ua = navigator.userAgent.toLowerCase();

        const isMobile =
            /android|webos|iphone|ipad|ipod|blackberry|windows phone|opera mini|mobile/.test(
                ua,
            );
        return !isMobile;
    }, []);
};