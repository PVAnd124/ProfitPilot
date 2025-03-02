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
  time_preference: "", // Changed to match backend
  guest_count: "", // Changed to match backend
  special_requests: "", // Changed to match backend
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
      // Format the data to match backend expectations
      const requestData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        date: formData.date?.toISOString().split("T")[0],
        time_preference: formData.time_preference,
        guest_count: parseInt(formData.guest_count) || 0,
        special_requests: formData.special_requests,
      };

      const response = await fetch("http://localhost:8080/api/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Add this if using cookies
        body: JSON.stringify(requestData),
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
              fullWidth
            />

            <TextField
              required
              type="email"
              label="Email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              fullWidth
            />

            <TextField
              required
              label="Phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              fullWidth
            />

            <DatePicker
              label="Event Date"
              value={formData.date}
              onChange={(newValue) => {
                setFormData((prev) => ({ ...prev, date: newValue }));
              }}
              minDate={addDays(new Date(), 1)}
              maxDate={addDays(new Date(), 90)}
              slotProps={{ textField: { fullWidth: true, required: true } }}
            />

            <FormControl required fullWidth>
              <InputLabel>Time Preference</InputLabel>
              <Select
                name="time_preference"
                value={formData.time_preference}
                label="Time Preference"
                onChange={handleChange}
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
              name="guest_count"
              value={formData.guest_count}
              onChange={handleChange}
              inputProps={{ min: 1 }}
              fullWidth
            />

            <TextField
              label="Special Requests"
              name="special_requests"
              value={formData.special_requests}
              onChange={handleChange}
              multiline
              rows={4}
              fullWidth
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
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
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
            variant="filled"
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
}
