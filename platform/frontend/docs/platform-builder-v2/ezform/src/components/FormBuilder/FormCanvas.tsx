import React from 'react';
import { Box, Card, CardContent, CardHeader, Typography, Button, Breadcrumbs, Link } from '@mui/material';
import { useFormContext } from '../../hook/useFormContext';
import { generateSchemas } from '../../utils/schemaGenerator';
import SortableList from '../SortableList/SortableList';
import FormField from './FormField';
import { useDroppable } from '@dnd-kit/core';
import { Field } from '../../context/FormContext';

const FormCanvas: React.FC = () => {
    const { fields, formSettings, moveField, selectedParentId, selectedParentStack, selectParent } = useFormContext();
    const { dataSchema, uiSchema } = generateSchemas(fields, formSettings);

    // Настройка дропа для перетаскивания новых полей на холст
    const { isOver, setNodeRef } = useDroppable({
        id: 'form-canvas',
    });

    const getFieldById = (fields: Field[], id: string): Field | null => {
        for (const field of fields) {
            if (field.id === id) {
                return field;
            }
            if (field.children && field.children.length > 0) {
                const result = getFieldById(field.children, id);
                if (result) {
                    return result;
                }
            }
        }
        return null;
    };


    const handleMoveField = (fromIndex: number, toIndex: number) => {
        moveField(fromIndex, toIndex);
    };

    const handleBackClick = () => {
        if (selectedParentStack.length > 0) {
            const newParentStack = selectedParentStack.slice(0, -1);
            const newParentId = newParentStack.length > 0 ? newParentStack[newParentStack.length - 1] : null;
            selectParent(newParentId);
        }
    };

    // Определение текущего списка полей в зависимости от выбранного родителя
    const getCurrentFields = (fields: Field[], parentId: string | null): Field[] => {
        if (!parentId) return fields;
        const findParent = (fields: Field[], parentId: string): Field | undefined => {
            for (let field of fields) {
                if (field.id === parentId) {
                    return field;
                }
                if (field.children && field.children.length > 0) {
                    const found = findParent(field.children, parentId);
                    if (found) return found;
                }
            }
            return undefined;
        };
        const parentField = findParent(fields, parentId);
        return parentField?.children || [];
    };

    const currentFields = getCurrentFields(fields, selectedParentId);

    return (
        <>
            <Card>
                <CardHeader title={formSettings.formTitle} />
                <CardContent>
                    {selectedParentStack.length > 0 && (
                        <>
                            <Breadcrumbs aria-label="breadcrumb" style={{ marginBottom: 16 }}>
                                <Link
                                    color="inherit"
                                    onClick={() => selectParent(null)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    Root
                                </Link>
                                {selectedParentStack.map((parentId, index) => {
                                    const field = getFieldById(fields, parentId);
                                    const fieldTitle = field ? field.title || field.label || `Level ${index + 1}` : `Level ${index + 1}`;

                                    return (
                                        <Link
                                            key={parentId}
                                            color="inherit"
                                            onClick={() => {
                                                // Сокращаем стек до нужного уровня
                                                const newParentStack = selectedParentStack.slice(0, index + 1);
                                                const newParentId = newParentStack[newParentStack.length - 1];
                                                selectParent(newParentId);
                                            }}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {fieldTitle}
                                        </Link>
                                    );
                                })}
                            </Breadcrumbs>
                            <Button variant="outlined" size="small" onClick={handleBackClick} style={{ marginBottom: 16 }}>
                                Back
                            </Button>
                        </>
                    )}
                    <Box
                        ref={setNodeRef}
                        sx={{
                            minHeight: '100%',
                            p: 2,
                            border: isOver ? '2px dashed #000' : '2px dashed #ccc',
                            backgroundColor: isOver ? '#f0f0f0' : 'inherit',
                        }}
                    >
                        {currentFields.length === 0 ? (
                            <Typography variant="h6" color="textSecondary">
                                Drag form elements here
                            </Typography>
                        ) : (
                            <SortableList
                                items={currentFields}
                                onMove={handleMoveField}
                                renderItem={(field: Field) => (
                                    <FormField field={field} />
                                )}
                            />
                        )}
                    </Box>
                </CardContent>
            </Card>
            <Card sx={{ marginTop: 4 }}>
                <CardContent>
                    <Typography sx={{ fontWeight: 600 }}>Data</Typography>
                    <pre>{JSON.stringify(dataSchema, null, 2)}</pre>
                    <Typography sx={{ fontWeight: 600 }}>UI</Typography>
                    <pre>{JSON.stringify(uiSchema, null, 2)}</pre>
                </CardContent>
            </Card>
        </>
    );
};

export default FormCanvas;
