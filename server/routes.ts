import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSchema, chatRequestSchema, type ChatMessage } from "@shared/schema";
import { generateChatResponse } from "./lib/openai";
import { sendContactEmail } from "./lib/email";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Contact form submission
  app.post("/api/contact", async (req, res) => {
    try {
      const contactData = insertContactSchema.parse(req.body);
      
      // Save to storage
      const contact = await storage.createContact(contactData);
      
      // Send email notifications
      try {
        await sendContactEmail(contactData);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // Continue even if email fails - contact is still saved
      }
      
      res.json({ 
        success: true, 
        message: "Thank you for your inquiry! We'll get back to you within 24 hours.",
        contactId: contact.id 
      });
    } catch (error) {
      console.error("Contact submission error:", error);
      res.status(400).json({ 
        success: false, 
        message: "Failed to submit contact form. Please try again." 
      });
    }
  });

  // Chat with AI
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, sessionId } = chatRequestSchema.parse(req.body);
      
      let currentSessionId = sessionId || randomUUID();
      let conversationHistory: ChatMessage[] = [];
      
      // Get existing conversation if sessionId provided
      if (sessionId) {
        const existingSession = await storage.getChatSession(sessionId);
        if (existingSession) {
          conversationHistory = existingSession.messages as ChatMessage[];
        }
      }
      
      // Generate AI response
      const aiResponse = await generateChatResponse(
        message, 
        conversationHistory.map(msg => ({ role: msg.role, content: msg.content }))
      );
      
      // Update conversation history
      const userMessage: ChatMessage = {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };
      
      const updatedHistory = [...conversationHistory, userMessage, assistantMessage];
      
      // Save or update chat session
      if (sessionId && await storage.getChatSession(sessionId)) {
        await storage.updateChatSession(currentSessionId, updatedHistory);
      } else {
        await storage.createChatSession({
          sessionId: currentSessionId,
          messages: updatedHistory
        });
      }
      
      res.json({
        response: aiResponse,
        sessionId: currentSessionId
      });
      
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ 
        error: "I apologize, but I'm having trouble processing your request right now. Please try again or contact our team directly." 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
