import { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { WidgetProps } from '@rjsf/utils';
import { useClientConfig } from '../../hooks/useClientConfig';
import { Typography } from '@mui/material';

interface Option {
    id: string;
    label: string;
    field1?: string;
    field2?: string;
    desc?: string;
    f: string;
}

interface OptionItemProps {
    option: Option;
    selectedCategory: string | null;
}

const OptionItem: FC<OptionItemProps> = memo(({ option, selectedCategory, ...props }) => {
    return (
        <li  {...props}
            style={{ display: 'flex', flexDirection: 'column', alignContent: 'left' }}>
            <Typography fontSize='small' sx={{ fontWeight: '600', display: 'block', width: '100%' }}>
                {selectedCategory ? option.field2 : option.label}
            </Typography>
            {option.desc && (
                <Typography fontSize='small' sx={{ display: 'block', width: '100%' }}>
                    {option.desc}
                </Typography>
            )}
        </li>
    );
});

export const SelectDic: FC<WidgetProps> = ({
    value,
    onChange,
    label,
    uiSchema,
    Id,
    required = false,
}) => {
    const { dictionary } = useClientConfig();
    const dataSource = uiSchema?.['ui:dataSource'];
    const dataType = uiSchema?.['ui:typeSource'];
    const isReadOnly = uiSchema?.['ui:readonly'] ?? false;

    const fullData: Option[] = useMemo(() => {
        let data: Option[] = [];
        if (dataSource && dictionary[dataSource]) {
            data = dictionary[dataSource];
        } else if (dataType && dictionary[dataType]) {
            data = dictionary[dataType];
        } else {
            data = [];
        }

        return data;
    }, [dataSource, dataType, dictionary]);

    const displayValue = useMemo(() => {
        return isReadOnly ? fullData.find((item) => item.id === value)?.label || '' : '';
    }, [isReadOnly, fullData, value]);

    const [inputValue, setInputValue] = useState('');

    const categoryList = useMemo(() => {
        const setOfCat = new Set<string>();
        fullData.forEach((item) => {
            if (item.field1) {
                if (item.field1.trim() !== '') {
                    setOfCat.add(item.field1.trim());
                }
            }
        });
        return Array.from(setOfCat.values()).sort();
    }, [fullData]);

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedCategoryForm, setSelectedCategoryForm] = useState<boolean>(false);

    useEffect(() => {
        if (
            dataType === 'lookup' &&
            fullData.length > 0 &&
            fullData[0].field1 !== undefined &&
            fullData[0].field2 !== undefined
        ) {
            setSelectedCategoryForm(true);
        } else {
            setSelectedCategoryForm(false);
        }
    }, [dataType, fullData]);


    const getOptionLabel = useCallback((option: Option) => option.label || '', []);

    const isLargeDataSet = fullData.length > 10000;
    const [loading, setLoading] = useState(false);
    const [debouncedInputValue, setDebouncedInputValue] = useState(inputValue);

    const handleCategoryChange = useCallback(
        (newCat: string | null) => {
            setSelectedCategory(newCat);
            onChange(null);
        },
        [onChange]
    );

    useEffect(() => {
        if (isLargeDataSet) {
            setLoading(true);
            const handler = setTimeout(() => {
                setDebouncedInputValue(inputValue);
                setLoading(false);
            }, 300);

            return () => {
                clearTimeout(handler);
                setLoading(false);
            };
        } else {
            setDebouncedInputValue(inputValue);
            setLoading(false);
        }
    }, [inputValue, isLargeDataSet]);

    const selectedOption = useMemo(
        () => fullData.find((option) => option.id === value) || null,
        [fullData, value]
    );

    const [loadedCount, setLoadedCount] = useState(20);
    const listboxRef = useRef<HTMLDivElement | null>(null);
    const scrollPositionRef = useRef<number>(0);

    const filteredOptions = useMemo(() => {
        const input = (isLargeDataSet ? debouncedInputValue : inputValue).toLowerCase();
        let filtered: Option[];
        let data = fullData;
        if (input === '') {
            if (selectedCategory) {
                filtered = data
                    .filter(item => item.field1 === selectedCategory)
                    .slice(0, loadedCount);
            } else {
                filtered = data.slice(0, loadedCount);
            }

        } else {
            if (selectedCategory) {
                data = data.filter(item => item.field1 === selectedCategory);
                filtered = data
                    .filter((option) => option.f.includes(input))
                    .slice(0, loadedCount);
            } else {
                filtered = data
                    .filter((option) => option.f.includes(input))
                    .slice(0, loadedCount);
            }
        }

        if (
            selectedOption &&
            !filtered.some((option) => option.id === selectedOption.id)
        ) {
            filtered = [selectedOption, ...filtered];
        }

        return filtered;
    }, [debouncedInputValue, inputValue, fullData, selectedOption, isLargeDataSet, selectedCategory, loadedCount]);

    useEffect(() => {
        setLoadedCount(20);
    }, [selectedCategory, inputValue, fullData.length]);

    const handleListboxScroll = useCallback(
        (event: React.SyntheticEvent) => {
            const listboxNode = event.currentTarget;
            scrollPositionRef.current = listboxNode.scrollTop;

            if (
                Math.abs(listboxNode.scrollTop + listboxNode.clientHeight - listboxNode.scrollHeight) < 5 &&
                loadedCount < fullData.length
            ) {
                setLoadedCount((prev) => prev + 20);
            }
        },
        [loadedCount, fullData.length]
    );

    useEffect(() => {
        if (listboxRef.current) {
            listboxRef.current.scrollTop = scrollPositionRef.current;
        }
    }, [loadedCount]);

    return isReadOnly ? (
        <TextField
            label={label || ''}
            value={displayValue}
            InputProps={{
                readOnly: true,
            }}
            disabled={isReadOnly}
        />
    ) : (
        <>
            {selectedCategoryForm && (
                <Autocomplete
                    options={categoryList}
                    value={selectedCategory}
                    onChange={(_, newValue) => handleCategoryChange(newValue)}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Categories Filter"
                            placeholder="Select category"
                        /*variant="standard"*/
                        />
                    )}
                    sx={{
                        marginBottom: '1rem',
                        '& .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
                            border: 'none',
                        },
                        '&:hover .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
                            border: 'none',
                        },
                        '&.Mui-focused .MuiOutlinedInput-root .MuiOutlinedInput-notchedOutline': {
                            border: 'none',
                        },
                    }}
                />
            )}
            <Autocomplete
                id={Id}
                options={filteredOptions}
                filterOptions={(options) => options}
                loading={isLargeDataSet && loading}
                getOptionLabel={getOptionLabel}
                renderOption={(props, option) => (
                    <OptionItem {...props} key={option.id} option={option} selectedCategory={selectedCategory} />
                )}
                renderInput={(params) => (
                    <TextField {...params} id={Id} name={Id} label={label || ''} required={required} />
                )}
                inputValue={inputValue}
                onInputChange={(_, newInputValue) => {
                    setInputValue(newInputValue);
                }}
                isOptionEqualToValue={(option, currentValue) => {
                    return currentValue ? option.id === currentValue?.id : false;
                }}
                value={selectedOption}
                onChange={(_, newValue: Option | null) => {
                    onChange(newValue ? newValue.id : null);
                }}
                disabled={isReadOnly}
                ListboxProps={{
                    onScroll: handleListboxScroll,
                    ref: listboxRef,
                }}
            />
        </>
    );
};