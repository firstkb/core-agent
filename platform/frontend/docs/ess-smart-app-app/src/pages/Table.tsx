import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import Logger from "../logger/Logger";
import { CircularProgress, Paper, Table, TableBody, TableContainer, TableHead, TableRow, Button, Typography, Box, Chip, Grid, Card, CardContent, Avatar, TableCell } from '@mui/material';
import { TocOutlined, DoneAllOutlined, DrawOutlined, SyncOutlined, WarningAmber } from '@mui/icons-material';
import { StyledTableCell, StyledTableRow } from '../components/StyledTable'
import { OnlineStatusContext } from "../contexts/OnlineStatusContext";
import { RequestContext } from "../contexts/RequestContext";
import { useClientConfig } from '../hooks/useClientConfig';
import { useDatabase } from '../hooks/useDatabase';
import { useSyncService } from '../hooks/useSyncService';
import { Scheme } from "../db/SchemeRepo";
import { Form } from "../db/FormRepo";
import { File } from "../db/FileRepo";

interface Stat {
    title: string;
    subtitle: string;
    icon: JSX.Element;
}

const calculateStats = (data: any[], scheme: Scheme | null): Stat[] => {
    let allRecords = 0;
    let draft = 0;
    let completed = 0;
    let waitingSync = 0;

    data.forEach(row => {
        allRecords++;

        let displayValue = "";
        if (scheme?.info.statusfield && row.data[scheme?.info.statusfield]) {
            displayValue = row.data[scheme?.info.statusfield];
        }

        if (scheme?.info.statusfield && displayValue === scheme?.info.statusnew) {
            draft++;
        }
        if (scheme?.info.statusfield && displayValue === scheme?.info.statusfinish) {
            completed++;
        }

        if (row.isSynced === 0) {
            waitingSync++;
        }
    });

    return [
        { title: allRecords.toString(), subtitle: 'All records', icon: <TocOutlined /> },
        { title: draft.toString(), subtitle: scheme?.info.statusnew, icon: <DrawOutlined /> },
        { title: completed.toString(), subtitle: scheme?.info.statusfinish, icon: <DoneAllOutlined /> },
        { title: waitingSync.toString(), subtitle: 'Waiting sync', icon: <SyncOutlined /> },
    ];
};

function TablePage() {
    const isOnline = useContext(OnlineStatusContext);
    const request = useContext(RequestContext);
    const { pageId } = useParams<{ pageId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const db = useDatabase();
    const { isRunningRecords, runSyncCycle } = useSyncService();
    const [stats, setStats] = useState<Stat[]>([]);
    const { schemes, dictionaryObj } = useClientConfig();
    const [scheme, setScheme] = useState<Scheme | null>(null);
    const [headers, setHeaders] = useState<Array<any>>([]);
    const [ui, setUi] = useState<Array<any>>([]);
    const [data, setData] = useState<Array<any>>([]);
    const [loading, setLoading] = useState(true);
    const clientId = localStorage.getItem('clientId');
    const aspUrl = localStorage.getItem('aspUrl');


    useEffect(() => {

        if (pageId && schemes && schemes[parseInt(pageId)]) {
            setScheme(schemes[parseInt(pageId)]);
            setHeaders(schemes[parseInt(pageId)].grid || []);
            setUi(schemes[parseInt(pageId)].ui || [])
            setData([]);
            setLoading(false);
            getData(schemes[parseInt(pageId)].info.table_id, schemes[parseInt(pageId)].info.datefield);
        }

    }, [schemes, pageId]);

    useEffect(() => {

        setStats(calculateStats(data, scheme));

    }, [data, scheme]);

    useEffect(() => {
        if (!isRunningRecords) {
            getLocalData(`${pageId}`);
        }
    }, [isRunningRecords])


    const getData = async (tableId: string, dateField: string) => {
        getLocalData(`${pageId}`);
        if (!isOnline) {
            Logger.warn("Offline mod");
            return;
        }

        try {
            setLoading(true);
            const responseData = await request?.sendRequest(`/data/${pageId}`, {}, "GET");

            if (responseData && responseData.formData) {
                await updateLocalData(`${pageId}`, tableId, dateField, responseData.formData);
                getLocalData(`${pageId}`);
            } else {
                Logger.warn("Failed to retrieve data");
            }

            if (responseData && responseData.fileData) {
                await updateLocalFile(responseData.fileData, pageId);
            } else {
                Logger.debug("Failed to retrieve files");
            }

        } catch (error) {
            Logger.error("Error loading data", error);
        } finally {
            setLoading(false);
            runSyncCycle();
        }
    };

    const getLocalData = async (pageId: string) => {
        const dataDB = await db?.formRepo.getFromPageId(pageId);
        if (dataDB == null) {
            return;
        }
        const orderedData = await orderData(dataDB, 'DESC')
        setData(orderedData);
        orderedData.forEach(item => {
            if (item.isEdit) {
                item.isEdit = 0;
                db?.formRepo.update(item.data['ExtDB' + item.tableId + '_guid'], item);
            }
        });
    }

    const orderData = async (data: Form[], sortOrder: string) => {
        return data.sort((a: Form, b: Form) => {
            const valueA = a.created;
            const valueB = b.created;

            if (sortOrder === 'ASC') {
                return valueA > valueB ? 1 : -1;
            } else { // DESC
                return valueA < valueB ? 1 : -1;
            }
        });
    };

    const convertDate = (dateString: string) => {
        if (dateString.length === 10) {
            dateString += 'T00:00:00';
        }
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    };

    const parseField = (key: any, value: any) => {
        if (typeof ui[key] !== "undefined") {
            if (typeof ui[key]['ui:options'] !== "undefined" && typeof ui[key]['ui:options']['format'] !== "undefined" && isDate(value)) {
                value = convertDate(value);
            } else if (typeof ui[key]['ui:widget'] !== "undefined" && ui[key]['ui:widget'] === "selectDic" && typeof ui[key]['ui:dataSource'] !== "undefined") {
                value = getDic(ui[key]['ui:dataSource'], ui[key]['ui:typeSource'], value);
            } else if (typeof ui[key]['ui:widget'] !== "undefined" && ui[key]['ui:widget'] === "selectLookup" && typeof ui[key]['ui:dataSource'] !== "undefined") {
                value = getDic(ui[key]['ui:dataSource'], ui[key]['ui:typeSource'], value);
            }
        }

        return value;
    }

    const getDic = (dic: any, type: string, value: string) => {
        if (typeof dictionaryObj[dic] !== "undefined" && typeof dictionaryObj[dic][value] !== "undefined") {
            return dictionaryObj[dic][value];
        } else if (typeof dictionaryObj[type] !== "undefined" && typeof dictionaryObj[type][value] !== "undefined") {
            return dictionaryObj[type][value];
        }
        return value;
    }

    const isDate = (value: any) => {
        return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?$/.test(value);
    };

    const updateLocalData = async (pageId: string, tableId: string, dateField: string, serverData: any) => {
        const serverRecordIds = new Set();
        for (const serverRecord of serverData) {
            serverRecordIds.add(serverRecord['ExtDB' + tableId + '_guid']);
            const localRecord = await db?.formRepo.get(serverRecord['ExtDB' + tableId + '_guid']);
            if (localRecord) {
                //if (localRecord.rowstamp !== serverRecord['ExtDB' + tableId + '_rowstamp']) {
                if (localRecord.isSynced === 1) {
                    // need update serverToLocal
                    localRecord.id = serverRecord['ExtDB' + tableId + '_id'];
                    localRecord.data = serverRecord;
                    localRecord.modified = Date.now();
                    localRecord.isValid = 1;
                    localRecord.rowstamp = serverRecord['ExtDB' + tableId + '_rowstamp'];
                    await db?.formRepo.update(serverRecord['ExtDB' + tableId + '_guid'], localRecord);
                }/* else {
                        // need update localToServer
                    }*/
                //}
            } else {
                // add new record
                const dataObj: Form = {
                    id: serverRecord['ExtDB' + tableId + '_id'],
                    guid: serverRecord['ExtDB' + tableId + '_guid'],
                    pageId: pageId,
                    tableId: tableId,
                    modified: Date.now(),
                    created: Math.floor(new Date(serverRecord[dateField]).getTime() / 1000),
                    operation: 'server',
                    rowstamp: serverRecord['ExtDB' + tableId + '_rowstamp'],
                    data: serverRecord,
                    isEdit: 0,
                    isReadOnly: 0,
                    isSynced: 1,
                    isValid: 1,
                    finish: '',
                    log: []
                }
                await db?.formRepo.add(serverRecord['ExtDB' + tableId + '_guid'], dataObj);

            }
        }
        const allLocalRecords = await db?.formRepo.getFromPageId(pageId);
        if (allLocalRecords) {
            for (const localRecord of allLocalRecords) {
                if (localRecord && localRecord.isSynced === 1 && !serverRecordIds.has(localRecord.data['ExtDB' + tableId + '_guid'])) {
                    await db?.formRepo.delete(localRecord.data['ExtDB' + tableId + '_guid']);
                }
            }
        }
    }


    const generateFileId = (mainGuid: string, name: string, parentGuid: string): string => {
        return `${mainGuid}_${name}_${parentGuid}`;
    };

    const updateLocalFile = async (serverData: any[], pageId: string | undefined) => {
        if (!pageId) {
            return;
        }

        const dataDB = await db?.formRepo.getFromPageId(pageId);
        if (!dataDB) {
            return;
        }

        const currentLocalGuids = new Set<string>(dataDB.map((item: any) => item.guid));

        for (const serverRecord of serverData) {
            const { parentGuid, mainGuid, name, parentId, table, source } = serverRecord;
            const fileId = generateFileId(mainGuid, name, parentGuid);

            const item = await db?.fileRepo.get(fileId);
            if (!item) {
                const newFile: File = {
                    id: fileId,
                    name,
                    parentId,
                    parentGuid,
                    mainGuid,
                    table,
                    isSynced: 1,
                    isDelete: 0,
                    source,
                    modified: Date.now(),
                    created: Date.now(),
                    operation: 'server',
                    log: []
                };
                await db?.fileRepo.add(fileId, newFile);
            }

            currentLocalGuids.delete(mainGuid);
        }

        for (const guid of currentLocalGuids) {
            const items = await db?.fileRepo.getFromMainGuid(guid);
            if (items && items.length > 0) {
                for (const item of items) {
                    if (item.isSynced === 1 && item.isDelete === 0) {
                        item.isDelete = 1;
                        await db?.fileRepo.update(item.id, item);
                    }
                }
            }
        }
    };

    const handleEditClick = (id: string) => {
        navigate(`/edit/${pageId}/${id}`);
    };

    const handlePdfClick = (id: string) => {
        if (scheme && scheme.info && scheme.info.id) {
            const url = `${aspUrl}/smart/web/?act=pdfw&part=E${scheme.info.id}&rec_guid=${id}&system_id=${clientId}`;
            window.open(url, '_blank');
        }
    }

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5">{scheme?.info.title || 'Loading...'}</Typography>

            <Box display="flex" justifyContent="center" my={2}>
                {scheme?.info.new == "true" ? <Button key={"0"} variant="contained" color="warning" onClick={() => handleEditClick("new")}>
                    <Typography sx={{ fontSize: '1.2em', fontWeight: '600', paddingRight: '5px' }}>+</Typography> {t("table.new")}
                </Button> : ""}
            </Box>

            <Card elevation={1} sx={{ borderRadius: '8px', padding: 1 }}>
                <CardContent>
                    <Grid container spacing={2}>
                        {stats.map((stat, index) => (
                            <React.Fragment key={index}>
                                <Grid item xs={6} sm={3} md={3} sx={{
                                    '&:last-child > div': {
                                        borderRight: 'none',
                                    },
                                }}>
                                    <Box display="flex" justifyContent="space-between" gap={2} sx={{
                                        padding: '0px 15px;', borderRight: '1px solid #ccc',
                                        '@media (max-width: 600px)': {
                                            padding: '0px 5px;',
                                            borderRight: 'none',
                                        },
                                    }}>
                                        <Box display="flex" flexDirection="column">
                                            <Typography variant="h6" sx={{
                                                fontWeight: 600, '@media (max-width: 600px)': {
                                                    fontSize: '1.1rem',
                                                },
                                            }}>{stat.title}</Typography>
                                            <Typography variant="body2" sx={{
                                                '@media (max-width: 600px)': {
                                                    fontSize: '0.7rem',
                                                },
                                            }}>{stat.subtitle}</Typography>
                                        </Box>
                                        <Avatar sx={{
                                            bgcolor: 'blueGrey', width: 35, height: 35, '@media (max-width: 600px)': {
                                                width: 30, height: 30
                                            },
                                        }}>
                                            <Box sx={{
                                                '@media (max-width: 600px)': {
                                                    fontSize: '0.001rem',
                                                },
                                            }}>{stat.icon}</Box>
                                        </Avatar>
                                    </Box>
                                </Grid>
                            </React.Fragment>
                        ))}
                    </Grid>
                </CardContent>
            </Card>


            <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {scheme?.info.edit === "true" && <StyledTableCell></StyledTableCell>}
                            <StyledTableCell></StyledTableCell>
                            {headers && headers.filter(column => (scheme?.info.table_type === "SOR" && column.type !== "30" || scheme?.info.table_type !== "SOR")).map((header, index) => (
                                <StyledTableCell key={index}>{header.title}</StyledTableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.length === 0 && loading ? (
                            <TableRow>
                                <TableCell colSpan={20} align="center">
                                    <CircularProgress />
                                </TableCell>
                            </TableRow>
                        ) : data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={20} align="center">
                                    {t("table.no_data")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, index) => (
                                <React.Fragment key={`fragment-${index}`}>
                                    <StyledTableRow key={index} isEven={index % 2 === 0}>
                                        <StyledTableCell rowSpan={scheme?.info.table_type === "SOR" ? 2 : 1} className={scheme?.info.table_type === "SOR" ? "sor-bottom" : ""}>
                                            <Box display="flex" gap={1}>
                                                {scheme?.info.edit === "true" && (
                                                    <Button variant="contained" size="small" color="primary" disabled={row.isSynced === 0 && row.isValid === 1 && row.log.length < 2 && isOnline} onClick={() => handleEditClick(row.guid)}>
                                                        {t("general.edit")}
                                                    </Button>
                                                )}
                                                {isOnline && row.id !== 0 && (
                                                    <Button variant="contained" size="small" color="secondary" onClick={() => handlePdfClick(row.guid)}>
                                                        {t("general.pdf")}
                                                    </Button>
                                                )}
                                            </Box>
                                        </StyledTableCell>
                                        <StyledTableCell sx={scheme?.info.table_type === "SOR" ? { borderBottom: "none" } : {}}>
                                            {row.isSynced === 0 ? <SyncOutlined color={row.log.length > 1 ? "error" : "warning"}></SyncOutlined> : ""}
                                            {row.isValid === 0 ? <WarningAmber color={"error"}></WarningAmber> : ""}
                                        </StyledTableCell>
                                        {headers && headers.filter(column => (scheme?.info.table_type === "SOR" && column.type !== "30" || scheme?.info.table_type !== "SOR")).map((column, columnIndex) => {
                                            const displayValue = parseField(column.field, row.data[column.field]);
                                            const cellStyle = scheme?.info.table_type === "SOR" ? { borderBottom: "none" } : {};
                                            return (
                                                <StyledTableCell key={`cell-${index}-${columnIndex}`} style={cellStyle}>
                                                    {column.field === scheme?.info.statusfield && displayValue === scheme?.info.statusnew ? (
                                                        <Chip label={displayValue} size="small" color="warning" />
                                                    ) : column.field === scheme?.info.statusfield && displayValue === scheme?.info.statusfinish ? (
                                                        <Chip label={displayValue} size="small" color="success" />
                                                    ) : column.field === scheme?.info.statusfield ? (
                                                        <Chip label={displayValue} size="small" color="default" />
                                                    ) : (
                                                        displayValue
                                                    )}
                                                </StyledTableCell>
                                            )
                                        })}
                                    </StyledTableRow>
                                    {scheme?.info.table_type === "SOR" && (
                                        <StyledTableRow key={`row-second-${index}`} isEven={index % 2 === 0}>
                                            <StyledTableCell sx={{ fontWeight: 'bold' }} colSpan={20}>
                                                {headers.filter(column => column.type === "30").map(column => parseField(column.field, row.data[column.field])).join(", ")}
                                            </StyledTableCell>
                                        </StyledTableRow>
                                    )}
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}

export default TablePage;
