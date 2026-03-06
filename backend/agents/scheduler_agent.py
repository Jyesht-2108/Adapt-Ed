import google.generativeai as genai
from models import (
    UserSchedule, 
    LearningModuleScheduler, 
    TimeSlot, 
    ActivityType, 
    ModuleStatusScheduler
)
from typing import List
from datetime import date, timedelta
import os
import json
import uuid


class SchedulerAgent:
    """
    AI-powered scheduler that creates and manages personalized learning schedules.
    Uses Google Gemini for intelligent curriculum design and replanning.
    """
    
    def __init__(self):
        """Initialize the Gemini model for scheduling tasks."""
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def generate_initial_roadmap(
        self, 
        goal: str, 
        current_skills: List[str], 
        time_per_day: int,
        preferred_language: str = "Python",
        start_date: date = None
    ) -> UserSchedule:
        """
        Generate a complete learning roadmap with scheduled time slots.
        
        Args:
            goal: Learning objective (e.g., "MLOps", "DevOps")
            current_skills: List of skills the user already has
            time_per_day: Hours per day the user can commit
            preferred_language: Programming language preference
            start_date: When to start the schedule (defaults to today)
            
        Returns:
            UserSchedule: Complete schedule with modules and calendar
        """
        if start_date is None:
            start_date = date.today()
        
        # Step 1: Generate module breakdown using AI
        modules = self._generate_module_breakdown(
            goal, 
            current_skills, 
            time_per_day,
            preferred_language
        )
        
        # Step 2: Create calendar time slots from modules
        calendar = self._create_calendar_from_modules(modules, time_per_day, start_date)
        
        # Step 3: Build UserSchedule
        user_schedule = UserSchedule(
            user_id=str(uuid.uuid4()),
            goal=goal,
            start_date=start_date,
            daily_commitment_hours=time_per_day,
            preferred_language=preferred_language,
            modules=modules,
            calendar=calendar
        )
        
        return user_schedule
    
    def _generate_module_breakdown(
        self, 
        goal: str, 
        current_skills: List[str], 
        time_per_day: int,
        preferred_language: str
    ) -> List[LearningModuleScheduler]:
        """
        Use AI to break down the goal into ordered learning modules.
        
        Args:
            goal: Learning objective
            current_skills: Skills user already has
            time_per_day: Daily time commitment
            preferred_language: Programming language preference
            
        Returns:
            List of LearningModuleScheduler with dependencies
        """
        prompt = f"""You are an expert technical curriculum designer specializing in creating structured learning paths.

Your task is to break down the learning goal into ordered modules with clear prerequisites.

GOAL: {goal}
CURRENT SKILLS: {", ".join(current_skills) if current_skills else "None"}
DAILY TIME COMMITMENT: {time_per_day} hours
PREFERRED LANGUAGE: {preferred_language}

REQUIREMENTS:
1. Create 6-10 learning modules that progressively build toward the goal
2. Each module should have clear prerequisites (use module IDs)
3. If a skill is in CURRENT SKILLS, mark that module as "completed" and viva_passed as true
4. First module that user hasn't learned should be "unlocked", others should be "locked"
5. Estimate realistic hours for each module based on daily time commitment
6. Focus content on the preferred programming language
7. Create a proper dependency tree (later modules depend on earlier ones)

OUTPUT FORMAT:
Return a JSON array of modules with this EXACT structure:
[
  {{
    "id": "module_1",
    "title": "Module Title",
    "prerequisites": [],
    "estimated_hours": 15,
    "status": "completed" | "unlocked" | "locked",
    "viva_passed": true | false
  }}
]

IMPORTANT: 
- Use sequential IDs like "module_1", "module_2", etc.
- Prerequisites should reference earlier module IDs
- Return ONLY the JSON array, no additional text

Generate the module breakdown:"""
        
        response = self.model.generate_content(prompt)
        
        try:
            content = response.text.strip()
            
            # Remove markdown code blocks
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            # Parse JSON
            modules_data = json.loads(content)
            
            # Convert to Pydantic models
            modules = [LearningModuleScheduler(**module) for module in modules_data]
            
            return modules
            
        except Exception as e:
            print(f"Error parsing module breakdown: {e}")
            print(f"Response: {response.text}")
            raise ValueError(f"Failed to generate module breakdown: {str(e)}")
    
    def _create_calendar_from_modules(
        self, 
        modules: List[LearningModuleScheduler], 
        time_per_day: int,
        start_date: date
    ) -> List[TimeSlot]:
        """
        Map modules to actual calendar time slots.
        
        Args:
            modules: List of learning modules
            time_per_day: Hours per day available
            start_date: Starting date for the schedule
            
        Returns:
            List of TimeSlot objects scheduled across days
        """
        calendar = []
        current_date = start_date
        days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        # Convert time_per_day to minutes
        daily_minutes = time_per_day * 60
        
        for module in modules:
            # Skip completed modules
            if module.status == ModuleStatusScheduler.completed:
                continue
            
            # Calculate how many days this module will take
            total_minutes_needed = module.estimated_hours * 60
            days_needed = (total_minutes_needed + daily_minutes - 1) // daily_minutes  # Ceiling division
            
            # Schedule learning sessions for this module
            for day_offset in range(days_needed):
                scheduled_date = current_date + timedelta(days=day_offset)
                day_name = days_of_week[scheduled_date.weekday()]
                
                # Determine minutes for this day
                remaining_minutes = total_minutes_needed - (day_offset * daily_minutes)
                session_minutes = min(daily_minutes, remaining_minutes)
                
                # Create learning time slot
                time_slot = TimeSlot(
                    day=day_name,
                    start_time="18:00",  # Default evening time
                    duration_minutes=session_minutes,
                    activity_type=ActivityType.learning
                )
                calendar.append(time_slot)
            
            # Add a coding practice session after each module
            practice_date = current_date + timedelta(days=days_needed)
            practice_day = days_of_week[practice_date.weekday()]
            
            practice_slot = TimeSlot(
                day=practice_day,
                start_time="18:00",
                duration_minutes=60,  # 1 hour practice
                activity_type=ActivityType.coding_practice
            )
            calendar.append(practice_slot)
            
            # Add a viva session
            viva_date = practice_date + timedelta(days=1)
            viva_day = days_of_week[viva_date.weekday()]
            
            viva_slot = TimeSlot(
                day=viva_day,
                start_time="18:00",
                duration_minutes=30,  # 30 min viva
                activity_type=ActivityType.viva
            )
            calendar.append(viva_slot)
            
            # Move to next module start date
            current_date = viva_date + timedelta(days=1)
        
        return calendar
    
    def replan_after_failure(
        self, 
        current_schedule: UserSchedule, 
        failed_module_id: str
    ) -> UserSchedule:
        """
        Replan the schedule after a user fails a viva.
        
        This method:
        1. Finds the failed module
        2. Inserts a remedial session in the next available slot
        3. Shifts all subsequent sessions by one day
        
        Args:
            current_schedule: Current user schedule
            failed_module_id: ID of the module that was failed
            
        Returns:
            Updated UserSchedule with remedial session and shifted calendar
        """
        # Step 1: Find the failed module
        failed_module = None
        for module in current_schedule.modules:
            if module.id == failed_module_id:
                failed_module = module
                module.status = ModuleStatusScheduler.failed
                module.viva_passed = False
                break
        
        if not failed_module:
            raise ValueError(f"Module {failed_module_id} not found in schedule")
        
        # Step 2: Use AI to generate remedial content focus
        remedial_focus = self._generate_remedial_focus(failed_module)
        
        # Step 3: Find the next available slot (tomorrow)
        today = date.today()
        tomorrow = today + timedelta(days=1)
        days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        tomorrow_day = days_of_week[tomorrow.weekday()]
        
        # Step 4: Create remedial session
        remedial_slot = TimeSlot(
            day=tomorrow_day,
            start_time="18:00",
            duration_minutes=120,  # 2 hours for remedial
            activity_type=ActivityType.remedial
        )
        
        # Step 5: Insert remedial session and shift subsequent sessions
        updated_calendar = self._insert_and_shift_calendar(
            current_schedule.calendar,
            remedial_slot,
            shift_days=1
        )
        
        # Step 6: Update the schedule
        current_schedule.calendar = updated_calendar
        
        return current_schedule
    
    def _generate_remedial_focus(self, failed_module: LearningModuleScheduler) -> str:
        """
        Use AI to identify specific gaps in the failed module.
        
        Args:
            failed_module: The module that was failed
            
        Returns:
            Focus areas for remedial study
        """
        prompt = f"""You are an expert tutor analyzing why a student failed a module assessment.

FAILED MODULE: {failed_module.title}

Your task is to identify the most critical gaps and create a focused remedial plan.

REQUIREMENTS:
1. Identify 3-5 key concepts that are typically challenging in this module
2. Suggest specific practice exercises
3. Recommend targeted resources

Return a brief summary (2-3 sentences) of what the remedial session should focus on.

Generate the remedial focus:"""
        
        response = self.model.generate_content(prompt)
        return response.text.strip()
    
    def _insert_and_shift_calendar(
        self, 
        calendar: List[TimeSlot], 
        new_slot: TimeSlot,
        shift_days: int
    ) -> List[TimeSlot]:
        """
        Insert a new time slot and shift all subsequent slots.
        
        Args:
            calendar: Current calendar
            new_slot: New slot to insert
            shift_days: Number of days to shift subsequent slots
            
        Returns:
            Updated calendar with inserted slot and shifted sessions
        """
        days_of_week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        
        # Insert the new slot at the beginning (tomorrow)
        updated_calendar = [new_slot]
        
        # Shift all existing slots
        for slot in calendar:
            # Find current day index
            current_day_index = days_of_week.index(slot.day)
            
            # Shift by specified days
            new_day_index = (current_day_index + shift_days) % 7
            new_day = days_of_week[new_day_index]
            
            # Create shifted slot
            shifted_slot = TimeSlot(
                day=new_day,
                start_time=slot.start_time,
                duration_minutes=slot.duration_minutes,
                activity_type=slot.activity_type
            )
            updated_calendar.append(shifted_slot)
        
        return updated_calendar
