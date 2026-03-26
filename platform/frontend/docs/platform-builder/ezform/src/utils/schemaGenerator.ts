import { Field, FormSettings } from '../context/FormContext';
import { JSONSchema7 } from 'json-schema';

export const generateSchemas = (fields: Field[], formSettings: FormSettings) => {
    const dataSchema: JSONSchema7 = {
        title: formSettings.formTitle || 'Generated Form',
        type: 'object',
        properties: {},
        required: [],
        definitions: {},
    };

    const uiSchema: Record<string, any> = {
        "ui:order": [],
        "ui:grid": [],
    };

    // Множество для отслеживания уникальных ключей
    const generatedKeys = new Set<string>();
    const fieldKeyMap: Record<string, string> = {};

    const processFields = (fields: Field[], parentSchema: any, parentUiSchema: any, parentKey: string | null = null, path: string[] = []) => {
        fields.forEach((field) => {
            const fieldKey = ensureUniqueKey(generateKeyFromTitle(field.title || field.type) || field.id, generatedKeys);
            const currentPath = [...path, fieldKey];
            fieldKeyMap[field.id] = fieldKey;

            const fieldSchema: any = {
                type: getFieldType(field.type),
                title: field.title || field.type,
                default: field.default || "",
            };

            if (field.required) {
                parentSchema.required = parentSchema.required || [];
                parentSchema.required.push(fieldKey);
            }

            if (field.isContainer) {
                // Определяем подформу как массив объектов и добавляем в определения
                if (!dataSchema.definitions![fieldKey]) {
                    dataSchema.definitions![fieldKey] = {
                        type: 'object',
                        title: field.title || field.type,
                        properties: {},
                        required: [],
                    };
                }
                fieldSchema.type = field.containerType;
                fieldSchema.items = {
                    $ref: `#/definitions/${fieldKey}`,
                };
                parentSchema.properties[fieldKey] = fieldSchema;

                if (parentUiSchema["ui:order"]) {
                    parentUiSchema["ui:order"].push(fieldKey);
                }

                // Создаем вложенный uiSchema для подформы
                if (parentKey) {
                    parentUiSchema.items[fieldKey] = {
                        "ui:type": field.type,
                        ...transformUIKeys(field.ui || {}, field),
                        ...transformSettingsKeys(field.settings || {}),
                        "ui:order": [],
                        items: {}
                    };
                    processFields(field.children || [], dataSchema.definitions![fieldKey], parentUiSchema.items[fieldKey], fieldKey, currentPath);
                } else {
                    parentUiSchema[fieldKey] = {
                        "ui:type": field.type,
                        ...transformUIKeys(field.ui || {}, field),
                        ...transformSettingsKeys(field.settings || {}),
                        "ui:order": [],
                        items: {}
                    };
                    processFields(field.children || [], dataSchema.definitions![fieldKey], parentUiSchema[fieldKey], fieldKey, currentPath);
                }
            } else {
                parentSchema.properties[fieldKey] = fieldSchema;

                // Генерация uiSchema для каждого поля
                if (parentKey) {
                    parentUiSchema.items[fieldKey] = {
                        "ui:type": field.type,
                        "ui:widget": getWidgetType(field),
                        ...transformUIKeys(field.ui || {}, field),
                        ...transformSettingsKeys(field.settings || {}),
                    };
                } else {
                    parentUiSchema[fieldKey] = {
                        "ui:type": field.type,
                        "ui:widget": getWidgetType(field),
                        ...transformUIKeys(field.ui || {}, field),
                        ...transformSettingsKeys(field.settings || {}),
                    };
                }


                // Добавляем поле в порядок отображения
                if (parentUiSchema["ui:order"]) {
                    parentUiSchema["ui:order"].push(fieldKey);
                }

                // Если поле должно отображаться в сетке, добавляем в ui:grid
                if (field.showInGrid) {
                    const fieldPath = currentPath.join('.');
                    //uiSchema['ui:grid'].push(fieldPath);
                    uiSchema["ui:grid"].push({
                        key: fieldPath,
                        position: field.pidGrid,
                    });
                }
            }
        });
    };

    processFields(fields, dataSchema, uiSchema);

    // Сортируем ui:grid по возрастанию позиции
    uiSchema["ui:grid"].sort((a: any, b: any) => a.position - b.position);
    uiSchema["ui:grid"] = uiSchema["ui:grid"].map((item: any) => item.key);

    // Добавляем определения в корневую структуру
    if (Object.keys(dataSchema.definitions || {}).length > 0) {
        dataSchema.definitions = { ...dataSchema.definitions };
    } else {
        delete dataSchema.definitions;
    }

    return { dataSchema, uiSchema };
};

// Функция для определения типа данных
const getFieldType = (type: string) => {
    switch (type) {
        case 'text':
            return 'string';
        case 'number':
            return 'number';
        case 'checkbox':
            return 'boolean';
        case 'radio':
            return 'string'; // В радио-кнопках в JSON Schema обычно используется 'string'
        case 'select':
            return 'string'; // Select также обычно используется как 'string'
        case 'sub_form':
            return 'array';
        default:
            return 'string';
    }
};

// Функция для определения виджета для поля
const getWidgetType = (field: Field) => {
    if (field.display && field.display === "Hidden") {
        return 'hidden';
    }
    switch (field.type) {
        case 'text':
            return 'text';
        case 'number':
            return 'updown';
        case 'checkbox':
            return 'checkbox';
        case 'radio':
            return 'radio';
        case 'select':
            return 'select';
        case 'textarea':
            return 'textarea';
        case 'sub_form':
            return 'array';
        default:
            return 'text';
    }
};

// Функция для создания ключа на основе title
const generateKeyFromTitle = (title: string) => {
    // Приводим к нижнему регистру, заменяем пробелы на подчеркивания, удаляем специальные символы
    return title
        .toLowerCase()
        .replace(/\s+/g, '_') // заменяем пробелы на подчеркивания
        .replace(/[^\w_]/g, ''); // удаляем все символы кроме букв, цифр и подчеркивания
};

// Функция для обеспечения уникальности ключей
const ensureUniqueKey = (key: string, generatedKeys: Set<string>): string => {
    let uniqueKey = key;
    let counter = 1;

    // Проверяем, есть ли уже такой ключ
    while (generatedKeys.has(uniqueKey)) {
        // Если есть, добавляем цифру в конец ключа
        uniqueKey = `${key}_${counter}`;
        counter++;
    }

    // Добавляем уникальный ключ в Set
    generatedKeys.add(uniqueKey);
    return uniqueKey;
};

// Функция для добавления префикса "ui:" ко всем ключам внутри uiSchema
const transformUIKeys = (ui: Record<string, any>, field: Field) => {
    const transformedUI: Record<string, any> = {};

    Object.keys(ui).forEach((key) => {
        transformedUI[`ui:${key}`] = ui[key];
        if (key === "widget" && field.display && field.display === "Hidden") {
            transformedUI[`ui:widget`] = "hidden";
        }
    });

    if (field.display && field.display === "Read Only") {
        transformedUI["ui:readonly"] = true;
    }

    return transformedUI;
};

const transformSettingsKeys = (settings: Record<string, any>) => {
    const transformedUI: Record<string, any> = {};

    Object.keys(settings).forEach((key) => {
        transformedUI[`ui:${key}`] = settings[key]['default'] || "";
    });

    return transformedUI;
};

