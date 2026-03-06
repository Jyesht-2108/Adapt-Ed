# Quick Start Guide - Sample Frontend

## Features Implemented

### ✅ Module Detail Page
- Click on any unlocked module in Learning Path to view detailed content
- Lessons with markdown rendering
- YouTube video recommendations
- Web scraped articles with summaries
- External resources and documentation links

### ✅ Enhanced Dashboard
- Removed 3D elements for better performance
- Dark bluish gradient background (slate-900 to blue-900)
- Cleaner, more professional look

### ✅ Improved Viva Voice Indicators with Mock Data
- Animated wave visualizations for speaking/listening states
- Larger, more visible status indicators
- Better user feedback during voice interactions
- **Automatic fallback to mock data when backend is unavailable**
- Intelligent scoring system based on answer quality
- Module-specific questions for realistic practice
- Works completely offline for testing

## Running the Application

1. **Install Dependencies** (if not already done):
   ```bash
   cd AdaptEd/sample-frontend
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```

3. **Access the Application**:
   - Open browser to `http://localhost:5173`
   - Login with Google (Firebase auth required)
   - Complete onboarding if first time
   - Navigate to Learning Path
   - Click on "JavaScript Fundamentals" to see the new module detail page

## Testing the Features

### Module Detail Page
1. Go to Learning Path (`/learning-path`)
2. Click on any unlocked module (e.g., "JavaScript Fundamentals")
3. You should see:
   - Lesson list on the left
   - Lesson content in the center
   - Tabs at the bottom for Videos, Resources, and Articles
4. Click through different lessons
5. Switch between tabs to see different content types

### Dashboard
1. Go to Dashboard (`/dashboard`)
2. Notice the new dark blue gradient header
3. No 3D elements, cleaner design

### Viva Voice Indicators
1. Click "Viva Voice" in the sidebar
2. Select a module from the available list
3. **Note**: If backend is not running, it will automatically use mock data (Demo Mode)
4. During the viva:
   - Watch for blue animated waves when interviewer speaks
   - Watch for red animated waves when you're speaking
   - Notice larger, more prominent status text
5. In Demo Mode:
   - Answer 5 questions about the module
   - Your answers are scored intelligently
   - Pass with 60% or higher
   - Get realistic feedback on your performance

## File Structure

```
src/
├── pages/
│   ├── ModuleDetail.tsx       # NEW: Module detail page
│   ├── VivaSelection.tsx      # NEW: Viva module selection page
│   ├── Dashboard.tsx          # UPDATED: Removed 3D, added dark blue
│   ├── Viva.tsx               # UPDATED: Added mock data fallback
│   └── LearningPath.tsx       # Links to ModuleDetail
├── mocks/
│   ├── moduleContent.ts       # NEW: Mock module content data
│   └── vivaData.ts            # NEW: Mock viva questions and scoring
├── components/
│   └── viva/
│       └── VivaRoom.tsx       # UPDATED: Enhanced voice indicators + mock support
└── App.tsx                    # UPDATED: Added routes
```

## Mock Data

### Module Content
The module content is currently using mock data defined in `src/mocks/moduleContent.ts`. 

To add more modules:
1. Open `src/mocks/moduleContent.ts`
2. Add a new entry to the `mockModuleContent` object
3. Use the module title as the key (must match the title in your roadmap)

Example:
```typescript
"React Core Concepts": {
  id: "react-core-concepts",
  title: "React Core Concepts",
  // ... rest of the content
}
```

### Viva Questions
The viva questions are defined in `src/mocks/vivaData.ts`.

To add questions for a new module:
1. Open `src/mocks/vivaData.ts`
2. Add a new entry to the `mockQuestions` object
3. Use the module title as the key

Example:
```typescript
"Your Module Name": [
  {
    question: "Your question here?",
    expectedTopics: ["keyword1", "keyword2", "keyword3"],
    difficulty: "medium"
  },
  // ... 4 more questions
]
```

The scoring system will:
- Award points for answer length (up to 40 points)
- Award points for mentioning expected topics (up to 50 points)
- Add randomness (±10 points) for realism
- Cap final score between 0-100

## Environment Variables

Make sure you have Firebase configured in `.env`:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Troubleshooting

### Module content not showing
- Check that the module title in `mockModuleContent.ts` exactly matches the module title from your roadmap
- Module titles are case-sensitive

### Markdown not rendering
- The `@tailwindcss/typography` plugin has been added to `tailwind.config.ts`
- Make sure to restart the dev server after config changes

### Voice indicators not showing
- Voice features require Chrome or Edge browser
- Check browser console for any errors
- Ensure microphone permissions are granted

### Viva not starting
- If you see "Demo Mode" in the toast, the backend is not available
- This is normal - the app will use mock data automatically
- Mock data provides a fully functional viva experience
- To use the real backend, ensure it's running on `http://localhost:8000`

### Viva scores seem random
- Mock scoring includes ±10 points of randomness for realism
- Longer, more detailed answers score higher
- Mentioning expected keywords significantly boosts score
- Try answering with relevant technical terms for better scores

## Next Steps

1. **Backend Integration**: Replace mock data with real API calls
2. **YouTube API**: Integrate real YouTube API for video data
3. **Web Scraping**: Implement real-time web scraping service
4. **Progress Tracking**: Save lesson completion to backend
5. **Video Player**: Add inline video player instead of external links

## Support

For issues or questions, check:
- Browser console for errors
- Network tab for failed API calls
- Firebase authentication status
