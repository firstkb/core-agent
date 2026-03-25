import { FC } from 'react';
import { Box } from '@mui/material';
import { WidgetProps } from '@rjsf/utils';

export const Html: FC<WidgetProps> = ({ uiSchema }) => {
    const htmlContent = uiSchema && uiSchema["ui:options"] && uiSchema["ui:options"]["html"];

    return (
        <Box display="flex" justifyContent="space-between" sx={{ marginBottom: 2 }}>
            {htmlContent && (
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            )}
        </Box>
    );
};