import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { produce, Draft } from 'immer';
import { v4 as uuidv4 } from 'uuid';
import { FIELD_TYPES } from '../utils/constants';
import { generateSchemas } from '../utils/schemaGenerator';

interface UI {
    widget?: string;
    placeholder?: string;
    label?: string;
    options?: any;
}

interface Setting {
    type?: string;
    title?: string;
    default: string | number | boolean | string[];
    options?: string[];
}

export interface Field {
    id: string;
    type: string;
    icon?: string;
    label?: string;
    title?: string;
    default?: string;
    display?: string;
    required?: boolean;
    showInGrid?: boolean;
    pidGrid: number;
    isContainer?: boolean;
    containerType?: string;
    level?: any;
    settings?: Record<string, Setting>;
    ui?: UI;
    children?: Field[];
    allowedChildTypes?: string[];
}

export interface FieldType {
    type: string;
    icon?: string;
    label?: string;
    title?: string;
    default?: string;
    required?: boolean;
    display?: string;
    isContainer?: boolean;
    containerType?: string;
    settings?: Record<string, { type: string, title?: string, default: string | boolean | number | string[], options?: any[] }>;
    ui?: UI;
    allowedChildTypes?: string[];
    allowedParentTypes?: string[];
    disabledChildTypes?: string[];
}

export interface FormSettings {
    formTitle: string;
    formDescription: string;
}

export interface FormContextType {
    fields: Field[];
    availableFieldTypes: FieldType[];
    selectedField: Field | null;
    formSettings: FormSettings;
    addField: (type: string) => void;
    addFieldType: (newFieldType: FieldType) => void;
    updateField: (id: string, updates: Partial<Field>) => void;
    updateFormSettings: (updates: Partial<FormSettings>) => void;
    selectField: (id: string | null) => void;
    selectedFieldId: string | null;
    selectedParentId: string | null;
    selectedParentStack: string[];
    selectParent: (parentId: string | null) => void;
    resetParent: () => void;
    removeField: (id: string) => void;
    moveField: (fromIndex: number, toIndex: number) => void;
    getSchemas: () => { dataSchema: any; uiSchema: any };
    selectedParentField: Field | null;
}

export const FormContext = createContext<FormContextType | undefined>(undefined);

interface FormProviderProps {
    children: ReactNode;
    addFieldTypes?: FieldType[];
    scheme?: string;
    schemeUI?: string;
}

export const FormProvider: React.FC<FormProviderProps> = ({ children, addFieldTypes = [], scheme = "", schemeUI = "" }) => {
    const [fields, setFields] = useState<Field[]>([]);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
    const [selectedParentStack, setSelectedParentStack] = useState<string[]>([]);

    const [availableFieldTypes, setAvailableFieldTypes] = useState<FieldType[]>(FIELD_TYPES);
    const [formSettings, setFormSettings] = useState<FormSettings>({
        formTitle: 'Untitled Form',
        formDescription: '',
    });

    const selectParent = (parentId: string | null) => {
        if (parentId) {
            setSelectedParentStack(prev => {
                // Находим индекс нового parentId в стеке
                const existingIndex = prev.indexOf(parentId);

                if (existingIndex !== -1) {
                    // Если parentId уже в стеке, возвращаем только элементы до него включительно
                    return prev.slice(0, existingIndex + 1);
                } else {
                    // Если его нет в стеке, добавляем
                    return [...prev, parentId];
                }
            });
        } else {
            // При переходе на root очищаем весь стек
            setSelectedParentStack([]);
        }
        setSelectedParentId(parentId);
        setSelectedFieldId(parentId);
    };


    /*useEffect(() => {
        console.log("context", selectedParentStack);
    }, [selectedParentStack])*/

    useEffect(() => {
        if (addFieldTypes.length > 0) {
            addFieldTypes.forEach((newFieldType: FieldType) => {
                const exists = availableFieldTypes.some((fieldType) => fieldType.type === newFieldType.type);
                if (!exists) {
                    addFieldType(newFieldType);
                }
            });
        }
    }, [addFieldTypes, availableFieldTypes]);

    const resetParent = () => {
        setSelectedParentId(null);
        setSelectedParentStack([]);
    };

    const addFieldType = (newFieldType: FieldType) => {
        setAvailableFieldTypes((prevTypes) => [...prevTypes, newFieldType]);
    };

    const addField = (type: string) => {
        const fieldType = availableFieldTypes.find(f => f.type === type);

        if (fieldType) {
            const display = fieldType.display || 'Default';
            const isContainer = fieldType.isContainer || false;
            const newField: Field = {
                ...fieldType,
                id: uuidv4(),
                pidGrid: fields.length,
                showInGrid: false,
                display: display,
                isContainer: isContainer,
                children: [],
            };

            const currentParentId = selectedParentStack.length > 0 ? selectedParentStack[selectedParentStack.length - 1] : null;

            if (currentParentId) {
                setFields(prevFields =>
                    produce(prevFields, (draft: Draft<Field[]>) => {
                        const addChildToParent = (fields: Draft<Field[]>, parentId: string, newField: Field) => {
                            for (let field of fields) {
                                if (field.id === parentId) {
                                    field.children = [...(field.children || []), newField];
                                    return true;
                                } else if (field.children && field.children.length > 0) {
                                    if (addChildToParent(field.children, parentId, newField)) {
                                        return true;
                                    }
                                }
                            }
                            return false;
                        };

                        addChildToParent(draft, currentParentId, newField);
                    })
                );
            } else {
                setFields(prevFields => [...prevFields, newField]);
            }
        }
    };

    const removeField = (id: string) => {
        if (selectedFieldId === selectedParentId && selectedParentStack.length > 0) {
            const newParentStack = selectedParentStack.slice(0, -1);
            const newParentId = newParentStack.length > 0 ? newParentStack[newParentStack.length - 1] : null;
            selectParent(newParentId);
        }
        setFields((prevFields) =>
            produce(prevFields, (draft: Draft<Field[]>) => {
                const removeFieldRecursive = (fields: Draft<Field[]>, id: string) => {
                    for (let i = fields.length - 1; i >= 0; i--) {
                        const field = fields[i];
                        if (field.id === id) {
                            fields.splice(i, 1); // Удаляем поле из массива
                        } else if (field.children && field.children.length > 0) {
                            removeFieldRecursive(field.children, id); // Рекурсивно проверяем детей
                        }
                    }
                };

                removeFieldRecursive(draft, id);
            })
        );
    };

    const updateField = (id: string, updates: Partial<Field>) => {
        setFields((prevFields) =>
            produce(prevFields, (draft: Draft<Field[]>) => {
                const updateFieldRecursive = (fields: Draft<Field[]>, id: string, updates: Partial<Field>) => {
                    for (let field of fields) {
                        if (field.id === id) {
                            Object.assign(field, updates);
                            return true;
                        } else if (field.children && field.children.length > 0) {
                            if (updateFieldRecursive(field.children, id, updates)) {
                                return true;
                            }
                        }
                    }
                    return false;
                };
                updateFieldRecursive(draft, id, updates);
            })
        );
    };

    const updateFormSettings = (updates: Partial<FormSettings>) => {
        setFormSettings((prevSettings) => ({
            ...prevSettings,
            ...updates,
        }));
    };

    const selectField = (id: string | null) => {
        setSelectedFieldId(id);
    };

    const findFieldRecursive = (fields: Field[], fieldId: string | null): Field | null => {
        if (fieldId === null) {
            return null;
        }
        for (const field of fields) {
            if (field.id === fieldId) {
                return field;
            }
            if (field.children && field.children.length > 0) {
                const found = findFieldRecursive(field.children, fieldId);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    };

    const selectedField = selectedParentId
        ? findFieldRecursive(fields, selectedFieldId)
        : fields.find((f) => f.id === selectedFieldId) || null;

    //const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

    const moveField = (fromIndex: number, toIndex: number) => {
        setFields((prevFields) =>
            produce(prevFields, (draft) => {
                const moveRecursive = (fields: Draft<Field[]>, parentId: string | null, fromIndex: number, toIndex: number) => {
                    if (!parentId) {
                        const [removed] = fields.splice(fromIndex, 1);
                        fields.splice(toIndex, 0, removed);
                    } else {
                        const findParentRecursive = (fields: Draft<Field[]>, parentId: string): Draft<Field> | undefined => {
                            for (let field of fields) {
                                if (field.id === parentId) {
                                    return field;
                                }
                                if (field.children && field.children.length > 0) {
                                    const found = findParentRecursive(field.children, parentId);
                                    if (found) return found;
                                }
                            }
                            return undefined;
                        };

                        const parentField = findParentRecursive(fields, parentId);
                        if (parentField && parentField.children) {
                            const [removed] = parentField.children.splice(fromIndex, 1);
                            parentField.children.splice(toIndex, 0, removed);
                        }
                    }
                };
                moveRecursive(draft, selectedParentId, fromIndex, toIndex);
            })
        );
    };

    const getSchemas = () => {
        const { dataSchema, uiSchema } = generateSchemas(fields, formSettings);
        return { dataSchema, uiSchema };
    };

    const selectedParentField = selectedParentId ? findFieldRecursive(fields, selectedParentId) : null;

    return (
        <FormContext.Provider
            value={{
                fields,
                availableFieldTypes,
                selectedField,
                selectedFieldId,
                selectedParentId,
                selectedParentStack,
                formSettings,
                addField,
                updateField,
                updateFormSettings,
                selectField,
                moveField,
                addFieldType,
                removeField,
                selectParent,
                resetParent,
                getSchemas,
                selectedParentField,
            }}
        >
            {children}
        </FormContext.Provider>
    );
};