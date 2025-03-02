import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "../../src/components/Navbar";
import BookingForm from "../../src/components/BookingForm";
import BookingHistory from "../../src/components/BookingHistory";
import { ThemeProvider, createTheme } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
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
