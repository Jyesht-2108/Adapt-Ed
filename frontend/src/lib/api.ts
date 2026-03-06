import axios from 'axios';

// Main AdaptEd Backend (NOT mcp-ide which runs on 8000)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UserStatus {
  onboarding_completed: boolean;
  roadmap?: any;
  profile?: any;
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

export interface LessonSource {
  title: string;
  url: string;
  type: string;
  metadata?: Record<string, any>;
}

export interface CodeSnippet {
  language: string;
  code: string;
}

export interface LessonContent {
  title: string;
  summary: string;
  key_concepts: string[];
  main_content: string;
  code_snippets: CodeSnippet[];
  quiz_question: string;
  sources: LessonSource[];
  citation_map?: Record<string, number>;
}

export interface StudyNotes {
  title: string;
  overview: string;
  detailed_notes: string;
  key_takeaways: string[];
  practice_exercises: string[];
  additional_resources: string[];
  sources: LessonSource[];
}

export interface LessonRequest {
  topic: string;
  user_preference: string;
  video_transcript?: {
    text: string;
    url: string;
  };
}

// ============================================================================
// USER API
// ============================================================================

export const getUserStatus = async (userId: string): Promise<UserStatus> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/users/${userId}/status`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user status:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, profileData: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/${userId}/profile`, profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const saveRoadmap = async (userId: string, roadmap: any) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/users/${userId}/roadmap`, roadmap);
    return response.data;
  } catch (error) {
    console.error('Error saving roadmap:', error);
    throw error;
  }
};

// ============================================================================
// ROADMAP API
// ============================================================================

export const generateRoadmap = async (profile: UserProfile) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/generate-roadmap`, profile);
    return response.data;
  } catch (error) {
    console.error('Error generating roadmap:', error);
    throw error;
  }
};

// ============================================================================
// LESSON API
// ============================================================================

export const generateLessonContent = async (request: LessonRequest): Promise<LessonContent> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/generate-lesson-content`, request);
    return response.data;
  } catch (error) {
    console.error('Error generating lesson content:', error);
    throw error;
  }
};

export const generateStudyNotes = async (lesson: LessonContent): Promise<StudyNotes> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/generate-study-notes`, lesson);
    return response.data;
  } catch (error) {
    console.error('Error generating study notes:', error);
    throw error;
  }
};
