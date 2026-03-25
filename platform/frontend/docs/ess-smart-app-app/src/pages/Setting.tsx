import { useState, useEffect, ChangeEvent } from "react";
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    Switch
} from "@mui/material";

function SettingPage() {
    const [autoField, setAutoField] = useState<boolean>(true);

    useEffect(() => {
        const storedValue = localStorage.getItem("setting_autoField");
        if (storedValue === null) {
            setAutoField(false);
        } else {
            setAutoField(storedValue === "true");
        }
    }, []);

    const handleToggle = (event: ChangeEvent<HTMLInputElement>) => {
        const newValue = event.target.checked;
        setAutoField(newValue);
        localStorage.setItem("setting_autoField", newValue.toString());
    };

    return (
        <Box
            sx={{
                py: 2,
                px: 2,
                maxWidth: 600,
                margin: "0 auto"
            }}
        >
            <Typography variant="h5" textAlign="center" gutterBottom>
                Settings
            </Typography>

            <List
                sx={{
                    bgcolor: "background.paper",
                    borderRadius: 2,
                    boxShadow: 1,
                    marginTop: '30px'
                }}
            >
                <ListItem
                    secondaryAction={
                        <Switch
                            edge="end"
                            color="primary"
                            checked={autoField}
                            onChange={handleToggle}
                        />
                    }
                >
                    <ListItemText
                        primary="Auto-fill form fields"
                        secondary="Automatically fill top-level fields"
                    />
                </ListItem>

            </List>
        </Box>
    );
}

export default SettingPage;