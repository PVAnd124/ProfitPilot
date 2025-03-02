import { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookingHistory();
  }, []);

  const fetchBookingHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:8080/api/booking/history",
        {
          credentials: "include", // Add this if using cookies
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch booking history");
      }

      const data = await response.json();
      setBookings(data);
      setError("");
    } catch (error) {
      setError(error.message || "An error occurred");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "booked":
        return "success";
      case "pending":
        return "warning";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Booking History
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {bookings.length === 0 && !error ? (
          <Alert severity="info">No bookings found.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Event ID</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Time</TableCell>
                  <TableCell>Guests</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.event_id}>
                    <TableCell>{booking.event_id}</TableCell>
                    <TableCell>
                      <div>{booking.customer.name}</div>
                      <Typography variant="caption" color="textSecondary">
                        {booking.customer.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {new Date(
                        booking.event_details.date
                      ).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{booking.event_details.time_slot}</TableCell>
                    <TableCell>{booking.event_details.guest_count}</TableCell>
                    <TableCell>
                      <Chip
                        label={booking.status}
                        color={getStatusColor(booking.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {new Date(booking.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
}
