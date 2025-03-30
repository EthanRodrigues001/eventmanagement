import { generateText, Output } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { LoadAPIKeyError } from "ai";

import { z } from "zod";

// type SocialPlatform = "instagram" | "twitter" | "facebook"
type TaskCategory = "PR" | "marketing" | "logistics" | "technical";

const gemini = createGoogleGenerativeAI({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY,
});

try {
  // const gemini = createGoogleGenerativeAI({
  //   apiKey: process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY
  //     ? process.env.GOOGLE_GENERATIVE_AI_API_KEY
  //     : process.env.NEXT_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY,
  // });
} catch (error) {
  if (LoadAPIKeyError.isInstance(error)) {
    console.error("Error loading API key:", error.message);
  }
}

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

export async function generateEventTasks(
  eventData: {
    title: string;
    description: string;
    startDate: Date;
    endDate: Date;
    location: string;
    organizingTeam: { name: string; role: string }[];
  },
  category: TaskCategory
): Promise<
  { title: string; description: string; assignedTo?: string | null }[]
> {
  const categoryInfo = {
    PR: "public relations, publicity, media relations, press coverage",
    marketing: "promotion, advertising, social media, audience engagement",
    logistics: "venue management, equipment, scheduling, transportation, setup",
    technical:
      "AV equipment, software, technical support, streaming, IT infrastructure",
  };
  const teamMembersString = eventData.organizingTeam
    .map((member) => `- ${member.name} (${member.role})`)
    .join("\n");

  const { experimental_output } = await generateText({
    model: gemini("gemini-1.5-flash"),
    experimental_output: Output.object({
      schema: z.object({
        title: z.string().describe("The title of task (what task to do...)"),
        description: z.string().describe("A detailed description of the task."),
        assignedTo: z
          .string()
          .describe(
            "The person to whom the item is assigned to based on his given role."
          ),
      }),
    }),
    prompt: `Generate 5 specific tasks for the "${category}" category for the following college event:
      - Event Title: ${eventData.title}
      - Description: ${eventData.description}
      - Date Range: ${eventData.startDate.toLocaleDateString()} to ${eventData.endDate.toLocaleDateString()}
      - Location: ${eventData.location}
      - Event organizing team

      
      The tasks should focus on ${
        categoryInfo[category]
      }. For each task, provide:
      1. Task title (short, actionable)
      2. Brief description of the task
      3. Organizing Team Members and Roles:
      ${teamMembersString}
      
      Format as JSON array of objects with title, description, and assignedTo properties.`,
  });

  try {
    return Array.isArray(experimental_output)
      ? experimental_output
      : [experimental_output];
  } catch (error) {
    console.error("Error parsing AI-generated tasks:", error);
    return [];
  }
}
