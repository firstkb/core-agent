import React, { useState, useEffect } from 'react';
import { List, Checkbox, Box, Typography } from '@mui/material';
import { useFormContext } from '../../hook/useFormContext';
import SortableList from '../SortableList/SortableList';
import { Field } from '../../context/FormContext';

const GridSettingsTab: React.FC = () => {
    const { fields, updateField } = useFormContext();

    const [localFields, setLocalFields] = useState<Field[]>([]);

    // Инициализация локального состояния
    useEffect(() => {
        const flatFields = flattenFields(fields);
        const sortedFields = flatFields.sort((a, b) => (a.pidGrid ?? 0) - (b.pidGrid ?? 0));
        setLocalFields(sortedFields);
    }, [fields]);

    useEffect(() => {
        handleSaveOrder();
    }, [localFields]);

    // Функция для рекурсивного сбора полей с уровнем вложенности
    const flattenFields = (fields: Field[], level: number = 0, parentId: string | null = null): any[] => {
        let result: any[] = [];
        for (const field of fields) {
            result.push({ ...field, level, parentId });
            if (field.children && field.children.length > 0) {
                const childFields = flattenFields(field.children, level + 1, field.id);
                result = result.concat(childFields);
            }
        }
        return result;
    };

    // Обработка перемещения элементов
    const handleMoveItem = (fromIndex: number, toIndex: number) => {
        const updatedFields = [...localFields];
        const [movedField] = updatedFields.splice(fromIndex, 1);
        updatedFields.splice(toIndex, 0, movedField);

        setLocalFields(updatedFields);
    };

    // Обработка переключения отображения поля
    const handleToggleField = (id: string) => {
        const updatedFields = localFields.map((field) => {
            if (field.id === id) {
                const updatedField = { ...field, showInGrid: !field.showInGrid };
                // Обновляем поле в контексте
                updateField(id, { showInGrid: updatedField.showInGrid });
                return updatedField;
            }
            return field;
        });
        setLocalFields(updatedFields);
    };

    // Функция для сохранения порядка (обновление pidGrid)
    const handleSaveOrder = () => {
        localFields.forEach((field, index) => {
            updateField(field.id, { pidGrid: index });
        });
    };

    return (
        <>
            <List>
                <SortableList
                    items={localFields}
                    onMove={handleMoveItem}
                    renderItem={(field) => (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {!field.isContainer && <Checkbox
                                size='small'
                                checked={field.showInGrid !== false}
                                onChange={() => handleToggleField(field.id)}
                            />}
                            <Typography variant="body2" component="span">
                                {Array(field.level).fill('•').join(' ')} {field.title || field.label || field.type}
                            </Typography>
                        </Box>
                    )}
                />
            </List>
        </>
    );
};

export default GridSettingsTab;