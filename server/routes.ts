import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDownloadItemSchema } from "@shared/schema";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Ensure downloads directory exists
  const downloadsDir = path.join(__dirname, '..', 'downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  // Get all download items
  app.get("/api/downloads", async (req, res) => {
    try {
      const items = await storage.getAllDownloadItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch downloads" });
    }
  });

  // Add new download item
  app.post("/api/downloads", async (req, res) => {
    try {
      const validatedData = insertDownloadItemSchema.parse(req.body);
      
      // Validate social media URL (Facebook, Instagram, YouTube)
      const socialMediaPattern = /^https?:\/\/(www\.)?(facebook\.com|fb\.watch|instagram\.com|youtube\.com|youtu\.be)/;
      if (!socialMediaPattern.test(validatedData.url)) {
        return res.status(400).json({ message: "Invalid social media URL" });
      }

      const item = await storage.createDownloadItem({
        ...validatedData,
        status: "pending"
      });
      
      res.json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Start download for specific item
  app.post("/api/downloads/:id/start", async (req, res) => {
    try {
      const { id } = req.params;
      const item = await storage.getDownloadItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Download item not found" });
      }

      if (item.status !== "pending") {
        return res.status(400).json({ message: "Download already processed" });
      }

      // First get video metadata
      const metadataProcess = spawn('yt-dlp', [
        '--dump-json',
        '--no-warnings',
        '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        '--referer', 'https://www.facebook.com/',
        '--no-check-certificates',
        item.url
      ]);

      let metadataJson = '';
      metadataProcess.stdout.on('data', (data) => {
        metadataJson += data.toString();
      });

      metadataProcess.on('close', async (code) => {
        if (code === 0 && metadataJson.trim()) {
          try {
            const metadata = JSON.parse(metadataJson.trim());
            await storage.updateDownloadItem(id, {
              title: metadata.title || metadata.fulltitle || (item.downloadType === "audio" ? "Social Media Audio" : "Social Media Video"),
              duration: metadata.duration_string || (metadata.duration ? `${Math.floor(metadata.duration / 60)}:${(metadata.duration % 60).toString().padStart(2, '0')}` : null),
              quality: item.downloadType === "audio" ? "192K MP3" : (metadata.height ? `${metadata.height}p` : null),
            });
          } catch (e) {
            console.log('Could not parse metadata, continuing with download...');
          }
        }

        // Update status to downloading
        await storage.updateDownloadItem(id, { status: "downloading", progress: 0 });

        // Start actual download
        const fileName = `${id}.%(ext)s`;
        const outputPath = path.join(downloadsDir, fileName);
        
        const ytdlpArgs = [
          '--no-warnings',
          '--newline',
          '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          '--referer', 'https://www.facebook.com/',
          '--output', outputPath,
          '--no-check-certificates'
        ];

        // Add audio-specific or video-specific options
        if (item.downloadType === "audio") {
          ytdlpArgs.push('--extract-audio');
          ytdlpArgs.push('--audio-format', 'mp3');
          ytdlpArgs.push('--audio-quality', '192K');
          ytdlpArgs.push('--prefer-ffmpeg');
        } else {
          // Prioritize high quality video formats - allows up to 1080p, falls back gracefully
          ytdlpArgs.push('--format', 'best[height<=1080]/best[height<=720]/best');
        }

        ytdlpArgs.push(item.url);
        
        const ytdlp = spawn('yt-dlp', ytdlpArgs);

        ytdlp.stdout.on('data', async (data) => {
        const output = data.toString();
        console.log('yt-dlp output:', output);
        
        // Parse download progress
        if (output.includes('[download]') && output.includes('%')) {
          const progressMatch = output.match(/(\d+\.?\d*)%/);
          const speedMatch = output.match(/(\d+\.?\d*[KMG]?iB\/s)/);
          const sizeMatch = output.match(/(\d+\.?\d*[KMG]?iB)/);
          
          if (progressMatch) {
            const progress = Math.round(parseFloat(progressMatch[1]));
            const downloadSpeed = speedMatch ? speedMatch[1] : undefined;
            const currentSize = sizeMatch ? sizeMatch[1] : undefined;
            
            await storage.updateDownloadItem(id, { 
              progress,
              downloadSpeed: downloadSpeed || item.downloadSpeed,
              fileSize: currentSize || item.fileSize
            });
          }
        }
        
        // Parse video information from download output
        if (output.includes('[info]')) {
          // Additional info parsing can be added here if needed
        }
        });

        ytdlp.stderr.on('data', async (data) => {
        console.error(`yt-dlp error: ${data}`);
        await storage.updateDownloadItem(id, {
          status: "failed",
          errorMessage: data.toString().slice(0, 200)
        });
        });

        ytdlp.on('close', async (code) => {
        if (code === 0) {
          // Find the actual downloaded file
          const files = fs.readdirSync(downloadsDir).filter(f => f.startsWith(id));
          const downloadedFile = files[0];
          
          if (downloadedFile) {
            await storage.updateDownloadItem(id, {
              status: "ready",
              progress: 100,
              fileName: downloadedFile
            });
          } else {
            await storage.updateDownloadItem(id, {
              status: "failed",
              errorMessage: "File not found after download"
            });
          }
        } else {
          await storage.updateDownloadItem(id, {
            status: "failed",
            errorMessage: `Download failed with code ${code}`
          });
          }
        });
      });

      res.json({ message: "Download started" });
    } catch (error) {
      res.status(500).json({ message: "Failed to start download" });
    }
  });

  // Download all pending items
  app.post("/api/downloads/bulk", async (req, res) => {
    try {
      const items = await storage.getAllDownloadItems();
      const pendingItems = items.filter(item => item.status === "pending");
      
      // Start downloads for all pending items
      for (const item of pendingItems) {
        // Trigger individual download (reuse the logic above)
        const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/downloads/${item.id}/start`, {
          method: 'POST'
        });
      }
      
      res.json({ message: `Started ${pendingItems.length} downloads` });
    } catch (error) {
      res.status(500).json({ message: "Failed to start bulk download" });
    }
  });

  // Delete download item
  app.delete("/api/downloads/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const item = await storage.getDownloadItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Download item not found" });
      }

      // Delete file if it exists
      if (item.fileName) {
        const filePath = path.join(downloadsDir, item.fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await storage.deleteDownloadItem(id);
      res.json({ message: "Download item deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete download item" });
    }
  });

  // Serve downloaded files
  app.get("/downloads/:filename", (req, res) => {
    try {
      const { filename } = req.params;
      const filePath = path.join(downloadsDir, filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }

      res.download(filePath);
    } catch (error) {
      res.status(500).json({ message: "Failed to serve file" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
