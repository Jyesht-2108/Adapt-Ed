export interface TranscriptResult {
    text: string;
    url: string;
    title: string;
    videoId: string;
}

/**
 * Extract video ID from various YouTube URL formats
 */
function extractVideoId(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
}

/**
 * Fetch YouTube transcript from the browser using a CORS proxy
 * This avoids backend IP blocking by using the user's IP
 * 
 * @param videoUrl - Full YouTube URL
 * @returns Transcript text and metadata
 */
export async function fetchYoutubeTranscript(videoUrl: string): Promise<TranscriptResult> {
    try {
        const videoId = extractVideoId(videoUrl);

        if (!videoId) {
            throw new Error('Invalid YouTube URL');
        }

        console.log(`Fetching transcript for video: ${videoId}`);

        // Use CORS proxy to fetch YouTube page
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const html = await response.text();

        // Extract captions data from the page HTML
        // YouTube embeds caption data in the page as JSON
        const captionsRegex = /"captions":\s*(\{[^}]+playerCaptionsTracklistRenderer[^}]+\})/;
        const match = html.match(captionsRegex);

        if (!match) {
            throw new Error('No captions data found');
        }

        // Parse the captions JSON
        let captionsData;
        try {
            // Extract the full captions object
            const captionsStart = html.indexOf('"captions":');
            if (captionsStart === -1) throw new Error('Captions not found');
            
            let braceCount = 0;
            let captionsEnd = captionsStart + 11; // Start after "captions":
            let inString = false;
            let escapeNext = false;

            for (let i = captionsEnd; i < html.length; i++) {
                const char = html[i];
                
                if (escapeNext) {
                    escapeNext = false;
                    continue;
                }
                
                if (char === '\\') {
                    escapeNext = true;
                    continue;
                }
                
                if (char === '"') {
                    inString = !inString;
                    continue;
                }
                
                if (inString) continue;
                
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
                
                if (braceCount === 0 && char === '}') {
                    captionsEnd = i + 1;
                    break;
                }
            }

            const captionsJson = html.substring(captionsStart + 11, captionsEnd);
            captionsData = JSON.parse(captionsJson);
        } catch (e) {
            console.error('Failed to parse captions JSON:', e);
            throw new Error('Failed to parse captions data');
        }

        const captionTracks = captionsData?.playerCaptionsTracklistRenderer?.captionTracks;

        if (!captionTracks || captionTracks.length === 0) {
            throw new Error('No transcript available for this video');
        }

        // Find English caption track (or first available)
        let captionTrack = captionTracks.find((track: any) =>
            track.languageCode === 'en' || track.languageCode?.startsWith('en')
        );

        if (!captionTrack) {
            captionTrack = captionTracks[0]; // Use first available language
        }

        console.log(`Found caption track: ${captionTrack.name?.simpleText || 'Unknown'}`);

        // Fetch the transcript XML
        const transcriptUrl = captionTrack.baseUrl;
        const transcriptProxyUrl = `https://corsproxy.io/?${encodeURIComponent(transcriptUrl)}`;
        
        const transcriptResponse = await fetch(transcriptProxyUrl);
        if (!transcriptResponse.ok) {
            throw new Error('Failed to fetch transcript XML');
        }
        
        const transcriptXml = await transcriptResponse.text();

        // Parse XML and extract text
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(transcriptXml, 'text/xml');
        const textElements = xmlDoc.getElementsByTagName('text');

        if (textElements.length === 0) {
            throw new Error('No transcript text found in XML');
        }

        const transcriptParts: string[] = [];
        for (let i = 0; i < textElements.length; i++) {
            const text = textElements[i].textContent || '';
            if (text.trim()) {
                // Decode HTML entities
                const decoded = text
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");
                transcriptParts.push(decoded.trim());
            }
        }

        const fullTranscript = transcriptParts.join(' ').replace(/\s+/g, ' ').trim();

        if (!fullTranscript) {
            throw new Error('Transcript is empty');
        }

        // Limit to 15,000 characters
        const limitedTranscript = fullTranscript.length > 15000
            ? fullTranscript.substring(0, 15000)
            : fullTranscript;

        console.log(`✓ Transcript fetched: ${limitedTranscript.length} characters`);

        return {
            text: limitedTranscript,
            url: videoUrl,
            title: '', // Will be filled by backend from video metadata
            videoId
        };

    } catch (error: any) {
        console.error('Error fetching YouTube transcript:', error);

        // Provide user-friendly error messages
        if (error.message?.includes('No captions')) {
            throw new Error('No transcript available for this video');
        } else if (error.message?.includes('Invalid')) {
            throw new Error('Invalid YouTube URL');
        } else if (error.message?.includes('HTTP error')) {
            throw new Error('Failed to access YouTube (network error)');
        } else {
            throw new Error(`Failed to fetch transcript: ${error.message}`);
        }
    }
}

/**
 * Fetch transcripts for multiple videos (tries each until one succeeds)
 * 
 * @param videoUrls - Array of YouTube URLs to try
 * @returns First successful transcript result
 */
export async function fetchYoutubeTranscriptMultiple(
    videoUrls: string[]
): Promise<TranscriptResult> {
    const errors: string[] = [];

    for (const url of videoUrls) {
        try {
            console.log(`Trying video: ${url}`);
            const result = await fetchYoutubeTranscript(url);
            console.log(`✓ Success! Got transcript from: ${url}`);
            return result;
        } catch (error: any) {
            console.log(`✗ Failed: ${error.message}`);
            errors.push(`${url}: ${error.message}`);
        }
    }

    throw new Error(
        `No transcripts available from any video. Tried ${videoUrls.length} videos.`
    );
}
