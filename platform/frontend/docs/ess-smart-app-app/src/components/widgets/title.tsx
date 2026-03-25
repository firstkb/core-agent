import { FC } from 'react';
import { Box, Typography, Divider } from '@mui/material';
import { WidgetProps } from '@rjsf/utils';

export const Title: FC<WidgetProps> = ({ value, schema }) => {
    return (
      <Box>
          <Typography variant="h6">{value || schema.title || ''}</Typography>
          <Divider></Divider>
      </Box>
    );
  };
  