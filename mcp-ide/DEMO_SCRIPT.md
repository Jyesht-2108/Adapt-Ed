# MCP-IDE Demo Script

## 🎬 5-Minute Demo for Judges/Stakeholders

### Pre-Demo Checklist
- [ ] Ollama is running (`ollama list`)
- [ ] Backend is started (http://localhost:8000)
- [ ] Frontend is started (http://localhost:5174)
- [ ] Browser is open to http://localhost:5174
- [ ] DevTools are closed (for clean demo)
- [ ] Screen recording is ready (optional)

---

## Act 1: The Problem (30 seconds)

**Say:**
> "Traditional coding platforms give students generic help. They don't understand what the student is actually working on, where they are in the code, or what errors they're seeing. This leads to shallow learning."

**Show:**
- Point to a generic chatbot or Stack Overflow
- Emphasize the disconnect between code and help

---

## Act 2: The Solution (1 minute)

**Say:**
> "We built MCP-IDE - a Context-Aware AI Coding Tutor. It's like having Cursor IDE's intelligence, but designed for education."

**Show:**
- Open http://localhost:5174
- Point out the split-screen layout:
  - Left: AI Tutor Chat (30%)
  - Right: Monaco Editor (70%)

**Highlight:**
- "This is Monaco Editor - the same editor that powers VS Code"
- "And this is our Shadow Tutor - it sees everything you're doing"

---

## Act 3: Context Awareness (1.5 minutes)

**Say:**
> "Let me show you how it understands context."

**Do:**
1. **Type this code in the editor:**
```javascript
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return total;
}
```

2. **Click on line 3** (the for loop)

**Point out:**
- "See the cursor position updating in the header? Line 3, Column 5"
- "The AI knows exactly where I am in the code"

3. **Select the for loop** (lines 3-5)

**Say:**
> "Now I've selected the loop. The AI knows what I'm focused on."

4. **Type in chat:**
```
"Why do we use i < items.length instead of i <= items.length?"
```

**Wait for response** (2-5 seconds)

**Expected Response:**
> "Great question! Think about array indexing. If an array has 5 items, what are the valid index positions? What happens if you try to access items[5]?"

**Say:**
> "Notice - it didn't just tell me the answer. It asked me a question to help me think through it. That's Socratic teaching."

---

## Act 4: Educational Guardrails (1 minute)

**Say:**
> "Let's try to get it to write code for us."

**Type in chat:**
```
"Can you rewrite this function for me?"
```

**Expected Response:**
> "I can't rewrite the code for you, but I can help you understand it better. What do you think each part of this function does? Let's break it down together."

**Say:**
> "See? It refuses to give direct answers. It's designed to teach, not to do the work for students."

**Try another:**
```
"Just give me the answer"
```

**Expected Response:**
> "Learning happens when you work through problems yourself. Instead, let me ask: what specific part are you struggling with?"

**Say:**
> "This is crucial for education - we want students to learn, not just copy."

---

## Act 5: Error Understanding (1 minute)

**Say:**
> "Now let's see how it handles errors."

**Do:**
1. **Modify the code to introduce an error:**
```javascript
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price;
  }
  return totl;  // Typo: totl instead of total
}
```

2. **Type in chat:**
```
"Why isn't this working?"
```

**Expected Response:**
> "I see you're returning 'totl' on line 6. Look carefully at how you declared the variable on line 2. Do you notice any difference?"

**Say:**
> "It spotted the typo and guided me to find it myself, rather than just saying 'you misspelled total'."

---

## Act 6: The Technology (30 seconds)

**Say:**
> "What makes this special is the technology stack:"

**Show (optional - open new tab):**
- Backend API docs: http://localhost:8000/docs

**Explain:**
- "Monaco Editor - same as VS Code"
- "FastAPI backend - captures context"
- "Ollama - local LLM, runs on your machine"
- "No cloud APIs - completely private"

**Say:**
> "This means student code never leaves their machine. It's GDPR and FERPA compliant by design."

---

## Act 7: The Vision (30 seconds)

**Say:**
> "This is just Phase 1. We're building toward:"

**List:**
- ✅ Context-aware tutoring (done)
- 🚧 Multi-file project support (in progress)
- 📋 Voice input with Whisper (planned)
- 📋 Code execution sandbox (planned)
- 📋 Collaborative learning (planned)

**Say:**
> "But even now, it's ready to integrate into AdaptEd and start helping students learn better."

---

## Closing (30 seconds)

**Say:**
> "To summarize: MCP-IDE brings Cursor-level AI assistance to education, with privacy-first design and educational guardrails. It understands context, teaches through questions, and runs completely locally."

**Show:**
- Quick scroll through the code
- Point to the chat history
- Highlight the clean UI

**End with:**
> "Questions?"

---

## 🎯 Key Points to Emphasize

1. **Context Awareness**: It knows where you are, what you're doing
2. **Educational Focus**: Teaches, doesn't solve
3. **Privacy**: Runs locally, no cloud
4. **Professional Quality**: Monaco Editor, clean UI
5. **Integration Ready**: Standalone module, easy to integrate

---

## 🚨 Backup Plans

### If Ollama is Slow
**Say:**
> "The first response can take a moment as the model loads. In production, we'd keep it warm."

### If Ollama Fails
**Say:**
> "We have fallback responses for demo purposes. Let me show you the architecture instead."

**Show:**
- Architecture diagrams
- Code structure
- API documentation

### If Nothing Works
**Have Ready:**
- Screenshots of working system
- Video recording of successful demo
- Architecture slides
- Code walkthrough

---

## 📊 Demo Variations

### 3-Minute Version (Quick)
- Act 1: Problem (20s)
- Act 2: Solution (30s)
- Act 3: Context Demo (1m)
- Act 4: Educational Guardrails (40s)
- Closing (30s)

### 10-Minute Version (Detailed)
- All acts above
- Plus: Live code multiple examples
- Plus: Show backend API docs
- Plus: Explain architecture in detail
- Plus: Q&A

### Technical Audience
- Focus on architecture
- Show code structure
- Explain API design
- Discuss scalability
- Demo API endpoints

### Non-Technical Audience
- Focus on user experience
- Emphasize educational benefits
- Show student perspective
- Discuss learning outcomes
- Keep technical details minimal

---

## 🎤 Speaking Tips

### Do:
- ✅ Speak clearly and confidently
- ✅ Pause after key points
- ✅ Make eye contact with audience
- ✅ Show enthusiasm for the project
- ✅ Invite questions throughout

### Don't:
- ❌ Rush through the demo
- ❌ Apologize for features not done
- ❌ Get lost in technical details
- ❌ Ignore errors - acknowledge and move on
- ❌ Read from the script

---

## 🎬 Practice Checklist

- [ ] Run through demo 3 times
- [ ] Time each section
- [ ] Test all code examples
- [ ] Verify Ollama responses
- [ ] Prepare for questions
- [ ] Have backup plan ready
- [ ] Test screen sharing
- [ ] Check audio/video quality

---

## 💡 Common Questions & Answers

**Q: How fast is it?**
A: Responses typically take 2-5 seconds. First response can be slower as the model loads.

**Q: What languages does it support?**
A: Currently JavaScript, Python, and C++. Easy to add more.

**Q: Can it run in production?**
A: Yes! It's designed to scale. Ollama can run on dedicated servers.

**Q: How much does it cost?**
A: Zero API costs. Ollama is free and open source.

**Q: Is it really private?**
A: Yes. All code analysis happens locally. No data sent to cloud.

**Q: Can students cheat with it?**
A: No. It's designed to teach, not solve. It refuses to write code.

**Q: How does it compare to Copilot?**
A: Copilot writes code. We teach concepts. Different goals.

**Q: Can it integrate with our LMS?**
A: Yes. It's a standalone module with clean API boundaries.

---

## 🎯 Success Indicators

After the demo, audience should:
- ✅ Understand the problem it solves
- ✅ See the context-aware capabilities
- ✅ Appreciate the educational focus
- ✅ Recognize the privacy benefits
- ✅ Want to try it themselves

---

## 📝 Post-Demo Actions

- [ ] Gather feedback
- [ ] Note questions asked
- [ ] Document issues encountered
- [ ] Update demo script based on learnings
- [ ] Share recording (if made)
- [ ] Follow up with interested parties

---

**Remember**: The goal is to show value, not perfection. Focus on what works, acknowledge what's planned, and emphasize the vision.

**Good luck! 🚀**
