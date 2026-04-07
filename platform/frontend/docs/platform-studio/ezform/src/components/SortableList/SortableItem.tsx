// SortableItem.tsx
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IconButton } from '@mui/material';
import { DragHandle as DragHandleIcon } from '@mui/icons-material';

interface SortableItemProps {
    id: string;
    children: React.ReactNode;
}

const SortableItem: React.FC<SortableItemProps> = ({ id, children }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        display: 'flex',
        alignItems: 'center',
        margin: '2px', // Добавьте отступы, если необходимо
    };

    return (
        <div ref={setNodeRef} style={style}>
            <IconButton {...listeners} {...attributes} sx={{ marginRight: 1 }}>
                <DragHandleIcon />
            </IconButton>
            <div style={{ flexGrow: 1 }}>{children}</div>
        </div>
    );
};

export default SortableItem;