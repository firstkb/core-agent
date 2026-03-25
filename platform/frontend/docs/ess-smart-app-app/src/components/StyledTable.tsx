import React from 'react';
import { styled } from '@mui/material/styles';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import { Theme } from '@mui/material/styles';

interface StyledTableRowProps {
    isEven: boolean;
    children?: React.ReactNode;
}

const StyledTableCell = styled(TableCell)(({ theme }: { theme: Theme }) => ({
    [`&.${tableCellClasses.head}`]: {
        backgroundColor: theme.palette.common.white,
        color: theme.palette.common.black,
        whiteSpace: 'nowrap',
        fontWeight: 600,
    },
    [`&.${tableCellClasses.body}`]: {
        fontSize: 14,
        whiteSpace: 'nowrap',
    },
}));

const StyledTableRow = styled(TableRow, {
    shouldForwardProp: (prop) => prop !== 'isEven'
})<StyledTableRowProps>(({ theme, isEven }) => ({
    backgroundColor: isEven ? theme.palette.action.hover : 'inherit',
    '&:last-child td, &:last-child th': {
        border: 0,
    },
}));

export { StyledTableCell, StyledTableRow };