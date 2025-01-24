
# Osiri - Restaurant Seating Review Platform

A web application that allows users to review and share information about restaurant seating arrangements and accessibility.

## Features

- User authentication and authorization
- Restaurant search and browsing
- Seat reviews and ratings
- Image uploads for seats
- Admin dashboard for feedback management
- Yelp integration for restaurant data
- Responsive design for mobile and desktop

## Tech Stack

- Frontend: React, TypeScript, Tailwind CSS, Shadcn/ui
- Backend: Express.js, Node.js
- Database: PostgreSQL with Drizzle ORM
- Image Storage: Cloudinary
- Authentication: Passport.js
- API Integration: Yelp Fusion API

## Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`.

## Project Structure

- `/client` - React frontend application
- `/server` - Express backend API
- `/db` - Database schema and configurations
- `/uploads` - Temporary storage for file uploads

## Environment Variables Required

- `DATABASE_URL` - PostgreSQL connection string
- `YELP_API_KEY` - Yelp Fusion API key
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret

## License

MIT License
