import axios from 'axios';

// Base API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000, // 120 seconds (2 minutes) for AI generation
});

// TypeScript Interfaces matching Backend Pydantic models

export interface UserProfile {
  uid: string;
  goal: string;
  current_skills: string[];
  preferred_language: string;
  time_commitment: string;
  notification_time?: string;
  weekly_hours?: number;
}

export interface UserStatus {
  uid: string;
  onboarding_completed: boolean;
  profile?: UserProfile | null;
  roadmap?: Roadmap | null;
}

export interface LearningModule {
  title: string;
  description: string;
  week: number;
  status: 'pending' | 'active' | 'completed';
  resources: string[];
}

export interface Roadmap {
  user_id: string;
  modules: LearningModule[];
}

export interface LessonRequest {
  topic: string;
  user_preference: string; // "visual" or "text"
}

export interface VideoTranscriptData {
  text: string;
  url: string;
  video_id: string;
}

export interface LessonRequestWithTranscript {
  topic: string;
  user_preference: string;
  video_transcript?: VideoTranscriptData | null;
}

export interface Lesson {
  topic: string;
  summary: string;
  key_points: string[];
  code_snippets: string[];
}

export interface CodeSnippet {
  language: string;
  code: string;
}

export interface Source {
  title: string;
  url: string;
  type: 'video' | 'documentation';
  metadata?: {
    channel?: string;
    views?: string;
  } | null;
}

export interface LessonContent {
  title: string;
  summary: string;
  key_concepts: string[];
  main_content: string;
  code_snippets: CodeSnippet[];
  quiz_question: string;
  sources: Source[];
  citation_map?: Record<string, number> | null;
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

// Scheduler Models
export interface TimeSlot {
  day: string;
  start_time: string;
  duration_minutes: number;
  activity_type: 'learning' | 'coding_practice' | 'viva' | 'remedial';
}

export interface LearningModuleScheduler {
  id: string;
  title: string;
  prerequisites: string[];
  estimated_hours: number;
  status: 'locked' | 'unlocked' | 'completed' | 'failed';
  viva_passed: boolean;
}

export interface UserSchedule {
  user_id: string;
  goal: string;
  start_date: string; // ISO date string
  daily_commitment_hours: number;
  preferred_language: string;
  modules: LearningModuleScheduler[];
  calendar: TimeSlot[];
}

// API Functions

/**
 * Check user onboarding status
 */
export async function getUserStatus(uid: string): Promise<UserStatus> {
  try {
    console.log('Checking user status for:', uid);
    const response = await apiClient.get<UserStatus>(`/users/${uid}/status`);
    console.log('User status:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error checking user status:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || 'Failed to check user status'
      );
    }
    throw error;
  }
}

/**
 * Save user profile after onboarding
 */
export async function saveUserProfile(profile: UserProfile): Promise<{
  success: boolean;
  message: string;
  user: any;
}> {
  try {
    console.log('Saving user profile:', profile);
    const response = await apiClient.post('/users/profile', profile);
    console.log('Profile saved:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error saving profile:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || 'Failed to save profile'
      );
    }
    throw error;
  }
}

/**
 * Generate a personalized learning roadmap
 */
export async function generateRoadmap(profile: UserProfile): Promise<Roadmap> {
  try {
    console.log('Calling /generate-roadmap with profile:', profile);
    const response = await apiClient.post<Roadmap>('/generate-roadmap', profile);
    console.log('Response received:', response);
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response data:', response.data);
    console.log('Response data type:', typeof response.data);
    console.log('Response data keys:', Object.keys(response.data));

    // Validate the response structure
    if (!response.data) {
      throw new Error('Empty response data');
    }

    return response.data;
  } catch (error) {
    console.error('Error in generateRoadmap:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        config: error.config
      });
      throw new Error(
        error.response?.data?.detail || error.message || 'Failed to generate roadmap'
      );
    }
    throw error;
  }
}

/**
 * Generate a simple lesson (legacy endpoint)
 */
export async function generateLesson(request: LessonRequest): Promise<Lesson> {
  try {
    const response = await apiClient.post<Lesson>('/generate-lesson', request);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || 'Failed to generate lesson'
      );
    }
    throw error;
  }
}

/**
 * Generate a comprehensive lesson with multi-source attribution
 * Fetches YouTube transcripts via backend proxy to avoid CORS issues
 */
export async function generateLessonContent(
  request: LessonRequest
): Promise<LessonContent> {
  try {
    console.log('Calling /generate-lesson-content with request:', request);
    
    // Step 1: Try to fetch YouTube transcript via backend proxy
    let videoTranscript: VideoTranscriptData | null = null;
    
    try {
      console.log('Fetching YouTube videos for topic:', request.topic);
      
      // Search for videos using backend API
      const searchResponse = await apiClient.get('/search-youtube', {
        params: { query: `${request.topic} tutorial` }
      });
      
      console.log('Search response:', searchResponse.data);
      
      if (searchResponse.data && searchResponse.data.length > 0) {
        console.log(`Found ${searchResponse.data.length} videos, trying to fetch transcripts via proxy...`);
        
        // Try each video until we get a transcript
        for (const video of searchResponse.data) {
          try {
            // Extract video ID from URL
            const videoIdMatch = video.url.match(/[?&]v=([^&]+)/);
            if (!videoIdMatch) continue;
            
            const videoId = videoIdMatch[1];
            console.log(`Trying video ${videoId}: ${video.title}`);
            
            // Fetch transcript via backend proxy with timeout
            const transcriptResponse = await apiClient.get(`/fetch-transcript/${videoId}`, {
              timeout: 15000 // 15 second timeout per video
            });
            
            if (transcriptResponse.data.success && transcriptResponse.data.text) {
              videoTranscript = {
                text: transcriptResponse.data.text,
                url: video.url,
                video_id: videoId
              };
              
              console.log('✓ Successfully fetched transcript via proxy:', {
                length: videoTranscript.text.length,
                url: videoTranscript.url,
                title: video.title
              });
              
              break; // Got a transcript, stop trying
            } else {
              console.log(`✗ No transcript for ${videoId}: ${transcriptResponse.data.error}`);
            }
          } catch (videoError: any) {
            console.log(`✗ Error fetching transcript for video: ${videoError.message}`);
            continue; // Try next video
          }
        }
        
        if (!videoTranscript) {
          console.log('No transcripts available from any video');
        }
      } else {
        console.log('No videos found from search');
      }
    } catch (transcriptError: any) {
      console.error('Failed to fetch transcripts:', transcriptError);
      console.error('Error details:', {
        message: transcriptError?.message,
        stack: transcriptError?.stack
      });
      console.log('Will proceed without video transcript');
    }
    
    // Step 2: Send request to backend with optional transcript
    const requestWithTranscript: LessonRequestWithTranscript = {
      topic: request.topic,
      user_preference: request.user_preference,
      video_transcript: videoTranscript
    };
    
    console.log('Sending to backend:', {
      topic: requestWithTranscript.topic,
      hasTranscript: !!requestWithTranscript.video_transcript,
      transcriptLength: requestWithTranscript.video_transcript?.text.length
    });
    
    const response = await apiClient.post<LessonContent>(
      '/generate-lesson-content',
      requestWithTranscript
    );
    
    console.log('Response received:', response);
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    console.log('Response data type:', typeof response.data);

    // Validate response data
    if (!response.data) {
      throw new Error('Empty response data from server');
    }

    if (!response.data.title) {
      console.error('Missing title in response:', response.data);
      throw new Error('Invalid lesson content: missing title');
    }

    if (!response.data.sources || !Array.isArray(response.data.sources)) {
      console.error('Invalid sources in response:', response.data);
      throw new Error('Invalid lesson content: missing or invalid sources');
    }

    console.log('✓ Lesson content validated successfully');
    return response.data;
  } catch (error) {
    console.error('Error in generateLessonContent:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw new Error(
        error.response?.data?.detail || 'Failed to generate lesson content'
      );
    }
    throw error;
  }
}

/**
 * Generate comprehensive study notes from lesson content
 */
export async function generateStudyNotes(
  lesson: LessonContent
): Promise<StudyNotes> {
  try {
    console.log('Generating study notes for:', lesson.title);
    const response = await apiClient.post<StudyNotes>(
      '/generate-study-notes',
      lesson
    );
    console.log('Study notes generated successfully');
    return response.data;
  } catch (error) {
    console.error('Error generating study notes:', error);
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || 'Failed to generate study notes'
      );
    }
    throw error;
  }
}

/**
 * Fetch user roadmap by user ID
 * Note: This endpoint doesn't exist yet in your backend
 * You'll need to add it or modify this to use the generate-roadmap endpoint
 */
export async function fetchUserRoadmap(userId: string): Promise<Roadmap> {
  try {
    const response = await apiClient.get<Roadmap>(`/roadmap/${userId}`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error('Roadmap not found for this user');
      }
      throw new Error(
        error.response?.data?.detail || 'Failed to fetch roadmap'
      );
    }
    throw error;
  }
}

/**
 * Health check endpoint
 */
export async function checkHealth(): Promise<{
  status: string;
  api_key_loaded: boolean;
  api_key_length: number;
}> {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error('API health check failed');
    }
    throw error;
  }
}

/**
 * Generate initial learning schedule
 */
export async function generateInitialSchedule(params: {
  goal: string;
  current_skills: string[];
  time_per_day: number;
  preferred_language?: string;
  start_date?: string;
}): Promise<UserSchedule> {
  try {
    const response = await apiClient.post<UserSchedule>(
      '/generate-schedule',
      params
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || 'Failed to generate schedule'
      );
    }
    throw error;
  }
}

/**
 * Replan schedule after viva failure
 */
export async function replanAfterFailure(
  currentSchedule: UserSchedule,
  failedModuleId: string
): Promise<UserSchedule> {
  try {
    const response = await apiClient.post<UserSchedule>('/replan-schedule', {
      current_schedule: currentSchedule,
      failed_module_id: failedModuleId,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(
        error.response?.data?.detail || 'Failed to replan schedule'
      );
    }
    throw error;
  }
}

// Error handling helper
export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error
      return error.response.data?.detail || error.message;
    } else if (error.request) {
      // Request made but no response
      return 'No response from server. Please check if the backend is running.';
    }
  }
  return 'An unexpected error occurred';
}

export default apiClient;
