export type ViewMode = 'mobile' | 'desktop' | 'auto';

export const resolveViewMode = (): ViewMode => {
    const qs = new URLSearchParams(window.location.search);
    const param = qs.get('view');                         // ?view=mobile
    if (param === 'mobile' || param === 'desktop') {
        localStorage.setItem('view', param);
        return param;
    }
    return (localStorage.getItem('view') as ViewMode) || 'auto';
};