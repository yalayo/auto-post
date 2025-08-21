# Overview

LinkedIn AutoPoster AI is a full-stack web application that enables users to automatically generate and post content to their LinkedIn feeds and company pages using AI-powered content generation from Google's Gemini API. The application provides scheduling capabilities, post preview functionality, and analytics tracking for automated LinkedIn content management.

## Current Implementation Status

The application is fully implemented with:
- Complete database schema with PostgreSQL and Drizzle ORM
- AI-powered post generation using Google Gemini API
- LinkedIn OAuth integration (backend ready)
- Full-featured dashboard with analytics, post composer, and account management
- Responsive UI with shadcn/ui components and Tailwind CSS
- TypeScript throughout frontend and backend

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client-side is built with React and TypeScript using Vite as the build tool. The UI leverages shadcn/ui components with Radix UI primitives for a consistent design system. State management is handled through TanStack Query (React Query) for server state and local React state for UI interactions. The application uses Wouter for lightweight client-side routing and implements a responsive design with Tailwind CSS.

## Backend Architecture
The server follows an Express.js REST API architecture with TypeScript. The codebase is structured with clear separation of concerns through dedicated service layers for external integrations (Gemini AI and LinkedIn API). Authentication is handled via OAuth 2.0 flow for LinkedIn integration. The API implements comprehensive error handling and request/response logging middleware.

## Database Design
The application uses PostgreSQL with Drizzle ORM for type-safe database operations. The schema includes three main entities:
- Users table for authentication and profile data
- LinkedIn Accounts table for managing multiple connected LinkedIn profiles/pages
- Posts table for storing generated content, scheduling information, and engagement metrics

The database supports multi-account management per user and tracks post lifecycle from draft to published states.

## AI Integration
Content generation is powered by Google's Gemini API through the @google/genai SDK. The system allows users to specify tone (professional, casual, inspirational, educational), length (short, medium, long), and custom hashtags. AI-generated content includes suggested hashtags and can be edited before publishing.

## Authentication & Authorization
LinkedIn OAuth 2.0 integration enables secure access to user profiles and company pages. The system stores access tokens with refresh capability and manages token expiration. User sessions are maintained through local storage for demo purposes, with the architecture supporting more robust session management.

## Scheduling & Automation
Posts can be scheduled for future publishing with the database storing scheduling timestamps. The system includes infrastructure for background job processing to handle scheduled post publishing, though the full scheduler implementation would require additional job queue integration.

# External Dependencies

## Third-Party APIs
- **Google Gemini API**: AI content generation service requiring GEMINI_API_KEY
- **LinkedIn API**: Social media posting and profile access via OAuth 2.0

## Database Services
- **Neon Database**: PostgreSQL serverless database with connection pooling
- **Drizzle ORM**: Type-safe database toolkit with schema migrations

## UI Framework
- **shadcn/ui**: Pre-built component library based on Radix UI primitives
- **Tailwind CSS**: Utility-first CSS framework for responsive design
- **Radix UI**: Headless component primitives for accessibility

## Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across frontend and backend
- **TanStack Query**: Server state management and caching
- **Wouter**: Lightweight client-side routing