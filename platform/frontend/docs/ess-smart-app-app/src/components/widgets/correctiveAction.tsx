import { FC, useState, useCallback, useEffect } from 'react';
import { Button, Modal, Card, CardHeader, CardContent, Box, Alert, Tooltip, IconButton, Typography } from '@mui/material';
import FormRjsf from '@rjsf/mui';
import { useClientConfig } from '../../hooks/useClientConfig';
import { useAuth } from '../../hooks/useAuth';
import { Form } from "../../db/FormRepo";
import { v4 as uuidv4 } from 'uuid';
import { Scheme } from "../../db/SchemeRepo";
import validator from '@rjsf/validator-ajv8';
import { widgets } from './formWidgets';
import { useDatabase } from '../../hooks/useDatabase';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import Logger from '../../logger/Logger';
import ImageUpload from './imageUpload';
import { useTheme } from '@mui/material/styles';
import { toLocalISOString } from '../../utils/dateUtils';
import HelpOutlineIcon from '@mui/icons-material/QuestionMark';
import VideoModal from "../VideoModal";

interface CorrectiveActionProps {
    formContext: Form,
    guidParent: string,
    tableParent: string,
    showModalCA: boolean,
    schemeId: string,
    onClose: () => void;
}

export const CorrectiveAction: FC<CorrectiveActionProps> = ({
    formContext,
    guidParent,
    tableParent,
    showModalCA = false,
    schemeId,
    onClose
}) => {
    const { schemes, helpVideo } = useClientConfig();
    const { userId } = useAuth();
    const db = useDatabase();
    const theme = useTheme();
    const isOnline = useOnlineStatus();
    const [modalOpen, setModalOpen] = useState(false);
    const [scheme, setScheme] = useState<Scheme | null>();
    const [data, setData] = useState<any>({});
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);
    const [widgetImage, setWidgetImage] = useState<boolean>(false)
    const isDarkMode = theme.palette.mode === 'dark';
    const [helpVideoUrl, setHelpVideoUrl] = useState("");
    const [videoModalOpen, setVideoModalOpen] = useState(false);

    const handleOpenModal = useCallback(() => {
        setModalOpen(true);
    }, []);

    useEffect(() => {
        if (schemeId && typeof helpVideo["helpv_" + schemeId] !== "undefined") {
            setHelpVideoUrl(helpVideo["helpv_" + schemeId]);
        }
    }, [helpVideo, schemeId]);

    useEffect(() => {
        if (showModalCA && !modalOpen) {
            handleOpenModal();
        }
    }, [showModalCA, modalOpen, handleOpenModal]);


    const prepareData = useCallback((updatedGuidParent: string, updatedSchemeId: string) => {
        if (schemes && schemes[parseInt(updatedSchemeId)]) {
            const schemeInfo = schemes[parseInt(updatedSchemeId)];
            setScheme(schemeInfo);

            const tableName = `ExtDB${schemeInfo?.info.table_id}`;
            const today = toLocalISOString();
            const guid = uuidv4().toUpperCase();
            const newForm: Form = {
                id: 0,
                guid: guid,
                pageId: schemeInfo?.info.id,
                tableId: schemeInfo?.info.table_id,
                isEdit: 1,
                isValid: 1,
                isSynced: 0,
                data: {
                    [`${tableName}_id`]: "0",
                    [`${tableName}_guid`]: guid,
                    [`${schemeInfo?.info.statusfield}`]: schemeInfo?.info.statusnew,
                    [`${schemeInfo?.info.datefield}`]: today,
                    [`${schemeInfo?.info.userfield}`]: parseInt(userId),
                },
                modified: Date.now(),
                created: Date.now(),
                operation: 'app',
                isReadOnly: 0,
                rowstamp: "",
                finish: "",
                log: [],
                parent: {
                    mainGuid: formContext?.guid,
                    mainTable: 'ExtDb' + formContext?.tableId,
                    table: tableParent,
                    guid: updatedGuidParent
                }
            }
            if (schemeInfo?.ui["ui:image"]) {
                setWidgetImage(true);
            }
            setData(newForm);
        }
    }, [schemes, formContext, userId, tableParent]);

    useEffect(() => {
        if ((guidParent && schemeId) || (guidParent == "" && schemeId)) {
            prepareData(guidParent, schemeId); // Передаем актуальный guidParent
        }
    }, [guidParent, schemeId, prepareData]);

    const onSubmit = async ({ formData }: any) => {

        const newData = { ...data, data: formData, isSynced: 0, modified: Date.now(), isEdit: 0 };
        await db?.formRepo.add(newData.guid, newData);
        setShowSuccessAlert(true);
        prepareData(guidParent, schemeId);

        setTimeout(() => {
            setShowSuccessAlert(false);
            setModalOpen(false);
            onClose();
        }, 2000);
    };

    const onChange = ({ formData }: any) => {
        const newData = { ...data, data: formData };
        setData(newData);
    };

    const handleDeleteAllImages = useCallback(async () => {
        if (widgetImage) {
            try {
                const listImg = await db?.fileRepo.getFromParentGuid(data?.guid);

                if (listImg && listImg.length > 0) {
                    for (const img of listImg) {
                        await db?.fileRepo.delete(img.id);
                    }

                    Logger.debug('All images deleted successfully.');
                } else {
                    Logger.debug('No images found to delete.');
                }
            } catch (error) {
                Logger.error('Error deleting images:', error);
            }
        }
    }, [db, widgetImage, data]);

    const handleCloseModal = useCallback(() => {
        setModalOpen(false);
        setShowSuccessAlert(false);
        handleDeleteAllImages();
        onClose();
    }, [onClose, handleDeleteAllImages]);

    return (
        <div>
            <Box>
                <Modal
                    open={modalOpen}
                    onClose={handleCloseModal}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    className={isDarkMode ? 'dark-theme' : 'light-theme'}
                >
                    <Card sx={{ maxWidth: 500, width: '100%', maxHeight: '80%', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                        <CardHeader
                            title="New Corrective Action"
                            action={helpVideoUrl != "" && !showSuccessAlert && (
                                <Box display="flex" alignItems="center" gap={0.5} sx={{ marginTop: '5px' }}>
                                    <Typography
                                        variant="body2"
                                        sx={{ cursor: 'pointer' }}
                                        onClick={() => { setVideoModalOpen(true); }}
                                    >
                                        Video tutorial
                                    </Typography>
                                    <Tooltip title="Help">
                                        <IconButton
                                            size="small"
                                            sx={{
                                                bgcolor: '#e0e0e0',
                                                color: 'black',
                                                '&:hover': { bgcolor: '#d5d5d5' },
                                            }}
                                            onClick={() => { setVideoModalOpen(true); }}
                                        >
                                            <HelpOutlineIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            )}
                            sx={{ position: 'sticky', top: 0, zIndex: 1000 }}
                        />
                        <CardContent sx={{ overflowY: 'auto', flexGrow: 1, marginBottom: '35px' }}>
                            {showSuccessAlert && (
                                <Alert severity="success">
                                    Corrective Action Saved Successfully.
                                </Alert>
                            )}
                            {!showSuccessAlert && (
                                <FormRjsf
                                    schema={scheme?.scheme || {}}
                                    uiSchema={scheme?.ui || {}}
                                    formData={data?.data}
                                    validator={validator}
                                    widgets={widgets}
                                    onSubmit={onSubmit}
                                    onChange={onChange}
                                >
                                    {widgetImage && (
                                        <ImageUpload
                                            uniqueKey={`${data.guid}-ca`}
                                            formContext={data}
                                            guidParent=""
                                            tableParent=""
                                        />
                                    )}

                                    <Box
                                        display="flex"
                                        justifyContent="space-between"
                                        className="modal-footer"
                                        sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            width: '100%',
                                            zIndex: 1000,
                                            padding: '10px 10px',
                                            boxShadow: '0 -1px 4px rgba(0, 0, 0, 0.1)'
                                        }}
                                    >
                                        <Button variant="contained" onClick={handleCloseModal} color="secondary">
                                            Cancel
                                        </Button>
                                        <Button type="submit" variant="contained" color="success">
                                            Save
                                        </Button>
                                    </Box>
                                </FormRjsf>
                            )}
                        </CardContent>
                    </Card>
                </Modal>
            </Box>
            {helpVideoUrl !== "" && (
                <VideoModal open={videoModalOpen} isOnline={isOnline} videoUrl={helpVideoUrl} onClose={() => setVideoModalOpen(false)} />
            )}
        </div>
    );
};

export default CorrectiveAction;