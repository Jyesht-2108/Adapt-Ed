/**
 * AdaptEd - Adaptive Cognitive Load Engine
 * Phase 3: DOM Mutator
 * 
 * Automatically adapts the UI in response to cognitive overload
 * by simplifying layout, reducing distractions, and highlighting focus areas
 */

import { aiSimplifier } from './simplifier';

interface MutatorState {
  isActive: boolean;
  originalStyles: Map<Element, string>;
  focusedElement: Element | null;
  resetButton: HTMLElement | null;
}

export class DOMMutator {
  private state: MutatorState = {
    isActive: false,
    originalStyles: new Map(),
    focusedElement: null,
    resetButton: null
  };

  private readonly DISTRACTION_SELECTORS = [
    // Sidebars
    'aside',
    '.sidebar',
    '.side-panel',
    '.left-sidebar',
    '.right-sidebar',
    '[class*="sidebar"]',
    '[id*="sidebar"]',
    
    // Navigation
    'nav:not(.main-nav)',
    '.navigation',
    '.navbar',
    '.menu',
    '.top-bar',
    'header nav',
    
    // Notifications & Alerts
    '.notification',
    '.notifications',
    '.notification-bell',
    '.alert-icon',
    '.badge',
    '[class*="notification"]',
    '[class*="bell"]',
    '[aria-label*="notification" i]',
    '[aria-label*="alert" i]',
    
    // Ads & Promotions
    '.ad-container',
    '.advertisement',
    '.banner-ad',
    '.promo',
    '.promotion',
    '[class*="ad-"]',
    '[id*="ad-"]',
    'iframe[src*="ads"]',
    
    // Social & Sharing
    '.social-share',
    '.share-buttons',
    '.social-icons',
    '.follow-us',
    '[class*="social"]',
    
    // Comments & Discussions
    '.comments',
    '.comment-section',
    '.discussion',
    '#comments',
    '[id*="comment"]',
    
    // Related Content
    '.related-posts',
    '.related-articles',
    '.recommended',
    '.suggestions',
    '.you-might-like',
    
    // Widgets & Extras
    '.widget',
    '.plugin',
    '.extra',
    '.footer',
    'footer',
    
    // Pop-ups & Modals
    '.popup',
    '.modal',
    '.overlay',
    '.lightbox',
    
    // Chat & Support
    '.chat-widget',
    '.support-widget',
    '.help-button',
    '[class*="chat"]',
    '[class*="support"]'
  ];

  private readonly CONTENT_SELECTORS = [
    'article',
    'main',
    '.content',
    '.post-content',
    '[role="main"]'
  ];

  constructor() {
    this.init();
  }

  /**
   * Initialize the mutator and listen for overload events
   */
  private init(): void {
    window.addEventListener('ADAPTED_OVERLOAD_TRIGGERED', (event) => {
      console.log('🎨 DOM Mutator: Overload detected, applying focus mode');
      this.applyFocusMode(event.detail);
    });

    // Listen for paragraph-specific simplification
    window.addEventListener('ADAPTED_PARAGRAPH_SIMPLIFY', (event: any) => {
      console.log('🤖 Paragraph simplification requested');
      this.simplifySpecificParagraph(event.detail.element);
    });

    // Listen for hyper-focus mode (aggressive layout muting)
    window.addEventListener('ADAPTED_HYPER_FOCUS', (event: any) => {
      console.log('🚨 Hyper-focus mode requested');
      this.applyHyperFocus(event.detail.element);
    });

    // Listen for inactivity-triggered simplification
    window.addEventListener('ADAPTED_INACTIVITY_SIMPLIFY', () => {
      console.log('⏱️ Inactivity detected - simplifying all paragraphs');
      this.simplifyAllParagraphs();
    });

    // Listen for custom reset events
    window.addEventListener('ADAPTED_RESET_REQUESTED', () => {
      this.reset();
    });
  }

  /**
   * Apply focus mode - simplify UI and reduce distractions
   */
  public applyFocusMode(detail?: any): void {
    if (this.state.isActive) {
      console.log('🎨 Focus mode already active');
      return;
    }

    console.log('🎨 Applying focus mode...');
    this.state.isActive = true;

    // Add overload class to body
    document.body.classList.add('adapted-overload');

    // Hide/fade distractions
    this.hideDistractions();

    // Enhance main content readability
    this.enhanceContent();

    // Highlight stuck paragraph if dwell time is high
    if (detail && detail.factors && detail.factors.dwellImpact > 0.5) {
      this.highlightStuckParagraph();
    }

    // AI Simplification: Simplify main content if cognitive load is critical
    if (detail && detail.score > 0.85) {
      console.log('🤖 Critical cognitive load - triggering AI simplification');
      this.simplifyMainContent();
    }

    // Show reset button
    this.showResetButton();

    // Log applied changes
    console.log('✅ Focus mode applied:', {
      distractionsHidden: this.state.originalStyles.size,
      contentEnhanced: true,
      aiSimplification: detail && detail.score > 0.85,
      resetButtonVisible: true
    });
  }

  /**
   * Hide or fade distracting elements
   * Actively fades out sidebars, hides notification bells, and removes distractions
   */
  private hideDistractions(): void {
    const selector = this.DISTRACTION_SELECTORS.join(', ');
    const distractions = document.querySelectorAll(selector);

    distractions.forEach((element) => {
      // Save original styles
      const htmlElement = element as HTMLElement;
      const originalStyle = htmlElement.getAttribute('style') || '';
      const originalDisplay = window.getComputedStyle(htmlElement).display;
      
      this.state.originalStyles.set(element, originalStyle);
      element.setAttribute('data-original-display', originalDisplay);

      // Determine if element should be completely hidden or just faded
      const shouldHideCompletely = this.shouldHideCompletely(htmlElement);

      if (shouldHideCompletely) {
        // Complete hiding with fade-out animation
        htmlElement.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        htmlElement.style.opacity = '0';
        htmlElement.style.transform = 'scale(0.95)';
        htmlElement.style.pointerEvents = 'none';
        
        // After animation, set display: none
        setTimeout(() => {
          htmlElement.style.display = 'none';
        }, 500);
        
        htmlElement.setAttribute('data-adapted-hidden', 'complete');
      } else {
        // Fade to very low opacity (sidebars, footers)
        htmlElement.style.opacity = '0.05';
        htmlElement.style.pointerEvents = 'none';
        htmlElement.style.transition = 'opacity 0.8s ease';
        htmlElement.style.filter = 'blur(2px)';
        htmlElement.setAttribute('data-adapted-hidden', 'faded');
      }
    });

    console.log(`🎨 Layout Muting: ${distractions.length} distractions removed/faded`);
  }

  /**
   * Determine if element should be completely hidden or just faded
   */
  private shouldHideCompletely(element: HTMLElement): boolean {
    const className = element.className.toLowerCase();
    const id = element.id.toLowerCase();
    
    // Complete hiding for these
    const hidePatterns = [
      'notification', 'bell', 'alert', 'badge',
      'ad', 'advertisement', 'promo',
      'popup', 'modal', 'chat', 'support',
      'social', 'share', 'comment'
    ];
    
    return hidePatterns.some(pattern => 
      className.includes(pattern) || 
      id.includes(pattern) ||
      element.getAttribute('aria-label')?.toLowerCase().includes(pattern)
    );
  }

  /**
   * Enhance main content for better readability
   * Increases line spacing and font size to force hyper-focus
   */
  private enhanceContent(): void {
    const selector = this.CONTENT_SELECTORS.join(', ');
    const contentElements = document.querySelectorAll(selector);

    if (contentElements.length === 0) {
      console.warn('⚠️ No main content elements found');
      return;
    }

    contentElements.forEach((element) => {
      const htmlElement = element as HTMLElement;
      
      // Save original styles
      if (!this.state.originalStyles.has(element)) {
        const originalStyle = htmlElement.getAttribute('style') || '';
        this.state.originalStyles.set(element, originalStyle);
      }

      // Enhance readability with increased spacing
      const currentFontSize = window.getComputedStyle(htmlElement).fontSize;
      const currentLineHeight = window.getComputedStyle(htmlElement).lineHeight;
      
      const newFontSize = parseFloat(currentFontSize) * 1.15; // 15% larger
      const newLineHeight = parseFloat(currentLineHeight) * 1.4; // 40% more spacing

      htmlElement.style.fontSize = `${newFontSize}px`;
      htmlElement.style.lineHeight = `${newLineHeight}px`;
      htmlElement.style.letterSpacing = '0.02em';
      htmlElement.style.maxWidth = '800px';
      htmlElement.style.margin = '0 auto';
      htmlElement.style.padding = '2rem';
      htmlElement.style.transition = 'all 0.5s ease';
      htmlElement.setAttribute('data-adapted-enhanced', 'true');
      
      // Enhance all paragraphs within content
      const paragraphs = htmlElement.querySelectorAll('p');
      paragraphs.forEach((p) => {
        const paragraph = p as HTMLElement;
        if (!this.state.originalStyles.has(p)) {
          const originalStyle = paragraph.getAttribute('style') || '';
          this.state.originalStyles.set(p, originalStyle);
        }
        
        paragraph.style.marginBottom = '1.5rem';
        paragraph.style.lineHeight = '2';
        paragraph.style.transition = 'all 0.5s ease';
      });
    });

    console.log(`✅ Enhanced ${contentElements.length} content elements with increased spacing`);
  }

  /**
   * Highlight the paragraph the user is stuck on
   * Uses mouse position and dwell time to identify the target
   */
  private highlightStuckParagraph(): void {
    // Find all paragraphs and divs with text content
    const textElements = document.querySelectorAll('p, div[contenteditable], .content-area p');
    
    if (textElements.length === 0) {
      console.warn('⚠️ No text elements found to highlight');
      return;
    }

    // Get mouse position (approximate - we'll use the first visible paragraph as fallback)
    let targetElement: Element | null = null;

    // Try to find element under mouse or use heuristics
    // For demo purposes, we'll highlight the first paragraph in main content
    const mainContent = document.querySelector(this.CONTENT_SELECTORS.join(', '));
    if (mainContent) {
      const paragraphs = mainContent.querySelectorAll('p');
      if (paragraphs.length > 0) {
        // Find the first paragraph with substantial text
        for (const p of Array.from(paragraphs)) {
          if (p.textContent && p.textContent.trim().length > 50) {
            targetElement = p;
            break;
          }
        }
      }
    }

    // Fallback to first paragraph
    if (!targetElement && textElements.length > 0) {
      targetElement = textElements[0];
    }

    if (targetElement) {
      this.applyFocusHighlight(targetElement);
    }
  }

  /**
   * Apply glowing border to focused element
   */
  private applyFocusHighlight(element: Element): void {
    const htmlElement = element as HTMLElement;

    // Remove previous focus if exists
    if (this.state.focusedElement) {
      (this.state.focusedElement as HTMLElement).classList.remove('adapted-focus');
    }

    // Save original styles
    if (!this.state.originalStyles.has(element)) {
      const originalStyle = htmlElement.getAttribute('style') || '';
      this.state.originalStyles.set(element, originalStyle);
    }

    // Apply focus styles
    htmlElement.classList.add('adapted-focus');
    htmlElement.style.position = 'relative';
    htmlElement.style.padding = '1.5rem';
    htmlElement.style.margin = '1rem 0';
    htmlElement.style.borderRadius = '8px';
    htmlElement.style.border = '2px solid rgba(102, 126, 234, 0.5)';
    htmlElement.style.boxShadow = '0 0 20px rgba(102, 126, 234, 0.3), inset 0 0 20px rgba(102, 126, 234, 0.1)';
    htmlElement.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    htmlElement.style.transition = 'all 0.5s ease';
    htmlElement.style.animation = 'adaptedGlow 2s ease-in-out infinite';
    htmlElement.setAttribute('data-adapted-focused', 'true');

    this.state.focusedElement = element;

    // Scroll element into view smoothly
    htmlElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

    console.log('✨ Highlighted stuck paragraph');
  }

  /**
   * Show reset button at the bottom of the page
   */
  private showResetButton(): void {
    if (this.state.resetButton) {
      this.state.resetButton.style.display = 'block';
      return;
    }

    // Create reset button
    const button = document.createElement('button');
    button.id = 'adapted-reset-button';
    button.textContent = '🔄 Exit Focus Mode';
    button.className = 'adapted-reset-button';
    
    // Style the button
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 50px;
      font-size: 1rem;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      z-index: 10000;
      transition: all 0.3s ease;
      animation: slideInUp 0.5s ease-out;
    `;

    // Add hover effect
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'translateY(-2px)';
      button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'translateY(0)';
      button.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
    });

    // Add click handler
    button.addEventListener('click', () => {
      this.reset();
    });

    document.body.appendChild(button);
    this.state.resetButton = button;

    console.log('✅ Reset button added');
  }

  /**
   * Simplify main content using AI
   * Automatically converts dense paragraphs to 8th-grade level bullet points
   */
  private async simplifyMainContent(): Promise<void> {
    const selector = this.CONTENT_SELECTORS.join(', ');
    const contentElements = document.querySelectorAll(selector);

    if (contentElements.length === 0) {
      console.warn('⚠️ No main content elements found for simplification');
      return;
    }

    console.log('🤖 Starting semantic restructuring...');

    // Find ALL substantial paragraphs (>100 chars) and simplify them
    const mainContent = contentElements[0] as HTMLElement;
    const paragraphs = mainContent.querySelectorAll('p');
    
    let simplifiedCount = 0;
    const simplificationPromises: Promise<void>[] = [];

    for (const p of Array.from(paragraphs)) {
      const text = p.textContent?.trim() || '';
      
      // Only simplify dense paragraphs (>100 chars) that aren't already simplified
      if (text.length > 100 && !aiSimplifier.isSimplified(p as HTMLElement)) {
        console.log(`🤖 Simplifying paragraph ${simplifiedCount + 1} (${text.length} chars)...`);
        
        // Simplify in parallel for better performance
        simplificationPromises.push(
          aiSimplifier.simplifyContent(p as HTMLElement)
            .then(() => {
              simplifiedCount++;
              console.log(`✅ Paragraph ${simplifiedCount} simplified`);
            })
            .catch(err => {
              console.error(`❌ Failed to simplify paragraph:`, err);
            })
        );
      }
    }

    // Wait for all simplifications to complete
    await Promise.all(simplificationPromises);

    console.log(`✅ Semantic restructuring complete: ${simplifiedCount} paragraphs simplified to 8th-grade level`);
  }

  /**
   * Simplify ALL paragraphs (triggered by inactivity)
   */
  private async simplifyAllParagraphs(): Promise<void> {
    const selector = this.CONTENT_SELECTORS.join(', ');
    const contentElements = document.querySelectorAll(selector);

    if (contentElements.length === 0) {
      console.warn('⚠️ No main content elements found');
      return;
    }

    console.log('🤖 Simplifying ALL paragraphs due to inactivity...');

    const mainContent = contentElements[0] as HTMLElement;
    const paragraphs = mainContent.querySelectorAll('p');
    
    let simplifiedCount = 0;
    const simplificationPromises: Promise<void>[] = [];

    for (const p of Array.from(paragraphs)) {
      const text = p.textContent?.trim() || '';
      
      // Simplify all paragraphs > 100 chars that aren't already simplified
      if (text.length > 100 && !aiSimplifier.isSimplified(p as HTMLElement)) {
        simplificationPromises.push(
          aiSimplifier.simplifyContent(p as HTMLElement)
            .then(() => {
              simplifiedCount++;
            })
            .catch(err => {
              console.error(`❌ Failed to simplify paragraph:`, err);
            })
        );
      }
    }

    await Promise.all(simplificationPromises);

    console.log(`✅ Inactivity simplification complete: ${simplifiedCount} paragraphs converted to bullets`);
  }


  /**
   * Reset all DOM mutations and return to normal state
   */
  public reset(): void {
    if (!this.state.isActive) {
      console.log('🎨 Focus mode not active, nothing to reset');
      return;
    }

    console.log('🔄 Resetting focus mode...');

    // Remove body class
    document.body.classList.remove('adapted-overload');
    
    // Reset body background
    document.body.style.background = '';
    document.body.style.transition = '';

    // Restore all original styles
    this.state.originalStyles.forEach((originalStyle, element) => {
      const htmlElement = element as HTMLElement;
      
      // Restore display first if it was hidden
      const originalDisplay = element.getAttribute('data-original-display');
      if (originalDisplay && htmlElement.style.display === 'none') {
        htmlElement.style.display = originalDisplay;
      }
      
      if (originalStyle) {
        htmlElement.setAttribute('style', originalStyle);
      } else {
        htmlElement.removeAttribute('style');
      }

      // Remove all data attributes
      htmlElement.removeAttribute('data-adapted-hidden');
      htmlElement.removeAttribute('data-adapted-enhanced');
      htmlElement.removeAttribute('data-adapted-focused');
      htmlElement.removeAttribute('data-adapted-hyperfocus');
      htmlElement.removeAttribute('data-original-display');
      htmlElement.classList.remove('adapted-focus');
    });

    // Clear state
    this.state.originalStyles.clear();
    this.state.focusedElement = null;

    // Hide reset button
    if (this.state.resetButton) {
      this.state.resetButton.style.animation = 'slideOutDown 0.3s ease-in';
      setTimeout(() => {
        if (this.state.resetButton) {
          this.state.resetButton.style.display = 'none';
        }
      }, 300);
    }

    this.state.isActive = false;

    console.log('✅ Focus mode reset complete');

    // Dispatch reset event
    window.dispatchEvent(new CustomEvent('ADAPTED_RESET_COMPLETE'));
  }

  /**
   * Check if focus mode is currently active
   */
  public isActive(): boolean {
    return this.state.isActive;
  }

  /**
   * Manually trigger focus mode (for testing)
   */
  public trigger(): void {
    this.applyFocusMode();
  }

  /**
   * Simplify a specific paragraph that user is struggling with
   */
  private async simplifySpecificParagraph(element: HTMLElement): Promise<void> {
    const text = element.textContent?.trim() || '';
    
    if (text.length < 100) {
      console.warn('⚠️ Paragraph too short to simplify');
      return;
    }

    if (aiSimplifier.isSimplified(element)) {
      console.log('⚠️ Paragraph already simplified');
      return;
    }

    console.log(`🤖 Simplifying specific paragraph (${text.length} chars)...`);
    
    // Highlight the paragraph being simplified
    this.applyFocusHighlight(element);
    
    // Simplify the content
    await aiSimplifier.simplifyContent(element);
    
    console.log('✅ Paragraph simplified to 8th-grade level');
  }

  /**
   * Apply hyper-focus mode - aggressive layout muting
   * Triggered when user still struggles after simplification
   * Actively fades out sidebars, hides notification bells, increases line spacing
   */
  private applyHyperFocus(element: HTMLElement): void {
    console.log('🚨 Applying hyper-focus mode - aggressive layout muting...');
    
    // PHASE 1: Hide ALL distractions completely
    const selector = this.DISTRACTION_SELECTORS.join(', ');
    const distractions = document.querySelectorAll(selector);

    let hiddenCount = 0;
    let fadedCount = 0;

    distractions.forEach((distraction) => {
      const htmlElement = distraction as HTMLElement;
      
      if (!this.state.originalStyles.has(distraction)) {
        const originalStyle = htmlElement.getAttribute('style') || '';
        this.state.originalStyles.set(distraction, originalStyle);
      }

      // Determine hiding strategy
      const shouldHideCompletely = this.shouldHideCompletely(htmlElement);

      if (shouldHideCompletely) {
        // Complete hiding with fade-out animation
        htmlElement.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        htmlElement.style.opacity = '0';
        htmlElement.style.transform = 'scale(0.8)';
        htmlElement.style.pointerEvents = 'none';
        
        setTimeout(() => {
          htmlElement.style.display = 'none';
        }, 600);
        
        htmlElement.setAttribute('data-adapted-hyperfocus', 'hidden');
        hiddenCount++;
      } else {
        // Fade to near-invisible
        htmlElement.style.opacity = '0.02';
        htmlElement.style.pointerEvents = 'none';
        htmlElement.style.transition = 'opacity 1s ease';
        htmlElement.style.filter = 'blur(4px) grayscale(100%)';
        htmlElement.setAttribute('data-adapted-hyperfocus', 'faded');
        fadedCount++;
      }
    });

    // PHASE 2: Dramatically increase line spacing in main content
    const mainContent = element.closest('article, main, .content, [role="main"]') as HTMLElement;
    if (mainContent) {
      if (!this.state.originalStyles.has(mainContent)) {
        const originalStyle = mainContent.getAttribute('style') || '';
        this.state.originalStyles.set(mainContent, originalStyle);
      }

      // Force hyper-focus with extreme spacing
      mainContent.style.lineHeight = '2.5'; // 150% increase
      mainContent.style.letterSpacing = '0.08em';
      mainContent.style.wordSpacing = '0.2em';
      mainContent.style.maxWidth = '700px';
      mainContent.style.margin = '0 auto';
      mainContent.style.padding = '3rem 2rem';
      mainContent.style.transition = 'all 0.8s ease';
      mainContent.setAttribute('data-adapted-hyperfocus', 'true');
      
      // Increase spacing for all paragraphs
      const allParagraphs = mainContent.querySelectorAll('p');
      allParagraphs.forEach((p) => {
        const paragraph = p as HTMLElement;
        if (!this.state.originalStyles.has(p)) {
          const originalStyle = paragraph.getAttribute('style') || '';
          this.state.originalStyles.set(p, originalStyle);
        }
        
        paragraph.style.marginBottom = '2.5rem';
        paragraph.style.lineHeight = '2.2';
        paragraph.style.fontSize = '1.1em';
        paragraph.style.transition = 'all 0.8s ease';
      });
    }

    // PHASE 3: Make the struggling paragraph stand out dramatically
    if (!this.state.originalStyles.has(element)) {
      const originalStyle = element.getAttribute('style') || '';
      this.state.originalStyles.set(element, originalStyle);
    }

    element.style.fontSize = '1.35em';
    element.style.lineHeight = '2.5';
    element.style.padding = '2.5rem';
    element.style.marginBottom = '3rem';
    element.style.background = 'linear-gradient(135deg, #fff9e6 0%, #ffe6f0 100%)';
    element.style.border = '3px solid #667eea';
    element.style.borderRadius = '12px';
    element.style.boxShadow = '0 0 50px rgba(102, 126, 234, 0.7), inset 0 0 30px rgba(102, 126, 234, 0.1)';
    element.style.animation = 'hyperGlow 1.5s ease-in-out infinite';
    element.style.position = 'relative';
    element.style.zIndex = '1000';
    element.style.transition = 'all 0.8s ease';
    element.setAttribute('data-adapted-hyperfocus', 'focused');

    // PHASE 4: Dim the entire page background
    document.body.style.background = 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)';
    document.body.style.transition = 'background 1s ease';

    // Scroll to center with smooth animation
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });

    console.log(`✅ Hyper-focus mode applied:`, {
      hiddenCompletely: hiddenCount,
      fadedOut: fadedCount,
      lineSpacingIncreased: '150%',
      focusedParagraph: 'highlighted'
    });
  }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes adaptedGlow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(102, 126, 234, 0.3), inset 0 0 20px rgba(102, 126, 234, 0.1);
    }
    50% {
      box-shadow: 0 0 30px rgba(102, 126, 234, 0.5), inset 0 0 30px rgba(102, 126, 234, 0.2);
    }
  }

  @keyframes hyperGlow {
    0%, 100% {
      box-shadow: 0 0 40px rgba(102, 126, 234, 0.6);
      transform: scale(1);
    }
    50% {
      box-shadow: 0 0 60px rgba(102, 126, 234, 0.9);
      transform: scale(1.02);
    }
  }

  @keyframes slideInUp {
    from {
      transform: translateY(100px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes slideOutDown {
    from {
      transform: translateY(0);
      opacity: 1;
    }
    to {
      transform: translateY(100px);
      opacity: 0;
    }
  }

  /* Focus mode body styles */
  body.adapted-overload {
    transition: background-color 0.5s ease;
  }

  /* Smooth transitions for all adapted elements */
  [data-adapted-hidden],
  [data-adapted-enhanced],
  [data-adapted-focused],
  [data-adapted-hyperfocus] {
    transition: all 0.5s ease;
  }

  /* Focus highlight styles */
  .adapted-focus {
    z-index: 100;
  }

  /* Reset button hover states */
  .adapted-reset-button:active {
    transform: translateY(0) scale(0.95) !important;
  }
`;
document.head.appendChild(style);

// Export singleton instance
export const domMutator = new DOMMutator();
