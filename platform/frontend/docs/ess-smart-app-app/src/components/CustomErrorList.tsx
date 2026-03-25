import React from 'react';
import { ErrorListProps } from '@rjsf/utils';
import { Card, ListItem, ListItemText } from '@mui/material';
import { Box } from '@mui/system';

const CustomErrorList: React.FC<ErrorListProps> = ({ errors }) => {
    if (errors.length === 0) {
        return null;
    }

    return (
        <Card sx={{ marginTop: '20px' }}>
            <Box sx={{ p: 3 }}>
                {errors.map((error, index) => (
                    error ? (
                        <ListItem key={index} disableGutters>
                            <ListItemText primary={error.message} />
                        </ListItem>
                    ) : null
                ))}
            </Box>
        </Card>
    );
};

export default CustomErrorList;