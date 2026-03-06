"""
Text-to-Speech Tool using Edge-TTS (Microsoft)
Provides async audio generation for FastAPI applications
"""
import edge_tts
import uuid
import os


# Voice configuration
# Options:
# - "en-US-ChristopherNeural" - Friendly male (US)
# - "en-US-AriaNeural" - Professional female (US)
# - "en-US-GuyNeural" - Professional male (US)
# - "en-US-JennyNeural" - Friendly female (US)
# - "en-GB-RyanNeural" - Professional male (UK)
VOICE = "en-US-ChristopherNeural"


async def generate_audio_file(text: str) -> str:
    """
    Generate audio file from text using Edge-TTS.
    
    This function is async-compatible with FastAPI and uses Microsoft's
    Edge-TTS service to convert text to high-quality speech.
    
    Args:
        text: The text to convert to speech
        
    Returns:
        str: The filename of the generated audio file (e.g., "temp_abc123.mp3")
        
    Example:
        ```python
        # In a FastAPI endpoint
        @app.post("/generate-speech")
        async def generate_speech(text: str):
            filename = await generate_audio_file(text)
            return FileResponse(filename, media_type="audio/mpeg")
        ```
    
    Note:
        - The generated file is saved in the current working directory
        - Caller is responsible for cleaning up the file after use
        - File format is MP3
    """
    # Generate unique filename
    filename = f"temp_{uuid.uuid4().hex}.mp3"
    
    # Create Edge-TTS communicator
    communicate = edge_tts.Communicate(text, VOICE)
    
    # Save audio to file (async operation)
    await communicate.save(filename)
    
    return filename


async def generate_audio_bytes(text: str) -> bytes:
    """
    Generate audio bytes from text using Edge-TTS.
    
    This is a convenience function that generates audio and returns
    the bytes directly, cleaning up the temporary file automatically.
    
    Args:
        text: The text to convert to speech
        
    Returns:
        bytes: The audio data in MP3 format
        
    Example:
        ```python
        # In a FastAPI endpoint
        @app.post("/generate-speech")
        async def generate_speech(text: str):
            audio_bytes = await generate_audio_bytes(text)
            return Response(content=audio_bytes, media_type="audio/mpeg")
        ```
    """
    # Generate audio file
    filename = await generate_audio_file(text)
    
    try:
        # Read the file
        with open(filename, 'rb') as f:
            audio_bytes = f.read()
        
        return audio_bytes
    finally:
        # Clean up the temporary file
        try:
            os.unlink(filename)
        except Exception as e:
            print(f"Warning: Could not delete temp file {filename}: {e}")


# List of available voices for reference
AVAILABLE_VOICES = {
    "us_male_professional": "en-US-GuyNeural",
    "us_male_friendly": "en-US-ChristopherNeural",
    "us_female_professional": "en-US-AriaNeural",
    "us_female_friendly": "en-US-JennyNeural",
    "us_female_warm": "en-US-MichelleNeural",
    "uk_male_professional": "en-GB-RyanNeural",
    "uk_female_professional": "en-GB-SoniaNeural",
    "au_female_professional": "en-AU-NatashaNeural",
}


async def generate_audio_file_with_voice(text: str, voice_key: str = "us_male_friendly") -> str:
    """
    Generate audio file with a specific voice.
    
    Args:
        text: The text to convert to speech
        voice_key: Key from AVAILABLE_VOICES dict (default: "us_male_friendly")
        
    Returns:
        str: The filename of the generated audio file
        
    Example:
        ```python
        # Use British male voice
        filename = await generate_audio_file_with_voice(
            "Hello, how are you?", 
            "uk_male_professional"
        )
        ```
    """
    voice = AVAILABLE_VOICES.get(voice_key, VOICE)
    filename = f"temp_{uuid.uuid4().hex}.mp3"
    
    communicate = edge_tts.Communicate(text, voice)
    await communicate.save(filename)
    
    return filename
