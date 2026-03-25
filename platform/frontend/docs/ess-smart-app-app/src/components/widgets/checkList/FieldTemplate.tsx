import { FC, useRef, useCallback, useState, useEffect, memo } from 'react';
import { Autocomplete, TextField } from '@mui/material';
import { CorrectiveAction } from '../correctiveAction';
import { WidgetProps } from '@rjsf/utils';

interface FieldTemplateProps extends WidgetProps {
  id: string;
  schema: any;
  uiSchema: any;
  onChange: (key: string, value: any) => void;
  fieldResult: string;
  fieldLookup: string;
  showModalCA: boolean;
  onClose: () => void;
  value: { [key: string]: any };
}

const FieldTemplate: FC<FieldTemplateProps> = memo(({ id, schema, uiSchema, onChange, fieldResult, fieldLookup, value, table, formContext, showModalCA, onClose }) => {
  const saveTimeoutRef = useRef<number | null>(null);
  const [selectedValues, setSelectedValues] = useState<{ [key: string]: any }>({});
  const [guid, setGuid] = useState<string>("");

  const saveDataWithDelay = useCallback((key: any, val: any) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    const newTimeout = window.setTimeout(async () => {
      onChange(key, val)
    }, 500);

    saveTimeoutRef.current = newTimeout;
  }, [onChange]);


  const onChangeHandler = (key: any, val: any) => {
    if (key) {
      setSelectedValues((prevValues) => {
        const updatedValues = { ...prevValues, [key]: val };
        return updatedValues;
      });
      saveDataWithDelay(key, val);
    }
  };


  useEffect(() => {
    if (value) {
      setSelectedValues(value);
      setGuid(value[table + '_guid']);
    }
  }, [value, table]);


  useEffect(() => {
    if (value) {
      setSelectedValues(value);
    }
  }, [value]);


  const fieldKeys = Object.keys(schema.items.properties);
  const orderedKeys = uiSchema["ui:order"] || fieldKeys;




  const fields = orderedKeys.map((key: string, index: number) => {
    if (fieldKeys.includes(key) && key !== fieldResult && key !== fieldLookup && !key.includes('_id') && !key.includes('_guid')) {
      const uiItem = uiSchema.items[key];
      const val = selectedValues[key] ?? '';
      const label = schema.items.properties[key]["title"] ?? '';


      const uniqueKey = `${key}-${id}-${index}`;

      if (uiItem?.['ui:widget'] === 'textarea') {
        return (
          <TextField
            key={uniqueKey}
            fullWidth
            multiline
            rows={2}
            label={label}
            margin="normal"
            variant="outlined"
            value={val}
            onChange={(e) => onChangeHandler(key, e.target.value)}
          />
        );
      } else if (uiItem?.['ui:widget'] === 'select') {
        const options = schema.items.properties[key].enum || [];
        const enumNames = schema.items.properties[key].enumNames || options;

        const fullData = options.map((optionValue: string, index: number) => ({
          id: optionValue,
          label: enumNames[index] || optionValue,
        }));

        return (
          <Autocomplete
            key={uniqueKey}
            options={fullData}
            getOptionLabel={(option) => option.label || ''}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                {option.label}
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                margin="normal"
                variant="outlined"
                fullWidth
              />
            )}
            isOptionEqualToValue={(option, currentValue) => option.id === currentValue?.id}
            value={fullData.find((option: any) => option.id === val) || null}
            onChange={(_, newValue) => {
              onChangeHandler(key, newValue ? newValue.id : '');
            }}
            disabled={uiItem['ui:disabled'] || false}
          />
        );
      } else if (uiItem?.['ui:widget'] === '' || uiItem?.['ui:widget'] === null) {
        return (
          <TextField
            key={uniqueKey}
            fullWidth
            label={label}
            margin="normal"
            variant="outlined"
            value={val}
            onChange={(e) => onChangeHandler(key, e.target.value)}
          />
        );
      } else if (uiItem?.['ui:button'] === 'CA') {
        const schemeId = uiItem?.["ui:scheme"];
        return (
          <CorrectiveAction
            key={uniqueKey}
            tableParent={table}
            guidParent={guid}
            formContext={formContext}
            schemeId={schemeId}
            showModalCA={showModalCA}
            onClose={() => onClose()}
          />
        );
      }

    }
    return null;
  });

  return <>{fields}</>;
});

export default FieldTemplate;