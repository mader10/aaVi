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
      
      // Validate Facebook URL
      const fbUrlPattern = /^https?:\/\/(www\.)?(facebook\.com|fb\.watch)/;
      if (!fbUrlPattern.test(validatedData.url)) {
        return res.status(400).json({ message: "Invalid Facebook URL" });
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

      // Update status to downloading
      await storage.updateDownloadItem(id, { status: "downloading", progress: 0 });

      // Start yt-dlp process
      const fileName = `${id}.%(ext)s`;
      const outputPath = path.join(downloadsDir, fileName);
      
      const ytdlp = spawn('yt-dlp', [
        '--no-warnings',
        '--extract-flat',
        '--print', 'title',
        '--print', 'duration_string',
        '--print', 'filesize_approx',
        '--print', 'height',
        '--output', outputPath,
        '--format', 'best[ext=mp4]',
        '--progress',
        item.url
      ]);

      let title = '';
      let duration = '';
      let fileSize = '';
      let quality = '';

      ytdlp.stdout.on('data', async (data) => {
        const output = data.toString();
        const lines = output.trim().split('\n');
        
        // Parse metadata from yt-dlp output
        if (!title && lines[0] && !lines[0].includes('[download]')) {
          title = lines[0];
        }
        if (!duration && lines[1] && !lines[1].includes('[download]')) {
          duration = lines[1];
        }
        if (!fileSize && lines[2] && !lines[2].includes('[download]')) {
          const size = parseInt(lines[2]);
          if (!isNaN(size)) {
            fileSize = (size / (1024 * 1024)).toFixed(1) + ' MB';
          }
        }
        if (!quality && lines[3] && !lines[3].includes('[download]')) {
          quality = lines[3] + 'p';
        }

        // Update item with metadata
        if (title || duration || fileSize || quality) {
          await storage.updateDownloadItem(id, {
            title: title || item.title,
            duration: duration || item.duration,
            fileSize: fileSize || item.fileSize,
            quality: quality || item.quality
          });
        }

        // Parse progress
        if (output.includes('[download]') && output.includes('%')) {
          const progressMatch = output.match(/(\d+\.?\d*)%/);
          const speedMatch = output.match(/(\d+\.?\d*\w+\/s)/);
          
          if (progressMatch) {
            const progress = Math.round(parseFloat(progressMatch[1]));
            const downloadSpeed = speedMatch ? speedMatch[1] : undefined;
            
            await storage.updateDownloadItem(id, { 
              progress,
              downloadSpeed: downloadSpeed || item.downloadSpeed
            });
          }
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
