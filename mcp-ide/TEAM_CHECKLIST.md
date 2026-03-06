# MCP-IDE Team Checklist

## 🚀 Getting Started (Day 1)

### Prerequisites Setup
- [ ] Install Node.js 18+ (`node --version`)
- [ ] Install Python 3.10+ (`python --version`)
- [ ] Install Ollama from https://ollama.ai/download
- [ ] Pull Llama 3 model: `ollama pull llama3`
- [ ] Verify Ollama is running: `curl http://localhost:11434/api/tags`

### Repository Setup
- [ ] Clone the repository
- [ ] Navigate to `mcp-ide` folder
- [ ] Read `README.md`
- [ ] Read `SETUP.md`
- [ ] Review `PROJECT_SUMMARY.md`

## 🔧 Backend Setup

### Environment Setup
- [ ] Navigate to `backend` folder
- [ ] Create virtual environment: `python -m venv venv`
- [ ] Activate virtual environment
  - Windows: `venv\Scripts\activate`
  - macOS/Linux: `source venv/bin/activate`
- [ ] Install dependencies: `pip install -r requirements.txt`
- [ ] Copy `.env.example` to `.env`
- [ ] Review configuration in `.env`

### Verify Backend
- [ ] Start backend: `python main.py`
- [ ] Check terminal for "Application startup complete"
- [ ] Open http://localhost:8000 in browser
- [ ] Should see: `{"message": "MCP-IDE Backend API", ...}`
- [ ] Open http://localhost:8000/docs
- [ ] Should see FastAPI Swagger documentation
- [ ] Test health endpoint: `curl http://localhost:8000/health`

## 💻 Frontend Setup

### Environment Setup
- [ ] Navigate to `frontend` folder
- [ ] Install dependencies: `npm install`
- [ ] Wait for installation to complete (may take a few minutes)
- [ ] Check for any error messages

### Verify Frontend
- [ ] Start frontend: `npm run dev`
- [ ] Check terminal for "Local: http://localhost:5174"
- [ ] Open http://localhost:5174 in browser
- [ ] Should see Monaco Editor with chat panel
- [ ] Check browser console for errors (F12)

## ✅ Integration Testing

### Basic Functionality
- [ ] Monaco Editor loads correctly
- [ ] Can type code in the editor
- [ ] Cursor position updates in header
- [ ] Chat panel is visible
- [ ] Can type in chat input
- [ ] Send button is clickable

### API Communication
- [ ] Open browser DevTools (F12)
- [ ] Go to Network tab
- [ ] Type a question in chat and send
- [ ] Should see POST request to `/api/v1/tutor/ask`
- [ ] Request should return 200 status
- [ ] Response should appear in chat

### Ollama Integration
- [ ] Verify Ollama is running: `ollama list`
- [ ] Send a question in chat
- [ ] Wait for response (may take 2-5 seconds)
- [ ] Response should be educational/Socratic
- [ ] Response should NOT be direct code

## 🐛 Troubleshooting

### Backend Issues
- [ ] Check Python version is 3.10+
- [ ] Verify all dependencies installed: `pip list`
- [ ] Check `.env` file exists and is configured
- [ ] Verify port 8000 is not in use
- [ ] Check backend terminal for error messages

### Frontend Issues
- [ ] Check Node version is 18+
- [ ] Clear node_modules: `rm -rf node_modules && npm install`
- [ ] Check if port 5174 is available
- [ ] Verify backend is running on port 8000
- [ ] Check browser console for errors

### Ollama Issues
- [ ] Verify Ollama is installed: `ollama --version`
- [ ] Check if Ollama is running: `ollama list`
- [ ] Verify model is downloaded: `ollama pull llama3`
- [ ] Test Ollama directly: `ollama run llama3 "Hello"`
- [ ] Check Ollama logs for errors

## 📚 Understanding the Code

### Frontend Deep Dive
- [ ] Read `src/pages/IDEPage.tsx`
- [ ] Understand Monaco Editor integration
- [ ] Review context capture logic
- [ ] Check chat message handling
- [ ] Understand state management

### Backend Deep Dive
- [ ] Read `app/services/tutor_agent.py`
- [ ] Understand context building
- [ ] Review prompt engineering
- [ ] Check Ollama API integration
- [ ] Understand fallback logic

### API Flow
- [ ] Trace a request from frontend to backend
- [ ] Understand payload structure
- [ ] Review response format
- [ ] Check error handling
- [ ] Understand timeout handling

## 🎨 Customization Tasks

### Easy Customizations
- [ ] Change editor theme (in IDEPage.tsx)
- [ ] Modify chat panel width
- [ ] Update color scheme
- [ ] Change default code sample
- [ ] Customize welcome message

### Medium Customizations
- [ ] Add new language support
- [ ] Modify tutor personality
- [ ] Add keyboard shortcuts
- [ ] Implement file saving
- [ ] Add code templates

### Advanced Customizations
- [ ] Integrate with main AdaptEd
- [ ] Add RAG functionality
- [ ] Implement multi-file support
- [ ] Add voice input
- [ ] Create collaborative features

## 🔗 Integration Preparation

### Documentation Review
- [ ] Read `INTEGRATION.md` thoroughly
- [ ] Understand integration options
- [ ] Review API endpoints
- [ ] Check styling consistency
- [ ] Understand state management approach

### Main Frontend Analysis
- [ ] Review AdaptEd frontend structure
- [ ] Check routing setup
- [ ] Understand state management
- [ ] Review API service patterns
- [ ] Check styling approach

### Integration Planning
- [ ] Decide on integration approach (standalone vs integrated)
- [ ] Plan component placement
- [ ] Design navigation integration
- [ ] Plan API endpoint structure
- [ ] Consider authentication needs

## 🧪 Testing Checklist

### Manual Testing
- [ ] Test with different code samples
- [ ] Try various question types
- [ ] Test error scenarios
- [ ] Check responsive design
- [ ] Test keyboard shortcuts
- [ ] Verify accessibility

### Edge Cases
- [ ] Empty code editor
- [ ] Very long code
- [ ] Special characters in code
- [ ] Network disconnection
- [ ] Ollama not running
- [ ] Backend timeout

### Performance Testing
- [ ] Measure response times
- [ ] Check memory usage
- [ ] Test with multiple tabs
- [ ] Monitor network requests
- [ ] Check bundle size

## 📊 Demo Preparation

### Demo Environment
- [ ] Ensure Ollama is running
- [ ] Backend is started
- [ ] Frontend is started
- [ ] Browser is ready
- [ ] DevTools closed (for clean demo)

### Demo Script
- [ ] Prepare sample code
- [ ] Plan questions to ask
- [ ] Prepare fallback responses
- [ ] Test demo flow
- [ ] Time the demo

### Backup Plan
- [ ] Enable demo mode if needed
- [ ] Prepare screenshots
- [ ] Have video recording ready
- [ ] Prepare explanation slides
- [ ] Test without Ollama (fallback mode)

## 🚢 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] No console errors
- [ ] Code is committed
- [ ] Documentation is updated
- [ ] Environment variables documented

### Production Setup
- [ ] Configure production URLs
- [ ] Set up Ollama server
- [ ] Configure CORS properly
- [ ] Set up monitoring
- [ ] Configure logging

### Post-Deployment
- [ ] Verify health endpoints
- [ ] Test API connectivity
- [ ] Check error logging
- [ ] Monitor performance
- [ ] Gather user feedback

## 📝 Documentation Tasks

### Code Documentation
- [ ] Add JSDoc comments to functions
- [ ] Document complex logic
- [ ] Add type definitions
- [ ] Update README if needed
- [ ] Document API changes

### User Documentation
- [ ] Create user guide
- [ ] Add screenshots
- [ ] Document features
- [ ] Create video tutorial
- [ ] Write FAQ

## 🎯 Team Roles

### Frontend Developer
- [ ] Understand IDEPage.tsx
- [ ] Know Monaco Editor API
- [ ] Understand state management
- [ ] Can modify UI components
- [ ] Can integrate with main app

### Backend Developer
- [ ] Understand FastAPI structure
- [ ] Know Ollama API
- [ ] Can modify prompts
- [ ] Can add new endpoints
- [ ] Can optimize performance

### Full Stack Developer
- [ ] Understand entire flow
- [ ] Can debug end-to-end
- [ ] Can integrate components
- [ ] Can deploy system
- [ ] Can optimize performance

### DevOps Engineer
- [ ] Can deploy backend
- [ ] Can deploy frontend
- [ ] Can set up Ollama
- [ ] Can configure monitoring
- [ ] Can troubleshoot issues

## 🎓 Learning Resources

### Must Read
- [ ] `README.md`
- [ ] `SETUP.md`
- [ ] `PROJECT_SUMMARY.md`
- [ ] `ARCHITECTURE_DIAGRAM.md`
- [ ] Architecture docs in `/docs`

### Should Read
- [ ] `INTEGRATION.md`
- [ ] `IMPLEMENTATION_STATUS.md`
- [ ] Monaco Editor docs
- [ ] FastAPI docs
- [ ] Ollama docs

### Nice to Have
- [ ] React 19 features
- [ ] TypeScript best practices
- [ ] Tailwind CSS docs
- [ ] Framer Motion docs
- [ ] Pydantic docs

## ✨ Success Criteria

### Minimum Viable Demo
- [ ] Editor loads and works
- [ ] Can type code
- [ ] Can ask questions
- [ ] Receives responses
- [ ] UI looks professional

### Full Feature Demo
- [ ] All above +
- [ ] Context-aware responses
- [ ] Error detection works
- [ ] Multiple languages supported
- [ ] Smooth animations
- [ ] No console errors

### Production Ready
- [ ] All above +
- [ ] Tests passing
- [ ] Documentation complete
- [ ] Performance optimized
- [ ] Security reviewed
- [ ] Monitoring in place

## 🎉 Completion Checklist

### Individual Developer
- [ ] Can run the system locally
- [ ] Understands the architecture
- [ ] Can make basic modifications
- [ ] Can debug common issues
- [ ] Can explain the system to others

### Team
- [ ] All members can run locally
- [ ] Code is reviewed
- [ ] Documentation is complete
- [ ] Demo is prepared
- [ ] Integration plan is ready

### Project
- [ ] All features working
- [ ] Tests passing
- [ ] Documentation complete
- [ ] Demo successful
- [ ] Ready for integration

---

## 📞 Need Help?

1. Check the documentation in `/docs`
2. Review `SETUP.md` for troubleshooting
3. Check `IMPLEMENTATION_STATUS.md` for known issues
4. Review architecture diagrams
5. Ask team members

## 🎯 Next Steps

After completing this checklist:
1. Review `INTEGRATION.md` for integration steps
2. Plan integration with main AdaptEd frontend
3. Gather feedback from team
4. Prioritize enhancements
5. Start integration process

---

**Remember**: This is a learning project. Don't hesitate to experiment, break things, and learn from mistakes!
