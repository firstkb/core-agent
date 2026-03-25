import { FC, useState, useEffect, useCallback, useMemo } from 'react';
import { Button, ButtonGroup, Typography, Box, Divider } from '@mui/material';
import { debounce } from 'lodash';
import FieldTemplate from './FieldTemplate';
import { WidgetProps } from '@rjsf/utils';
import ImageUpload from '../imageUpload';

interface QuestionItemProps extends WidgetProps {
  index: number;
  id: string;
  question: string;
  value: any;
  onResultChange: (id: string, item: any) => void;
  uiSchema: any;
  schema: any;
  table: string;
  registry: any;
}

const QuestionItem: FC<QuestionItemProps> = ({
  id,
  question,
  value,
  onResultChange,
  uiSchema,
  schema,
  table,
  registry,
  formContext
}) => {
  //const [arrayResult, setArrayResult] = useState<string[]>([]);
  const [selectedValues, setSelectedValues] = useState<{ [key: string]: any }>({});
  const [widgetCA, setwidgetCA] = useState<boolean>(false)
  const [showModalCA, setShowModalCA] = useState<boolean>(false)
  const [widgetImage, setWidgetImage] = useState<boolean>(false)
  const [guid, setGuid] = useState<string>("");

  const fieldResult = uiSchema?.['ui:fieldResult'];
  const buttonColors = useMemo<Array<"inherit" | "error" | "primary" | "secondary" | "success" | "info" | "warning">>(
    () => ["success", "warning", "primary"],
    []
  );

  useEffect(() => {
    if (uiSchema["ui:image"]) {
      setWidgetImage(true);
    }
  }, [uiSchema]);

  const debouncedOnResultChange = useMemo(() => debounce(onResultChange, 300), [onResultChange]);

  const onChangeField = useCallback(
    (key: string, item: any) => {
      const updatedValues = { ...selectedValues, [key]: item };
      setSelectedValues(updatedValues);
      debouncedOnResultChange(id, updatedValues); // С задержкой вызываем обновление
    },
    [selectedValues, debouncedOnResultChange, id]
  );
  /*const onChangeField = useCallback(
    (key: string, item: any) => {
      const updatedValues = { ...selectedValues, [key]: item };
      setSelectedValues(updatedValues);
      onResultChange(id, updatedValues);
    },
    [selectedValues, onResultChange, id]
  );*/

  const handleResultChange = useCallback(
    (result: string) => {
      onChangeField(fieldResult, result);
    },
    [fieldResult, onChangeField]
  );

  const getButtonColor = useCallback(
    (result: string, idx: number) => {
      return selectedValues[fieldResult] === result ? buttonColors[idx % buttonColors.length] : 'inherit';
    },
    [selectedValues, fieldResult, buttonColors]
  );

  const arrayResult: string[] = useMemo((): string[] => {
    return fieldResult && schema.items?.properties?.[fieldResult]?.enum
      ? schema.items.properties[fieldResult].enum
      : [];
  }, [fieldResult, schema]);

  useEffect(() => {
    if (value && Object.keys(value).length > 0) {
      setSelectedValues(value);
      setGuid(value[table + '_guid']);
    }
  }, [value, table]);

  useEffect(() => {
    if (uiSchema) {
      const hasCAButton = Object.values(uiSchema.items).some(
        (item) => (item as { "ui:button"?: string })["ui:button"] === "CA"
      );

      if (hasCAButton) {
        setwidgetCA(true);
      }
    }
  }, [uiSchema])

  return (
    <Box mb={2} display="flex" flexDirection="column">
      <Typography variant="subtitle1" gutterBottom component="div">
        <Box sx={{ fontWeight: 500 }}>{question}</Box>
        <Divider />
      </Typography>
      <Box alignItems="center">
        <Box display="flex" justifyContent="space-between" flexWrap="wrap">
          <ButtonGroup variant="contained" aria-label="outlined primary button group" sx={{ marginTop: 2, marginBottom: 2, borderRadius: '7px' }}>
            {arrayResult.map((result, idx) => (
              result.trim() !== '' && (
                <Button
                  disableRipple
                  key={`${result}-${idx}`}
                  color={getButtonColor(result, idx)}
                  onClick={() => handleResultChange(result)}
                >
                  {result}
                </Button>
              )
            ))}
          </ButtonGroup>
          {selectedValues[fieldResult] && widgetCA && (<Button variant="contained" disableRipple onClick={() => { setShowModalCA(true) }} color="error" sx={{ marginTop: 2, marginBottom: 2 }}>
            Corrective Action { /*{label !== "" ? label : 'Corrective Action'} */}
          </Button>)}
        </Box>
        <FieldTemplate
          id={selectedValues[`${table}_id`]}
          name={selectedValues[`${table}_id`]}
          label=''
          schema={schema}
          uiSchema={uiSchema}
          fieldResult={fieldResult}
          fieldLookup={uiSchema?.['ui:fieldLookup']}
          value={selectedValues}
          onChange={onChangeField}
          onBlur={() => { }}
          onFocus={() => { }}
          options={{}}
          registry={registry}
          table={table}
          formContext={formContext}
          showModalCA={showModalCA}
          widgetImage={widgetImage}
          onClose={() => setShowModalCA(false)}
        />
        {selectedValues[fieldResult] && widgetImage && (
          <ImageUpload
            uniqueKey={`${id}-${guid}`}
            formContext={formContext}
            tableParent={table}
            guidParent={guid}
          />
        )}
      </Box>
    </Box>
  );
};

export default QuestionItem;