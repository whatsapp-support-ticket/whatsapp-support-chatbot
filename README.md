# WhatsApp Lottery Ticket Booking Chatbot

A production-ready WhatsApp chatbot for lottery ticket booking with admin panel.

## Features

- WhatsApp chatbot for ticket selection and payment
- QR code payment system
- Admin panel for payment verification
- Ticket reservation with expiration
- File upload for payment screenshots

## Tech Stack

- Next.js 16
- TypeScript
- MongoDB with Mongoose
- Twilio WhatsApp API
- Cloudinary for file storage
- Tailwind CSS
- React Query

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local` (see `.env.local` for required vars)
4. Set up MongoDB database
5. Configure Twilio WhatsApp sandbox
6. Run the development server: `npm run dev`

## Environment Variables

Copy `.env.local` and fill in your values:

- MONGODB_URI: MongoDB connection string
- TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER: Twilio credentials
- JWT_SECRET: Secret for JWT tokens
- ADMIN_PASSWORD: Password for admin login
- CLOUDINARY_*: Cloudinary credentials for file uploads
- QR_CODE_URL: URL of the payment QR code image

## Usage

1. Access admin panel at `/admin` (login required)
2. Set up Twilio webhook to point to `/api/whatsapp/webhook`
3. Users can interact with the bot via WhatsApp

## API Endpoints

- POST /api/whatsapp/webhook: Handles WhatsApp messages
- GET /api/tickets/available: Get available tickets
- POST /api/tickets/reserve: Reserve a ticket
- POST /api/payments: Submit payment
- POST /api/admin/login: Admin login
- GET /api/admin/payments: Get payments for verification
- POST /api/admin/payments/approve: Approve payment
- POST /api/admin/payments/reject: Reject payment

## Database Schema

- Users: phoneNumber, createdAt
- Tickets: ticketNumber, drawId, status, reservedBy, reservedAt
- Payments: phoneNumber, ticketNumber, screenshotUrl, utrNumber, status, createdAt
- Draws: drawName, drawDate, ticketPrice

## Deployment

Deploy to Vercel or any Node.js hosting platform. Ensure environment variables are set.
