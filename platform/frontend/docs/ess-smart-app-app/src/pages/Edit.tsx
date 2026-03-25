import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, useBeforeUnload } from "react-router-dom";
import { useTranslation } from 'react-i18next';
//import { debounce } from 'lodash';
import { Box, Typography, Button, Card, CircularProgress, Tooltip, IconButton } from '@mui/material';
import FormRjsf from '@rjsf/mui';
import FormRjsfType from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import { v4 as uuidv4 } from 'uuid';
import { useDatabase } from '../hooks/useDatabase';
import { useAuth } from '../hooks/useAuth';
import { Form } from "../db/FormRepo";
import { Scheme } from "../db/SchemeRepo";
import { useClientConfig } from '../hooks/useClientConfig';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { widgets } from "../components/widgets/formWidgets";
import { FormHeader } from "../components/widgets/formHeader";
import { PageIdContext } from '../contexts/PageIdContext';
import Logger from "../logger/Logger";
import CorrectiveAction from "../components/widgets/correctiveAction";
import ImageUpload, { ImageUploadRef } from "../components/widgets/imageUpload";
import { RJSFValidationError } from "@rjsf/utils";
import CustomErrorList from "../components/CustomErrorList";
import { toLocalISOString } from '../utils/dateUtils';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import HelpOutlineIcon from '@mui/icons-material/QuestionMark';
import VideoModal from "../components/VideoModal";


function Edit() {
    const db = useDatabase();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isOnline = useOnlineStatus();
    const formRef = useRef<FormRjsfType | null>(null);
    const { schemes, helpVideo } = useClientConfig();
    const { userId } = useAuth();
    const { formId, pageId } = useParams<{ formId: string, pageId: string }>();
    const [data, setData] = useState<Form | null>(null);
    const [scheme, setScheme] = useState<Scheme | null>(null);
    const [isEdit, setIsEdit] = useState<boolean>(false)
    const [change, setChange] = useState<boolean>(false)
    //const [changed, setChanged] = useState<boolean>(false)
    const [widgetCA, setWidgetCA] = useState<boolean>(false)
    const [widgetImage, setWidgetImage] = useState<boolean>(false)
    const [showModalCA, setShowModalCA] = useState<boolean>(false)
    const [schemeIdCA, setSchemeIdCA] = useState<string>("");
    const [newForm, setNewForm] = useState<boolean>(true);
    const afterDataRef = useRef<Form | null>(null);
    const saveTimeoutRef = useRef<number | null>(null);
    const imageUploadRef = useRef<ImageUploadRef | null>(null);
    const [isImageLoading, setIsImageLoading] = useState(false);
    const [helpVideoUrl, setHelpVideoUrl] = useState("");
    const [videoModalOpen, setVideoModalOpen] = useState(false);

    const rememberLastTopFields = (pageId: string, userId: string, formData: any, excludeKeys: string[] = []) => {
        const topLevelData: Record<string, any> = {};
        for (const key in formData) {
            if (
                typeof formData[key] !== "object" &&
                !excludeKeys.includes(key)
            ) {
                topLevelData[key] = formData[key];
            }
        }
        localStorage.setItem(`lastTopFields_${pageId}_${userId}`, JSON.stringify(topLevelData));
    }

    const applyLastTopFields = (pageId: string, userId: string, newFormData: any, excludeKeys: string[] = []) => {
        const setting_autoField = localStorage.getItem("setting_autoField");
        let autoField = false;
        if (setting_autoField === null) {
            const stored = localStorage.getItem(`lastTopFields_${pageId}_${userId}`);
            autoField = stored !== null;
            localStorage.setItem("setting_autoField", autoField.toString());
        } else {
            autoField = setting_autoField === 'true';
        }

        if (!autoField) {
            return;
        }
        const item = localStorage.getItem(`lastTopFields_${pageId}_${userId}`);
        if (!item) return;

        let storedData: Record<string, any>;
        try {
            storedData = JSON.parse(item);
        } catch {
            return;
        }

        for (const key in storedData) {
            if (!excludeKeys.includes(key)) {
                newFormData[key] = storedData[key];
            }
        }
    }

    useEffect(() => {
        if (pageId && typeof helpVideo["helpv_" + pageId] !== "undefined") {
            setHelpVideoUrl(helpVideo["helpv_" + pageId]);
        }
    }, [helpVideo, pageId]);

    useEffect(() => {
        if (userId && formId && formId === "new" && pageId) {
            if (schemes && schemes[parseInt(pageId)]) {
                const schemeInfo = schemes[parseInt(pageId)];
                setScheme(schemeInfo);

                const tableName = `ExtDB${schemeInfo.info.table_id}`;
                const today = toLocalISOString();
                const guid = uuidv4().toUpperCase();
                const newForm: Form = {
                    id: 0,
                    guid: guid,
                    pageId: pageId,
                    tableId: schemeInfo.info.table_id,
                    isEdit: 1,
                    isSynced: 0,
                    isValid: 0,
                    data: {
                        [`${tableName}_id`]: "0",
                        [`${tableName}_guid`]: guid,
                        [`${schemeInfo.info.statusfield}`]: schemeInfo.info.statusnew,
                        [`${schemeInfo.info.datefield}`]: today,
                        [`${schemeInfo.info.userfield}`]: parseInt(userId),
                    },
                    modified: Date.now(),
                    created: Date.now(),
                    operation: 'app',
                    isReadOnly: 0,
                    rowstamp: "",
                    finish: "",
                    log: [],
                }

                if (schemeInfo.scheme && typeof schemeInfo.scheme.properties === 'object') {
                    Object.entries(schemeInfo.scheme.properties).forEach(([key, item]) => {
                        const property = item as { type?: string };
                        if (property.type && property.type === "array") {
                            newForm.data[key] = [];
                        }
                    });
                }

                // Set Auto field
                const excludeKeys = [
                    `${tableName}_guid`,
                    `${tableName}_id`,
                    schemeInfo.info.statusfield,
                    schemeInfo.info.datefield,
                    schemeInfo.info.userfield
                ];
                applyLastTopFields(pageId, userId, newForm.data, excludeKeys);

                setIsEdit(true);
                setData(newForm);
                Logger.debug(newForm);
            }
        } else if (userId && formId && formId !== "new" && pageId) {
            setNewForm(false);
            db?.formRepo.get(formId).then((formData) => {
                setData(formData);
                afterDataRef.current = formData;
                if (schemes && schemes[parseInt(pageId)]) {
                    setScheme(schemes[parseInt(pageId)]);
                }
                if (formData) {
                    if (formData['isReadOnly']) {
                        //setIsReadOnly(true);
                    } else {
                        formData['isEdit'] = 1;
                        setIsEdit(true);
                        db?.formRepo.update(formData['guid'], formData)
                    }
                }
            });
        }
    }, [db, formId, pageId, userId, schemes]);

    useEffect(() => {
        if (data && data.isValid === 0 && formRef.current) {
            formRef.current.validateForm();
        }
    }, [data, formRef]);

    useEffect(() => {
        if (scheme) {
            Object.entries(scheme.ui).forEach(([, item]) => {
                const property = item as { "ui:button"?: string, "ui:scheme"?: string };
                if (property["ui:button"] === "CA" && property["ui:scheme"]) {
                    setWidgetCA(true);
                    setSchemeIdCA(property["ui:scheme"]);
                }
            });
            if (scheme.ui["ui:image"]) {
                setWidgetImage(true);
            }
        }
    }, [scheme]);

    const setEditFalse = useCallback(async (data: Form) => {
        const newData = { ...data, isEdit: 0 }; //, isSynced: 0
        Logger.debug("data", newData);
        await db?.formRepo.update(newData.guid, newData);
    }, [db]);

    useBeforeUnload(() => {
        if (data && isEdit) {
            setEditFalse(data)
        }
        /*if (change && formRef.current && data) {
            if (!formRef.current.validateForm()) {
                event.preventDefault();
                event.returnValue = '';
                //return;
            }
        }*/
    });

    const onBackClick = async () => {
        /*if (change && formRef.current && data) {
            if (formRef.current.validateForm()) {
                setEditFalse(data);
                navigate(-1);
            }
        } else {
            navigate(-1);
        }*/
        if (change && formRef.current && data) {
            setEditFalse(data);
            navigate(-1);
        } else {
            navigate(-1);
        }
    };

    const saveDataWithDelay = useCallback((updatedData: any) => {
        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        const newTimeout = window.setTimeout(async () => {
            if (data && formRef.current) {
                //if (formRef.current.validateForm() || !valid) {
                //const validationResult = formRef.current.validate(updatedData);
                //const isValid = validationResult.errors.length === 0 ? 1 : 0;
                let finish = "";
                const currentStatus = data.data[`${scheme?.info.statusfield}`];
                if (typeof currentStatus === "string" && currentStatus.includes("Complete")) {
                    finish = "completed";
                }
                const curData = {
                    ...data, data: updatedData, isSynced: 0, modified: Date.now(), log: [],
                    isValid: formRef.current.validateForm() ? 1 : 0,
                    finish: finish
                };
                await db?.formRepo.add(curData.guid, curData);
                setData(curData);
                //setChanged(true);
                if (newForm === true) {
                    navigate(`/edit/${pageId}/${curData.guid}`, { replace: true });
                }
                setNewForm(false);

                const tableName = `ExtDB${scheme?.info.table_id}`;
                const excludeKeys = [
                    `${tableName}_guid`,
                    `${tableName}_id`,
                    scheme?.info.statusfield,
                    scheme?.info.datefield,
                    scheme?.info.userfield
                ];
                rememberLastTopFields(pageId!, userId!, curData.data, excludeKeys);

                Logger.debug("Data saved after delay: ", curData);
                //}
            }
        }, 500);

        saveTimeoutRef.current = newTimeout;

    }, [db, data]);

    const onChange = useCallback(({ formData }: any) => {
        if (data) {
            setChange(true);
            saveDataWithDelay(formData);
            const newData = { ...data, data: formData, log: [] };
            setData(newData);
        }
    }, [saveDataWithDelay, data]);

    /*const compareObjects = (originalData: any, newData: any, path = '') => {
        const log: any[] = [];

        const allKeys = new Set([...Object.keys(originalData), ...Object.keys(newData)]);

        for (const key of allKeys) {
            const originalValue = originalData[key] === undefined || originalData[key] === null ? "" : originalData[key];
            const newValue = newData[key] === undefined || newData[key] === null ? "" : newData[key];

            if (typeof originalValue === 'object' && originalValue !== null && typeof newValue === 'object' && newValue !== null) {
                log.push(...compareObjects(originalValue, newValue, path + key + '.'));
            } else if (originalValue !== newValue) {
                log.push({ field: `${path}${key}`, from: originalValue, to: newValue });
            }
        }

        return log;
    };*/

    const onSubmit = async ({ formData }: any) => {
        if (data) {
            if (data.data[`${scheme?.info.statusfield}`] !== scheme?.info.statusfinish) {
                data.finish = "completed";
                //data.data[`${scheme?.info.statusfield}`] = scheme?.info.statusfinish;
                const currentStatus = data.data[`${scheme?.info.statusfield}`];
                if (typeof currentStatus === "string" && !currentStatus.includes("Complete")) {
                    data.data[`${scheme?.info.statusfield}`] = scheme?.info.statusfinish;
                }
                const newData = { ...data, isSynced: 0, modified: Date.now(), isEdit: 0, log: [] };
                await db?.formRepo.update(newData.guid, newData);
                Logger.debug("Form submitted: ", formData);
            }
        }
        navigate(-1);
    };

    const onValidate = (errors: any) => {
        if (errors.length > 0) {
            const errorElement = document.querySelector('.Mui-error');
            if (errorElement) {
                errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
        return errors;
    };

    const triggerFormChange = () => {
        if (newForm && formRef.current?.onChange) {
            saveDataWithDelay(data?.data);
        }
    };

    const transformErrors = useCallback((errors: RJSFValidationError[]) => {
        return errors.map((error) => {
            if (error.name === "required") {
                return {
                    ...error,
                    message: `${t("form.error.required")}`,
                };
            }

            return {
                ...error,
                message: `${t("form.error.incorrectly")}`,
            };

        });
    }, []);


    if (!scheme || !data) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    flexDirection: 'column',
                }}
            >
                <Box sx={{ width: '80px', height: '80px' }}>
                    <Typography>Loading...</Typography>
                    <img
                        src="/assets/loader.gif"
                        alt="Loading..."
                        style={{ width: '100%', height: '100%' }}
                    />
                </Box>
            </Box>
        );
    }

    return (
        <>
            <Box sx={{ p: 2 }}>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <Typography variant="h5">{scheme?.info.title}</Typography>

                    {helpVideoUrl != "" && (
                        <Box display="flex" alignItems="center" gap={0.5}>
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
                </Box>
                <Card sx={{ marginTop: '20px' }}>
                    <Box sx={{ p: 3 }}>
                        <PageIdContext.Provider value={pageId}>
                            <FormHeader readonly={data?.isReadOnly === 1 || false} />
                            {/*formRef.current && !formRef.current.validateForm() && change && (
                            <Alert severity="error">
                                The form will not be saved until you fill in the required fields.
                            </Alert>
                        )*/}
                            <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2, marginTop: 4 }}>
                                {widgetImage && scheme?.info.table_type === "SOR" && (
                                    <Button
                                        variant="contained"
                                        disableRipple
                                        color="primary"
                                        onClick={() => imageUploadRef.current?.openFileDialog()}
                                        sx={{
                                            minWidth: '40px',
                                            padding: '6px',
                                        }}
                                    >
                                        {isImageLoading ? (
                                            <CircularProgress size={24} sx={{ color: '#fff' }} />
                                        ) : (
                                            <PhotoCameraIcon />
                                        )}
                                    </Button>
                                )}
                                <Box sx={{ flex: 1 }} />
                                {!newForm && widgetCA && (
                                    <Button
                                        variant="contained"
                                        disableRipple
                                        color="error"
                                        onClick={() => { setShowModalCA(true); }}
                                    >
                                        Corrective Action
                                    </Button>
                                )}

                            </Box>
                            <CorrectiveAction
                                formContext={data}
                                guidParent=""
                                tableParent=""
                                showModalCA={showModalCA}
                                schemeId={schemeIdCA}
                                onClose={() => setShowModalCA(false)}
                            />
                            <FormRjsf
                                ref={formRef}
                                schema={scheme?.scheme}
                                uiSchema={scheme?.ui}
                                formData={data?.data}
                                validator={validator}
                                onError={onValidate}
                                onSubmit={onSubmit}
                                onChange={onChange}
                                widgets={widgets}
                                readonly={data?.isReadOnly === 1}
                                formContext={data}
                                transformErrors={transformErrors}
                                showErrorList={false}
                                noHtml5Validate={true}
                                templates={{
                                    ErrorListTemplate: CustomErrorList,
                                }}
                            >
                                {widgetImage && (
                                    <ImageUpload
                                        ref={imageUploadRef}
                                        uniqueKey="img-upload"
                                        formContext={data}
                                        guidParent=""
                                        tableParent=""
                                        onChange={() => triggerFormChange()}
                                        hideAddButton={scheme?.info.table_type === "SOR"}
                                        onLoadingChange={(loading) => setIsImageLoading(loading)}
                                    />
                                )}

                                <Box display="flex" justifyContent="space-between" sx={{ marginTop: 2 }}>
                                    <Button type="button" id="backButtonForm" disableRipple onClick={onBackClick} variant="contained" color="secondary" sx={{ fontSize: '0.75em', minWidth: '120px', fontWeight: '600', maxHeight: '37px' }}>
                                        {t("edit.back")}
                                    </Button>
                                    {!data?.isReadOnly && !newForm && (<Button type="submit" disableRipple variant="contained" sx={{ fontSize: '0.75em', minWidth: '120px', fontWeight: '600', maxHeight: '37px' }} color="success">
                                        {t("general.finish")}
                                    </Button>)}
                                </Box>
                            </FormRjsf>
                        </PageIdContext.Provider>
                    </Box>
                </Card>
            </Box>
            {helpVideoUrl !== "" && (
                <VideoModal open={videoModalOpen} isOnline={isOnline} videoUrl={helpVideoUrl} onClose={() => setVideoModalOpen(false)} />
            )}
        </>
    );
}

export default Edit;
