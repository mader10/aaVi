import { type User, type InsertUser, type DownloadItem, type InsertDownloadItem } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Download items
  getDownloadItem(id: string): Promise<DownloadItem | undefined>;
  getAllDownloadItems(): Promise<DownloadItem[]>;
  createDownloadItem(item: InsertDownloadItem): Promise<DownloadItem>;
  updateDownloadItem(id: string, updates: Partial<DownloadItem>): Promise<DownloadItem | undefined>;
  deleteDownloadItem(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private downloadItems: Map<string, DownloadItem>;

  constructor() {
    this.users = new Map();
    this.downloadItems = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDownloadItem(id: string): Promise<DownloadItem | undefined> {
    return this.downloadItems.get(id);
  }

  async getAllDownloadItems(): Promise<DownloadItem[]> {
    return Array.from(this.downloadItems.values())
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }

  async createDownloadItem(insertItem: InsertDownloadItem): Promise<DownloadItem> {
    const id = randomUUID();
    const item: DownloadItem = { 
      ...insertItem,
      title: insertItem.title ?? null,
      status: insertItem.status ?? "pending",
      progress: insertItem.progress ?? null,
      fileSize: insertItem.fileSize ?? null,
      duration: insertItem.duration ?? null,
      quality: insertItem.quality ?? null,
      fileName: insertItem.fileName ?? null,
      errorMessage: insertItem.errorMessage ?? null,
      downloadSpeed: insertItem.downloadSpeed ?? null,
      id, 
      createdAt: new Date() 
    };
    this.downloadItems.set(id, item);
    return item;
  }

  async updateDownloadItem(id: string, updates: Partial<DownloadItem>): Promise<DownloadItem | undefined> {
    const item = this.downloadItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates };
    this.downloadItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteDownloadItem(id: string): Promise<boolean> {
    return this.downloadItems.delete(id);
  }
}

export const storage = new MemStorage();
