import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, TextField, FormControlLabel, Checkbox, Button, Divider } from '@mui/material';
import { useFormContext } from '../../hook/useFormContext';
import { Field } from '../../context/FormContext';

const FieldSettings: React.FC = () => {
    const { selectedField, updateField, formSettings, updateFormSettings, removeField } = useFormContext();
    const [activeTab, setActiveTab] = useState(0);

    // Локальное состояние для опций
    const [localOptions, setLocalOptions] = useState<string[]>([]);

    // Синхронизация состояния опций с выбранным полем
    useEffect(() => {
        if (selectedField?.settings?.options?.default && Array.isArray(selectedField.settings.options.default)) {
            setLocalOptions(selectedField.settings.options.default);
        }
    }, [selectedField]);

    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedField) {
            updateField(selectedField.id, { [e.target.name]: e.target.value });
        }
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedField) {
            updateField(selectedField.id, { [e.target.name]: e.target.checked });
        }
    };

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateFormSettings({ [e.target.name]: e.target.value });
    };

    const handleOptionChange = (index: number, value: string) => {
        const updatedOptions = [...localOptions];
        updatedOptions[index] = value;
        setLocalOptions(updatedOptions);
        updateField(selectedField?.id || '', {
            settings: {
                ...selectedField?.settings,
                options: {
                    type: selectedField?.settings?.options?.type || 'string',
                    ...selectedField?.settings?.options,
                    default: updatedOptions,
                },
            },
        });
    };

    const handleAddOption = () => {
        setLocalOptions([...localOptions, '']);
    };

    const handleRemoveOption = (index: number) => {
        const updatedOptions = localOptions.filter((_, i) => i !== index);
        setLocalOptions(updatedOptions);
        updateField(selectedField?.id || '', {
            settings: {
                ...selectedField?.settings,
                options: {
                    type: selectedField?.settings?.options?.type || 'string',
                    ...selectedField?.settings?.options,
                    default: updatedOptions,
                },
            },
        });
    };

    // Новая функция для обработки настроек (специально для опций)
    const handleSettingsChange = (key: string, value: any) => {
        if (selectedField) {
            updateField(selectedField.id, {
                settings: {
                    ...selectedField.settings,
                    [key]: {
                        ...selectedField.settings?.[key],
                        default: value,
                    }
                }
            });
        }
    };

    const handleRemoveField = () => {
        if (window.confirm('Are you sure you want to remove this field?')) {
            removeField(selectedField?.id || '');
        }
    };

    // Рендеринг настроек для поля
    const renderFieldSettings = (selField: Field) => {
        if (!selField?.settings) return null;

        return Object.entries(selField.settings).map(([key, setting]) => {
            switch (setting.type) {
                case 'text':
                    return (
                        <TextField
                            key={key}
                            label={setting.title || key}
                            name={key}
                            value={setting.default || ''}
                            onChange={(e) => handleSettingsChange(key, e.target.value)}
                            fullWidth
                            margin="normal"
                        />
                    );
                case 'select':
                    return (
                        <TextField
                            key={key}
                            label={setting.title || key}
                            name={key}
                            select
                            value={setting.default || ''}
                            onChange={(e) => handleSettingsChange(key, e.target.value)}
                            fullWidth
                            margin="normal"
                            SelectProps={{
                                native: true,
                            }}
                        >
                            {(setting.options || []).map((option: string, index: number) => (
                                <option key={index} value={option}>
                                    {option}
                                </option>
                            ))}
                        </TextField>
                    );
                case 'options':
                    return renderOptions(); // Для опций используем отдельную функцию
                default:
                    return null;
            }
        });
    };

    // Рендеринг опций
    const renderOptions = () => {
        return (
            <Box>
                <p style={{ fontWeight: 600 }}>Options</p>
                {localOptions.map((option, index) => (
                    <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 0 }}>
                        <TextField
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            fullWidth
                            size='small'
                            margin="normal"
                            sx={{ margin: '3px', padding: 0 }}
                        />
                        <Button onClick={() => handleRemoveOption(index)} color='error'>X</Button>
                    </Box>
                ))}
                <Button onClick={handleAddOption} sx={{ marginTop: 1 }}>Add Option</Button>
            </Box>
        );
    };

    return (
        <Box sx={{ minWidth: 300, width: '20%', borderLeft: '1px solid #ccc', overflowY: 'auto', maxHeight: 'calc(100vh - 64px)' }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
                <Tab label="Field Settings" />
                <Tab label="Form Settings" />
            </Tabs>
            <Box sx={{ p: 2, background: '#F9FAFB', height: '100%' }}>
                {activeTab === 0 && selectedField ? (
                    <Box>
                        <TextField
                            label="Title"
                            name="title"
                            value={selectedField.title || ''}
                            onChange={handleFieldChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Default"
                            name="default"
                            value={selectedField.default || ''}
                            onChange={handleFieldChange}
                            fullWidth
                            margin="normal"
                        />
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={selectedField.required || false}
                                    onChange={handleCheckboxChange}
                                    name="required"
                                />
                            }
                            label="Required Field"
                        />
                        {renderFieldSettings(selectedField)}
                        <Divider sx={{ marginTop: 3 }}></Divider>
                        <Button
                            onClick={handleRemoveField}
                            color='error'
                            sx={{ mt: 2 }}
                            variant="contained"
                        >
                            Remove
                        </Button>
                    </Box>
                ) : activeTab === 0 ? (
                    <Box sx={{ background: '#F9FAFB' }}>
                        <p>Choose a field to configure</p>
                    </Box>
                ) : (
                    <Box sx={{ background: '#F9FAFB' }}>
                        <TextField
                            label="Form Title"
                            name="formTitle"
                            value={formSettings.formTitle || ''}
                            onChange={handleFormChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Form Description"
                            name="formDescription"
                            value={formSettings.formDescription || ''}
                            onChange={handleFormChange}
                            fullWidth
                            multiline
                            rows={3}
                            margin="normal"
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default FieldSettings;