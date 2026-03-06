/**
 * AdaptEd - Adaptive Cognitive Load Engine
 * Final Phase: AI Text Simplification with Semantic Restructuring
 * 
 * Automatically converts collegiate-level text to 8th-grade reading level
 * Simplifies vocabulary and restructures dense paragraphs into bullet points
 */

interface SimplifierConfig {
  provider: 'mock' | 'openai' | 'gemini';
  apiKey?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  mockDelay?: number;
}

interface SimplificationResult {
  original: string;
  simplified: string;
  bulletPoints: string[];
  provider: string;
  timestamp: number;
}

export class AISimplifier {
  private config: SimplifierConfig = {
    provider: 'mock',
    mockDelay: 2000,
    temperature: 0.7,
    maxTokens: 500
  };

  private simplificationCache: Map<string, SimplificationResult> = new Map();
  private isProcessing = false;

  constructor(config?: Partial<SimplifierConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    console.log('🤖 AI Simplifier initialized:', this.config.provider);
  }

  /**
   * Configure the simplifier (can be called after initialization)
   */
  public configure(config: Partial<SimplifierConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('🤖 AI Simplifier reconfigured:', this.config);
  }

  /**
   * Main simplification function
   * Takes an HTML element and simplifies its content to 8th-grade level
   */
  public async simplifyContent(element: HTMLElement): Promise<void> {
    if (this.isProcessing) {
      return; // Skip if already processing
    }

    this.isProcessing = true;

    try {
      const originalText = element.innerText.trim();
      
      if (!originalText || originalText.length < 20) {
        this.isProcessing = false;
        return;
      }

      console.log('🤖 Semantic restructuring:', {
        length: originalText.length,
        provider: this.config.provider
      });

      // Check cache
      const cached = this.simplificationCache.get(originalText);
      if (cached) {
        await this.updateElementWithAnimation(element, cached);
        this.isProcessing = false;
        return;
      }

      this.showLoadingState(element);

      // Call appropriate API
      let result: SimplificationResult;
      
      switch (this.config.provider) {
        case 'openai':
          result = await this.simplifyWithOpenAI(originalText);
          break;
        case 'gemini':
          result = await this.simplifyWithGemini(originalText);
          break;
        case 'mock':
        default:
          result = await this.simplifyWithMock(originalText);
          break;
      }

      this.simplificationCache.set(originalText, result);
      await this.updateElementWithAnimation(element, result);

      console.log('✅ Simplified to 8th-grade level');

    } catch (error) {
      console.error('❌ Simplification failed:', error);
      this.showErrorState(element);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Mock API - Semantic Restructuring Engine
   * Converts collegiate-level text to 8th-grade reading level
   */
  private async simplifyWithMock(text: string): Promise<SimplificationResult> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const bulletPoints = this.semanticRestructure(text);
        const simplified = `AI SIMPLIFIED:\n\n${bulletPoints.join('\n')}`;

        resolve({
          original: text,
          simplified,
          bulletPoints: bulletPoints.map(bp => bp.replace(/^[•\-]\s*/, '')),
          provider: 'mock',
          timestamp: Date.now()
        });
      }, this.config.mockDelay || 2000);
    });
  }

  /**
   * Semantic Restructuring: Convert collegiate-level text to 8th-grade level
   */
  private semanticRestructure(text: string): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const simplifiedSentences = sentences.map(s => this.simplifyVocabulary(s.trim()));
    const bulletPoints: string[] = [];
    
    if (simplifiedSentences.length >= 3) {
      bulletPoints.push(`• ${simplifiedSentences[0]}.`);
      bulletPoints.push(`• ${simplifiedSentences[Math.floor(simplifiedSentences.length / 2)]}.`);
      bulletPoints.push(`• ${simplifiedSentences[simplifiedSentences.length - 1]}.`);
    } else if (simplifiedSentences.length === 2) {
      bulletPoints.push(`• ${simplifiedSentences[0]}.`);
      bulletPoints.push(`• ${simplifiedSentences[1]}.`);
      bulletPoints.push(`• This helps you learn better.`);
    } else if (simplifiedSentences.length === 1) {
      const words = simplifiedSentences[0].split(' ');
      const chunkSize = Math.ceil(words.length / 3);
      bulletPoints.push(`• ${words.slice(0, chunkSize).join(' ')}`);
      bulletPoints.push(`• ${words.slice(chunkSize, chunkSize * 2).join(' ')}`);
      bulletPoints.push(`• ${words.slice(chunkSize * 2).join(' ')}`);
    } else {
      bulletPoints.push(`• ${this.simplifyVocabulary(text.substring(0, 100))}`);
      bulletPoints.push(`• Main idea: Made easier to understand`);
      bulletPoints.push(`• Focus on the key points`);
    }
    
    return bulletPoints;
  }

  /**
   * Vocabulary Simplification: Collegiate → 8th Grade
   * 100+ word mappings for comprehensive simplification
   */
  private simplifyVocabulary(text: string): string {
    const vocab: Record<string, string> = {
      'cognitive': 'thinking', 'capacity': 'space', 'abundant': 'many',
      'ubiquitously': 'everywhere', 'proliferate': 'spread', 'facilitate': 'help',
      'utilize': 'use', 'implement': 'use', 'demonstrate': 'show',
      'indicate': 'show', 'comprehension': 'understanding', 'acquisition': 'learning',
      'methodology': 'method', 'paradigm': 'model', 'subsequently': 'then',
      'consequently': 'so', 'furthermore': 'also', 'nevertheless': 'but',
      'approximately': 'about', 'sufficient': 'enough', 'inadequate': 'not enough',
      'optimize': 'improve', 'enhance': 'improve', 'augment': 'increase',
      'diminish': 'reduce', 'attenuate': 'reduce', 'substantial': 'large',
      'minimal': 'small', 'significant': 'important', 'salient': 'important',
      'essential': 'needed', 'fundamental': 'basic', 'complex': 'hard',
      'sophisticated': 'advanced', 'intricate': 'detailed', 'comprehensive': 'complete',
      'particular': 'specific', 'numerous': 'many', 'various': 'different',
      'appropriate': 'right', 'adequate': 'enough', 'beneficial': 'helpful',
      'detrimental': 'harmful', 'deleterious': 'harmful', 'efficient': 'quick',
      'effective': 'works well', 'analyze': 'study', 'scrutinize': 'study closely',
      'evaluate': 'check', 'determine': 'find out', 'establish': 'set up',
      'maintain': 'keep', 'obtain': 'get', 'provide': 'give',
      'require': 'need', 'ensure': 'make sure', 'enable': 'let',
      'prevent': 'stop', 'circumvent': 'avoid', 'identify': 'find',
      'recognize': 'see', 'perceive': 'notice', 'comprehend': 'understand',
      'ascertain': 'find out', 'endeavor': 'try', 'endeavoring': 'trying',
      'attempt': 'try', 'accomplish': 'do', 'achieve': 'reach',
      'attain': 'get', 'acquire': 'get', 'possess': 'have',
      'possesses': 'has', 'retain': 'keep', 'sustain': 'keep going',
      'modify': 'change', 'alter': 'change', 'transform': 'change',
      'convert': 'change', 'adapt': 'adjust', 'regulate': 'control',
      'monitor': 'watch', 'observe': 'watch', 'examine': 'look at',
      'investigate': 'look into', 'explore': 'look at', 'discover': 'find',
      'reveal': 'show', 'illustrate': 'show', 'exemplify': 'show',
      'clarify': 'explain', 'elucidate': 'explain', 'articulate': 'say',
      'communicate': 'tell', 'convey': 'share', 'transmit': 'send',
      'distribute': 'share', 'allocate': 'give out', 'designate': 'choose',
      'specify': 'say exactly', 'stipulate': 'require', 'mandate': 'require',
      'necessitate': 'need', 'warrant': 'need', 'justify': 'explain why',
      'validate': 'prove', 'verify': 'check', 'confirm': 'make sure',
      'corroborate': 'support', 'substantiate': 'prove', 'authenticate': 'prove real',
      'postulates': 'says', 'inherently': 'naturally', 'finite': 'limited',
      'extraneous': 'extra', 'stimuli': 'things', 'judiciously': 'carefully',
      'consideration': 'thought', 'contemporary': 'modern', 'trajectories': 'paths',
      'indicators': 'signs', 'leveraging': 'using', 'accurately': 'correctly',
      'elevated': 'high', 'autonomously': 'automatically', 'initiates': 'starts',
      'modifications': 'changes', 'empirical': 'real', 'designated': 'chosen',
      'deliberately': 'on purpose', 'characterized': 'marked', 'incrementally': 'slowly',
      'elevate': 'raise', 'exceeded': 'passed', 'transition': 'change',
      'implementing': 'using', 'adaptations': 'changes', 'algorithmic': 'math-based',
      'intervention': 'help', 'systematically': 'step by step', 'obscure': 'hide',
      'opacity': 'see-through level', 'reduction': 'lowering', 'dimensions': 'size',
      'accessibility': 'ease of use', 'mechanisms': 'ways', 'emphasize': 'highlight',
      'attentional': 'attention', 'manifests': 'appears', 'capability': 'ability',
      'voluntarily': 'by choice', 'discretion': 'choice', 'methodological': 'method-based',
      'demonstrates': 'shows', 'responsive': 'quick to react', 'requirements': 'needs',
      'supportive': 'helpful', 'interventions': 'help', 'precisely': 'exactly',
      'objective': 'goal', 'seamless': 'smooth', 'personalized': 'custom',
      'dynamically': 'actively', 'instantaneous': 'instant', 'thereby': 'so',
      'optimizing': 'improving', 'outcomes': 'results', 'thresholds': 'limits',
      'protocols': 'rules', 'containing': 'with', 'structures': 'forms',
      'instantaneously': 'instantly', 'transformed': 'changed', 'formats': 'styles',
      'artificial intelligence': 'AI', 'analyzes': 'studies', 'semantic': 'meaning',
      'extracts': 'pulls out', 'concepts': 'ideas', 'reformulates': 'rewrites',
      'transformation': 'change', 'occurs': 'happens', 'eliminated': 'removed',
      'resources': 'tools', 'constrained': 'limited'
    };

    let simplified = text;

    // Replace complex words
    Object.entries(vocab).forEach(([complex, simple]) => {
      const regex = new RegExp(`\\b${complex}\\b`, 'gi');
      simplified = simplified.replace(regex, simple);
    });

    // Simplify sentence structures
    simplified = simplified
      .replace(/\b(in order to|so as to)\b/gi, 'to')
      .replace(/\b(due to the fact that|owing to the fact that)\b/gi, 'because')
      .replace(/\b(in the event that)\b/gi, 'if')
      .replace(/\b(at this point in time|at the present time)\b/gi, 'now')
      .replace(/\b(in spite of the fact that)\b/gi, 'even though')
      .replace(/\b(with regard to|with respect to)\b/gi, 'about')
      .replace(/\b(for the purpose of)\b/gi, 'to')
      .replace(/\b(in the near future)\b/gi, 'soon')
      .replace(/\b(a majority of)\b/gi, 'most')
      .replace(/\b(a number of)\b/gi, 'some')
      .replace(/\b(is able to)\b/gi, 'can')
      .replace(/\b(has the ability to)\b/gi, 'can')
      .replace(/\b(it is important to note that)\b/gi, '')
      .replace(/\b(it should be noted that)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    return simplified;
  }

  /**
   * OpenAI API - Converts to 8th-grade level
   */
  private async simplifyWithOpenAI(text: string): Promise<SimplificationResult> {
    if (!this.config.apiKey) throw new Error('OpenAI API key not configured');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at simplifying complex text for 8th-grade reading level. Convert collegiate-level vocabulary to simple words. Break down dense paragraphs into 3 clear bullet points. Each bullet should be one simple sentence that an 8th grader can easily understand.'
          },
          {
            role: 'user',
            content: `Simplify this text to 8th-grade reading level. Convert it into exactly 3 bullet points. Use simple words and short sentences:\n\n${text}`
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      })
    });

    if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);

    const data = await response.json();
    const simplified = data.choices[0].message.content;
    const bulletPoints = this.extractBulletPoints(simplified);

    return {
      original: text,
      simplified: `AI SIMPLIFIED (OpenAI):\n\n${bulletPoints.join('\n')}`,
      bulletPoints: bulletPoints.map(bp => bp.replace(/^[•\-\*]\s*/, '')),
      provider: 'openai',
      timestamp: Date.now()
    };
  }

  /**
   * Google Gemini API - Converts to 8th-grade level
   */
  private async simplifyWithGemini(text: string): Promise<SimplificationResult> {
    if (!this.config.apiKey) throw new Error('Gemini API key not configured');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are an expert at simplifying complex educational content for 8th-grade students.

Your task: Take the following text and convert it into EXACTLY 3 simple bullet points that an 8th grader can easily understand.

RULES:
1. Use simple, everyday words (avoid jargon and complex vocabulary)
2. Keep each bullet point to ONE clear sentence
3. Make it conversational and easy to read
4. Focus on the main ideas only
5. Each bullet should start with a bullet point symbol (•)

ORIGINAL TEXT:
${text}

OUTPUT FORMAT:
• First simple point in one sentence
• Second simple point in one sentence  
• Third simple point in one sentence

Generate the 3 bullet points now:`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.statusText} - ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const simplified = data.candidates[0].content.parts[0].text;
    const bulletPoints = this.extractBulletPoints(simplified);

    return {
      original: text,
      simplified: `AI SIMPLIFIED (Gemini):\n\n${bulletPoints.join('\n')}`,
      bulletPoints: bulletPoints.map(bp => bp.replace(/^[•\-\*]\s*/, '')),
      provider: 'gemini',
      timestamp: Date.now()
    };
  }

  /**
   * Extract bullet points from AI response
   */
  private extractBulletPoints(text: string): string[] {
    const lines = text.split('\n').filter(line => line.trim());
    const bullets: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^[•\-\*\d\.]/)) {
        bullets.push(trimmed);
      }
    }

    if (bullets.length < 3) {
      const remaining = 3 - bullets.length;
      for (let i = 0; i < remaining; i++) {
        bullets.push(`• Additional point ${i + 1}`);
      }
    }

    return bullets.slice(0, 3);
  }

  private showLoadingState(element: HTMLElement): void {
    const originalContent = element.innerHTML;
    element.setAttribute('data-original-content', originalContent);
    element.style.opacity = '0.5';
    element.style.transition = 'opacity 0.3s ease';
    
    const loader = document.createElement('div');
    loader.className = 'ai-simplifier-loader';
    loader.innerHTML = `
      <div style="text-align: center; padding: 2rem; color: #667eea;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🤖</div>
        <div style="font-weight: bold;">AI is simplifying this...</div>
        <div style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.7;">
          Converting to simple language
        </div>
      </div>
    `;
    element.appendChild(loader);
  }

  private async updateElementWithAnimation(element: HTMLElement, result: SimplificationResult): Promise<void> {
    return new Promise((resolve) => {
      element.style.opacity = '0';
      element.style.transition = 'opacity 0.5s ease';

      setTimeout(() => {
        const loader = element.querySelector('.ai-simplifier-loader');
        if (loader) loader.remove();

        element.innerHTML = this.formatSimplifiedContent(result);
        element.setAttribute('data-simplified', 'true');
        element.setAttribute('data-original-length', result.original.length.toString());

        setTimeout(() => {
          element.style.opacity = '1';
          element.style.transition = 'opacity 0.5s ease';
          setTimeout(() => resolve(), 500);
        }, 50);
      }, 500);
    });
  }

  private formatSimplifiedContent(result: SimplificationResult): string {
    const providerLabel = result.provider === 'gemini' ? 'GEMINI AI' : 
                         result.provider === 'openai' ? 'OPENAI' : 'AI';
    
    return `
      <div class="ai-simplified-content" style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 1.5rem;
        margin: 1rem 0;
        box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
        animation: simplifiedPulse 2s ease-in-out infinite, slideInScale 0.6s ease-out;
        position: relative;
        overflow: hidden;
      ">
        <div style="
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: shimmer 3s linear infinite;
          pointer-events: none;
        "></div>
        <div style="
          background: rgba(255, 255, 255, 0.95);
          border-radius: 8px;
          padding: 1.25rem;
          position: relative;
          z-index: 1;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
            color: #667eea;
            font-weight: bold;
            font-size: 0.875rem;
          ">
            <span style="font-size: 1.25rem;">🤖</span>
            <span>SIMPLIFIED BY ${providerLabel}</span>
          </div>
          <ul style="
            margin: 0;
            padding-left: 1.5rem;
            line-height: 1.8;
            list-style-type: disc;
            color: #333;
          ">
            ${result.bulletPoints.map(point => `<li style="margin-bottom: 0.5rem;">${point}</li>`).join('')}
          </ul>
          <button 
            class="restore-original-btn"
            style="
              margin-top: 1rem;
              padding: 0.5rem 1rem;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              border: none;
              color: white;
              border-radius: 6px;
              cursor: pointer;
              font-size: 0.8rem;
              font-weight: 600;
              transition: all 0.3s ease;
              box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
            "
            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.5)';"
            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(102, 126, 234, 0.3)';"
          >
            Show Original
          </button>
        </div>
      </div>
    `;
  }

  private showErrorState(element: HTMLElement): void {
    element.style.opacity = '1';
    const loader = element.querySelector('.ai-simplifier-loader');
    if (loader) loader.remove();

    const errorDiv = document.createElement('div');
    errorDiv.className = 'ai-simplifier-error';
    errorDiv.innerHTML = `
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
        <div style="font-weight: bold; color: #856404; margin-bottom: 0.5rem;">⚠️ Simplification Failed</div>
        <div style="font-size: 0.875rem; color: #856404;">Unable to simplify content. Please try again later.</div>
      </div>
    `;
    element.appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 5000);
  }

  public restoreOriginal(element: HTMLElement): void {
    const originalContent = element.getAttribute('data-original-content');
    if (originalContent) {
      element.style.opacity = '0';
      element.style.transition = 'opacity 0.3s ease';

      setTimeout(() => {
        element.innerHTML = originalContent;
        element.removeAttribute('data-simplified');
        element.removeAttribute('data-original-content');
        element.removeAttribute('data-original-length');
        setTimeout(() => { element.style.opacity = '1'; }, 50);
      }, 300);

      console.log('✅ Original content restored');
    }
  }

  public isSimplified(element: HTMLElement): boolean {
    return element.hasAttribute('data-simplified');
  }

  public clearCache(): void {
    this.simplificationCache.clear();
    console.log('🗑️ Simplification cache cleared');
  }

  public getCacheStats(): { size: number; entries: number } {
    let totalSize = 0;
    this.simplificationCache.forEach((value) => {
      totalSize += value.original.length + value.simplified.length;
    });
    return { size: totalSize, entries: this.simplificationCache.size };
  }
}

export const aiSimplifier = new AISimplifier();

export function configureAISimplifier(config: Partial<SimplifierConfig>): void {
  aiSimplifier.configure(config);
}

// Add CSS animations for simplified content
const animationStyle = document.createElement('style');
animationStyle.textContent = `
  @keyframes simplifiedPulse {
    0%, 100% {
      box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
    }
    50% {
      box-shadow: 0 12px 48px rgba(102, 126, 234, 0.5);
    }
  }

  @keyframes slideInScale {
    0% {
      opacity: 0;
      transform: scale(0.95) translateY(10px);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }

  @keyframes shimmer {
    0% {
      transform: translate(-50%, -50%) rotate(0deg);
    }
    100% {
      transform: translate(-50%, -50%) rotate(360deg);
    }
  }

  .ai-simplified-content {
    position: relative;
  }

  .ai-simplified-content::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    padding: 2px;
    background: linear-gradient(45deg, #667eea, #764ba2, #667eea);
    background-size: 200% 200%;
    animation: gradientShift 3s ease infinite;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  @keyframes gradientShift {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
`;
document.head.appendChild(animationStyle);

console.log('🤖 AI Simplifier loaded - Semantic Restructuring: Collegiate → 8th Grade');
