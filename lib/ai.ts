import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const gemini = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export async function handleEventQuery(
  eventData: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location: string;
    createdBy: string;
  },
  query: string
) {
  const { text } = await generateText({
    model: gemini("gemini-1.5-flash"),
    prompt: `You are a helpful assistant for a college event:
        - Event Title: ${eventData.title}
        - Description: ${eventData.description}
        - Date Range: ${eventData.startDate.toLocaleDateString()} to ${eventData.endDate.toLocaleDateString()}
        - Location: ${eventData.location}
        - This question was asked by: ${eventData.createdBy}
        
        Answer this question about the event concisely and helpfully: "${query}"`,
  });

  return text;
}
// function generateTextLocal(arg0: { model: any; prompt: string; }): { text: any; } | PromiseLike<{ text: any; }> {
//     throw new Error("Function not implemented.");
// }
