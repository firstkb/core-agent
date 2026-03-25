import { useState, useEffect, useContext, useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Box, Modal, Card, CardContent, IconButton, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Typography, CircularProgress } from '@mui/material';
import RotateLeftIcon from '@mui/icons-material/RotateLeft';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
//import heic2any from "heic2any";
import { useDatabase } from '../../hooks/useDatabase';
import { OnlineStatusContext } from '../../contexts/OnlineStatusContext';
import { File } from "../../db/FileRepo";
import { Form } from "../../db/FormRepo";
import * as markerjs2 from "markerjs2";

interface ImageUploadProps {
    uniqueKey: string;
    formContext: Form;
    guidParent: string;
    tableParent: string;
    onChange?: (img: File) => void;
    hideAddButton?: boolean;
    onLoadingChange?: (loading: boolean) => void;
}

export interface ImageUploadRef {
    openFileDialog: () => void;
}

export const ImageUpload = forwardRef<ImageUploadRef, ImageUploadProps>((props, ref) => {
    const {
        uniqueKey,
        formContext,
        guidParent,
        tableParent,
        onChange,
        hideAddButton = false,
        onLoadingChange
    } = props;
    const { t } = useTranslation();
    const [images, setImages] = useState<File[]>([]);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [parentGuid, setParentGuid] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState<boolean>(false);
    const [modalHide, setModalHide] = useState<boolean>(false);
    const [imageToDelete, setImageToDelete] = useState<File | null>(null);
    const [unsupportedFormat, setUnsupportedFormat] = useState<string | null>(null);
    const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({}); // состояние для хранения ошибок изображений
    const isOnline = useContext(OnlineStatusContext);
    const db = useDatabase();
    const aspUrl = localStorage.getItem('aspUrl');
    const markerImageRef = useRef<HTMLImageElement | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
        openFileDialog() {
            fileInputRef.current?.click();
        }
    }));

    useEffect(() => {
        if (guidParent === "" && formContext.guid) {
            setParentGuid(formContext.guid);
        } else if (guidParent !== "") {
            setParentGuid(guidParent);
        }
    }, [guidParent, formContext]);

    const sortedImages = useMemo(() => {
        return [...images].sort((a, b) => { return a.created > b.created ? 1 : -1 });
    }, [images]);

    useEffect(() => {
        const fetchImages = async () => {
            const storedImages = await db?.fileRepo.getFromParentGuid(parentGuid);
            const activeImages = storedImages?.filter(image => image.isDelete === 0);
            setImages(activeImages || []);
        };
        fetchImages();
    }, [db, parentGuid]);

    const generateFileId = (mainGuid: string, name: string, parentGuid: string): string => {
        return `${mainGuid}_${name}_${parentGuid}`;
    };

    const generateNameFile = (): string => {
        const firstPart = ("000" + ((Math.random() * 4665659) | 0).toString(36)).slice(-6);
        const secondPart = ("000" + ((Math.random() * 4665659) | 0).toString(36)).slice(-6);
        return `${firstPart}${secondPart}.jpg`;
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (file) {
            setIsLoading(true);
            onLoadingChange?.(true);

            const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
            if (!supportedFormats.includes(file.type)) {
                setUnsupportedFormat(t("edit.image.info_unformat"));
                setIsLoading(false);
                onLoadingChange?.(false);
                return;
            }
            setUnsupportedFormat(null);


            const reader = new FileReader();
            reader.onload = async () => {
                const convertedSource = await convertToJPEG(reader.result as string, file.type);
                const newImage: File = {
                    id: "",
                    name: generateNameFile(), //file.name,
                    parentId: 0,
                    parentGuid: guidParent && guidParent !== "" ? guidParent : formContext.guid,
                    mainGuid: formContext.guid,
                    table: tableParent && tableParent !== "" ? tableParent : 'ExtDb' + formContext.tableId,
                    isSynced: 0,
                    isDelete: 0,
                    source: convertedSource,
                    modified: Date.now(),
                    created: Date.now(),
                    operation: 'app',
                    log: []
                };
                newImage.id = generateFileId(newImage.mainGuid, newImage.name, newImage.parentGuid);
                await db?.fileRepo.add(newImage.id, newImage);
                setImages((prevImages) => [...prevImages, newImage]);
                if (onChange) {
                    onChange(newImage);
                }
                setIsLoading(false);
                setTimeout(() => {
                    onLoadingChange?.(false);
                }, 1500);
            };
            reader.readAsDataURL(file);
        }
    };

    const convertToJPEG = (dataURL: string, type: string): Promise<string> => {
        const defaultImage = {
            width: 1440,
            height: 1080,
            quality: 0.95
        };

        return new Promise((resolve) => {
            const img = new Image();
            const appleFormats = ['image/heic', 'image/heif'];
            if (appleFormats.includes(type)) {
                convertHeifToPngBase64(dataURL).then((pngBase64) => {
                    img.src = pngBase64 as string;
                }).catch(error => {
                    console.error("Error convert:", error);
                });
            } else {
                img.src = dataURL;
            }
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let width = img.width;
                let height = img.height;

                if (width > defaultImage.width) {
                    height *= defaultImage.width / width;
                    width = defaultImage.width;
                }
                if (height > defaultImage.height) {
                    width *= defaultImage.height / height;
                    height = defaultImage.height;
                }

                canvas.width = width;
                canvas.height = height;
                ctx?.drawImage(img, 0, 0, width, height);
                const newDataURL = canvas.toDataURL('image/jpeg', defaultImage.quality);
                resolve(newDataURL);
            };
        });
    };

    const handleRotate = async (direction: number) => {
        await updateImageRotation(direction);
    };

    const updateImageRotation = async (direction: number) => {
        if (selectedImage) {
            const updatedImage = images.find(img => img.source === selectedImage);
            if (updatedImage) {

                if (!updatedImage.source.includes("data:image") && isOnline) {
                    const url = `${aspUrl}${updatedImage.source}`;

                    const img = new Image();
                    //img.crossOrigin = 'Anonymous';
                    img.src = url;

                    img.onload = async () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');

                        if (direction === 1 || direction === -1) {
                            canvas.width = img.height;
                            canvas.height = img.width;
                        } else {
                            canvas.width = img.width;
                            canvas.height = img.height;
                        }

                        if (ctx) {
                            ctx.setTransform(1, 0, 0, 1, 0, 0);
                            ctx.clearRect(0, 0, canvas.width, canvas.height);

                            switch (direction) {
                                case 1:
                                    ctx.translate(canvas.width, 0);
                                    ctx.rotate((90 * Math.PI) / 180);
                                    ctx.drawImage(img, 0, 0);
                                    break;
                                case -1:
                                    ctx.translate(0, canvas.height);
                                    ctx.rotate((-90 * Math.PI) / 180);
                                    ctx.drawImage(img, 0, 0);
                                    break;
                                default:
                                    ctx.drawImage(img, 0, 0);
                                    break;
                            }

                            const newSource = canvas.toDataURL('image/jpeg');
                            updatedImage.source = newSource;
                            updatedImage.isSynced = 0;

                            await db?.fileRepo.update(updatedImage.id, updatedImage);
                            setImages(images.map(img => (img.id === updatedImage.id ? updatedImage : img)));
                            setSelectedImage(newSource);
                        }
                    };

                    img.onerror = (error) => {
                        console.error("err download img:", error);
                    };
                } else {
                    processImageRotation(updatedImage, direction);
                }
            }
        }
    };

    const processImageRotation = async (updatedImage: File, direction: number) => {
        const imgElement = new Image();
        imgElement.src = updatedImage.source;

        imgElement.onload = async () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (direction === 1 || direction === -1) {
                canvas.width = imgElement.height;
                canvas.height = imgElement.width;
            } else {
                canvas.width = imgElement.width;
                canvas.height = imgElement.height;
            }

            if (ctx) {
                ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                switch (direction) {
                    case 1:
                        ctx.translate(canvas.width, 0);
                        ctx.rotate((90 * Math.PI) / 180);
                        ctx.drawImage(imgElement, 0, 0);
                        break;
                    case -1:
                        ctx.translate(0, canvas.height);
                        ctx.rotate((-90 * Math.PI) / 180);
                        ctx.drawImage(imgElement, 0, 0);
                        break;
                    default:
                        ctx.drawImage(imgElement, 0, 0);
                        break;
                }

                const newSource = canvas.toDataURL('image/jpeg');
                updatedImage.source = newSource;
                updatedImage.isSynced = 0;

                await db?.fileRepo.update(updatedImage.id, updatedImage);
                setImages(images.map(img => (img.id === updatedImage.id ? updatedImage : img)));
                setSelectedImage(newSource);
            }
        };
    };

    const convertHeifToPngBase64 = async (heifBase64: string) => {
        try {
            const response = await fetch(heifBase64);
            const heifBlob = await response.blob();

            const heic2any = (await import('heic2any')).default;

            const conversionResult = await heic2any({
                blob: heifBlob,
                toType: "image/png",
            });

            const resultBlob = Array.isArray(conversionResult)
                ? conversionResult[0]
                : conversionResult;

            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = function () {
                    const base64data = reader.result as string;
                    resolve(base64data);
                };
                reader.onerror = reject;
                reader.readAsDataURL(resultBlob);
            });
        } catch (error) {
            console.error("Error convert HEIF to PNG:", error);
            throw error;
        }
    };

    const handleDeleteImage = async (fileToDelete: File) => {
        if (fileToDelete.source.includes("data:image")) {
            await db?.fileRepo.delete(fileToDelete.id);
        } else {
            const newDelete = { ...fileToDelete, isSynced: 0, isDelete: 1 };
            await db?.fileRepo.update(fileToDelete.id, newDelete);
        }
        setImages(images.filter(image => image.id !== fileToDelete.id));
        setSelectedImage(null);
        setIsDeleteConfirmOpen(false);
    };

    const confirmDeleteImage = (image: File) => {
        setImageToDelete(image);
        setIsDeleteConfirmOpen(true);
    };

    const handleCloseDeleteConfirm = () => {
        setIsDeleteConfirmOpen(false);
        setImageToDelete(null);
    };

    const handleSelectImage = (image: string) => {
        setSelectedImage(image);
    };

    const handleCloseModal = () => {
        setSelectedImage(null);
    };

    const handleImageError = (index: number, imageId: string) => {
        setImageErrors((prevErrors) => ({ ...prevErrors, [imageId]: true }));
        const image = sortedImages[index];
        if (image) {
            image.isDelete = 1;
            db?.fileRepo.update(image.id, image);
        }
    };

    const handleMarker = async () => {
        if (!markerImageRef.current || !selectedImage) return;
        //handleCloseDeleteConfirm();
        const imageForMarker = new Image();
        imageForMarker.src = selectedImage;
        imageForMarker.style.position = 'absolute';
        imageForMarker.style.left = '-9999px';
        document.body.appendChild(imageForMarker);

        imageForMarker.onload = () => {

            const markerArea = new markerjs2.MarkerArea(imageForMarker);
            markerArea.settings.displayMode = 'popup';
            markerArea.uiStyleSettings.redoButtonVisible = true;
            markerArea.uiStyleSettings.notesButtonVisible = true;
            markerArea.uiStyleSettings.zoomButtonVisible = true;
            markerArea.uiStyleSettings.zoomOutButtonVisible = true;
            markerArea.uiStyleSettings.clearButtonVisible = true;
            markerArea.uiStyleSettings.notesButtonVisible = false;
            markerArea.uiStyleSettings.toolbarStyleColorsClassName = 'markerjs-toolbar';

            markerArea.availableMarkerTypes = [
                markerjs2.FreehandMarker,
                markerjs2.CalloutMarker,
                markerjs2.LineMarker,
                markerjs2.ArrowMarker,
                markerjs2.TextMarker,
                markerjs2.HighlightMarker,
            ];

            markerArea.addEventListener("render", async (event) => {
                const dataUrl = event.dataUrl;

                const updatedImage = images.find(img => img.source === selectedImage);
                if (!updatedImage) return;

                updatedImage.source = dataUrl;
                updatedImage.isSynced = 0;
                await db?.fileRepo.update(updatedImage.id, updatedImage);

                setImages(images.map(img => (img.id === updatedImage.id ? updatedImage : img)));
                setSelectedImage(dataUrl);
            });

            markerArea.addEventListener("show", async () => {
                setModalHide(true);
            });

            markerArea.addEventListener("close", async () => {
                document.body.removeChild(imageForMarker);
                setModalHide(false);
            });

            markerArea.show();
        }
    };


    return (
        <div style={{ marginBottom: '32px', marginTop: '16px' }}>
            <Box display="flex" flexWrap="wrap" marginBottom={2}>
                {sortedImages.map((image, index) => (
                    !image.source.includes("data:image") && !isOnline ? (
                        <Box
                            key={`${uniqueKey}-${index}`}
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100px',
                                height: '100px',
                                marginRight: '10px',
                                marginBottom: '10px',
                                border: '1px solid #ccc',
                                textAlign: 'center',
                                cursor: 'pointer',
                                fontSize: '14px',
                                borderRadius: '5px'
                            }}
                        >
                            {t("general.offline")}
                        </Box>
                    ) : (
                        !imageErrors[image.id] && (
                            <img
                                key={`${uniqueKey}-${index}`}
                                src={image.source.includes("data:image") ? image.source : `${aspUrl}${image.source}`}
                                alt={`${image.name}`}
                                style={{ width: '100px', height: '100px', marginRight: '10px', objectFit: 'cover', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '5px' }}
                                onClick={() => {
                                    handleSelectImage(image.source);
                                }}
                                onError={() => handleImageError(index, image.id)}
                            />
                        )
                    )
                ))}
            </Box>
            <input
                ref={fileInputRef}
                style={{ display: 'none' }}
                id={`${uniqueKey}-btn`}
                type="file"
                accept="image/*;capture=camera"
                onChange={handleFileChange}
            />
            {!hideAddButton && (
                <label htmlFor={`${uniqueKey}-btn`}>
                    <Button
                        variant="contained"
                        component="span"
                        sx={{ fontSize: '0.75em', minWidth: '120px', fontWeight: '600', maxHeight: '37px' }}
                        disabled={isLoading}
                    >
                        {isLoading ? <CircularProgress size={24} /> : t("edit.image.add")}
                    </Button>
                </label>
            )}
            {unsupportedFormat && (
                <Typography color="error" variant="body2" sx={{ mt: 1 }}>{unsupportedFormat}</Typography>
            )}

            {selectedImage && (
                <Modal
                    open={Boolean(selectedImage)}
                    onClose={handleCloseModal}
                    className={modalHide ? 'img-modal-hide' : ''}
                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <Card sx={{ maxWidth: 500, width: '100%', overflowY: 'auto', height: 'auto' }}>
                        <CardContent sx={{ height: 'auto' }}>
                            <Box position="relative" textAlign="center" sx={{ height: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <img
                                    ref={markerImageRef}
                                    src={selectedImage.includes("data:image") ? selectedImage : `${aspUrl}${selectedImage}`}
                                    alt="Selected"
                                    style={{
                                        maxWidth: '100%',
                                        minHeight: '50vh',
                                        maxHeight: '80vh',
                                        objectFit: 'contain',
                                    }}
                                />

                                <IconButton onClick={handleCloseModal} sx={{ position: 'absolute', top: 0, right: 0, background: "rgba(255,255,255, 0.2)" }}>
                                    <CloseIcon />
                                </IconButton>
                                <Box display="flex" justifyContent="center" marginTop={2}>
                                    {selectedImage.includes("data:image") && (<IconButton onClick={() => handleRotate(-1)}>
                                        <RotateLeftIcon />
                                    </IconButton>)}
                                    {selectedImage.includes("data:image") && (<IconButton onClick={() => handleRotate(1)}>
                                        <RotateRightIcon />
                                    </IconButton>)}
                                    {selectedImage.includes("data:image") && (<IconButton onClick={() => handleMarker()}>
                                        <EditIcon />
                                    </IconButton>)}
                                    <IconButton
                                        color="error"
                                        onClick={() => confirmDeleteImage(images.find(img => img.source === selectedImage) as File)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Box>
                        </CardContent>
                    </Card>
                </Modal>
            )}

            <Dialog
                open={isDeleteConfirmOpen}
                onClose={handleCloseDeleteConfirm}
            >
                <DialogTitle>{t("edit.image.del_title")}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {t("edit.image.del_info")}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeleteConfirm} color="primary">
                        {t("general.cancel")}
                    </Button>
                    <Button onClick={() => handleDeleteImage(imageToDelete!)} color="error" autoFocus>
                        {t("general.delete")}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
});

export default ImageUpload;