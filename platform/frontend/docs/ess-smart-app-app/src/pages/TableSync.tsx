import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Paper, Table, TableBody, TableContainer, TableHead, TableRow, Button, Typography, Box, TableCell, Divider, Chip } from '@mui/material';
import { StyledTableCell, StyledTableRow } from '../components/StyledTable'
import { useClientConfig } from '../hooks/useClientConfig';
import { useDatabase } from '../hooks/useDatabase';
import { useSyncService } from '../hooks/useSyncService';
import { Form } from "../db/FormRepo";
import { File } from "../db/FileRepo";
import { Support } from "../db/SupportRepo";

function TableSyncPage() {
    const navigate = useNavigate();
    const db = useDatabase();
    const { t } = useTranslation();
    const { isRunningRecords } = useSyncService();
    const { schemes } = useClientConfig();
    const [data, setData] = useState<Array<any>>([]);
    const [photo, setPhoto] = useState<Array<any>>([]);
    const [support, setSupport] = useState<Array<any>>([]);

    const orderData = useCallback(async (data: Form[], sortOrder: string) => {
        return data.sort((a: Form, b: Form) => {
            const valueA = a.created;
            const valueB = b.created;

            if (sortOrder === 'ASC') {
                return valueA > valueB ? 1 : -1;
            } else { // DESC
                return valueA < valueB ? 1 : -1;
            }
        });
    }, []);

    const getLocalData = useCallback(async () => {
        const dataDB = await db?.formRepo.notIsSynced();
        if (dataDB != null) {


            const orderedData = await orderData(dataDB, 'DESC')
            const dataArray: Array<{ form: string; data: string; info: string; pageId: string; guid: string; }> = [];

            orderedData.forEach((item: Form) => {
                if (item.isEdit) {
                    item.isEdit = 0;
                    db?.formRepo.update(item.data['ExtDB' + item.tableId + '_guid'], item);
                }

                const schemForm = schemes?.[parseInt(item.pageId)]?.info;

                if (schemForm) {
                    const lastLogEntry = item.log && item.log.length > 0
                        ? typeof item.log[item.log.length - 1] === 'object'
                            ? JSON.stringify(item.log[item.log.length - 1])
                            : item.log[item.log.length - 1]
                        : "";
                    const formattedDate = new Date(item.modified).toLocaleDateString('en-US').toString();

                    dataArray.push({
                        form: schemForm.title || 'Undefined',
                        data: formattedDate,
                        info: item.isValid === 0 ? 'Required field not filled.' : lastLogEntry,
                        pageId: item.pageId,
                        guid: item.guid,
                    });
                }
            });

            setData(dataArray);

        }

        const photoDB = await db?.fileRepo.getNoSync();
        if (photoDB != null) {

            const photoArray: Array<{ name: string; data: string; info: string; }> = [];
            photoDB.forEach((item: File) => {
                const lastLogEntry = item.log && item.log.length > 0
                    ? typeof item.log[item.log.length - 1] === 'object'
                        ? JSON.stringify(item.log[item.log.length - 1])
                        : item.log[item.log.length - 1]
                    : "";
                const formattedDate = new Date(item.modified).toLocaleDateString('en-US').toString();

                photoArray.push({
                    name: item.name || 'Undefined',
                    data: formattedDate,
                    info: lastLogEntry,
                });
            });

            setPhoto(photoArray);
        }

        const supportDB = await db?.supportRepo.all()
        if (supportDB != null) {

            const supportArray: Array<{ type: string; priority: string; description: string; }> = [];
            supportDB.forEach((item: Support) => {

                supportArray.push({
                    type: item.type,
                    priority: item.priority,
                    description: item.description,
                });
            });

            setSupport(supportArray);
        }

    }, [db, schemes, orderData]);


    useEffect(() => {
        if (schemes || !isRunningRecords) {
            getLocalData();
        }
    }, [schemes, isRunningRecords, getLocalData]);

    const handleEditClick = (pageId: string, id: string) => {
        navigate(`/edit/${pageId}/${id}`);
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h5">{t("general.sync_table")}</Typography>

            <Divider sx={{ mt: 2, mb: 2 }}><Chip label="Forms" /></Divider>
            <TableContainer component={Paper} sx={{ mt: 1 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <StyledTableCell></StyledTableCell>
                            <StyledTableCell>Form</StyledTableCell>
                            <StyledTableCell>Date</StyledTableCell>
                            <StyledTableCell>Info</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={20} align="center">
                                    {t("table.no_data_sync")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, index) => (
                                <React.Fragment key={`fragment-${index}`}>
                                    <StyledTableRow key={index} isEven={index % 2 === 0}>
                                        <StyledTableCell>
                                            <Button variant="contained" size="small" color="primary" onClick={() => handleEditClick(row.pageId, row.guid)}>
                                                {t("general.edit")}
                                            </Button>
                                        </StyledTableCell>
                                        <StyledTableCell>{row.form}</StyledTableCell>
                                        <StyledTableCell>{row.data}</StyledTableCell>
                                        <StyledTableCell>{row.info}</StyledTableCell>
                                    </StyledTableRow>
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Divider sx={{ mt: 5, mb: 2 }}><Chip label="Photo upload" /></Divider>
            <TableContainer component={Paper} sx={{ mt: 1 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <StyledTableCell>File name</StyledTableCell>
                            <StyledTableCell>Date</StyledTableCell>
                            <StyledTableCell>Info</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {photo.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={20} align="center">
                                    {t("table.no_data_sync")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            photo.map((row, index) => (
                                <React.Fragment key={`fragment-${index}`}>
                                    <StyledTableRow key={index} isEven={index % 2 === 0}>
                                        <StyledTableCell>{row.name}</StyledTableCell>
                                        <StyledTableCell>{row.data}</StyledTableCell>
                                        <StyledTableCell>{row.info}</StyledTableCell>
                                    </StyledTableRow>
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Divider sx={{ mt: 5, mb: 2 }}><Chip label="Support request" /></Divider>
            <TableContainer component={Paper} sx={{ mt: 1 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <StyledTableCell>Type</StyledTableCell>
                            <StyledTableCell>Priority</StyledTableCell>
                            <StyledTableCell>Description</StyledTableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {support.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={20} align="center">
                                    {t("table.no_data_sync")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            support.map((row, index) => (
                                <React.Fragment key={`fragment-${index}`}>
                                    <StyledTableRow key={index} isEven={index % 2 === 0}>
                                        <StyledTableCell>{row.type}</StyledTableCell>
                                        <StyledTableCell>{row.priority}</StyledTableCell>
                                        <StyledTableCell>{row.description}</StyledTableCell>
                                    </StyledTableRow>
                                </React.Fragment>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

        </Box>
    );
}

export default TableSyncPage;
