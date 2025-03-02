import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import BookingForm from "./components/BookingForm";
import BookingHistory from "./components/BookingHistory";
import { ThemeProvider, createTheme } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { CssBaseline } from "@mui/material";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
    background: {
      default: "#f5f5f5",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<BookingForm />} />
              <Route path="/history" element={<BookingHistory />} />
            </Routes>
          </div>
        </Router>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
