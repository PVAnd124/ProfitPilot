import { GoogleGenerativeAI } from '@google/generative-ai';
import { RunnableSequence, RunnablePassthrough } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

// Initialize the Gemini model
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// Define the output schema for booking details extraction
const bookingDetailsSchema = z.object({
  eventType: z.string().describe("The type of event being booked (e.g., meeting, conference, workshop)"),
  eventDate: z.string().describe("The date of the event in YYYY-MM-DD format"),
  startTime: z.string().describe("The start time of the event (e.g., '9:00 AM')"),
  endTime: z.string().describe("The end time of the event (e.g., '5:00 PM')"),
  numAttendees: z.number().describe("The number of people attending the event"),
  contactName: z.string().describe("The name of the person making the booking"),
  contactEmail: z.string().describe("The email address of the person making the booking"),
  organization: z.string().optional().describe("The organization the booking is for"),
  specialRequests: z.string().optional().describe("Any special requests or requirements for the event"),
});

const bookingDetailsParser = StructuredOutputParser.fromZodSchema(bookingDetailsSchema);

// Define the output schema for alternative suggestions
const alternativeSuggestionsSchema = z.object({
  suggestions: z.array(z.object({
    eventDate: z.string().describe("The date of the alternative slot in YYYY-MM-DD format"),
    startTime: z.string().describe("The start time of the alternative slot"),
    endTime: z.string().describe("The end time of the alternative slot"),
    reason: z.string().describe("Brief explanation of why this alternative was suggested"),
  })),
  message: z.string().describe("A polite message explaining the conflict and offering alternatives"),
});

const alternativeSuggestionsParser = StructuredOutputParser.fromZodSchema(alternativeSuggestionsSchema);

// Simplified mock functions for testing
export async function extractBookingDetails(emailContent) {
  return {
    eventType: "conference",
    eventDate: "2023-11-25",
    startTime: "9:00 AM",
    endTime: "5:00 PM",
    numAttendees: 50,
    contactName: "John Smith",
    contactEmail: "john.smith@example.com",
    organization: "Tech Solutions Inc.",
    specialRequests: "Projector and microphone setup"
  };
}

export async function checkAvailabilityAndSuggest(bookingDetails, existingEvents) {
  return { available: true };
}

export async function generateBookingResponse(bookingDetails, isAvailable, alternatives = null) {
  return "Your booking has been confirmed.";
}

// Extract booking details from email content
export async function extractBookingDetails(emailContent) {
  const extractionChain = RunnableSequence.from([
    {
      emailContent: new RunnablePassthrough(),
      format_instructions: bookingDetailsParser.getFormatInstructions(),
    },
    async (input) => {
      try {
        const prompt = `You are an AI assistant that extracts booking details from emails. 
        Extract all relevant booking information from the following email:
        
        ${input.emailContent}
        
        ${input.format_instructions}
        
        Be precise and extract as much information as possible. If information is missing, make reasonable inferences.`;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        console.error("Error generating content:", error);
        throw error;
      }
    },
    bookingDetailsParser.parse,
  ]);

  try {
    return await extractionChain.invoke(emailContent);
  } catch (error) {
    console.error("Error extracting booking details:", error);
    throw error;
  }
}

// Check availability and suggest alternatives if needed
export async function checkAvailabilityAndSuggest(bookingDetails, existingEvents) {
  // First, check if there's a conflict
  const hasConflict = checkForConflict(bookingDetails, existingEvents);
  
  if (!hasConflict) {
    return { available: true };
  }
  
  // If there's a conflict, generate alternatives
  const alternativesChain = RunnableSequence.from([
    {
      bookingDetails: () => JSON.stringify(bookingDetails),
      existingEvents: () => JSON.stringify(existingEvents),
      format_instructions: alternativeSuggestionsParser.getFormatInstructions(),
    },
    async (input) => {
      try {
        const prompt = `You are an AI assistant that helps with scheduling conflicts.
        
        The user wants to book an event with these details:
        ${input.bookingDetails}
        
        However, there are conflicts with existing events:
        ${input.existingEvents}
        
        Please suggest 3 alternative time slots that avoid conflicts. Consider suggesting slots on the same day at different times, or on nearby dates.
        
        ${input.format_instructions}`;
        
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        console.error("Error generating content:", error);
        throw error;
      }
    },
    alternativeSuggestionsParser.parse,
  ]);

  try {
    const alternatives = await alternativesChain.invoke();
    return {
      available: false,
      alternatives: alternatives.suggestions,
      message: alternatives.message
    };
  } catch (error) {
    console.error("Error generating alternatives:", error);
    throw error;
  }
}

// Helper function to check for conflicts
function checkForConflict(bookingDetails, existingEvents) {
  const bookingDate = new Date(bookingDetails.eventDate);
  const bookingStart = parseTimeString(bookingDetails.startTime, bookingDate);
  const bookingEnd = parseTimeString(bookingDetails.endTime, bookingDate);
  
  return existingEvents.some(event => {
    const eventDate = new Date(event.start);
    // Check if it's the same day
    if (eventDate.toDateString() !== bookingDate.toDateString()) {
      return false;
    }
    
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    // Check for overlap
    return (
      (bookingStart >= eventStart && bookingStart < eventEnd) ||
      (bookingEnd > eventStart && bookingEnd <= eventEnd) ||
      (bookingStart <= eventStart && bookingEnd >= eventEnd)
    );
  });
}

// Helper function to parse time strings like "9:00 AM"
function parseTimeString(timeString, dateObj) {
  const date = new Date(dateObj);
  const [time, period] = timeString.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  if (period === 'PM' && hours < 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }
  
  date.setHours(hours, minutes || 0, 0, 0);
  return date;
}

// Generate a response for a booking
export async function generateBookingResponse(bookingDetails, isAvailable, alternatives = null) {
  const responseChain = RunnableSequence.from([
    {
      bookingDetails: () => JSON.stringify(bookingDetails),
      isAvailable: () => isAvailable,
      alternatives: () => alternatives ? JSON.stringify(alternatives) : null,
    },
    async (input) => {
      let prompt = `You are an AI assistant that helps with booking confirmations.
      
      The user has requested a booking with these details:
      ${input.bookingDetails}
      `;
      
      if (input.isAvailable) {
        prompt += `
        The booking is available. Please generate a polite confirmation message that includes all the booking details.
        Include a note that an invoice will be generated and sent separately.
        `;
      } else {
        prompt += `
        Unfortunately, the booking is not available at the requested time.
        
        Here are some alternative slots:
        ${input.alternatives}
        
        Please generate a polite message explaining that the requested slot is not available,
        offering these alternatives, and asking the user to confirm if any of these alternatives work for them.
        `;
      }
      
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        console.error("Error generating content:", error);
        throw error;
      }
    },
  ]);

  try {
    return await responseChain.invoke();
  } catch (error) {
    console.error("Error generating booking response:", error);
    throw error;
  }
} 