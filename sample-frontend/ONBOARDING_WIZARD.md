# Onboarding Wizard Implementation

## Overview

A beautiful, multi-step onboarding wizard that collects user preferences and generates a personalized learning roadmap using AI.

## State Management

Single state object structure:
```typescript
{
  goal: string,                    // e.g., "MLOps Engineer"
  current_skills: string[],        // e.g., ["Python", "Git"]
  preferred_language: string,      // e.g., "Go"
  weekly_hours: number,            // 1-40 hours
  notification_time: string,       // e.g., "09:00"
}
```

## Steps

### Step 1: The Ambition 🎯
**Question:** "What is your primary goal?"

**Features:**
- Text input for custom goals
- 6 popular goal cards with icons:
  - MLOps Engineer
  - DevOps Engineer
  - Full-Stack Developer
  - Frontend Developer
  - Backend Developer
  - Cloud Architect
- Animated card selection with hover effects
- Visual feedback with ring highlight

### Step 2: The Baseline ✓
**Question:** "What do you already know?"

**Features:**
- Text input with "Add" button
- Enter key support for quick adding
- 12 popular skills as quick-select badges:
  - Python, JavaScript, Git, Docker, Linux, SQL
  - React, Node.js, AWS, Kubernetes, CI/CD, REST APIs
- Toggle selection by clicking badges
- Display selected skills in a separate section
- Remove skills with X button
- Skills are optional (can skip)

### Step 3: The Preferences ⚙️
**Question:** "How do you want to build?"

**Features:**
- Radio button selection for programming language
- 5 language options with descriptions:
  - **Python**: Great for ML, automation, and backend
  - **Go**: Fast, efficient, perfect for cloud-native
  - **Java**: Enterprise-grade, robust ecosystem
  - **JavaScript**: Full-stack web development
  - **Rust**: Systems programming, high performance
- Visual card-style radio buttons
- Hover effects and active state styling

**Additional:** "When should we nudge you?"
- Time picker input for daily reminders
- Default: 09:00

### Step 4: The Commitment ⚡
**Question:** "How much time can you commit?"

**Features:**
- Interactive slider (1-40 hours per week)
- Large, animated hour display
- Dynamic feedback message based on commitment:
  - < 5 hours: "Perfect for busy schedules"
  - 5-10 hours: "Great balance!"
  - 10-20 hours: "Excellent commitment!"
  - 20+ hours: "Intensive learning mode!"
- Summary card showing all collected data:
  - Goal
  - Number of skills
  - Preferred language
  - Weekly hours
  - Daily reminder time

## UI/UX Features

### Progress Stepper
- 4 circular step indicators with icons
- Animated progress bars between steps
- Active step highlighted with scale animation
- Completed steps shown in primary color
- Step labels: Ambition, Baseline, Preferences, Commitment

### Animations
- Smooth step transitions with AnimatePresence
- Fade and slide animations
- Scale animations on interactive elements
- Hover effects on all clickable items
- Loading spinner with rotation animation

### Loading State
- Full-screen overlay with backdrop blur
- Animated sparkle icon
- "Crafting Your Journey" message
- Pulsing dots animation
- Prevents interaction during API call

### Validation
- Step-by-step validation
- "Continue" button disabled until required fields filled
- Visual feedback for selected options
- Toast notifications for success/error

## API Integration

### Endpoint
`POST /generate-roadmap`

### Request Mapping
```typescript
{
  goal: formData.goal,
  current_skills: formData.current_skills,
  preferred_language: formData.preferred_language,
  time_commitment: `${formData.weekly_hours} hours per week`
}
```

### Response Handling
1. Validates roadmap structure
2. Stores in localStorage:
   - `roadmap`: Full roadmap data
   - `userProfile`: User profile for API
   - `onboardingData`: Complete form data
3. Shows success toast
4. Redirects to `/dashboard`

### Error Handling
- Try-catch wrapper
- Console logging for debugging
- Toast notification with error message
- Loading state reset on error

## Navigation Flow

```
/login (authenticated)
  ↓
/onboarding
  ↓ (Step 1-4)
  ↓ (Generate Roadmap)
  ↓
/dashboard
```

### Redirect Logic
- If roadmap exists → Redirect to `/dashboard`
- After completion → Navigate to `/dashboard`
- On error → Stay on current step

## Styling

### Theme
- Gradient backgrounds
- Primary color accents
- Smooth transitions
- Consistent spacing
- Responsive design

### Components Used
- Card, CardHeader, CardContent
- Button (multiple variants)
- Input (text and time)
- Label
- Badge
- Slider
- RadioGroup, RadioGroupItem
- Toast notifications

### Layout
- Centered card (max-w-3xl)
- Full-height viewport
- Gradient background
- Shadow and border effects
- Responsive padding

## Accessibility

- Semantic HTML
- Keyboard navigation support
- Focus states on interactive elements
- ARIA labels on radio buttons
- Clear visual hierarchy
- High contrast text

## Mobile Responsive

- Single column layout on mobile
- Touch-friendly button sizes
- Responsive grid for goal cards
- Collapsible step labels on small screens
- Optimized spacing for mobile

## Data Persistence

### localStorage Keys
- `roadmap`: Generated learning roadmap
- `userProfile`: User profile for API calls
- `onboardingData`: Complete onboarding form data

### Data Flow
1. User completes onboarding
2. Data sent to backend API
3. Roadmap generated by AI
4. All data stored in localStorage
5. User redirected to dashboard
6. Dashboard/LearningPath read from localStorage

## Future Enhancements

- [ ] Save progress between steps
- [ ] Allow editing after completion
- [ ] Add more language options
- [ ] Skill suggestions based on goal
- [ ] Estimated completion time calculation
- [ ] Integration with calendar for reminders
- [ ] Social login data pre-fill
- [ ] Multi-language support
- [ ] Accessibility improvements
- [ ] Analytics tracking

## Testing Checklist

- [ ] All steps navigate correctly
- [ ] Validation works on each step
- [ ] Skills can be added/removed
- [ ] Language selection works
- [ ] Slider updates value correctly
- [ ] Time picker works
- [ ] API call succeeds
- [ ] Loading state displays
- [ ] Error handling works
- [ ] Success redirect works
- [ ] localStorage saves correctly
- [ ] Mobile responsive
- [ ] Keyboard navigation
- [ ] Toast notifications appear
