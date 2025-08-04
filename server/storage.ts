import { contacts, chatSessions, type Contact, type InsertContact, type ChatSession, type InsertChatSession } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  createContact(contact: InsertContact): Promise<Contact>;
  getContact(id: string): Promise<Contact | undefined>;
  
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(sessionId: string): Promise<ChatSession | undefined>;
  updateChatSession(sessionId: string, messages: any): Promise<ChatSession>;
}

export class MemStorage implements IStorage {
  private contacts: Map<string, Contact>;
  private chatSessions: Map<string, ChatSession>;

  constructor() {
    this.contacts = new Map();
    this.chatSessions = new Map();
  }

  async createContact(insertContact: InsertContact): Promise<Contact> {
    const id = randomUUID();
    const contact: Contact = { 
      ...insertContact, 
      industry: insertContact.industry || null,
      id,
      createdAt: new Date()
    };
    this.contacts.set(id, contact);
    return contact;
  }

  async getContact(id: string): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const id = randomUUID();
    const session: ChatSession = {
      ...insertSession,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.chatSessions.set(insertSession.sessionId, session);
    return session;
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    return this.chatSessions.get(sessionId);
  }

  async updateChatSession(sessionId: string, messages: any): Promise<ChatSession> {
    const existing = this.chatSessions.get(sessionId);
    if (!existing) {
      throw new Error("Chat session not found");
    }
    
    const updated: ChatSession = {
      ...existing,
      messages,
      updatedAt: new Date()
    };
    
    this.chatSessions.set(sessionId, updated);
    return updated;
  }
}

export class DatabaseStorage implements IStorage {
  async createContact(insertContact: InsertContact): Promise<Contact> {
    const [contact] = await db
      .insert(contacts)
      .values(insertContact)
      .returning();
    return contact;
  }

  async getContact(id: string): Promise<Contact | undefined> {
    const [contact] = await db.select().from(contacts).where(eq(contacts.id, id));
    return contact || undefined;
  }

  async createChatSession(insertSession: InsertChatSession): Promise<ChatSession> {
    const [session] = await db
      .insert(chatSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getChatSession(sessionId: string): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.sessionId, sessionId));
    return session || undefined;
  }

  async updateChatSession(sessionId: string, messages: any): Promise<ChatSession> {
    const [session] = await db
      .update(chatSessions)
      .set({ messages, updatedAt: new Date() })
      .where(eq(chatSessions.sessionId, sessionId))
      .returning();
    
    if (!session) {
      throw new Error("Chat session not found");
    }
    
    return session;
  }
}

// Use database storage in production, memory storage in development
export const storage = process.env.NODE_ENV === 'production' 
  ? new DatabaseStorage() 
  : new MemStorage();
