# Social Media Video Downloader

## Overview

A full-stack web application for downloading videos from multiple social media platforms including Facebook, Instagram, and YouTube. Built with React frontend and Node.js/Express backend, this tool allows users to add multiple video URLs to a queue and download them as MP4 files. The application features a modern UI with real-time progress tracking, video metadata extraction, and status updates for each download.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/UI components built on Radix UI primitives
- **Styling**: TailwindCSS with CSS variables for theming
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

The frontend follows a component-based architecture with reusable UI components. Key components include URL input form, download queue display, progress tracking, and status management. The application uses a clean separation between presentation and business logic.

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Data Layer**: In-memory storage with interface abstraction for future database integration
- **File Processing**: Child process spawning for yt-dlp video downloads
- **API Design**: RESTful endpoints for CRUD operations on download items

The backend implements a storage abstraction pattern allowing easy migration from in-memory storage to persistent databases. The download processing is handled asynchronously using child processes to avoid blocking the main thread.

### Data Storage
- **Current**: In-memory storage using Map data structures
- **Schema**: Drizzle ORM schema definitions ready for PostgreSQL migration
- **Models**: Download items with status tracking (pending, downloading, ready, failed)

The application is designed with database-ready schemas using Drizzle ORM, making it easy to transition from in-memory storage to PostgreSQL when needed.

### Authentication & Authorization
- **Current State**: No authentication implemented
- **Prepared**: User schema exists in the database schema for future implementation
- **Session Management**: Connect-pg-simple dependency suggests planned PostgreSQL session store

### File Management
- **Download Storage**: Local filesystem in `/downloads` directory
- **File Serving**: Express static file serving for completed downloads
- **Organization**: Files stored with unique identifiers to prevent conflicts

### Supported Platforms

- **Facebook**: All video formats including shared links (facebook.com/share/r/...)
- **Instagram**: Posts, Reels, Stories, IGTV content
- **YouTube**: Videos, Shorts, livestreams, music content

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, Vite for development and build
- **Backend Framework**: Express.js with TypeScript support via tsx
- **Database ORM**: Drizzle ORM with PostgreSQL adapter and Zod integration
- **Database Driver**: Neon serverless PostgreSQL client

### UI and Styling
- **Component Library**: Radix UI primitives for accessible components
- **Styling**: TailwindCSS with PostCSS for processing
- **Icons**: Lucide React for consistent iconography
- **Utilities**: Class Variance Authority for component variants, clsx for conditional classes

### Development Tools
- **Video Processing**: yt-dlp latest version (2025.08.20) with enhanced Facebook, Instagram, and YouTube support
- **Metadata Extraction**: JSON-based video information retrieval for titles, duration, and quality
- **Form Management**: React Hook Form with Hookform resolvers
- **Date Handling**: date-fns for date manipulation
- **Command Interface**: cmdk for command palette functionality

### Development and Build
- **Development**: Vite with React plugin and runtime error overlay
- **Build**: ESBuild for server bundling, Vite for client bundling
- **Type Safety**: TypeScript with strict configuration
- **Database Migrations**: Drizzle Kit for schema management

The application architecture supports both development and production environments with appropriate tooling for each phase.