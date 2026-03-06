from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound, VideoUnavailable
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from ddgs import DDGS
from bs4 import BeautifulSoup
import requests
import re
import os
from typing import Optional, Dict, List
from dataclasses import dataclass


@dataclass
class ContentResult:
    """Structured result from content retrieval tools."""
    text: str  # The transcript or scraped text
    url: str  # The source URL
    title: str  # The title of the video or page
    source_type: str  # "video" or "documentation"
    metadata: Optional[Dict[str, str]] = None  # Additional metadata (views, channel, etc.)


def _parse_view_count(view_str: str) -> int:
    """
    Parse view count string to integer for sorting.
    
    Examples:
        "1.2M views" -> 1200000
        "500K views" -> 500000
        "1,234 views" -> 1234
    
    Args:
        view_str: View count string
        
    Returns:
        Integer view count
    """
    try:
        # Remove "views" and extra spaces
        view_str = view_str.lower().replace('views', '').replace(',', '').strip()
        
        # Handle K (thousands)
        if 'k' in view_str:
            return int(float(view_str.replace('k', '')) * 1000)
        
        # Handle M (millions)
        if 'm' in view_str:
            return int(float(view_str.replace('m', '')) * 1000000)
        
        # Handle B (billions)
        if 'b' in view_str:
            return int(float(view_str.replace('b', '')) * 1000000000)
        
        # Plain number
        return int(float(view_str))
    except:
        return 0


def _format_view_count(view_count: int) -> str:
    """
    Format view count integer to readable string.
    
    Examples:
        1234567 -> "1.2M"
        123456 -> "123K"
        1234 -> "1.2K"
    
    Args:
        view_count: Integer view count
        
    Returns:
        Formatted string
    """
    try:
        if view_count >= 1000000000:
            return f"{view_count / 1000000000:.1f}B"
        elif view_count >= 1000000:
            return f"{view_count / 1000000:.1f}M"
        elif view_count >= 1000:
            return f"{view_count / 1000:.1f}K"
        else:
            return str(view_count)
    except:
        return "N/A"


def get_video_content(query: str) -> Optional[ContentResult]:
    """
    Search for a YouTube video and return structured content with transcript.
    Tries multiple videos and multiple language codes to find a working transcript.
    
    Args:
        query: Search query (e.g., "Python Docker tutorial")
        
    Returns:
        ContentResult with transcript, URL, title, metadata, and type, or None if not found
    """
    try:
        # Step 1: Search for high-quality videos (returns list sorted by views)
        video_list = search_youtube_video(query, max_results=5)
        if not video_list:
            print("No videos found")
            return None
        
        # Step 2: Try each video until we find one with a transcript
        language_codes = ['en', 'hi', 'es', 'fr', 'de', 'pt', 'ja', 'ko']  # Try multiple languages
        
        for video_info in video_list:
            video_url = video_info['url']
            
            # Extract video ID
            video_id = _extract_video_id(video_url)
            if not video_id:
                print(f"Could not extract video ID from {video_url}")
                continue
            
            print(f"Trying video: {video_info['title']} ({video_info['views']} views)")
            
            # Try to get transcript with multiple language codes
            transcript_found = False
            full_transcript = ""
            
            try:
                print(f"  Attempting transcript with multiple languages...")
                # Try multiple languages in priority order
                api = YouTubeTranscriptApi()
                fetched_transcript = api.fetch(video_id, languages=language_codes)
                
                # Extract text from snippets
                full_transcript = " ".join([snippet.text for snippet in fetched_transcript.snippets])
                full_transcript = re.sub(r'\s+', ' ', full_transcript).strip()
                
                # Limit to 15,000 characters
                if len(full_transcript) > 15000:
                    full_transcript = full_transcript[:15000]
                
                print(f"  ✓ Transcript found ({len(full_transcript)} chars)")
                transcript_found = True
                
            except (TranscriptsDisabled, NoTranscriptFound) as e:
                print(f"  ✗ No transcript available: {e}")
                transcript_found = False
            except Exception as e:
                print(f"  ✗ Error fetching transcript: {e}")
                transcript_found = False
            
            # If we found a transcript for this video, return it
            if transcript_found and full_transcript:
                # Build title with channel and views
                title = f"{video_info['title']} by {video_info['channel']}"
                
                # Create metadata dictionary
                metadata = {
                    'channel': video_info['channel'],
                    'views': video_info['views']
                }
                
                print(f"✓ Successfully retrieved content from: {video_info['title']}")
                
                return ContentResult(
                    text=full_transcript,
                    url=video_url,
                    title=title,
                    source_type="video",
                    metadata=metadata
                )
            else:
                print(f"  ✗ No transcript available for this video, trying next...")
        
        # If we tried all videos and none had transcripts
        print("No videos with transcripts found")
        return None
        
    except Exception as e:
        print(f"Error getting video content: {e}")
        import traceback
        traceback.print_exc()
        return None


def search_web_docs(query: str) -> Optional[ContentResult]:
    """
    Search for documentation pages and return structured content.
    
    Args:
        query: Search query (e.g., "Docker official docs volumes")
        
    Returns:
        ContentResult with scraped text, URL, title, and type, or None if not found
    """
    try:
        # Step 1: Search for documentation using DuckDuckGo
        print(f"[search_web_docs] Searching for: {query}")
        
        with DDGS() as ddgs:
            # Try multiple search strategies
            search_queries = [
                f"{query} site:docs.aws.amazon.com",  # AWS specific
                f"{query} official documentation",
                f"{query} docs tutorial guide"
            ]
            
            doc_url = None
            doc_title = None
            
            for search_query in search_queries:
                print(f"[search_web_docs] Trying query: {search_query}")
                try:
                    results = list(ddgs.text(search_query, max_results=10))
                    
                    if not results:
                        continue
                    
                    # Look for documentation URLs (prioritize official docs)
                    for result in results:
                        url = result.get('href', '')
                        title = result.get('title', '')
                        
                        print(f"[search_web_docs] Found result: {title[:50]}... - {url}")
                        
                        # Prioritize official documentation sites
                        if any(domain in url.lower() for domain in [
                            'docs.aws.amazon.com',
                            'aws.amazon.com/documentation',
                            'docs.', 
                            'documentation', 
                            'readthedocs', 
                            'github.io',
                            '.dev',
                            'developer.'
                        ]):
                            doc_url = url
                            doc_title = title
                            print(f"[search_web_docs] Selected official doc: {doc_url}")
                            break
                    
                    # If found a good URL, stop searching
                    if doc_url:
                        break
                    
                    # If no official docs found, use first result
                    if not doc_url and results:
                        doc_url = results[0].get('href', '')
                        doc_title = results[0].get('title', '')
                        print(f"[search_web_docs] Using first result: {doc_url}")
                        
                except Exception as e:
                    print(f"[search_web_docs] Error with query '{search_query}': {e}")
                    continue
            
            if not doc_url:
                print("[search_web_docs] No documentation URL found")
                return None
        
        # Step 2: Scrape the documentation page
        print(f"[search_web_docs] Scraping: {doc_url}")
        scraped_text = scrape_documentation(doc_url)
        
        # Check if scraping failed
        if scraped_text.startswith("Error:") or not scraped_text:
            print(f"[search_web_docs] Scraping failed: {scraped_text[:100]}")
            return None
        
        print(f"[search_web_docs] Successfully scraped {len(scraped_text)} chars")
        
        return ContentResult(
            text=scraped_text,
            url=doc_url,
            title=doc_title or "Documentation",
            source_type="documentation"
        )
        
    except Exception as e:
        print(f"[search_web_docs] Error searching web docs: {e}")
        import traceback
        traceback.print_exc()
        return None


def _search_youtube_fallback(query: str) -> Optional[Dict[str, str]]:
    """
    Fallback YouTube search using DuckDuckGo (used when API quota exceeded).
    Excludes YouTube Shorts.
    
    Args:
        query: Search query
        
    Returns:
        Dictionary with video metadata or None
    """
    try:
        # Add -shorts -#shorts to exclude Shorts
        search_query = f"{query} full course tutorial -shorts -#shorts site:youtube.com"
        print(f"Using DuckDuckGo fallback for: {search_query}")
        
        with DDGS() as ddgs:
            results = list(ddgs.text(search_query, max_results=15))
        
        if not results:
            return None
        
        # Find the first valid YouTube URL (excluding Shorts)
        for result in results:
            url = result.get('href', '')
            title = result.get('title', '')
            
            # Safety net: Filter out Shorts URLs and titles
            if '/shorts/' in url:
                print(f"  Skipping Shorts URL: {url}")
                continue
            
            if any(keyword in title.lower() for keyword in ['#shorts', '#short', 'shorts']):
                print(f"  Skipping Shorts title: {title}")
                continue
            
            if 'youtube.com/watch?v=' in url or 'youtu.be/' in url:
                video_id = _extract_video_id(url)
                if video_id:
                    normalized_url = f"https://www.youtube.com/watch?v={video_id}"
                    
                    # Try to extract channel from title
                    channel = "YouTube"
                    if ' - ' in title:
                        parts = title.split(' - ')
                        if len(parts) >= 2:
                            channel = parts[-1]
                    
                    return {
                        'url': normalized_url,
                        'title': title,
                        'views': 'N/A',
                        'channel': channel
                    }
        
        return None
    except Exception as e:
        print(f"Error in DuckDuckGo fallback: {e}")
        return None


def search_youtube_video(query: str, max_results: int = 5) -> Optional[List[Dict[str, str]]]:
    """
    Search for YouTube videos using official YouTube Data API v3.
    Returns a list of videos sorted by view count (highest first).
    Falls back to DuckDuckGo if API quota is exceeded.
    Excludes YouTube Shorts to prioritize educational content.
    
    Args:
        query: Search query (e.g., "Python Docker tutorial")
        max_results: Maximum number of videos to return (default: 5)
        
    Returns:
        List of dictionaries with video metadata:
        - url: Full YouTube URL
        - title: Video title
        - views: Formatted view count (e.g., "1.2M")
        - channel: Channel name
        Or None if not found
    """
    try:
        # Check if YouTube API key is available
        youtube_api_key = os.getenv('YOUTUBE_API_KEY')
        
        if not youtube_api_key:
            print("YouTube API key not found, using DuckDuckGo fallback")
            fallback_result = _search_youtube_fallback(query)
            return [fallback_result] if fallback_result else None
        
        # Initialize YouTube API client
        youtube = build('youtube', 'v3', developerKey=youtube_api_key)
        
        # Step 1: Search for videos with Shorts exclusion
        # Append -shorts -#shorts to exclude YouTube Shorts
        search_query = f"{query} full course tutorial -shorts -#shorts"
        print(f"Searching YouTube API for: {search_query}")
        
        search_response = youtube.search().list(
            q=search_query,
            part='id,snippet',
            maxResults=max_results * 3,  # Request more to filter out shorts
            type='video',
            videoDuration='medium'  # 4-20 minutes, excludes very short videos
        ).execute()
        
        if not search_response.get('items'):
            # Try again with 'long' duration (>20 minutes)
            print("No medium videos found, trying long videos...")
            search_response = youtube.search().list(
                q=search_query,
                part='id,snippet',
                maxResults=max_results * 3,
                type='video',
                videoDuration='long'  # >20 minutes
            ).execute()
        
        if not search_response.get('items'):
            print("No videos found via YouTube API")
            fallback_result = _search_youtube_fallback(query)
            return [fallback_result] if fallback_result else None
        
        # Step 2: Extract video IDs and filter out Shorts
        video_ids = []
        video_titles = {}
        
        for item in search_response['items']:
            video_id = item['id']['videoId']
            title = item['snippet']['title']
            
            # Filter out videos with "shorts" or "#shorts" in title
            if any(keyword in title.lower() for keyword in ['#shorts', '#short', 'shorts', '#tiktok']):
                print(f"  Skipping Shorts video: {title}")
                continue
            
            video_ids.append(video_id)
            video_titles[video_id] = title
        
        if not video_ids:
            print("All videos were Shorts, trying fallback")
            fallback_result = _search_youtube_fallback(query)
            return [fallback_result] if fallback_result else None
        
        print(f"Found {len(video_ids)} non-Shorts videos")
        
        # Step 3: Get video statistics and content details
        videos_response = youtube.videos().list(
            id=','.join(video_ids),
            part='statistics,snippet,contentDetails'
        ).execute()
        
        if not videos_response.get('items'):
            print("No video statistics found")
            fallback_result = _search_youtube_fallback(query)
            return [fallback_result] if fallback_result else None
        
        # Step 4: Parse and filter by duration
        video_data = []
        for video in videos_response['items']:
            try:
                video_id = video['id']
                title = video['snippet']['title']
                channel = video['snippet']['channelTitle']
                view_count = int(video['statistics'].get('viewCount', 0))
                
                # Additional filter: Check duration to exclude very short videos
                duration = video.get('contentDetails', {}).get('duration', '')
                # Parse ISO 8601 duration (e.g., PT1M30S = 1 min 30 sec)
                # Skip videos shorter than 3 minutes
                if 'PT' in duration:
                    # Simple check: if duration doesn't contain 'M' (minutes) or 'H' (hours), it's likely < 1 min
                    if 'H' not in duration and 'M' not in duration:
                        print(f"  Skipping short video: {title} (duration: {duration})")
                        continue
                    
                    # Additional check: if it has minutes but is very short (e.g., PT1M = 1 minute)
                    if 'M' in duration and 'H' not in duration:
                        # Extract minutes
                        import re
                        match = re.search(r'PT(\d+)M', duration)
                        if match:
                            minutes = int(match.group(1))
                            if minutes < 3:
                                print(f"  Skipping short video: {title} ({minutes} minutes)")
                                continue
                
                video_data.append({
                    'url': f"https://www.youtube.com/watch?v={video_id}",
                    'title': title,
                    'channel': channel,
                    'views': _format_view_count(view_count),
                    'view_count_int': view_count
                })
                
                print(f"  ✓ {title} by {channel} ({_format_view_count(view_count)} views)")
            except Exception as e:
                print(f"Error parsing video: {e}")
                continue
        
        if not video_data:
            fallback_result = _search_youtube_fallback(query)
            return [fallback_result] if fallback_result else None
        
        # Step 5: Sort by view count (highest first)
        video_data.sort(key=lambda x: x['view_count_int'], reverse=True)
        
        # Limit to max_results
        video_data = video_data[:max_results]
        
        print(f"Returning {len(video_data)} videos sorted by views")
        
        # Remove internal sorting field from all videos
        for video in video_data:
            del video['view_count_int']
        
        return video_data
        
    except HttpError as e:
        # Handle API quota exceeded (403) or other HTTP errors
        if e.resp.status == 403:
            print(f"YouTube API quota exceeded, falling back to DuckDuckGo")
        else:
            print(f"YouTube API error ({e.resp.status}): {e}")
        fallback_result = _search_youtube_fallback(query)
        return [fallback_result] if fallback_result else None
        
    except Exception as e:
        print(f"Error searching YouTube: {e}")
        fallback_result = _search_youtube_fallback(query)
        return [fallback_result] if fallback_result else None
        
        print(f"Returning {len(video_data)} videos sorted by views")
        
        # Remove internal sorting field from all videos
        for video in video_data:
            del video['view_count_int']
        
        return video_data
        
    except HttpError as e:
        # Handle API quota exceeded (403) or other HTTP errors
        if e.resp.status == 403:
            print(f"YouTube API quota exceeded, falling back to DuckDuckGo")
        else:
            print(f"YouTube API error ({e.resp.status}): {e}")
        fallback_result = _search_youtube_fallback(query)
        return [fallback_result] if fallback_result else None
        
    except Exception as e:
        print(f"Error searching YouTube: {e}")
        fallback_result = _search_youtube_fallback(query)
        return [fallback_result] if fallback_result else None


def get_video_transcript(video_url: str) -> str:
    """
    Extract transcript from a YouTube video URL.
    
    Args:
        video_url: Full YouTube URL (e.g., "https://www.youtube.com/watch?v=...")
        
    Returns:
        Transcript text (limited to first 15,000 characters) or empty string on error
        
    Raises:
        TranscriptsDisabled: If transcripts are disabled for the video
        NoTranscriptFound: If no transcript is available
        VideoUnavailable: If the video is unavailable
    """
    try:
        # Extract video ID from URL
        video_id = _extract_video_id(video_url)
        
        if not video_id:
            print(f"Error: Could not extract video ID from URL '{video_url}'")
            return ""
        
        # Get the transcript
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        
        # Combine all transcript segments into one string
        full_transcript = " ".join([segment['text'] for segment in transcript_list])
        
        # Clean up the transcript (remove extra whitespace)
        full_transcript = re.sub(r'\s+', ' ', full_transcript).strip()
        
        # Limit to first 15,000 characters to save LLM tokens
        if len(full_transcript) > 15000:
            return full_transcript[:15000]
        
        return full_transcript
        
    except TranscriptsDisabled:
        print(f"Error: Transcripts are disabled for video '{video_url}'")
        return ""
    except NoTranscriptFound:
        print(f"Error: No transcript found for video '{video_url}'")
        return ""
    except VideoUnavailable:
        print(f"Error: Video '{video_url}' is unavailable")
        return ""
    except Exception as e:
        print(f"Error retrieving transcript: {str(e)}")
        return ""


# Legacy function - kept for backward compatibility
def get_youtube_transcript(search_query: str, video_id: Optional[str] = None) -> str:
    """
    Get YouTube video transcript by searching for a video or using a specific video ID.
    
    Args:
        search_query: Search query to find relevant YouTube video
        video_id: Optional specific YouTube video ID to use directly
        
    Returns:
        First 2000 characters of the transcript or error message
    """
    try:
        # If no video_id provided, search for one
        if not video_id:
            video_id = _search_youtube_video(search_query)
            if not video_id:
                return f"Error: Could not find a YouTube video for query '{search_query}'"
        
        # Get the transcript
        transcript_list = YouTubeTranscriptApi.get_transcript(video_id)
        
        # Combine all transcript segments into one text
        full_transcript = " ".join([segment['text'] for segment in transcript_list])
        
        # Clean up the transcript
        full_transcript = re.sub(r'\s+', ' ', full_transcript).strip()
        
        # Return first 2000 characters
        if len(full_transcript) > 2000:
            return full_transcript[:2000] + "..."
        return full_transcript
        
    except TranscriptsDisabled:
        return f"Error: Transcripts are disabled for video ID '{video_id}'"
    except NoTranscriptFound:
        return f"Error: No transcript found for video ID '{video_id}'"
    except VideoUnavailable:
        return f"Error: Video '{video_id}' is unavailable"
    except Exception as e:
        return f"Error retrieving transcript: {str(e)}"


def _search_youtube_video(query: str) -> Optional[str]:
    """
    Search for a YouTube video using DuckDuckGo and extract video ID.
    
    Args:
        query: Search query
        
    Returns:
        YouTube video ID or None if not found
    """
    try:
        # Search for YouTube videos
        search_query = f"{query} site:youtube.com"
        
        with DDGS() as ddgs:
            results = list(ddgs.text(search_query, max_results=5))
            
            # Look for YouTube URLs in results
            for result in results:
                url = result.get('href', '')
                video_id = _extract_video_id(url)
                if video_id:
                    return video_id
        
        return None
        
    except Exception as e:
        print(f"Error searching for YouTube video: {e}")
        return None


def _extract_video_id(url: str) -> Optional[str]:
    """
    Extract YouTube video ID from various URL formats.
    Excludes YouTube Shorts URLs.
    
    Args:
        url: YouTube URL
        
    Returns:
        Video ID or None (returns None for Shorts URLs)
    """
    # Safety net: Reject Shorts URLs
    if '/shorts/' in url:
        return None
    
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})',
        r'youtube\.com\/embed\/([a-zA-Z0-9_-]{11})',
        r'youtube\.com\/v\/([a-zA-Z0-9_-]{11})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    return None


def scrape_documentation(url: str, max_chars: int = 10000) -> str:
    """
    Scrape documentation from a URL and extract main text content.
    
    Args:
        url: URL of the documentation page
        max_chars: Maximum characters to return (default: 10000)
        
    Returns:
        Cleaned text content (up to max_chars) or error message
    """
    try:
        print(f"[scrape_documentation] Fetching: {url}")
        
        # Set headers to mimic a browser request
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        
        # Make the request
        response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        response.raise_for_status()
        
        print(f"[scrape_documentation] Status: {response.status_code}")
        
        # Parse HTML
        soup = BeautifulSoup(response.content, 'lxml')
        
        # Remove script and style elements
        for script in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe', 'noscript']):
            script.decompose()
        
        # Extract text from main content areas (try multiple selectors)
        text_elements = []
        
        # Try to find main content area first
        main_content = soup.find('main') or soup.find('article') or soup.find('div', class_=re.compile(r'content|main|body|article', re.I))
        
        if main_content:
            print("[scrape_documentation] Found main content area")
            # Get all paragraph text from main content
            for p in main_content.find_all(['p', 'li', 'h1', 'h2', 'h3', 'h4']):
                text = p.get_text().strip()
                if text and len(text) > 20:  # Skip very short snippets
                    text_elements.append(text)
            
            # Get code blocks from main content
            for code in main_content.find_all('code'):
                text = code.get_text().strip()
                if text and len(text) < 500:  # Avoid huge code blocks
                    text_elements.append(f"Code: {text}")
        else:
            print("[scrape_documentation] No main content area, using all paragraphs")
            # Fallback: Get all paragraph text
            for p in soup.find_all('p'):
                text = p.get_text().strip()
                if text and len(text) > 20:
                    text_elements.append(text)
            
            # Get all code blocks
            for code in soup.find_all('code'):
                text = code.get_text().strip()
                if text and len(text) < 500:
                    text_elements.append(f"Code: {text}")
        
        # Combine all text
        full_text = "\n\n".join(text_elements)
        
        # Clean up whitespace
        full_text = re.sub(r'\n\s*\n', '\n\n', full_text)
        full_text = re.sub(r' +', ' ', full_text)
        full_text = full_text.strip()
        
        print(f"[scrape_documentation] Extracted {len(full_text)} chars, {len(text_elements)} elements")
        
        # Return up to max_chars
        if not full_text:
            return f"Error: No text content found at URL '{url}'"
        
        if len(full_text) > max_chars:
            return full_text[:max_chars]
        return full_text
        
    except requests.exceptions.Timeout:
        return f"Error: Request timeout while accessing '{url}'"
    except requests.exceptions.ConnectionError:
        return f"Error: Could not connect to '{url}'"
    except requests.exceptions.HTTPError as e:
        return f"Error: HTTP {e.response.status_code} while accessing '{url}'"
    except Exception as e:
        print(f"[scrape_documentation] Error: {e}")
        import traceback
        traceback.print_exc()
        return f"Error scraping documentation: {str(e)}"


# Utility function to test the tools
if __name__ == "__main__":
    # Test video content retrieval
    print("Testing video content retrieval...")
    video_result = get_video_content("Python tutorial for beginners")
    if video_result:
        print(f"Title: {video_result.title}")
        print(f"URL: {video_result.url}")
        print(f"Type: {video_result.source_type}")
        print(f"Text (first 200 chars): {video_result.text[:200]}\n")
    
    # Test documentation search
    print("Testing documentation search...")
    doc_result = search_web_docs("Docker official docs volumes")
    if doc_result:
        print(f"Title: {doc_result.title}")
        print(f"URL: {doc_result.url}")
        print(f"Type: {doc_result.source_type}")
        print(f"Text (first 200 chars): {doc_result.text[:200]}")
