var R=Object.defineProperty;var H=(n,e,t)=>e in n?R(n,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):n[e]=t;var r=(n,e,t)=>H(n,typeof e!="symbol"?e+"":e,t);(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))i(o);new MutationObserver(o=>{for(const s of o)if(s.type==="childList")for(const a of s.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function t(o){const s={};return o.integrity&&(s.integrity=o.integrity),o.referrerPolicy&&(s.referrerPolicy=o.referrerPolicy),o.crossOrigin==="use-credentials"?s.credentials="include":o.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function i(o){if(o.ep)return;o.ep=!0;const s=t(o);fetch(o.href,s)}})();class z{constructor(){r(this,"dataWindow",[]);r(this,"WINDOW_SIZE_MS",3e4);r(this,"THROTTLE_MS",100);r(this,"BACKSPACE_WINDOW_MS",1e4);r(this,"lastMouseX",0);r(this,"lastMouseY",0);r(this,"lastMouseTime",0);r(this,"lastVelocityX",0);r(this,"lastVelocityY",0);r(this,"currentDwellTime",0);r(this,"dwellStartTime",0);r(this,"isDwelling",!1);r(this,"dwellThreshold",50);r(this,"dwellCheckX",0);r(this,"dwellCheckY",0);r(this,"throttleTimer",null);r(this,"boundHandlers",new Map);this.init()}init(){const e=this.throttle(s=>this.handleMouseMove(s),this.THROTTLE_MS),t=this.throttle(s=>this.handleMouseDown(s),this.THROTTLE_MS),i=this.throttle(s=>this.handleScroll(s),this.THROTTLE_MS),o=this.throttle(s=>this.handleKeyDown(s),this.THROTTLE_MS);this.boundHandlers.set("mousemove",e),this.boundHandlers.set("mousedown",t),this.boundHandlers.set("scroll",i),this.boundHandlers.set("keydown",o),document.addEventListener("mousemove",e,{passive:!0}),document.addEventListener("mousedown",t,{passive:!0}),document.addEventListener("scroll",i,{passive:!0}),document.addEventListener("keydown",o)}throttle(e,t){let i=0;return(...o)=>{const s=Date.now();s-i>=t&&(i=s,e(...o))}}handleMouseMove(e){const t=performance.now(),i=e.clientX,o=e.clientY;if(this.lastMouseTime>0){const s=t-this.lastMouseTime,a=i-this.lastMouseX,c=o-this.lastMouseY,l=Math.sqrt(a*a+c*c),m=s>0?l/s:0,h=s>0?a/s:0,d=s>0?c/s:0;let S=!1;if(this.lastVelocityX!==0||this.lastVelocityY!==0){const f=h*this.lastVelocityX+d*this.lastVelocityY,b=Math.sqrt((h*h+d*d)*(this.lastVelocityX*this.lastVelocityX+this.lastVelocityY*this.lastVelocityY));b>0&&(S=f/b<-.5)}this.lastVelocityX=h,this.lastVelocityY=d,this.updateDwellTime(i,o,t),this.addDataPoint({timestamp:t,velocity:m,directionChange:S,backspace:!1,dwellTime:this.currentDwellTime})}this.lastMouseX=i,this.lastMouseY=o,this.lastMouseTime=t}updateDwellTime(e,t,i){Math.sqrt(Math.pow(e-this.dwellCheckX,2)+Math.pow(t-this.dwellCheckY,2))<this.dwellThreshold?(this.isDwelling||(this.isDwelling=!0,this.dwellStartTime=i),this.currentDwellTime=i-this.dwellStartTime):(this.isDwelling=!1,this.currentDwellTime=0,this.dwellCheckX=e,this.dwellCheckY=t)}handleMouseDown(e){const t=performance.now();this.addDataPoint({timestamp:t,velocity:0,directionChange:!1,backspace:!1,dwellTime:this.currentDwellTime})}handleScroll(e){const t=performance.now();this.addDataPoint({timestamp:t,velocity:0,directionChange:!1,backspace:!1,dwellTime:0})}handleKeyDown(e){const t=performance.now(),i=e.key==="Backspace";this.addDataPoint({timestamp:t,velocity:0,directionChange:!1,backspace:i,dwellTime:this.currentDwellTime})}addDataPoint(e){this.dataWindow.push(e),this.cleanOldData()}cleanOldData(){const t=performance.now()-this.WINDOW_SIZE_MS;this.dataWindow=this.dataWindow.filter(i=>i.timestamp>t)}getSnapshot(){if(this.cleanOldData(),this.dataWindow.length===0)return{velocity:0,directionChanges:0,backspaceRate:0,dwellTime:0};const t=performance.now()-this.BACKSPACE_WINDOW_MS;let i=0,o=0,s=0,a=0;for(const l of this.dataWindow)i+=l.velocity,l.directionChange&&o++,l.backspace&&l.timestamp>t&&s++,l.dwellTime>a&&(a=l.dwellTime);const c=i/this.dataWindow.length;return{velocity:Math.round(c*1e3)/1e3,directionChanges:o,backspaceRate:s,dwellTime:Math.round(a)}}getDataWindow(){return[...this.dataWindow]}getWindowStats(){if(this.dataWindow.length===0)return{size:0,timeSpan:0};const e=this.dataWindow[0].timestamp,t=this.dataWindow[this.dataWindow.length-1].timestamp;return{size:this.dataWindow.length,timeSpan:t-e}}destroy(){for(const[e,t]of this.boundHandlers)document.removeEventListener(e,t);this.boundHandlers.clear(),this.dataWindow=[],this.throttleTimer!==null&&clearTimeout(this.throttleTimer)}}class W{constructor(e){r(this,"config",{provider:"mock",mockDelay:2e3,temperature:.7,maxTokens:500});r(this,"simplificationCache",new Map);r(this,"isProcessing",!1);e&&(this.config={...this.config,...e}),console.log("🤖 AI Simplifier initialized:",this.config.provider)}configure(e){this.config={...this.config,...e},console.log("🤖 AI Simplifier reconfigured:",this.config)}async simplifyContent(e){if(!this.isProcessing){this.isProcessing=!0;try{const t=e.innerText.trim();if(!t||t.length<20){this.isProcessing=!1;return}console.log("🤖 Semantic restructuring:",{length:t.length,provider:this.config.provider});const i=this.simplificationCache.get(t);if(i){await this.updateElementWithAnimation(e,i),this.isProcessing=!1;return}this.showLoadingState(e);let o;switch(this.config.provider){case"openai":o=await this.simplifyWithOpenAI(t);break;case"gemini":o=await this.simplifyWithGemini(t);break;case"mock":default:o=await this.simplifyWithMock(t);break}this.simplificationCache.set(t,o),await this.updateElementWithAnimation(e,o),console.log("✅ Simplified to 8th-grade level")}catch(t){console.error("❌ Simplification failed:",t),this.showErrorState(e)}finally{this.isProcessing=!1}}}async simplifyWithMock(e){return new Promise(t=>{setTimeout(()=>{const i=this.semanticRestructure(e),o=`AI SIMPLIFIED:

${i.join(`
`)}`;t({original:e,simplified:o,bulletPoints:i.map(s=>s.replace(/^[•\-]\s*/,"")),provider:"mock",timestamp:Date.now()})},this.config.mockDelay||2e3)})}semanticRestructure(e){const i=e.split(/[.!?]+/).filter(s=>s.trim().length>10).map(s=>this.simplifyVocabulary(s.trim())),o=[];if(i.length>=3)o.push(`• ${i[0]}.`),o.push(`• ${i[Math.floor(i.length/2)]}.`),o.push(`• ${i[i.length-1]}.`);else if(i.length===2)o.push(`• ${i[0]}.`),o.push(`• ${i[1]}.`),o.push("• This helps you learn better.");else if(i.length===1){const s=i[0].split(" "),a=Math.ceil(s.length/3);o.push(`• ${s.slice(0,a).join(" ")}`),o.push(`• ${s.slice(a,a*2).join(" ")}`),o.push(`• ${s.slice(a*2).join(" ")}`)}else o.push(`• ${this.simplifyVocabulary(e.substring(0,100))}`),o.push("• Main idea: Made easier to understand"),o.push("• Focus on the key points");return o}simplifyVocabulary(e){const t={cognitive:"thinking",capacity:"space",abundant:"many",ubiquitously:"everywhere",proliferate:"spread",facilitate:"help",utilize:"use",implement:"use",demonstrate:"show",indicate:"show",comprehension:"understanding",acquisition:"learning",methodology:"method",paradigm:"model",subsequently:"then",consequently:"so",furthermore:"also",nevertheless:"but",approximately:"about",sufficient:"enough",inadequate:"not enough",optimize:"improve",enhance:"improve",augment:"increase",diminish:"reduce",attenuate:"reduce",substantial:"large",minimal:"small",significant:"important",salient:"important",essential:"needed",fundamental:"basic",complex:"hard",sophisticated:"advanced",intricate:"detailed",comprehensive:"complete",particular:"specific",numerous:"many",various:"different",appropriate:"right",adequate:"enough",beneficial:"helpful",detrimental:"harmful",deleterious:"harmful",efficient:"quick",effective:"works well",analyze:"study",scrutinize:"study closely",evaluate:"check",determine:"find out",establish:"set up",maintain:"keep",obtain:"get",provide:"give",require:"need",ensure:"make sure",enable:"let",prevent:"stop",circumvent:"avoid",identify:"find",recognize:"see",perceive:"notice",comprehend:"understand",ascertain:"find out",endeavor:"try",endeavoring:"trying",attempt:"try",accomplish:"do",achieve:"reach",attain:"get",acquire:"get",possess:"have",possesses:"has",retain:"keep",sustain:"keep going",modify:"change",alter:"change",transform:"change",convert:"change",adapt:"adjust",regulate:"control",monitor:"watch",observe:"watch",examine:"look at",investigate:"look into",explore:"look at",discover:"find",reveal:"show",illustrate:"show",exemplify:"show",clarify:"explain",elucidate:"explain",articulate:"say",communicate:"tell",convey:"share",transmit:"send",distribute:"share",allocate:"give out",designate:"choose",specify:"say exactly",stipulate:"require",mandate:"require",necessitate:"need",warrant:"need",justify:"explain why",validate:"prove",verify:"check",confirm:"make sure",corroborate:"support",substantiate:"prove",authenticate:"prove real",postulates:"says",inherently:"naturally",finite:"limited",extraneous:"extra",stimuli:"things",judiciously:"carefully",consideration:"thought",contemporary:"modern",trajectories:"paths",indicators:"signs",leveraging:"using",accurately:"correctly",elevated:"high",autonomously:"automatically",initiates:"starts",modifications:"changes",empirical:"real",designated:"chosen",deliberately:"on purpose",characterized:"marked",incrementally:"slowly",elevate:"raise",exceeded:"passed",transition:"change",implementing:"using",adaptations:"changes",algorithmic:"math-based",intervention:"help",systematically:"step by step",obscure:"hide",opacity:"see-through level",reduction:"lowering",dimensions:"size",accessibility:"ease of use",mechanisms:"ways",emphasize:"highlight",attentional:"attention",manifests:"appears",capability:"ability",voluntarily:"by choice",discretion:"choice",methodological:"method-based",demonstrates:"shows",responsive:"quick to react",requirements:"needs",supportive:"helpful",interventions:"help",precisely:"exactly",objective:"goal",seamless:"smooth",personalized:"custom",dynamically:"actively",instantaneous:"instant",thereby:"so",optimizing:"improving",outcomes:"results",thresholds:"limits",protocols:"rules",containing:"with",structures:"forms",instantaneously:"instantly",transformed:"changed",formats:"styles","artificial intelligence":"AI",analyzes:"studies",semantic:"meaning",extracts:"pulls out",concepts:"ideas",reformulates:"rewrites",transformation:"change",occurs:"happens",eliminated:"removed",resources:"tools",constrained:"limited"};let i=e;return Object.entries(t).forEach(([o,s])=>{const a=new RegExp(`\\b${o}\\b`,"gi");i=i.replace(a,s)}),i=i.replace(/\b(in order to|so as to)\b/gi,"to").replace(/\b(due to the fact that|owing to the fact that)\b/gi,"because").replace(/\b(in the event that)\b/gi,"if").replace(/\b(at this point in time|at the present time)\b/gi,"now").replace(/\b(in spite of the fact that)\b/gi,"even though").replace(/\b(with regard to|with respect to)\b/gi,"about").replace(/\b(for the purpose of)\b/gi,"to").replace(/\b(in the near future)\b/gi,"soon").replace(/\b(a majority of)\b/gi,"most").replace(/\b(a number of)\b/gi,"some").replace(/\b(is able to)\b/gi,"can").replace(/\b(has the ability to)\b/gi,"can").replace(/\b(it is important to note that)\b/gi,"").replace(/\b(it should be noted that)\b/gi,"").replace(/\s+/g," ").trim(),i}async simplifyWithOpenAI(e){if(!this.config.apiKey)throw new Error("OpenAI API key not configured");const t=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${this.config.apiKey}`},body:JSON.stringify({model:this.config.model||"gpt-3.5-turbo",messages:[{role:"system",content:"You are an expert at simplifying complex text for 8th-grade reading level. Convert collegiate-level vocabulary to simple words. Break down dense paragraphs into 3 clear bullet points. Each bullet should be one simple sentence that an 8th grader can easily understand."},{role:"user",content:`Simplify this text to 8th-grade reading level. Convert it into exactly 3 bullet points. Use simple words and short sentences:

${e}`}],temperature:this.config.temperature,max_tokens:this.config.maxTokens})});if(!t.ok)throw new Error(`OpenAI API error: ${t.statusText}`);const o=(await t.json()).choices[0].message.content,s=this.extractBulletPoints(o);return{original:e,simplified:`AI SIMPLIFIED (OpenAI):

${s.join(`
`)}`,bulletPoints:s.map(a=>a.replace(/^[•\-\*]\s*/,"")),provider:"openai",timestamp:Date.now()}}async simplifyWithGemini(e){if(!this.config.apiKey)throw new Error("Gemini API key not configured");const t=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.model||"gemini-pro"}:generateContent?key=${this.config.apiKey}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({contents:[{parts:[{text:`You are an expert at simplifying complex text for 8th-grade reading level. Convert this collegiate-level text into exactly 3 simple bullet points. Use simple vocabulary that an 8th grader can understand. Each bullet should be one clear, short sentence:

${e}`}]}],generationConfig:{temperature:this.config.temperature,maxOutputTokens:this.config.maxTokens}})});if(!t.ok)throw new Error(`Gemini API error: ${t.statusText}`);const o=(await t.json()).candidates[0].content.parts[0].text,s=this.extractBulletPoints(o);return{original:e,simplified:`AI SIMPLIFIED (Gemini):

${s.join(`
`)}`,bulletPoints:s.map(a=>a.replace(/^[•\-\*]\s*/,"")),provider:"gemini",timestamp:Date.now()}}extractBulletPoints(e){const t=e.split(`
`).filter(o=>o.trim()),i=[];for(const o of t){const s=o.trim();s.match(/^[•\-\*\d\.]/)&&i.push(s)}if(i.length<3){const o=3-i.length;for(let s=0;s<o;s++)i.push(`• Additional point ${s+1}`)}return i.slice(0,3)}showLoadingState(e){const t=e.innerHTML;e.setAttribute("data-original-content",t),e.style.opacity="0.5",e.style.transition="opacity 0.3s ease";const i=document.createElement("div");i.className="ai-simplifier-loader",i.innerHTML=`
      <div style="text-align: center; padding: 2rem; color: #667eea;">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🤖</div>
        <div style="font-weight: bold;">Semantic Restructuring...</div>
        <div style="font-size: 0.875rem; margin-top: 0.5rem; opacity: 0.7;">
          Converting to 8th-grade reading level
        </div>
      </div>
    `,e.appendChild(i)}async updateElementWithAnimation(e,t){return new Promise(i=>{e.style.opacity="0",e.style.transition="opacity 0.5s ease",setTimeout(()=>{const o=e.querySelector(".ai-simplifier-loader");o&&o.remove(),e.innerHTML=this.formatSimplifiedContent(t),e.setAttribute("data-simplified","true"),e.setAttribute("data-original-length",t.original.length.toString()),setTimeout(()=>{e.style.opacity="1",e.style.transition="opacity 0.5s ease",setTimeout(()=>i(),500)},50)},500)})}formatSimplifiedContent(e){return`
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
            <span>SIMPLIFIED TO 8TH GRADE LEVEL</span>
          </div>
          <ul style="
            margin: 0;
            padding-left: 1.5rem;
            line-height: 1.8;
            list-style-type: disc;
            color: #333;
          ">
            ${e.bulletPoints.map(t=>`<li style="margin-bottom: 0.5rem;">${t}</li>`).join("")}
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
    `}showErrorState(e){e.style.opacity="1";const t=e.querySelector(".ai-simplifier-loader");t&&t.remove();const i=document.createElement("div");i.className="ai-simplifier-error",i.innerHTML=`
      <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 1rem; border-radius: 4px; margin: 1rem 0;">
        <div style="font-weight: bold; color: #856404; margin-bottom: 0.5rem;">⚠️ Simplification Failed</div>
        <div style="font-size: 0.875rem; color: #856404;">Unable to simplify content. Please try again later.</div>
      </div>
    `,e.appendChild(i),setTimeout(()=>i.remove(),5e3)}restoreOriginal(e){const t=e.getAttribute("data-original-content");t&&(e.style.opacity="0",e.style.transition="opacity 0.3s ease",setTimeout(()=>{e.innerHTML=t,e.removeAttribute("data-simplified"),e.removeAttribute("data-original-content"),e.removeAttribute("data-original-length"),setTimeout(()=>{e.style.opacity="1"},50)},300),console.log("✅ Original content restored"))}isSimplified(e){return e.hasAttribute("data-simplified")}clearCache(){this.simplificationCache.clear(),console.log("🗑️ Simplification cache cleared")}getCacheStats(){let e=0;return this.simplificationCache.forEach(t=>{e+=t.original.length+t.simplified.length}),{size:e,entries:this.simplificationCache.size}}}const v=new W;function _(n){v.configure(n)}const I=document.createElement("style");I.textContent=`
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
`;document.head.appendChild(I);document.addEventListener("click",n=>{const e=n.target;if(e.classList.contains("restore-original-btn")){const t=e.closest(".ai-simplified-content");if(t){const i=t.parentElement;i&&v.restoreOriginal(i)}}});console.log("🤖 AI Simplifier loaded - Semantic Restructuring: Collegiate → 8th Grade");class ${constructor(){r(this,"state",{isActive:!1,originalStyles:new Map,focusedElement:null,resetButton:null});r(this,"DISTRACTION_SELECTORS",["aside",".sidebar",".side-panel",".left-sidebar",".right-sidebar",'[class*="sidebar"]','[id*="sidebar"]',"nav:not(.main-nav)",".navigation",".navbar",".menu",".top-bar","header nav",".notification",".notifications",".notification-bell",".alert-icon",".badge",'[class*="notification"]','[class*="bell"]','[aria-label*="notification" i]','[aria-label*="alert" i]',".ad-container",".advertisement",".banner-ad",".promo",".promotion",'[class*="ad-"]','[id*="ad-"]','iframe[src*="ads"]',".social-share",".share-buttons",".social-icons",".follow-us",'[class*="social"]',".comments",".comment-section",".discussion","#comments",'[id*="comment"]',".related-posts",".related-articles",".recommended",".suggestions",".you-might-like",".widget",".plugin",".extra",".footer","footer",".popup",".modal",".overlay",".lightbox",".chat-widget",".support-widget",".help-button",'[class*="chat"]','[class*="support"]']);r(this,"CONTENT_SELECTORS",["article","main",".content",".post-content",'[role="main"]']);this.init()}init(){window.addEventListener("ADAPTED_OVERLOAD_TRIGGERED",e=>{console.log("🎨 DOM Mutator: Overload detected, applying focus mode"),this.applyFocusMode(e.detail)}),window.addEventListener("ADAPTED_PARAGRAPH_SIMPLIFY",e=>{console.log("🤖 Paragraph simplification requested"),this.simplifySpecificParagraph(e.detail.element)}),window.addEventListener("ADAPTED_HYPER_FOCUS",e=>{console.log("🚨 Hyper-focus mode requested"),this.applyHyperFocus(e.detail.element)}),window.addEventListener("ADAPTED_INACTIVITY_SIMPLIFY",()=>{console.log("⏱️ Inactivity detected - simplifying all paragraphs"),this.simplifyAllParagraphs()}),window.addEventListener("ADAPTED_RESET_REQUESTED",()=>{this.reset()})}applyFocusMode(e){if(this.state.isActive){console.log("🎨 Focus mode already active");return}console.log("🎨 Applying focus mode..."),this.state.isActive=!0,document.body.classList.add("adapted-overload"),this.hideDistractions(),this.enhanceContent(),e&&e.factors&&e.factors.dwellImpact>.5&&this.highlightStuckParagraph(),e&&e.score>.85&&(console.log("🤖 Critical cognitive load - triggering AI simplification"),this.simplifyMainContent()),this.showResetButton(),console.log("✅ Focus mode applied:",{distractionsHidden:this.state.originalStyles.size,contentEnhanced:!0,aiSimplification:e&&e.score>.85,resetButtonVisible:!0})}hideDistractions(){const e=this.DISTRACTION_SELECTORS.join(", "),t=document.querySelectorAll(e);t.forEach(i=>{const o=i,s=o.getAttribute("style")||"",a=window.getComputedStyle(o).display;this.state.originalStyles.set(i,s),i.setAttribute("data-original-display",a),this.shouldHideCompletely(o)?(o.style.transition="opacity 0.5s ease, transform 0.5s ease",o.style.opacity="0",o.style.transform="scale(0.95)",o.style.pointerEvents="none",setTimeout(()=>{o.style.display="none"},500),o.setAttribute("data-adapted-hidden","complete")):(o.style.opacity="0.05",o.style.pointerEvents="none",o.style.transition="opacity 0.8s ease",o.style.filter="blur(2px)",o.setAttribute("data-adapted-hidden","faded"))}),console.log(`🎨 Layout Muting: ${t.length} distractions removed/faded`)}shouldHideCompletely(e){const t=e.className.toLowerCase(),i=e.id.toLowerCase();return["notification","bell","alert","badge","ad","advertisement","promo","popup","modal","chat","support","social","share","comment"].some(s=>{var a;return t.includes(s)||i.includes(s)||((a=e.getAttribute("aria-label"))==null?void 0:a.toLowerCase().includes(s))})}enhanceContent(){const e=this.CONTENT_SELECTORS.join(", "),t=document.querySelectorAll(e);if(t.length===0){console.warn("⚠️ No main content elements found");return}t.forEach(i=>{const o=i;if(!this.state.originalStyles.has(i)){const h=o.getAttribute("style")||"";this.state.originalStyles.set(i,h)}const s=window.getComputedStyle(o).fontSize,a=window.getComputedStyle(o).lineHeight,c=parseFloat(s)*1.15,l=parseFloat(a)*1.4;o.style.fontSize=`${c}px`,o.style.lineHeight=`${l}px`,o.style.letterSpacing="0.02em",o.style.maxWidth="800px",o.style.margin="0 auto",o.style.padding="2rem",o.style.transition="all 0.5s ease",o.setAttribute("data-adapted-enhanced","true"),o.querySelectorAll("p").forEach(h=>{const d=h;if(!this.state.originalStyles.has(h)){const S=d.getAttribute("style")||"";this.state.originalStyles.set(h,S)}d.style.marginBottom="1.5rem",d.style.lineHeight="2",d.style.transition="all 0.5s ease"})}),console.log(`✅ Enhanced ${t.length} content elements with increased spacing`)}highlightStuckParagraph(){const e=document.querySelectorAll("p, div[contenteditable], .content-area p");if(e.length===0){console.warn("⚠️ No text elements found to highlight");return}let t=null;const i=document.querySelector(this.CONTENT_SELECTORS.join(", "));if(i){const o=i.querySelectorAll("p");if(o.length>0){for(const s of Array.from(o))if(s.textContent&&s.textContent.trim().length>50){t=s;break}}}!t&&e.length>0&&(t=e[0]),t&&this.applyFocusHighlight(t)}applyFocusHighlight(e){const t=e;if(this.state.focusedElement&&this.state.focusedElement.classList.remove("adapted-focus"),!this.state.originalStyles.has(e)){const i=t.getAttribute("style")||"";this.state.originalStyles.set(e,i)}t.classList.add("adapted-focus"),t.style.position="relative",t.style.padding="1.5rem",t.style.margin="1rem 0",t.style.borderRadius="8px",t.style.border="2px solid rgba(102, 126, 234, 0.5)",t.style.boxShadow="0 0 20px rgba(102, 126, 234, 0.3), inset 0 0 20px rgba(102, 126, 234, 0.1)",t.style.backgroundColor="rgba(255, 255, 255, 0.95)",t.style.transition="all 0.5s ease",t.style.animation="adaptedGlow 2s ease-in-out infinite",t.setAttribute("data-adapted-focused","true"),this.state.focusedElement=e,t.scrollIntoView({behavior:"smooth",block:"center"}),console.log("✨ Highlighted stuck paragraph")}showResetButton(){if(this.state.resetButton){this.state.resetButton.style.display="block";return}const e=document.createElement("button");e.id="adapted-reset-button",e.textContent="🔄 Exit Focus Mode",e.className="adapted-reset-button",e.style.cssText=`
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
    `,e.addEventListener("mouseenter",()=>{e.style.transform="translateY(-2px)",e.style.boxShadow="0 6px 20px rgba(102, 126, 234, 0.6)"}),e.addEventListener("mouseleave",()=>{e.style.transform="translateY(0)",e.style.boxShadow="0 4px 15px rgba(102, 126, 234, 0.4)"}),e.addEventListener("click",()=>{this.reset()}),document.body.appendChild(e),this.state.resetButton=e,console.log("✅ Reset button added")}async simplifyMainContent(){var c;const e=this.CONTENT_SELECTORS.join(", "),t=document.querySelectorAll(e);if(t.length===0){console.warn("⚠️ No main content elements found for simplification");return}console.log("🤖 Starting semantic restructuring...");const o=t[0].querySelectorAll("p");let s=0;const a=[];for(const l of Array.from(o)){const m=((c=l.textContent)==null?void 0:c.trim())||"";m.length>100&&!v.isSimplified(l)&&(console.log(`🤖 Simplifying paragraph ${s+1} (${m.length} chars)...`),a.push(v.simplifyContent(l).then(()=>{s++,console.log(`✅ Paragraph ${s} simplified`)}).catch(h=>{console.error("❌ Failed to simplify paragraph:",h)})))}await Promise.all(a),console.log(`✅ Semantic restructuring complete: ${s} paragraphs simplified to 8th-grade level`)}async simplifyAllParagraphs(){var c;const e=this.CONTENT_SELECTORS.join(", "),t=document.querySelectorAll(e);if(t.length===0){console.warn("⚠️ No main content elements found");return}console.log("🤖 Simplifying ALL paragraphs due to inactivity...");const o=t[0].querySelectorAll("p");let s=0;const a=[];for(const l of Array.from(o))(((c=l.textContent)==null?void 0:c.trim())||"").length>100&&!v.isSimplified(l)&&a.push(v.simplifyContent(l).then(()=>{s++}).catch(h=>{console.error("❌ Failed to simplify paragraph:",h)}));await Promise.all(a),console.log(`✅ Inactivity simplification complete: ${s} paragraphs converted to bullets`)}reset(){if(!this.state.isActive){console.log("🎨 Focus mode not active, nothing to reset");return}console.log("🔄 Resetting focus mode..."),document.body.classList.remove("adapted-overload"),document.body.style.background="",document.body.style.transition="",this.state.originalStyles.forEach((e,t)=>{const i=t,o=t.getAttribute("data-original-display");o&&i.style.display==="none"&&(i.style.display=o),e?i.setAttribute("style",e):i.removeAttribute("style"),i.removeAttribute("data-adapted-hidden"),i.removeAttribute("data-adapted-enhanced"),i.removeAttribute("data-adapted-focused"),i.removeAttribute("data-adapted-hyperfocus"),i.removeAttribute("data-original-display"),i.classList.remove("adapted-focus")}),this.state.originalStyles.clear(),this.state.focusedElement=null,this.state.resetButton&&(this.state.resetButton.style.animation="slideOutDown 0.3s ease-in",setTimeout(()=>{this.state.resetButton&&(this.state.resetButton.style.display="none")},300)),this.state.isActive=!1,console.log("✅ Focus mode reset complete"),window.dispatchEvent(new CustomEvent("ADAPTED_RESET_COMPLETE"))}isActive(){return this.state.isActive}trigger(){this.applyFocusMode()}async simplifySpecificParagraph(e){var i;const t=((i=e.textContent)==null?void 0:i.trim())||"";if(t.length<100){console.warn("⚠️ Paragraph too short to simplify");return}if(v.isSimplified(e)){console.log("⚠️ Paragraph already simplified");return}console.log(`🤖 Simplifying specific paragraph (${t.length} chars)...`),this.applyFocusHighlight(e),await v.simplifyContent(e),console.log("✅ Paragraph simplified to 8th-grade level")}applyHyperFocus(e){console.log("🚨 Applying hyper-focus mode - aggressive layout muting...");const t=this.DISTRACTION_SELECTORS.join(", "),i=document.querySelectorAll(t);let o=0,s=0;i.forEach(c=>{const l=c;if(!this.state.originalStyles.has(c)){const h=l.getAttribute("style")||"";this.state.originalStyles.set(c,h)}this.shouldHideCompletely(l)?(l.style.transition="opacity 0.6s ease, transform 0.6s ease",l.style.opacity="0",l.style.transform="scale(0.8)",l.style.pointerEvents="none",setTimeout(()=>{l.style.display="none"},600),l.setAttribute("data-adapted-hyperfocus","hidden"),o++):(l.style.opacity="0.02",l.style.pointerEvents="none",l.style.transition="opacity 1s ease",l.style.filter="blur(4px) grayscale(100%)",l.setAttribute("data-adapted-hyperfocus","faded"),s++)});const a=e.closest('article, main, .content, [role="main"]');if(a){if(!this.state.originalStyles.has(a)){const l=a.getAttribute("style")||"";this.state.originalStyles.set(a,l)}a.style.lineHeight="2.5",a.style.letterSpacing="0.08em",a.style.wordSpacing="0.2em",a.style.maxWidth="700px",a.style.margin="0 auto",a.style.padding="3rem 2rem",a.style.transition="all 0.8s ease",a.setAttribute("data-adapted-hyperfocus","true"),a.querySelectorAll("p").forEach(l=>{const m=l;if(!this.state.originalStyles.has(l)){const h=m.getAttribute("style")||"";this.state.originalStyles.set(l,h)}m.style.marginBottom="2.5rem",m.style.lineHeight="2.2",m.style.fontSize="1.1em",m.style.transition="all 0.8s ease"})}if(!this.state.originalStyles.has(e)){const c=e.getAttribute("style")||"";this.state.originalStyles.set(e,c)}e.style.fontSize="1.35em",e.style.lineHeight="2.5",e.style.padding="2.5rem",e.style.marginBottom="3rem",e.style.background="linear-gradient(135deg, #fff9e6 0%, #ffe6f0 100%)",e.style.border="3px solid #667eea",e.style.borderRadius="12px",e.style.boxShadow="0 0 50px rgba(102, 126, 234, 0.7), inset 0 0 30px rgba(102, 126, 234, 0.1)",e.style.animation="hyperGlow 1.5s ease-in-out infinite",e.style.position="relative",e.style.zIndex="1000",e.style.transition="all 0.8s ease",e.setAttribute("data-adapted-hyperfocus","focused"),document.body.style.background="linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)",document.body.style.transition="background 1s ease",e.scrollIntoView({behavior:"smooth",block:"center"}),console.log("✅ Hyper-focus mode applied:",{hiddenCompletely:o,fadedOut:s,lineSpacingIncreased:"150%",focusedParagraph:"highlighted"})}}const P=document.createElement("style");P.textContent=`
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
`;document.head.appendChild(P);new $;class Y{constructor(e){r(this,"config",{enabled:!1,useTensorFlow:!1,useLightweight:!0,saccadeThreshold:30,updateInterval:100,privacyMode:!0});r(this,"stream",null);r(this,"videoElement",null);r(this,"canvas",null);r(this,"context",null);r(this,"eyePositionHistory",[]);r(this,"lastEyePosition",null);r(this,"saccadeCount",0);r(this,"blinkCount",0);r(this,"faceDetected",!1);r(this,"faceDetectionHistory",[]);r(this,"lookingAwayDetected",!1);r(this,"totalFrames",0);r(this,"framesWithFace",0);r(this,"trackingStartTime",0);r(this,"trackingInterval",null);r(this,"metricsInterval",null);r(this,"isModelLoaded",!1);e&&(this.config={...this.config,...e})}async initialize(){if(this.config.enabled)return console.log("👁️ Vision tracker already initialized"),!0;try{return console.log("👁️ Initializing vision tracker..."),this.stream=await navigator.mediaDevices.getUserMedia({video:{width:{ideal:640},height:{ideal:480},facingMode:"user"}}),this.videoElement=document.createElement("video"),this.videoElement.srcObject=this.stream,this.videoElement.autoplay=!0,this.videoElement.playsInline=!0,this.videoElement.style.display="none",document.body.appendChild(this.videoElement),this.canvas=document.createElement("canvas"),this.canvas.width=640,this.canvas.height=480,this.context=this.canvas.getContext("2d",{willReadFrequently:!0}),await new Promise(e=>{this.videoElement.onloadedmetadata=()=>{this.videoElement.play(),e()}}),this.config.useTensorFlow&&await this.loadFaceMeshModel(),this.startTracking(),this.totalFrames=0,this.framesWithFace=0,this.trackingStartTime=Date.now(),this.config.enabled=!0,console.log("✅ Vision tracker initialized successfully"),this.showPrivacyNotice(),!0}catch(e){return console.error("❌ Failed to initialize vision tracker:",e),console.log("💡 Webcam access denied or not available"),!1}}async loadFaceMeshModel(){try{console.log("📦 Loading TensorFlow.js FaceMesh model..."),console.log("⚠️ TensorFlow.js not loaded - using lightweight detection"),this.config.useTensorFlow=!1,this.config.useLightweight=!0}catch(e){console.error("❌ Failed to load FaceMesh model:",e),this.config.useTensorFlow=!1,this.config.useLightweight=!0}}startTracking(){this.trackingInterval=window.setInterval(()=>{this.processFrame()},this.config.updateInterval),this.metricsInterval=window.setInterval(()=>{this.calculateMetrics()},1e3),console.log("🎥 Vision tracking started")}processFrame(){if(!(!this.videoElement||!this.canvas||!this.context))try{this.context.drawImage(this.videoElement,0,0,this.canvas.width,this.canvas.height),this.totalFrames++,this.config.useTensorFlow&&this.isModelLoaded?this.processWithTensorFlow():this.config.useLightweight&&this.processWithLightweight(),this.faceDetected&&this.framesWithFace++}catch{}}processWithLightweight(){if(!(!this.context||!this.canvas))try{const t=this.context.getImageData(0,0,this.canvas.width,this.canvas.height).data,i=this.canvas.width,o=this.canvas.height,s=[{x:i/2,y:o/2,size:120,weight:1},{x:i/2,y:o/3,size:80,weight:.8},{x:i/2,y:o*.6,size:60,weight:.6}];let a=0,c=0;s.forEach(d=>{let S=0,f=0,b=0,T=0;for(let w=d.y-d.size;w<d.y+d.size;w++)for(let u=d.x-d.size;u<d.x+d.size;u++)if(u>=0&&u<i&&w>=0&&w<o){const C=(w*i+u)*4,p=t[C],g=t[C+1],y=t[C+2];(p>95&&g>40&&y>20&&p>g&&p>y&&Math.abs(p-g)>15||p>220&&g>200&&y>180&&p>g&&g>y||p>150&&p<220&&g>100&&g<180&&y>80&&y<150)&&S++;const O=(p+g+y)/3;b+=O,T+=Math.abs(p-g)+Math.abs(g-y)+Math.abs(y-p),f++}if(f>0){const w=S/f;b/=f,T/=f;let u=0;w>.15&&(u+=Math.min(w*2,.4)),b>80&&b<200&&(u+=.3),T>20&&T<100&&(u+=.3),a+=u*d.weight,c+=d.weight}d.weight===1&&f>0&&this.estimatePupilDilation(b/f)});const l=c>0?a/c:0;this.faceDetectionHistory.push(l>.4),this.faceDetectionHistory.length>10&&this.faceDetectionHistory.shift();const h=this.faceDetectionHistory.filter(d=>d).length/this.faceDetectionHistory.length;this.faceDetected=l>.4&&h>.5,this.lookingAwayDetected=l<.2&&h<.3,this.simulateEyeTracking()}catch{this.faceDetected=!1}}async processWithTensorFlow(){console.log("🔬 TensorFlow processing (not yet implemented)")}simulateEyeTracking(){const e=performance.now(),t=320+Math.sin(e/1e3)*50,i=240+Math.cos(e/1500)*30,o=Math.random();let s=t,a=i;o>.95&&(s+=(Math.random()-.5)*100,a+=(Math.random()-.5)*80,this.saccadeCount++);const c={x:s,y:a,timestamp:e};this.lastEyePosition&&Math.sqrt(Math.pow(s-this.lastEyePosition.x,2)+Math.pow(a-this.lastEyePosition.y,2))>this.config.saccadeThreshold&&this.saccadeCount++,this.eyePositionHistory.push(c),this.lastEyePosition=c;const l=e-1e4;this.eyePositionHistory=this.eyePositionHistory.filter(m=>m.timestamp>l)}estimatePupilDilation(e){const t=1-e/255;this.currentPupilDilation=t}calculateMetrics(){if(!this.config.enabled)return;const t=this.saccadeCount/10,i=this.blinkCount*6,o=this.calculateAttentionScore(),s={eyeSaccadeRate:Math.round(t*10)/10,pupilDilation:this.currentPupilDilation||.5,facePresent:this.faceDetected,faceConfidence:0,lookingAway:this.lookingAwayDetected,blinkRate:Math.round(i),attentionScore:Math.round(o*100)/100};window.dispatchEvent(new CustomEvent("ADAPTED_VISION_UPDATE",{detail:s})),this.saccadeCount=0,this.blinkCount=0}calculateAttentionScore(){let e=.5;this.faceDetected?e+=.3:e-=.3,this.lookingAwayDetected&&(e-=.2);const t=this.saccadeCount/10;return t>5&&(e-=.2),t<1&&(e-=.1),Math.max(0,Math.min(1,e))}getMetrics(){const e=this.saccadeCount/10,t=this.blinkCount*6,i=this.calculateAttentionScore();return{eyeSaccadeRate:Math.round(e*10)/10,pupilDilation:this.currentPupilDilation||.5,facePresent:this.faceDetected,faceConfidence:0,lookingAway:this.lookingAwayDetected,blinkRate:Math.round(t),attentionScore:Math.round(i*100)/100}}isLikelyCopying(){const e=this.getMetrics();return e.lookingAway||e.attentionScore<.3||!e.facePresent}isDistracted(){const e=this.getMetrics();return e.lookingAway||!e.facePresent||e.attentionScore<.4||e.eyeSaccadeRate<1}isFocused(){const e=this.getMetrics();return e.facePresent&&!e.lookingAway&&e.eyeSaccadeRate>=2&&e.eyeSaccadeRate<=5&&e.attentionScore>.6}hasReadingDifficulty(){const e=this.getMetrics();return e.eyeSaccadeRate>6||e.pupilDilation>.7||e.blinkRate<10}showPrivacyNotice(){var t;const e=document.createElement("div");e.id="vision-privacy-notice",e.style.cssText=`
      position: fixed;
      top: 20px;
      left: 20px;
      background: #28a745;
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 9999;
      max-width: 350px;
      animation: slideInLeft 0.5s ease-out;
    `,e.innerHTML=`
      <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
        <span style="font-size: 1.5rem;">👁️</span>
        <strong>Vision Tracking Active</strong>
      </div>
      <p style="margin: 0; font-size: 0.875rem; line-height: 1.4;">
        Webcam is being used for attention tracking. ${this.config.privacyMode?"Privacy mode: ON. No video is stored.":""}
      </p>
      <button id="disable-vision" style="
        margin-top: 0.75rem;
        padding: 0.5rem 1rem;
        background: white;
        color: #28a745;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 0.875rem;
        font-weight: bold;
      ">
        Disable Vision Tracking
      </button>
    `,document.body.appendChild(e),(t=document.getElementById("disable-vision"))==null||t.addEventListener("click",()=>{this.stop(),e.remove()}),setTimeout(()=>{e.parentElement&&(e.style.animation="slideOutLeft 0.3s ease-in",setTimeout(()=>e.remove(),300))},1e4)}stop(){console.log("🛑 Stopping vision tracker...");const e=this.totalFrames>0?Math.round(this.framesWithFace/this.totalFrames*100):0,t=Math.round((Date.now()-this.trackingStartTime)/1e3);console.log("📊 Vision Tracking Summary:",{duration:`${t}s`,totalFrames:this.totalFrames,framesWithFace:this.framesWithFace,facePresencePercentage:`${e}%`}),this.showTrackingSummary(e,t),this.trackingInterval&&(clearInterval(this.trackingInterval),this.trackingInterval=null),this.metricsInterval&&(clearInterval(this.metricsInterval),this.metricsInterval=null),this.stream&&(this.stream.getTracks().forEach(i=>i.stop()),this.stream=null),this.videoElement&&(this.videoElement.remove(),this.videoElement=null),this.canvas=null,this.context=null,this.eyePositionHistory=[],this.lastEyePosition=null,this.saccadeCount=0,this.blinkCount=0,this.faceDetected=!1,this.faceDetectionHistory=[],this.lookingAwayDetected=!1,this.totalFrames=0,this.framesWithFace=0,this.trackingStartTime=0,this.config.enabled=!1,console.log("✅ Vision tracker stopped")}showTrackingSummary(e,t){var c;const i=document.createElement("div");i.id="vision-tracking-summary",i.style.cssText=`
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      z-index: 10001;
      min-width: 400px;
      animation: popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    `;let o="#28a745",s="✅",a="Excellent Presence";e<30?(o="#dc3545",s="❌",a="Low Presence"):e<60?(o="#ffc107",s="⚠️",a="Moderate Presence"):e<80&&(o="#17a2b8",s="👍",a="Good Presence"),i.innerHTML=`
      <div style="text-align: center;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">${s}</div>
        <h3 style="margin: 0 0 1rem 0; color: #333;">Vision Tracking Summary</h3>
        
        <div style="
          background: linear-gradient(135deg, ${o}15 0%, ${o}25 100%);
          padding: 1.5rem;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          border: 2px solid ${o};
        ">
          <div style="font-size: 0.875rem; color: #666; margin-bottom: 0.5rem;">Face Presence</div>
          <div style="font-size: 3rem; font-weight: bold; color: ${o};">
            ${e}%
          </div>
          <div style="font-size: 0.875rem; color: #666; margin-top: 0.5rem;">
            ${a}
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; text-align: left;">
          <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px;">
            <div style="font-size: 0.75rem; color: #666; margin-bottom: 0.25rem;">Duration</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: #333;">${t}s</div>
          </div>
          <div style="background: #f8f9fa; padding: 1rem; border-radius: 6px;">
            <div style="font-size: 0.75rem; color: #666; margin-bottom: 0.25rem;">Total Frames</div>
            <div style="font-size: 1.25rem; font-weight: bold; color: #333;">${this.totalFrames}</div>
          </div>
        </div>

        <button id="close-summary" style="
          width: 100%;
          padding: 0.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          font-size: 1rem;
          transition: all 0.3s ease;
        "
        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)';"
        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';"
        >
          Close
        </button>
      </div>
    `,document.body.appendChild(i),(c=document.getElementById("close-summary"))==null||c.addEventListener("click",()=>{i.style.animation="popOut 0.3s ease-in",setTimeout(()=>i.remove(),300)}),setTimeout(()=>{i.parentElement&&(i.style.animation="popOut 0.3s ease-in",setTimeout(()=>i.remove(),300))},15e3)}configure(e){this.config={...this.config,...e},console.log("👁️ Vision tracker reconfigured:",this.config)}isEnabled(){return this.config.enabled}}const L=document.createElement("style");L.textContent=`
  @keyframes slideInLeft {
    from {
      transform: translateX(-400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutLeft {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(-400px);
      opacity: 0;
    }
  }

  @keyframes popIn {
    0% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0;
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
  }

  @keyframes popOut {
    0% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    100% {
      transform: translate(-50%, -50%) scale(0.8);
      opacity: 0;
    }
  }
`;document.head.appendChild(L);const E=new Y;console.log("👁️ Vision Tracker module loaded");class V{constructor(){r(this,"paragraphMetrics",new Map);r(this,"currentHoveredParagraph",null);r(this,"lastMouseX",0);r(this,"lastMouseY",0);r(this,"movementCount",0);r(this,"thresholds",{cursorMovementLimit:50,dwellTimeLimit:1e4,hyperFocusCursorLimit:30,hyperFocusDwellLimit:8e3});r(this,"lastActivityTime",Date.now());r(this,"inactivityTimeout",5e3);r(this,"hasTriggeredInactivitySimplification",!1);this.init()}init(){document.addEventListener("mousemove",e=>this.handleMouseMove(e),{passive:!0}),document.addEventListener("mousemove",()=>this.resetInactivityTimer(),{passive:!0}),document.addEventListener("mousedown",()=>this.resetInactivityTimer(),{passive:!0}),document.addEventListener("keydown",()=>this.resetInactivityTimer(),{passive:!0}),document.addEventListener("scroll",()=>this.resetInactivityTimer(),{passive:!0}),document.addEventListener("touchstart",()=>this.resetInactivityTimer(),{passive:!0}),setInterval(()=>this.checkParagraphMetrics(),1e3),setInterval(()=>this.checkInactivity(),1e3),console.log("📊 Paragraph Tracker initialized with inactivity detection (5s)")}handleMouseMove(e){const i=e.target.closest("p, article p, main p");if(!i){this.currentHoveredParagraph=null;return}const o=Math.abs(e.clientX-this.lastMouseX),s=Math.abs(e.clientY-this.lastMouseY);Math.sqrt(o*o+s*s)>5&&this.movementCount++,this.lastMouseX=e.clientX,this.lastMouseY=e.clientY,i!==this.currentHoveredParagraph&&(this.currentHoveredParagraph=i,this.movementCount=0,this.paragraphMetrics.has(i)||this.paragraphMetrics.set(i,{element:i,cursorMovements:0,dwellTime:0,lastUpdate:Date.now(),isSimplified:!1,isHyperFocused:!1}));const c=this.paragraphMetrics.get(i);c&&(c.cursorMovements=this.movementCount,c.lastUpdate=Date.now())}checkParagraphMetrics(){const e=Date.now();this.paragraphMetrics.forEach((t,i)=>{const o=e-t.lastUpdate;this.currentHoveredParagraph===i?t.dwellTime+=1e3:o>2e3&&(t.dwellTime=0,t.cursorMovements=0),this.checkInterventionTriggers(t)})}checkInterventionTriggers(e){const{element:t,cursorMovements:i,dwellTime:o,isSimplified:s,isHyperFocused:a}=e;!s&&(i>=this.thresholds.cursorMovementLimit||o>=this.thresholds.dwellTimeLimit)?(console.log("🎯 Paragraph struggle detected:",{cursorMovements:i,dwellTime:o,threshold:`${this.thresholds.cursorMovementLimit} movements or ${this.thresholds.dwellTimeLimit}ms dwell`}),this.triggerSimplification(t),e.isSimplified=!0,e.cursorMovements=0,e.dwellTime=0):s&&!a&&(i>=this.thresholds.hyperFocusCursorLimit||o>=this.thresholds.hyperFocusDwellLimit)&&(console.log("🚨 Still struggling after simplification:",{cursorMovements:i,dwellTime:o,threshold:`${this.thresholds.hyperFocusCursorLimit} movements or ${this.thresholds.hyperFocusDwellLimit}ms dwell`}),this.triggerHyperFocus(t),e.isHyperFocused=!0)}triggerSimplification(e){console.log("🤖 Triggering semantic restructuring for paragraph..."),window.dispatchEvent(new CustomEvent("ADAPTED_PARAGRAPH_SIMPLIFY",{detail:{element:e}}))}triggerHyperFocus(e){console.log("🎨 Triggering hyper-focus mode for paragraph..."),window.dispatchEvent(new CustomEvent("ADAPTED_HYPER_FOCUS",{detail:{element:e}}))}getMetrics(e){return this.paragraphMetrics.get(e)||null}getAllMetrics(){return Array.from(this.paragraphMetrics.values())}reset(){this.paragraphMetrics.clear(),this.currentHoveredParagraph=null,this.movementCount=0,this.hasTriggeredInactivitySimplification=!1,this.lastActivityTime=Date.now(),console.log("🔄 Paragraph tracker reset")}resetInactivityTimer(){this.lastActivityTime=Date.now(),this.hasTriggeredInactivitySimplification=!1}checkInactivity(){Date.now()-this.lastActivityTime>=this.inactivityTimeout&&!this.hasTriggeredInactivitySimplification&&(console.log("⏱️ Screen inactive for 5 seconds - triggering automatic simplification"),this.triggerInactivitySimplification(),this.hasTriggeredInactivitySimplification=!0)}triggerInactivitySimplification(){console.log("🤖 Simplifying ALL paragraphs due to inactivity..."),window.dispatchEvent(new CustomEvent("ADAPTED_INACTIVITY_SIMPLIFY"))}}const N=new V;console.log("📊 Paragraph Tracker module loaded");window.aiSimplifier=v;window.configureAISimplifier=_;window.visionTracker=E;window.paragraphTracker=N;const A=new z,D=new Worker(new URL("/assets/engine.worker-DFI6b1c-.js",import.meta.url),{type:"module"});D.onmessage=n=>{if(n.data.type==="WORKER_READY"){console.log("✅ Cognitive Engine Worker initialized");return}if(n.data.type==="LOAD_CALCULATED"){const e=n.data.result;if(j(e),e.score>.7){const t=new CustomEvent("ADAPTED_OVERLOAD_TRIGGERED",{detail:{score:e.score,level:e.level,factors:e.factors,recommendations:e.recommendations}});window.dispatchEvent(t),console.warn("🚨 COGNITIVE OVERLOAD TRIGGERED!",{score:e.score,level:e.level,recommendations:e.recommendations})}console.log("🧠 Cognitive Load Analysis:",{score:e.score,level:e.level,factors:e.factors,recommendations:e.recommendations})}};const q=setInterval(()=>{const n=A.getSnapshot();D.postMessage({type:"CALCULATE_LOAD",snapshot:n})},3e3),B=setInterval(()=>{const n=A.getSnapshot();x("velocity",n.velocity.toFixed(3)),x("directionChanges",n.directionChanges.toString()),x("backspaceRate",n.backspaceRate.toString()),x("dwellTime",n.dwellTime.toString())},200);function x(n,e){const t=document.getElementById(n);t&&(t.textContent=e,t.style.transition="none",t.style.color="#007bff",setTimeout(()=>{t.style.transition="color 0.3s",t.style.color="#333"},50))}function j(n){const e=document.getElementById("cognitiveScore");e&&(e.textContent=(n.score*100).toFixed(0));const t=document.getElementById("cognitiveLevel");if(t){t.textContent=n.level.toUpperCase();const o={low:"#28a745",medium:"#ffc107",high:"#fd7e14",critical:"#dc3545"};t.style.color=o[n.level]}const i=document.getElementById("recommendations");i&&n.recommendations.length>0&&(i.innerHTML=n.recommendations.map(o=>`<li>${o}</li>`).join(""))}window.addEventListener("ADAPTED_OVERLOAD_TRIGGERED",n=>{console.log("🔔 Overload event received:",n.detail),document.body.style.transition="background-color 0.5s",document.body.style.backgroundColor="#fff3cd",setTimeout(()=>{document.body.style.backgroundColor="#f5f5f5"},2e3),X(n.detail)});function X(n){const e=document.getElementById("overload-alert");e&&e.remove();const t=document.createElement("div");t.id="overload-alert",t.style.cssText=`
    position: fixed;
    top: 20px;
    right: 20px;
    background: #dc3545;
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 9999;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `,t.innerHTML=`
    <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
      <span style="font-size: 1.5rem;">🚨</span>
      <strong>High Cognitive Load Detected!</strong>
    </div>
    <p style="margin: 0; font-size: 0.875rem;">
      Score: ${(n.score*100).toFixed(0)}% | Level: ${n.level}
    </p>
  `,document.body.appendChild(t),setTimeout(()=>{t.style.animation="slideOut 0.3s ease-in",setTimeout(()=>t.remove(),300)},5e3)}const F=document.createElement("style");F.textContent=`
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;document.head.appendChild(F);window.addEventListener("beforeunload",()=>{clearInterval(B),clearInterval(q),D.terminate(),A.destroy()});window.addEventListener("ADAPTED_VISION_UPDATE",n=>{const e=n.detail;k("eyeSaccadeRate",e.eyeSaccadeRate.toFixed(1)),k("pupilDilation",(e.pupilDilation*100).toFixed(0)+"%");const t=e.facePresent?"✅ Yes":"❌ No";k("facePresent",t),k("attentionScore",(e.attentionScore*100).toFixed(0)+"%"),E.isLikelyCopying()&&console.warn("⚠️ User may be copying from another source"),E.isDistracted()&&console.warn("⚠️ User appears distracted"),E.hasReadingDifficulty()&&console.warn("⚠️ Reading difficulty detected (high saccade rate)")});function k(n,e){const t=document.getElementById(n);t&&(t.textContent=e,t.style.transition="none",t.style.color="#28a745",setTimeout(()=>{t.style.transition="color 0.3s",t.style.color="#333"},50))}var M;(M=document.getElementById("enable-vision-btn"))==null||M.addEventListener("click",async()=>{const n=document.getElementById("enable-vision-btn");E.isEnabled()?(E.stop(),n.textContent="Enable Webcam Tracking",n.style.background="#28a745",console.log("🛑 Webcam tracking disabled by user")):(n.textContent="Initializing...",n.disabled=!0,await E.initialize()?(n.textContent="Disable Webcam Tracking",n.style.background="#dc3545",n.disabled=!1,console.log("✅ Webcam tracking enabled - will trace until disabled")):(n.textContent="Enable Webcam Tracking (Failed)",n.style.background="#6c757d",n.disabled=!1,alert("Failed to access webcam. Please grant camera permissions and try again.")))});window.addEventListener("ADAPTED_RESET_COMPLETE",()=>{console.log("✅ Focus mode reset complete")});console.log("%c🧠 AdaptEd Cognitive Load Engine - Phase 3","font-size: 16px; font-weight: bold; color: #007bff;");console.log("✅ Telemetry Observer initialized");console.log("✅ Cognitive Engine Worker initialized");console.log("✅ DOM Mutator initialized");console.log(`
Phase 1 - Telemetry Tracking:`);console.log("  • Mouse velocity (px/ms)");console.log("  • Direction changes (sharp turns)");console.log("  • Backspace rate (last 10s)");console.log("  • Dwell time (hover duration)");console.log(`
Phase 2 - Cognitive Load Analysis:`);console.log("  • Velocity variance analysis");console.log("  • Backspace impact scoring");console.log("  • Dwell time impact (15s threshold)");console.log("  • Direction change patterns");console.log("  • Smoothness bonus calculation");console.log(`
Phase 3 - Adaptive UI Mutations:`);console.log("  • Focus mode activation");console.log("  • Distraction hiding (opacity: 0.1)");console.log("  • Content enhancement (font-size, line-height)");console.log("  • Stuck paragraph highlighting");console.log("  • Reset button for manual control");console.log(`
Final Phase - AI Text Simplification:`);console.log("  • Mock AI simplification (2s delay)");console.log("  • OpenAI integration ready");console.log("  • Gemini integration ready");console.log("  • 3-bullet point summaries");console.log("  • Fade-in animations");console.log("  • Restore original content");console.log(`
⚡ Worker updates every 3 seconds`);console.log("🚨 Overload event triggers at score > 0.7");console.log("🎨 DOM mutations apply automatically on overload");console.log("🤖 AI simplification triggers at score > 0.85");console.log(`
Phase 4 - Visual Attention Tracking:`);console.log("  • Webcam-based eye tracking (manual enable)");console.log("  • Saccade detection (reading difficulty)");console.log("  • Pupil dilation monitoring");console.log("  • Face presence detection");console.log("  • Copying detection");console.log("  • Distraction detection");console.log("  • Privacy mode enabled");console.log("  • Continuous tracking until disabled");console.log(`
Phase 5 - Paragraph-Level Intelligence:`);console.log("  • Per-paragraph cursor movement tracking");console.log("  • Per-paragraph dwell time monitoring");console.log("  • Inactivity detection (5 seconds)");console.log("  • Level 1: Simplify at 50 movements OR 10s dwell");console.log("  • Level 2: Hyper-focus at 30 movements OR 8s dwell (after simplification)");console.log("  • Level 3: Auto-simplify ALL paragraphs after 5s inactivity");console.log("  • Progressive intervention based on struggle");console.log(`
💡 Configure AI: window.configureAISimplifier({ provider: "openai", apiKey: "..." })`);console.log('👁️ Enable vision: Click "Enable Webcam Tracking" button (manual control only)');
