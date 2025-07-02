// --- File: src/services/llmService.ts ---

import { formatDistanceToNowStrict } from 'date-fns';
import { ADVISOR_PROFILES} from '../config/prompts.ts';
import { AdvisorFeedback, JournalEntry, SummitMessage, Goal, GoalCompletionStatus } from '../types/index.ts';
import { getAllAttributes, getActiveWeeklyGoals, getPendingDeadlines } from './firestoreService.ts';

const OPENROUTER_API_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';

const callModelViaOpenRouter = async (prompt: string, apiKey: string, model: string): Promise<string> => {
  const response = await fetch(OPENROUTER_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': `${window.location.host}`,
      'X-Title': 'Advisor Journal',
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API Error (${response.status}): ${errorData.error.message}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

const parseCombinedFeedback = (
  responseText: string,
  advisorNames: string[]
): Record<string, AdvisorFeedback> => {
  const feedbackObject: Record<string, AdvisorFeedback> = {};

  advisorNames.forEach(name => {
    const regex = new RegExp(`\\[${name.toUpperCase()}\\]([\\s\\S]*?)(?=\\s*\\[[A-Z_]+\\]|$)`);
    const match = responseText.match(regex);

    if (match && match[1] && match[1].trim()) {
      feedbackObject[name] = { status: 'completed', response: match[1].trim() };
    } else {
      feedbackObject[name] = { status: 'error', response: `Advisor "${name}" response not found in combined output.` };
    }
  });

  return feedbackObject;
};


// ---  Helper to calculate streak and progress info for a goal ---
const getGoalContextString = (goal: Goal): string => {
  const { completionStatus = {}, plannedDays = [], target } = goal;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate current streak
  let streak = 0;
  for (let i = 0; i < 30; i++) { // Check up to 30 days back
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    const isPlanned = plannedDays.length === 0 || plannedDays.includes(date.getDay());
    const status = completionStatus[dateString];

    if (status === 'complete') {
      streak++;
    } else if (isPlanned && (status === 'missed' || (!status && date < today))) {
      // Break streak if a planned day was missed or is pending in the past
      break;
    }
  }

  // Get this week's completions
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const completedThisWeek = Object.entries(completionStatus)
    .filter(([date, status]) => new Date(date) >= startOfWeek && status === 'complete')
    .length;

  let context = `- Goal: "${goal.title}" (Target: ${target}x/week). Progress this week: ${completedThisWeek}/${target}.`;
  if (streak > 1) {
    context += ` Current streak: ${streak} days.`
  }

  return context;
};

export const generateAllFeedback = async (
  userId: string,
  entryText: string,
  apiKey: string,
  primaryModel: string,
  utilityModel: string,
  enabledAdvisors: Record<string, boolean>
): Promise<Record<string, AdvisorFeedback>> => {

  const activeAdvisors = Object.keys(enabledAdvisors).filter(name => enabledAdvisors[name]);
  if (activeAdvisors.length === 0) return {};

  const [allUserAttributes, activeGoals, pendingDeadlines] = await Promise.all([
    getAllAttributes(userId),
    getActiveWeeklyGoals(userId),
    getPendingDeadlines(userId),
  ]);


  // Get the current date and time and format it nicely.
  const currentDate = new Date();
  const formattedDateTime = currentDate.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  // Start the context block by anchoring the AI in the present moment.
  let contextBlock = `The user is writing this journal entry right now.
CURRENT DATE AND TIME: ${formattedDateTime}

For additional context, here is what we know about the user. Use this to inform your responses:`;


  if (pendingDeadlines.length > 0) {
    contextBlock += "\n\nUPCOMING DEADLINES (most urgent first):";
    pendingDeadlines.forEach(deadline => {
      const dueDate = deadline.dueDate.toDate();
      const formattedDistance = formatDistanceToNowStrict(dueDate, { addSuffix: true });
      contextBlock += `\n- "${deadline.title}" is due ${formattedDistance}.`;
    });
  }

  if (activeGoals.length > 0) {
    contextBlock += "\n\nTHEIR ACTIVE GOALS AND RECENT PERFORMANCE:";
    activeGoals.forEach(goal => {
      contextBlock += `\n${getGoalContextString(goal)}`;
    });
  }

  const relevantAttributes = await getRelevantAttributes(entryText, allUserAttributes, apiKey, utilityModel);
  if (relevantAttributes.length > 0) {
    contextBlock += `\n\nKEY PERSONALITY TRAITS:\n- ${relevantAttributes.join('\n- ')}`;
  }

  let masterPrompt = "You are several distinct AI advisors responding to a user's journal entry. Provide a response for each advisor persona described below. YOU MUST format your entire response by starting each advisor's feedback with their unique tag in all caps, e.g., `[PLITT]`.\n\n";

  activeAdvisors.forEach(name => {
    const profile = ADVISOR_PROFILES[name];
    if (profile) {
      masterPrompt += `---
ADVISOR: [${name.toUpperCase()}]
PERSONA: ${profile.persona}
TASK: ${profile.task}
---\n`;
    }
  });

  masterPrompt += `\n\n--- USER DATA ---\n${contextBlock}`;
  masterPrompt += `\n\n--- USER'S JOURNAL ENTRY ---\n"${entryText}"\n\n`;
  masterPrompt += "Now, generate the response for each advisor, ensuring each starts with its tag.";

  console.log(masterPrompt)
  try {
    const combinedResponse = await callModelViaOpenRouter(masterPrompt, apiKey, primaryModel);
    return parseCombinedFeedback(combinedResponse, activeAdvisors);
  } catch (error: any) {
    console.error("The combined API call failed:", error);
    const errorFeedback: AdvisorFeedback = { status: 'error', response: `API call failed: ${error.message}` };
    return activeAdvisors.reduce((acc, name) => ({ ...acc, [name]: errorFeedback }), {});
  }
};



export const checkGoalProgress = async (
  entryText: string,
  goal: { title: string; description: string | null },
  apiKey: string,
  utilityModel: string
): Promise<{ progressMade: boolean; reasoning: string } | null> => {
  const prompt = `
    Analyze the following journal entry to determine if the user made progress on a specific goal.
    Goal: "${goal.title}"
    Description: "${goal.description || 'N/A'}"
    Journal Entry: "${entryText}"
    Respond ONLY with a JSON object: { "progressMade": boolean, "reasoning": "A brief explanation." }
  `;

  console.log(prompt)

  try {
    let responseText = await callModelViaOpenRouter(prompt, apiKey, utilityModel);
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in response");

    const result = JSON.parse(jsonMatch[0]);
    if (typeof result.progressMade === 'boolean' && typeof result.reasoning === 'string') {
      return result;
    }
    throw new Error("Parsed JSON has incorrect structure.");
  } catch (e: any) {
    console.error("Error checking goal progress:", e.message);
    return null;
  }
};

export async function extractAttributeFromEntry(
  entryText: string,
  apiKey: string,
  utilityModel: string,
): Promise<string | null> {
  const prompt = `
    You are a psychological analyst. Your task is to analyze the following journal entry and determine if it reveals a durable, high-level personality trait, recurring belief, or core struggle.
    - If it does, state this trait as a single, concise sentence.
    - Examples: "User struggles with impostor syndrome." or "User finds fulfillment in helping others." or "User is motivated by external validation."
    - If the entry is just a simple report of the day's events with no deeper insight, respond with ONLY the word "NULL".

    Journal Entry: "${entryText}"
  `;

  try {
    const response = await callModelViaOpenRouter(prompt, apiKey, utilityModel);
    if (response.trim().toUpperCase() === 'NULL') {
      return null;
    }
    return response.trim();
  } catch (error) {
    console.error("Error extracting attribute:", error);
    return null;
  }
}

export async function getRelevantAttributes(
  entryText: string,
  allAttributes: string[],
  apiKey: string,
  utilityModel: string,
  limit: number = 3,
): Promise<string[]> {
  if (allAttributes.length === 0) return [];

  const prompt = `
    You are a fast AI filtering assistant. From the following list of facts about a user, select the top ${limit} MOST RELEVANT facts to their latest journal entry.
    Respond ONLY with a JSON array of the chosen facts. Example: ["Fact 1", "Fact 2"]

    USER FACTS:
    - ${allAttributes.join('\n- ')}

    LATEST JOURNAL ENTRY:
    "${entryText}"
  `;

  try {
    const response = await callModelViaOpenRouter(prompt, apiKey, utilityModel);
    const parsed = JSON.parse(response);
    if (Array.isArray(parsed) && parsed.every(item => typeof item === 'string')) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error("Error filtering attributes:", error);
    return [];
  }
}

type AdvisorTurn = { advisor: 'plitt' | 'hudson' | 'self'; text: string; };

export const generateSummitResponse = async (
  entry: JournalEntry,
  transcript: SummitMessage[],
  apiKey: string,
  model: string,
): Promise<AdvisorTurn[]> => {
  const history = transcript.map(msg => `${msg.author.toUpperCase()}: ${msg.text}`).join('\n');
  const prompt = `
    You are a master AI that will simulate a conversation between three distinct advisors defined as follows:
    - HUDSON: "${ADVISOR_PROFILES.hudson.persona}"
    - PLITT: "${ADVISOR_PROFILES.plitt.persona}"
    - SELF: "${ADVISOR_PROFILES.self.persona}"

    --- ORIGINAL JOURNAL ENTRY ---
    "${entry.entryText}"

    --- INITIAL ADVISOR FEEDBACK ---
    HUDSON: "${entry.feedback?.hudson?.response || 'No initial feedback.'}"
    PLITT: "${entry.feedback?.plitt?.response || 'No initial feedback.'}"
    85-YEAR-OLD SELF: "${entry.feedback?.self?.response || 'No initial feedback.'}"

    --- FOLLOW-UP CONVERSATION HISTORY ---
    ${history}

    --- TASK ---
    Generate the *next turn* in the conversation. Advisors should respond to the user and each other, referencing the original entry and their initial feedback when relevant. Your response MUST be a valid JSON array of objects, with detailed, paragraph-length text for each advisor.
    Example Format:
    [
      { "advisor": "hudson", "text": "A full paragraph from Hudson..." },
      { "advisor": "plitt", "text": "A full paragraph from Plitt..." },
      { "advisor": "self", "text": "A full paragraph from Self..." }
    ]
  `;

  try {
    const responseText = await callModelViaOpenRouter(prompt, apiKey, model);
    const startIndex = responseText.indexOf('[');
    const endIndex = responseText.lastIndexOf(']');
    if (startIndex === -1 || endIndex === -1) throw new Error("AI response did not contain a valid JSON array.");

    const jsonString = responseText.substring(startIndex, endIndex + 1);
    const parsedResponse = JSON.parse(jsonString);

    if (Array.isArray(parsedResponse) && parsedResponse.every(item => item.advisor && item.text)) {
      return parsedResponse as AdvisorTurn[];
    } else {
      throw new Error("AI response was not in the expected JSON array format.");
    }
  } catch (error) {
    console.error("Error in generateSummitResponse:", error);
    throw new Error("The AI failed to generate a valid response. Please try again.");
  }
};