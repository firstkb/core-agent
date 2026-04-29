import { Box, Paper, Stack, Typography } from '@mui/material';
import type { Metric } from '../app/viewModel';
import { StatusChip } from './StatusChip';

type Props = {
  metrics: Metric[];
};

export function MetricStrip({ metrics }: Props) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: 'repeat(2, minmax(0, 1fr))',
          md: 'repeat(5, minmax(0, 1fr))'
        },
        gap: 1.5
      }}
    >
      {metrics.map((metric) => (
        <Paper
          key={metric.label}
          variant="outlined"
          sx={{
            p: 1.5,
            minHeight: 82,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderColor: 'divider'
          }}
        >
          <Stack spacing={0.25}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700 }}>
              {metric.label}
            </Typography>
            <Typography variant="h2">{metric.value}</Typography>
          </Stack>
          <StatusChip label={metric.badge} tone={metric.tone} />
        </Paper>
      ))}
    </Box>
  );
}
