import { FC } from 'react';
import { Box, Button } from '@mui/material';
import { useTranslation } from 'react-i18next';

interface FormHeaderProps {
    readonly: boolean;
}

export const FormHeader: FC<FormHeaderProps> = ({ readonly }) => {
    const { t } = useTranslation();

    const onBackClick = () => {
        document.getElementById('backButtonForm')?.click();
    };

    return (
        <div>
            <Box display="flex" justifyContent="space-between" sx={{ marginBottom: 2 }}>
                <Button type="button" disableRipple onClick={onBackClick} sx={{ fontSize: '0.75em', minWidth: '120px', fontWeight: '600', maxHeight: '37px', whiteSpace: 'nowrap' }} variant="contained" color="secondary">
                    {t("edit.back")}
                </Button>

                {!readonly ? (
                    <div style={{ paddingLeft: 15, fontSize: '0.75em', textAlign: "left", color: 'grey.900' }}>
                        {t("edit.info_save_1")}
                        <br />{t("edit.info_save_2")}
                    </div>
                ) : (
                    <div style={{ paddingLeft: 15, fontSize: '0.75em', textAlign: "left", color: 'grey.900' }}>
                        {t("edit.info_read_only")}
                    </div>
                )}
            </Box>
        </div>
    );
};