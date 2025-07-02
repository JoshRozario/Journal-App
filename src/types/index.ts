// --- File: src/types/index.ts ---
import { Timestamp } from "firebase/firestore";

export interface AdvisorFeedback {
  status: 'completed' | 'error';
  response: string;
}

export interface JournalEntry {
  id: string;
  entryText: string;
  createdAt: Timestamp;
  feedback?: { 
    plitt?: AdvisorFeedback;
    hudson?: AdvisorFeedback;
    self?: AdvisorFeedback;
  };
}

export interface OpenRouterModel {
  id: string; // e.g., "openai/gpt-4o"
  name: string; // e.g., "GPT-4o"
  description: string;
  pricing: {
    prompt: string; // Price per million prompt tokens (as a string number)
    completion: string; // Price per million completion tokens (as a string number)
  };
  context_length: number;
}

export interface UserAttribute {
  id: string;
  text: string;
  createdAt: Timestamp;
  lastAccessed: Timestamp;
  sourceEntryIds: string[];
}

export interface SummitMessage {
  id:string;
  author: 'user' | 'plitt' | 'hudson' | 'self' | 'advisors';
  text: string;
  createdAt: Timestamp;
}


export type GoalCompletionStatus = 'complete' | 'missed' | 'pending';

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'yearly';
  status: 'in_progress' | 'completed' | 'paused';
  createdAt: Timestamp;

  // Flexible Goal Fields
  target: number; // e.g., target number of completions (like 3 times a week)
  
  // Optional Scheduled Goal Fields
  plannedDays?: number[]; // Array of day indices [0-6] for Sun-Sat

  // ---  Daily Tracking ---
  // Tracks explicit user actions and automatic AI checks.
  // Key is 'YYYY-MM-DD' format.
  completionStatus?: {
    [date: string]: GoalCompletionStatus;
  };
}


// This type is no longer needed as AI suggestions will be handled automatically.
export interface AIGoalSuggestion {
  goal: Goal;
  reasoning: string;
}

export interface Deadline {
  id: string;
  title: string;
  dueDate: Timestamp;
  status: 'pending' | 'completed';
  createdAt: Timestamp;
}