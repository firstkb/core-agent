import { Chip } from '@mui/material';
import type { ChipProps } from '@mui/material/Chip';
import type { StatusTone } from '../app/viewModel';

type Props = {
  label: string;
  tone?: StatusTone;
  size?: ChipProps['size'];
};

const colors: Record<StatusTone, ChipProps['color']> = {
  default: 'default',
  info: 'primary',
  success: 'success',
  warning: 'warning',
  error: 'error'
};

export function StatusChip({ label, tone = 'default', size = 'small' }: Props) {
  return <Chip size={size} label={humanize(label)} color={colors[tone]} variant={tone === 'default' ? 'outlined' : 'filled'} />;
}

function humanize(value: string): string {
  return value
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
