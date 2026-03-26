import React from 'react';
import { Box, Typography } from '@mui/material';
import { useDraggable, DragOverlay } from '@dnd-kit/core';
import { FieldType } from '../../context/FormContext';
import iconMapping from '../../utils/iconMapping';

export interface DraggableFieldProps {
    field: FieldType;
}

const DraggableField: React.FC<DraggableFieldProps> = ({ field }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: field.type,
    });

    const IconComponent = iconMapping[field.icon || field.type] ? iconMapping[field.icon || field.type] : iconMapping['other'];

    const sxStyle = {
        transform: isDragging
            ? undefined
            : `translate3d(${transform?.x ?? 0}px, ${transform?.y ?? 0}px, 0)`,
        /*borderLeft: '2px solid #CCC',*/
        cursor: 'pointer',
        padding: 1,
        paddingLeft: '10px',
        background: '#F9FAFB',
        opacity: isDragging ? 1 : 1,
        display: 'flex',
        alignItems: 'center',
        "&:hover": {
            background: '#FFF',
        }
    };

    return (
        <>
            <Box
                ref={setNodeRef}
                sx={sxStyle}
                {...listeners}
                {...attributes}
            >
                {IconComponent && (
                    <IconComponent style={{ marginRight: 8 }} />
                )}
                <Typography variant="body1">{field.label}</Typography>
            </Box>
            {isDragging && (
                <DragOverlay>
                    <Box
                        style={{
                            background: '#F9FAFB',
                            padding: 4,
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'move',
                        }}
                    >
                        {IconComponent && (
                            <IconComponent style={{ marginRight: 8 }} />
                        )}
                        <Typography variant="body1">{field.label}</Typography>
                    </Box>
                </DragOverlay>
            )}
        </>
    );
};

export default DraggableField;