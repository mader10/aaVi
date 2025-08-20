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

  // Stream download directly to user
  app.get("/api/downloads/:id/stream", async (req, res) => {
    try {
      const { id } = req.params;
      const item = await storage.getDownloadItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Download item not found" });
      }

      // Get video metadata first
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
        let filename = 'download';
        let contentType = 'application/octet-stream';
        
        if (code === 0 && metadataJson.trim()) {
          try {
            const metadata = JSON.parse(metadataJson.trim());
            filename = (metadata.title || 'download').replace(/[^a-zA-Z0-9]/g, '_');
          } catch (e) {
            console.log('Could not parse metadata');
          }
        }

        // Set appropriate headers
        const ext = item.downloadType === 'audio' ? 'mp3' : 'mp4';
        contentType = item.downloadType === 'audio' ? 'audio/mpeg' : 'video/mp4';
        
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.${ext}"`);
        res.setHeader('Transfer-Encoding', 'chunked');

        // Stream download directly to response
        const ytdlpArgs = [
          '--no-warnings',
          '--user-agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          '--referer', 'https://www.facebook.com/',
          '--output', '-',
          '--no-check-certificates'
        ];

        if (item.downloadType === "audio") {
          ytdlpArgs.push('--extract-audio', '--audio-format', 'mp3', '--audio-quality', '192K');
        } else {
          ytdlpArgs.push('--format', 'best[height<=1080][vbr>2000]/best[height<=1080][vbr>1500]/best[height<=1080]/best[vbr>1000]/best');
        }

        ytdlpArgs.push(item.url);
        
        const ytdlp = spawn('yt-dlp', ytdlpArgs);

        ytdlp.stdout.pipe(res);
        
        ytdlp.stderr.on('data', (data) => {
          console.error(`Stream error: ${data}`);
        });

        ytdlp.on('close', (code) => {
          if (code !== 0) {
            if (!res.headersSent) {
              res.status(500).json({ message: 'Download failed' });
            }
          }
          res.end();
        });

        ytdlp.on('error', (err) => {
          console.error('Stream process error:', err);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Stream failed' });
          }
        });
      });

    } catch (error) {
      res.status(500).json({ message: "Failed to stream download" });
    }
  });

  // Start download (now just updates status)
  app.post("/api/downloads/:id/start", async (req, res) => {
    try {
      const { id } = req.params;
      const item = await storage.getDownloadItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Download item not found" });
      }

      await storage.updateDownloadItem(id, { status: "ready" });
      res.json({ message: "Download ready for streaming" });
    } catch (error) {
      res.status(500).json({ message: "Failed to prepare download" });
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



  const httpServer = createServer(app);
  return httpServer;
}
