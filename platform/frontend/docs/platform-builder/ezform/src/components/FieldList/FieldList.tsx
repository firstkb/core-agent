import React from 'react';
import { List, ListItem, Box } from '@mui/material';
import DraggableField from './DraggableField';
import { useFormContext } from '../../hook/useFormContext';
import { FieldType } from '../../context/FormContext';

const FieldList: React.FC = () => {
    const { availableFieldTypes, selectedParentField } = useFormContext();

    let filteredFieldTypes: FieldType[] = [];

    if (selectedParentField && selectedParentField.type) {
        const parentType = selectedParentField.type;
        const parentFieldType = availableFieldTypes.find(ft => ft.type === parentType);

        if (parentFieldType) {
            // Получаем списки allowedChildTypes и disabledChildTypes
            const { allowedChildTypes, disabledChildTypes } = parentFieldType;

            // Фильтруем доступные типы полей
            filteredFieldTypes = availableFieldTypes.filter(ft => {
                const fieldType = ft.type;

                // Проверяем allowedChildTypes
                if (allowedChildTypes && !allowedChildTypes.includes(fieldType)) {
                    return false;
                }

                // Проверяем disabledChildTypes
                if (disabledChildTypes && disabledChildTypes.includes(fieldType)) {
                    return false;
                }

                // Проверяем allowedParentTypes у поля
                if (ft.allowedParentTypes && !ft.allowedParentTypes.includes(parentType)) {
                    return false;
                }

                return true;
            });
        } else {
            // Если у родителя нет специфических ограничений, включаем все поля, кроме тех, которые запрещают этого родителя
            filteredFieldTypes = availableFieldTypes.filter(ft => {
                if (ft.allowedParentTypes && !ft.allowedParentTypes.includes(parentType)) {
                    return false;
                }
                return true;
            });
        }
    } else {
        // Нет выбранного родительского поля (корень)
        filteredFieldTypes = availableFieldTypes.filter(ft => !ft.allowedParentTypes);
    }


    return (
        <Box sx={{ width: '20%', minWidth: 200, borderRight: '1px solid #ccc', overflowY: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
            <List>
                {filteredFieldTypes.map((field, index) => (
                    <ListItem className='list-item-field' key={`${field.type}-${index}`} sx={{ width: '100%' }}>
                        <DraggableField key={`d-${field.type}-${index}`} field={field} />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default FieldList;