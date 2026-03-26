
// constants.ts

import { FieldType } from "../context/FormContext";

export const FIELD_TYPES: FieldType[] = [
    {
        type: 'text',
        label: 'Text',
        title: 'Title',
        required: false,
        settings: {
            title: { type: 'text', title: 'Display Title', default: '' },
            placeholder: { type: 'text', title: 'Placeholder', default: '' },
        },
        ui: {
            widget: 'text',
        }
    },
    {
        type: 'combobox',
        label: 'Combobox',
        required: false,
        settings: {
            title: { type: 'text', title: 'Display Title', default: '' },
            options: { type: 'options', title: 'Options', default: ['Option 1', 'Option 2', 'Option 3'] }
        },
        ui: {
            widget: 'select'
        }
    },
    {
        type: 'combobox_small',
        label: 'Combobox (Yes/No)',
        required: false,
        settings: {
            title: { type: 'text', title: 'Display Title', default: '' },
            options: { type: 'options', title: 'Options', default: ['Yes', 'No'] }
        },
        ui: {
            widget: 'select',
            options: {
                size: 'small',
            }
        }
    },
    {
        type: 'memo',
        label: 'Memo',
        required: false,
        settings: {
            title: { type: 'text', title: 'Display Title', default: '' },
        },
        ui: {
            widget: 'textarea',
        }
    },
    {
        type: 'number',
        label: 'Number Field',
        required: false,
        settings: {
            title: { type: 'text', title: 'Display Title', default: '' },
            min: { type: 'number', default: 0 },
            max: { type: 'number', default: 100 },
        },
        ui: {
            widget: 'number'
        }
    },
    /*{
        type: 'checkbox',
        label: 'Checkbox',
        required: false,
        settings: {
            defaultValue: { type: 'boolean', default: false },
        },
        ui: {
            widget: 'checkbox'
        }
    },
    {
        type: 'radio',
        label: 'Radio Button',
        required: false,
        settings: {
            options: { type: 'options', default: ['Option 1', 'Option 2'] }
        },
        ui: {
            widget: 'radio'
        }
    },
    {
        type: 'select',
        label: 'Select',
        required: false,
        settings: {
            options: { type: 'options', title: 'Options', default: ['Option 1', 'Option 2', 'Option 3'] }
        },
        ui: {
            widget: 'select'
        }
    },*/
    {
        type: 'sub_form',
        label: 'Sub Form',
        title: 'Sub Form',
        required: false,
        isContainer: true,
        containerType: "array",
        settings: {
            //title: { type: 'text', title: 'Display Title', default: '' },
        },
        ui: {
            widget: 'sub_form',
        },
        disabledChildTypes: ['sub_form', 'tabs', 'group'],
    },
    {
        type: 'group',
        label: 'Group',
        title: 'Group',
        required: false,
        isContainer: true,
        containerType: "object",
        settings: {
            //title: { type: 'text', title: 'Group Title', default: 'Group' },
        },
        ui: {
            //widget: 'group',
        }
    },
    {
        type: 'tabs',
        label: 'Tabs',
        title: 'Tabs',
        required: false,
        isContainer: true,
        containerType: "object",
        settings: {
            //title: { type: 'text', title: 'Tabs Title', default: 'Tabs' },
        },
        ui: {
            widget: 'tabs',
        },
        allowedChildTypes: ['tab_item'],
    },
    {
        type: 'tab_item',
        label: 'Tab Item',
        title: 'Tab Item',
        required: false,
        isContainer: true,
        containerType: "object",
        settings: {
            //title: { type: 'text', title: 'Tab Item', default: 'Tab' },
        },
        ui: {
            widget: 'tab_item',
        },
        allowedParentTypes: ['tabs'],
        disabledChildTypes: ['tabs'],
    },
];