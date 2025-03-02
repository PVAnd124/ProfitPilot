import { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  Alert,
  Snackbar,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import { addDays } from "date-fns";

const initialFormData = {
  name: "",
  email: "",
  phone: "",
  date: null,
  timePreference: "",
  guestCount: "",
  specialRequests: "",
};

export default function BookingForm() {
  const [formData, setFormData] = useState(initialFormData);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:8080/api/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          date: formData.date?.toISOString().split("T")[0],
          guestCount: parseInt(formData.guestCount),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSnackbar({
          open: true,
          message: "Booking request submitted successfully!",
          severity: "success",
        });
        setFormData(initialFormData);
      } else {
        throw new Error(data.message || "Failed to submit booking");
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || "An error occurred",
        severity: "error",
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Book an Event
        </Typography>

        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <TextField
              required
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />

            <TextField
              required
              type="email"
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
            />

            <TextField
              required
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
            />

            <DatePicker
              label="Event Date"
              value={formData.date}
              onChange={(newValue) => {
                setFormData((prev) => ({ ...prev, date: newValue }));
              }}
              minDate={addDays(new Date(), 1)}
              maxDate={addDays(new Date(), 90)}
            />

            <FormControl required>
              <InputLabel>Time Preference</InputLabel>
              <Select
                name="timePreference"
                value={formData.timePreference}
                label="Time Preference"
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    timePreference: e.target.value,
                  }));
                }}
              >
                <MenuItem value="morning">
                  Morning (8:00 AM - 12:00 PM)
                </MenuItem>
                <MenuItem value="afternoon">
                  Afternoon (12:00 PM - 4:00 PM)
                </MenuItem>
                <MenuItem value="evening">Evening (4:00 PM - 8:00 PM)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              required
              type="number"
              label="Number of Guests"
              name="guestCount"
              value={formData.guestCount}
              onChange={handleChange}
              inputProps={{ min: 1 }}
            />

            <TextField
              label="Special Requests"
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleChange}
              multiline
              rows={4}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              sx={{ mt: 2 }}
            >
              Submit Booking Request
            </Button>
          </Stack>
        </form>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
}
