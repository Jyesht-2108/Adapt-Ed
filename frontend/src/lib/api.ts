/**
 * API client for AdaptEd backend
 * Main AdaptEd Backend (NOT mcp-ide which runs on 8000)
 */

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

export interface UserStatus {
  uid: string;
  onboarding_completed: boolean;
  profile?: any;
  roadmap?: any;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  uid: string;
  goal: string;
  current_skills: string[];
  preferred_language: string;
  time_commitment: string;
  notification_time: string;
  weekly_hours: number;
}

export interface VideoTranscriptData {
  text: string;
  url: string;
  video_id: string;
}

export interface LessonRequestWithTranscript {
  topic: string;
  user_preference: string;
  video_transcript?: VideoTranscriptData;
}

export interface CodeSnippet {
  language: string;
  code: string;
}

export interface Source {
  title: string;
  url: string;
  type: string;
  metadata?: Record<string, string>;
}

export interface LessonContent {
  title: string;
  summary: string;
  key_concepts: string[];
  main_content: string;
  code_snippets: CodeSnippet[];
  quiz_question: string;
  sources: Source[];
  citation_map?: Record<string, number>;
}

export interface StudyNotes {
  title: string;
  overview: string;
  detailed_notes: string;
  key_takeaways: string[];
  practice_exercises: string[];
  additional_resources: string[];
  sources: Source[];
}

/**
 * Generate lesson content from topic
 */
export async function generateLessonContent(
  request: LessonRequestWithTranscript
): Promise<LessonContent> {
  const response = await fetch(`${API_URL}/generate-lesson-content`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to generate lesson content');
  }

  return response.json();
}

/**
 * Generate study notes from lesson content
 */
export async function generateStudyNotes(
  lesson: LessonContent
): Promise<StudyNotes> {
  const response = await fetch(`${API_URL}/generate-study-notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(lesson),
  });

  if (!response.ok) {
    throw new Error('Failed to generate study notes');
  }

  return response.json();
}

/**
 * Search for YouTube videos
 */
export async function searchYouTube(query: string): Promise<any[]> {
  const response = await fetch(`${API_URL}/search-youtube?query=${encodeURIComponent(query)}`);

  if (!response.ok) {
    throw new Error('Failed to search YouTube');
  }

  return response.json();
}

/**
 * Fetch YouTube transcript
 */
export async function fetchTranscript(videoId: string): Promise<any> {
  const response = await fetch(`${API_URL}/fetch-transcript/${videoId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch transcript');
  }

  return response.json();
}

/**
 * Get user status (check if onboarding completed)
 */
export async function getUserStatus(uid: string): Promise<UserStatus> {
  const response = await fetch(`${API_URL}/users/${uid}/status`);

  if (!response.ok) {
    throw new Error('Failed to get user status');
  }

  return response.json();
}

/**
 * Save user profile
 */
export async function saveUserProfile(profile: any): Promise<any> {
  const response = await fetch(`${API_URL}/users/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    throw new Error('Failed to save user profile');
  }

  return response.json();
}

/**
 * Generate roadmap
 */
export async function generateRoadmap(profile: UserProfile): Promise<any> {
  const response = await fetch(`${API_URL}/generate-roadmap`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    throw new Error('Failed to generate roadmap');
  }

  return response.json();
}

/**
 * Get user stats
 */
export async function getUserStats(uid: string): Promise<any> {
  const response = await fetch(`${API_URL}/users/${uid}/stats`);

  if (!response.ok) {
    throw new Error('Failed to get user stats');
  }

  return response.json();
}

/**
 * Get user roadmap
 */
export async function getUserRoadmap(uid: string): Promise<any> {
  const response = await fetch(`${API_URL}/users/${uid}/roadmap`);

  if (!response.ok) {
    throw new Error('Failed to get user roadmap');
  }

  return response.json();
}

/**
 * Complete viva exam
 */
export async function completeViva(data: {
  user_id: string;
  module_id: string;
  final_score: number;
  academic_dishonesty_flag?: boolean;
  integrity_log?: string[];
}): Promise<any> {
  const response = await fetch(`${API_URL}/viva/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to complete viva');
  }

  return response.json();
}
