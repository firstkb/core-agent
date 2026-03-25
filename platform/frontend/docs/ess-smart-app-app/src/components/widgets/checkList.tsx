import { FC, useState, useEffect, useMemo, useCallback, useContext } from 'react';
import { Accordion, AccordionSummary, AccordionDetails, Typography, Box, Paper } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { WidgetProps } from '@rjsf/utils';
import { v4 as uuidv4 } from 'uuid';
import { useClientConfig } from '../../hooks/useClientConfig';
import { PageIdContext } from '../../contexts/PageIdContext';
import { groupDataByCategory } from './checkList/GroupedData';
import QuestionItem from './checkList/QuestionItem';

const CheckListComponent: FC<WidgetProps> = ({ value, onChange, label, uiSchema, schema, registry, formContext }) => {
  const { dictionary, schemes } = useClientConfig();
  const pageId = useContext(PageIdContext);
  const fieldLookup = uiSchema?.['ui:fieldLookup'] as string;
  const table = uiSchema?.['ui:table'] as string;
  const dataSource = uiSchema?.['items']?.[fieldLookup]?.['ui:dataSource'] as string;
  const [isAccordionOpen, setIsAccordionOpen] = useState<{ [key: string]: boolean }>({});

  const fields = useMemo(() => {
    if (pageId && schemes && dataSource) {
      return schemes[parseInt(pageId)]?.dictionary[dataSource]?.fields as string[];
    }
    return [];
  }, [pageId, schemes, dataSource]);

  const dataDictionary = useMemo(() => {
    if (dictionary && dataSource) {
      return dictionary[dataSource] as Record<number, any>;
    }
    return {};
  }, [dictionary, dataSource]);

  const [selectedValues, setSelectedValues] = useState<{ [key: number]: any }>({});

  const isAccordionNeeded = useMemo(() => fields.length === 2, [fields]);

  const groupedData = useMemo(() => {
    return groupDataByCategory(dataDictionary, isAccordionNeeded);
  }, [dataDictionary, isAccordionNeeded]);

  const handleChange = useCallback(
    (id: string, item: any) => {
      setSelectedValues((prevValues) => {
        const updatedValues = { ...prevValues, [id]: item };
        onChange(Object.values(updatedValues));
        return updatedValues;
      });
    },
    [onChange]
  );

  const handleAccordionChange = (category: string) => {
    setIsAccordionOpen((prevState) => ({
      ...prevState,
      [category]: !prevState[category],
    }));
  };

  useEffect(() => {
    if (fieldLookup) {
      const processValue = (data: any): { [key: number]: any } => {
        const processedData: { [key: number]: any } = {};

        const existingIds = new Set(
          Array.isArray(data) ? data.map((item: any) => item[fieldLookup]) : []
        );

        Object.values(dataDictionary).forEach((item) => {
          if (!existingIds.has(item.id)) {
            const guid = uuidv4().toUpperCase();
            processedData[item.id] = { [table + '_guid']: guid, [fieldLookup]: item.id };
          }
        });

        if (Array.isArray(data)) {
          data.forEach((item: any) => {
            if (item[fieldLookup]) {
              processedData[item[fieldLookup]] = item;
            }
          });
        }

        return processedData;
      };

      setSelectedValues(processValue(value));
    }
  }, [fieldLookup, dataDictionary]);

  return (
    <div>
      <Typography variant="h6" gutterBottom>
        {label}
      </Typography>
      {isAccordionNeeded ? (
        Object.keys(groupedData).map((category, key) => (
          <Accordion disableGutters
            expanded={!!isAccordionOpen[category]}
            onChange={() => handleAccordionChange(category)}
            slotProps={{
              transition: { timeout: 0 },
            }}
            key={`category-${key}`}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography component="div">
                <Box sx={{ fontWeight: 600 }}>{category}</Box>
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {isAccordionOpen[category] && groupedData[category].map((item, index) => (
                <QuestionItem
                  key={item.id}
                  name={item.id}
                  label=''
                  index={index}
                  id={item.id}
                  value={selectedValues[item.id]}
                  question={item.field2}
                  onResultChange={handleChange}
                  uiSchema={uiSchema}
                  schema={schema}
                  table={table || ''}
                  onBlur={() => { }}
                  onFocus={() => { }}
                  onChange={() => { }}
                  options={{}}
                  registry={registry}
                  formContext={formContext}
                />
              ))}
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <Paper elevation={3} style={{ padding: '20px', marginTop: '10px' }}>
          {groupedData['MAIN'].map((item, index) => (
            <QuestionItem
              key={item.id}
              name={item.id}
              label=''
              index={index}
              id={item.id}
              value={selectedValues[item.id]}
              question={item.field1}
              onResultChange={handleChange}
              uiSchema={uiSchema}
              schema={schema}
              table={table || ''}
              onBlur={() => { }}
              onFocus={() => { }}
              onChange={() => { }}
              options={{}}
              registry={registry}
              formContext={formContext}
            />
          ))}
        </Paper>
      )}
    </div>
  );
};

//export default CheckList;
export const CheckList = Object.assign(
  (props: WidgetProps) => <CheckListComponent {...props} />,
  { displayName: 'CheckList' }
);