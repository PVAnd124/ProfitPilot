import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

export default function Navbar() {
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Event Booking System
        </Typography>
        <Box>
          <Button color="inherit" component={RouterLink} to="/">
            New Booking
          </Button>
          <Button color="inherit" component={RouterLink} to="/history">
            Booking History
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
