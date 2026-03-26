import ReactDOM from 'react-dom/client';
import MainComponent from './components/MainComponent';
import { FieldType } from './context/FormContext';

const addFieldTypes: FieldType[] = [
  {
    type: 'custom_field',
    label: 'Custom Field1',
    title: '',
    required: false,
    ui: {
      widget: 'custom_widget',
    },
  }
];

const scheme = `Data Schema: {
  "title": "Users",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "title": "Title",
      "default": ""
    },
    "combobox": {
      "type": "string",
      "title": "combobox",
      "default": ""
    },
    "tabs": {
      "type": "object",
      "title": "Tabs",
      "default": "",
      "items": {
        "$ref": "#/definitions/tabs"
      }
    }
  },
  "required": [],
  "definitions": {
    "tabs": {
      "type": "object",
      "title": "Tabs",
      "properties": {
        "general": {
          "type": "object",
          "title": "General",
          "default": "",
          "items": {
            "$ref": "#/definitions/general"
          }
        },
        "address": {
          "type": "object",
          "title": "Address",
          "default": "",
          "items": {
            "$ref": "#/definitions/address"
          }
        }
      },
      "required": []
    },
    "general": {
      "type": "object",
      "title": "General",
      "properties": {
        "memo": {
          "type": "string",
          "title": "memo",
          "default": ""
        }
      },
      "required": []
    },
    "address": {
      "type": "object",
      "title": "Address",
      "properties": {
        "address_1": {
          "type": "string",
          "title": "Address",
          "default": ""
        }
      },
      "required": []
    }
  }
}`;

const schemeUI = `{
  "ui:order": [
    "title",
    "combobox",
    "tabs"
  ],
  "ui:grid": [
    "title",
    "combobox",
    "tabs.address.address_1"
  ],
  "title": {
    "ui:widget": "text",
    "ui:maxLength": 255,
    "ui:placeholder": "Enter text"
  },
  "combobox": {
    "ui:widget": "select",
    "ui:options": [
      "Option 1",
      "Option 2",
      "Option 3"
    ]
  },
  "tabs": {
    "ui:widget": "tabs",
    "ui:order": [
      "general",
      "address"
    ],
    "items": {},
    "general": {
      "ui:widget": "tab_item",
      "ui:order": [
        "memo"
      ],
      "items": {
        "memo": {
          "ui:widget": "textarea"
        }
      }
    },
    "address": {
      "ui:widget": "tab_item",
      "ui:order": [
        "address_1"
      ],
      "items": {
        "address_1": {
          "ui:widget": "text",
          "ui:maxLength": 255,
          "ui:placeholder": "Enter text"
        }
      }
    }
  }
}`;

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

const onSubmit = (scheme: any, schemeUI: any) => {
  console.log("scheme", scheme);
  console.log("schemeUI", schemeUI);
};

root.render(
  <MainComponent
    addFieldTypes={addFieldTypes}
    scheme={scheme}
    schemeUI={schemeUI}
    onSubmit={onSubmit}
  />
);