import { generateText, Output } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { LoadAPIKeyError } from "ai";

import { z } from "zod";

type SocialPlatform = "instagram" | "twitter" | "linkedin";
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

export async function generateSocialPost(
  eventData: {
    title: string;
    description: string;
    startDate: Date;
    location: string;
  },
  platform: SocialPlatform
) {
  const platformInfo: Record<SocialPlatform, { limit: number; style: string }> =
    {
      instagram: {
        limit: 2200,
        style: "visual, engaging, with relevant hashtags",
      },
      twitter: {
        limit: 280,
        style: "concise, catchy, with 1-2 hashtags",
      },
      linkedin: {
        limit: 5000,
        style: "informative, engaging, with a clear call to action",
      },
    };

  const { text } = await generateText({
    model: gemini("gemini-1.5-flash"),
    prompt: `Create a ${platform} post for a college event with the following details:
      - Event Title: ${eventData.title}
      - Description: ${eventData.description}
      - Date: ${eventData.startDate.toLocaleDateString()}
      - Location: ${eventData.location}
      
      Make it ${platformInfo[platform].style}. Keep it under ${
      platformInfo[platform].limit
    } characters.
      Include appropriate emojis and formatted text for the platform.`,
  });

  return text;
}

export async function generateSocialPostUser(
  eventData: {
    eventTitle: string;
    position: string;
    eventDate: string;
  },
  platform: SocialPlatform
) {
  const platformInfo: Record<SocialPlatform, { limit: number; style: string }> =
    {
      instagram: {
        limit: 2200,
        style: "visual, engaging, with relevant hashtags",
      },
      twitter: {
        limit: 280,
        style: "concise, catchy, with 1-2 hashtags",
      },
      linkedin: {
        limit: 3000,
        style:
          "professional, reflective, with a clear message about the achievement",
      },
    };
  const prompt = `Create a ${platform} post about winning an award at a college event with the following details:
        - Event Title: ${eventData.eventTitle}
        - Position/Award: ${eventData.position}
        - Date: ${eventData.eventDate}
        
        Make it ${platformInfo[platform].style}. Keep it under ${platformInfo[platform].limit} characters.
        Include appropriate emojis and formatted text for the platform.
        The tone should be proud but not boastful, grateful, and excited.
        Include a brief mention of what you learned or gained from the experience.`;

  const { text } = await generateText({
    model: gemini("gemini-1.5-flash"),
    prompt,
  });
  return text;
}
