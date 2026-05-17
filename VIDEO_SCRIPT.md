# Cascade Blast-Radius Analyzer - Video Script

**Duration**: 5 minutes  
**Target Audience**: Developers, DevOps teams, Technical managers  
**Tone**: Professional, engaging, problem-focused

---

## 🎬 OPENING (0:00 - 0:30)

### Visual: Title card with Cascade logo, then transition to speaker

**[Speaker on camera]**

"Have you ever made a small code change and wondered... what else might break? 

In large codebases, a single line change can cascade through dozens of files, breaking features you didn't even know existed.

Today, I'm excited to show you **Cascade** - an AI-powered blast-radius analyzer that predicts the ripple effects of your code changes *before* they hit production."

---

## 🎯 THE PROBLEM (0:30 - 1:15)

### Visual: Screen recording showing a complex codebase with interconnected files

**[Voiceover with visuals]**

"Let me paint a picture. You're working on a microservices monorepo with hundreds of files. You need to update an authentication function.

**[Show code editor with auth function]**

Simple change, right? But here's what you don't see:

**[Animate connections spreading out]**

- This auth function is imported by 12 different services
- Those services are used by 30+ API endpoints  
- Each endpoint has its own validation logic
- Some have environment variable dependencies
- Others have database schema requirements

**[Show overwhelmed developer]**

Traditional tools show you *syntax* errors. But they can't predict *logical* failures, runtime crashes, or cascading bugs across your entire system.

That's where Cascade comes in."

---

## 💡 THE SOLUTION (1:15 - 2:30)

### Visual: Cascade web interface - clean, modern UI

**[Screen recording with voiceover]**

"Cascade uses IBM's Bob AI to analyze your code changes and predict their blast radius.

**[Show the analyze page]**

Here's how it works:

**Step 1: Paste your code diff**  
**[Type in a sample diff]**

Just copy your git diff or GitHub PR changes and paste them here.

**Step 2: Click Analyze**  
**[Click the button, show loading animation]**

Cascade sends your changes to IBM Bob Shell - a powerful AI that understands code relationships, dependencies, and architectural patterns.

**Step 3: Get instant insights**  
**[Show results appearing in real-time]**

Within seconds, you get:

- **Risk Assessment**: High, Medium, or Low impact rating
- **Affected Files**: Every file that could be impacted
- **Dependency Chain**: Visual graph showing how changes propagate
- **Specific Risks**: Null pointer exceptions, type mismatches, breaking changes
- **Recommendations**: Actionable steps to mitigate risks

**[Highlight the visual graph]**

This Mermaid diagram shows exactly how your change flows through the system. Red nodes are high-risk, yellow are medium, green are safe."

---

## 🔧 REAL-WORLD DEMO (2:30 - 3:45)

### Visual: Live demo with actual code

**[Screen recording]**

"Let me show you a real example. 

**[Open demo page]**

Here's a change to our authentication service - we're adding a null check to the validateToken function.

**[Show the diff]**

```typescript
- return jwt.verify(token, secret);
+ return token ? jwt.verify(token, secret) : null;
```

Looks safe, right? Let's see what Cascade finds.

**[Click analyze, show streaming results]**

**[Point to results as they appear]**

Wow. Cascade identified:

1. **High Risk**: The billing service expects a user object, not null
2. **Medium Risk**: Email notifications will crash on null user
3. **Low Risk**: Logging might need updates

**[Show the dependency graph]**

Look at this graph - our simple null check affects 8 files across 3 services!

**[Show recommendations]**

And here's the best part - Cascade gives us specific recommendations:

- Update billing/checkout.ts to handle null users
- Add null checks in email templates
- Update error handling in notifications

**[Show code snippets]**

It even shows us the exact lines that need attention.

Without Cascade, we would have shipped this change, broken the billing flow, and spent hours debugging in production. Now we can fix it before it ever reaches users."

---

## 🚀 KEY FEATURES (3:45 - 4:15)

### Visual: Feature highlights with icons

**[Animated slides with voiceover]**

"Let's recap what makes Cascade powerful:

**✅ AI-Powered Analysis**  
IBM Bob Shell understands your codebase like a senior architect

**✅ Real-Time Streaming**  
Watch the analysis happen live - no waiting for batch jobs

**✅ Visual Dependency Graphs**  
See the blast radius at a glance with interactive diagrams

**✅ GitHub Integration**  
Analyze PRs directly from GitHub URLs

**✅ Risk Scoring**  
Prioritize what needs attention with clear risk levels

**✅ Actionable Recommendations**  
Get specific fixes, not vague warnings"

---

## 🎓 TECHNICAL HIGHLIGHTS (4:15 - 4:45)

### Visual: Architecture diagram

**[Show technical architecture]**

"For the technical folks, here's what's under the hood:

**Frontend**: Next.js 15 with React Server Components and streaming UI

**AI Engine**: IBM Bob Shell with custom prompts for code analysis

**Analysis Pipeline**: 
- Diff parsing and AST analysis
- Dependency graph construction  
- Impact prediction with confidence scores
- Risk assessment and recommendations

**Deployment**: One-click Netlify deployment with environment variables

Everything is open source and ready to integrate into your CI/CD pipeline."

---

## 🏆 HACKATHON CONTEXT (4:45 - 5:00)

### Visual: IBM Bob Hackathon logo

**[Speaker on camera]**

"Cascade was built for the IBM Bob Hackathon 2026, showcasing how AI can transform code review and risk management.

This isn't just a demo - it's a production-ready tool that can save your team hours of debugging and prevent costly production incidents."

---

## 📞 CALL TO ACTION (5:00 - 5:15)

### Visual: GitHub repo and demo link

**[Speaker on camera with graphics]**

"Want to try Cascade?

**Live Demo**: cascade-blast-radius.netlify.app  
**GitHub**: github.com/raj921/cascade-blast-radius  
**Documentation**: Full setup guide in the README

Star the repo, try the demo, and let me know what you think!

**[Smile]**

Thanks for watching, and happy coding!"

---

## 🎬 CLOSING (5:15 - 5:20)

### Visual: Cascade logo with tagline

**[Text on screen]**

**Cascade**  
*Predict the ripple effects before they become waves*

**Powered by IBM Bob AI**

---

## 📋 PRODUCTION NOTES

### Camera Setup
- **Shot 1**: Speaker on camera (intro, problem, conclusion)
- **Shot 2**: Screen recording (demo, features)
- **Shot 3**: B-roll of code/diagrams (technical sections)

### Screen Recording Checklist
- [ ] Clean browser with no extra tabs
- [ ] Hide bookmarks bar
- [ ] Use demo data (no real credentials)
- [ ] Zoom to 125% for readability
- [ ] Record at 1920x1080, 60fps
- [ ] Enable cursor highlighting

### Audio
- Use lapel mic for speaker sections
- Add subtle background music (tech/corporate)
- Sound effects for transitions
- Lower music during speaking

### Graphics
- Animated title cards
- Lower thirds with key points
- Highlight boxes for important UI elements
- Smooth transitions between sections

### Editing Tips
- Cut pauses and "ums"
- Speed up slow loading times (1.5x)
- Add captions for accessibility
- Include chapter markers in YouTube description

### YouTube Description Template
```
🚀 Cascade - AI-Powered Code Change Impact Analysis

Predict the blast radius of your code changes before they hit production!

🔗 Links:
• Live Demo: https://cascade-blast-radius.netlify.app
• GitHub: https://github.com/raj921/cascade-blast-radius
• Documentation: [link]

⏱️ Chapters:
0:00 - Introduction
0:30 - The Problem
1:15 - The Solution
2:30 - Live Demo
3:45 - Key Features
4:15 - Technical Details
4:45 - Hackathon Context
5:00 - Try It Yourself

🏆 Built for IBM Bob Hackathon 2026

#IBMBob #AI #CodeAnalysis #DevTools #Hackathon
```

---

## 🎯 ALTERNATIVE VERSIONS

### 60-Second Version (Social Media)
Focus on: Problem (10s) → Demo (35s) → CTA (15s)

### 2-Minute Version (Pitch)
Focus on: Problem (30s) → Solution (60s) → Demo (30s)

### 10-Minute Version (Technical Deep Dive)
Add: Architecture walkthrough, code examples, integration guide

---

**Script Version**: 1.0  
**Last Updated**: May 17, 2026  
**Author**: Cascade Team