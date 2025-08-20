# aaVideo - High-Quality Video Downloader

A modern web application for downloading high-bitrate videos from social media platforms including Facebook, Instagram, and YouTube.

## Features

- **High-Quality Downloads**: Prioritizes highest bitrate available (2000+ kbps preferred)
- **Multiple Formats**: Support for video (MP4) and audio (MP3) downloads
- **Bulk Downloads**: Queue multiple videos for batch processing
- **Real-time Progress**: Live download progress tracking
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS
- **Direct Streaming**: No server storage - streams directly to user

## Supported Platforms

- Facebook (facebook.com, fb.watch)
- Instagram (instagram.com)
- YouTube (youtube.com, youtu.be)

## Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Download Engine**: yt-dlp
- **Build Tool**: Vite

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   DATABASE_URL=your_postgresql_connection_string
   ```

3. **Run development server**:
   ```bash
   npm run dev
   ```

4. **Open browser**: http://localhost:5000

## Deployment

### Free Hosting Options

- **Railway** (Recommended): $5 free credit monthly
- **Render**: Free tier with limitations
- **Fly.io**: Free tier available

### Deploy to Railway

1. Push to GitHub
2. Connect repository to Railway
3. Add `DATABASE_URL` environment variable
4. Deploy

## Video Quality Settings

The app prioritizes video quality in this order:
1. 1080p with 2000+ kbps bitrate
2. 1080p with 1500+ kbps bitrate  
3. Any 1080p video
4. Videos with 1000+ kbps bitrate
5. Best available quality

## License

MIT License - feel free to use and modify.