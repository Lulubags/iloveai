import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function generateChatResponse(message: string, conversationHistory: any[] = []): Promise<string> {
  try {
    const systemPrompt = `You are an AI business consultant for iLove AI, a global AI solutions company. You help businesses understand how AI agents can transform their operations.

Key services we offer:
- Customer Service Agents: 24/7 multilingual chatbots for customer support
- Business Intelligence Agents: AI-powered analytics and reporting
- E-commerce Agents: Personalized shopping assistants and inventory management
- Process Automation Agents: Workflow automation and document processing

Focus on:
- Understanding the client's business needs
- Explaining how AI can solve their specific challenges
- Highlighting benefits like cost reduction, efficiency gains, and improved customer satisfaction
- Mentioning our expertise with businesses worldwide
- Being professional yet approachable
- Asking follow-up questions to better understand their needs

Keep responses concise but informative. Always end with a question or call-to-action to continue the conversation.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: message }
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I apologize, but I'm having trouble processing your request right now. Please try again or contact our team directly.";
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate AI response. Please try again later.");
  }
}
