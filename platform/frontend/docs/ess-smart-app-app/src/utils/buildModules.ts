import { Scheme } from '../db/SchemeRepo';

export interface IShareLink {
    id: string;
    module: string;
    part?: string;
    label: string;
    param: string;
    icon?: string;
    count?: string;
}

export interface IMenuItem {
    id: string;
    type: 'scheme' | 'share' | 'static';
    label: string;
    icon?: string;
    part?: string;
    url: string;
    needsOnline: boolean;
    moduleOrder?: number;
    count?: string;
}

export const buildModules = (
    schemes: Record<string, Scheme> | null | undefined,
    shareLinks: IShareLink[],
    localCounts: Record<string, number> = {},
) => {
    const map: Record<string, IMenuItem[]> = {};

    Object.values(schemes ?? {}).forEach((sch) => {
        if (sch.info.active !== 'true') return;
        const mod = sch.info.module || 'Others';
        if (!map[mod]) map[mod] = [];

        map[mod].push({
            id: sch.info.id,
            type: 'scheme',
            label: sch.info.title,
            icon: sch.info.icon,
            url: `/page/${sch.info.id}`,
            needsOnline: false,
            moduleOrder: Number(sch.info.module_order) || 0,
            count: String(localCounts[sch.info.id] ?? '-'),
        });
    });

    Object.keys(map).forEach((m) =>
        map[m].sort((a, b) => {
            if (a.type !== b.type) return a.type === 'scheme' ? -1 : 1;
            if (a.type === 'scheme') return (a.moduleOrder ?? 0) - (b.moduleOrder ?? 0);
            return 0;
        }),
    );

    shareLinks.forEach((sl) => {
        const mod = sl.module || 'Others';
        const isShare = (sl.part?.charAt(0).toUpperCase() === 'E');
        if (!map[mod]) map[mod] = [];
        map[mod].push({
            id: sl.id,
            type: isShare ? 'share' : 'static',
            part: sl.part,
            label: sl.label,
            icon: sl.icon,
            url: `/web/?act=list&${sl.param}`,
            needsOnline: true,
            count: sl.count ?? '-',
        });
    });

    const entries = Object.entries(map);
    const withScheme = entries
        .filter(([, items]) => items.some((i) => i.type === 'scheme'))
        .sort(([a], [b]) => a.localeCompare(b));
    const onlyShare = entries
        .filter(([, items]) => items.every((i) => i.type !== 'scheme'))
        .sort(([a], [b]) => a.localeCompare(b));

    return [...withScheme, ...onlyShare];
};