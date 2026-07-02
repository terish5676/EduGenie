"""
EduGenie — Optimized Gemini Prompt Templates
Each function returns a formatted prompt string for the specific AI feature.
"""


def qa_prompt(question: str, context: str = "") -> str:
    ctx = f"\n\nAdditional context:\n{context}" if context else ""
    return f"""You are EduGenie, an expert AI educational assistant. Answer the following question clearly, accurately, and educationally.

Use markdown formatting:
- Use **bold** for key terms
- Use `code blocks` for code snippets
- Use numbered lists or bullet points for steps
- Use tables when comparing items
- Use ## headings to organize long answers
- Use LaTeX notation $...$ for math when needed

Always end with a brief "Key Takeaway" section.

Question: {question}{ctx}

Provide a thorough, well-structured answer that helps the student truly understand the concept."""


def explain_prompt(topic: str, level: str = "intermediate", style: str = "detailed") -> str:
    level_map = {
        "beginner": "a complete beginner (use simple language, analogies, and avoid jargon)",
        "intermediate": "an intermediate student (assume basic knowledge, go deeper)",
        "advanced": "an advanced student (use technical depth, edge cases, nuances)"
    }
    style_map = {
        "simple": "Keep it simple, short and easy to understand.",
        "detailed": "Be thorough, cover all important aspects.",
        "examples": "Focus on practical examples and real-world applications.",
        "analogy": "Use real-world analogies and comparisons to explain.",
    }
    return f"""You are EduGenie, an expert AI educator. Explain the following topic for {level_map.get(level, level_map['intermediate'])}.

{style_map.get(style, style_map['detailed'])}

Topic: **{topic}**

Structure your explanation with:
## 📚 Overview
Brief introduction

## 🔑 Key Concepts
Main ideas and components

## 💡 Real-World Example
Practical application

## ⚠️ Common Mistakes
What students often get wrong

## 🎯 Interview Questions
3-5 common interview/exam questions on this topic

## 📝 Summary
Key takeaways in bullet points

Use markdown formatting throughout. Make it engaging and educational."""


def quiz_prompt(topic: str, difficulty: str = "medium", num_questions: int = 5, quiz_type: str = "mcq") -> str:
    type_instructions = {
        "mcq": f"Generate {num_questions} multiple choice questions (MCQ) with 4 options each (A, B, C, D). Mark the correct answer.",
        "true_false": f"Generate {num_questions} True/False questions. Mark the correct answer.",
        "fill_blank": f"Generate {num_questions} fill-in-the-blank questions. Provide the answer.",
        "short_answer": f"Generate {num_questions} short answer questions. Provide a model answer.",
    }
    return f"""You are EduGenie Quiz Generator. Create a quiz on the topic below.

Topic: {topic}
Difficulty: {difficulty}
Type: {type_instructions.get(quiz_type, type_instructions['mcq'])}

Format your response as valid JSON with this EXACT structure:
{{
  "topic": "{topic}",
  "difficulty": "{difficulty}",
  "type": "{quiz_type}",
  "questions": [
    {{
      "id": 1,
      "question": "Question text here",
      "options": {{"A": "Option A", "B": "Option B", "C": "Option C", "D": "Option D"}},
      "correct": "A",
      "explanation": "Brief explanation of why this is correct"
    }}
  ]
}}

For true/false, options should be {{"A": "True", "B": "False"}}.
For fill_blank and short_answer, omit "options" and set "correct" to the answer string.
Make questions that truly test understanding, not just memorization."""


def summarize_prompt(text: str, mode: str = "detailed") -> str:
    mode_instructions = {
        "short": "Write a concise summary in 2-3 sentences capturing only the most essential points.",
        "detailed": "Write a comprehensive summary covering all major points, maintaining the logical flow.",
        "bullets": "Summarize as organized bullet points grouped by topic. Use sub-bullets for details.",
        "takeaways": "Extract the 5-10 most important key takeaways as actionable insights.",
        "terms": "Identify and define the most important technical terms and concepts from the text.",
    }
    return f"""You are EduGenie, an expert at summarizing educational content.

Mode: {mode_instructions.get(mode, mode_instructions['detailed'])}

Text to summarize:
---
{text[:8000]}
---

Use clear markdown formatting. For bullets/takeaways use ✅ or • symbols. Make the output genuinely useful for studying."""


def roadmap_prompt(topic: str, level: str = "beginner", duration: str = "3 months") -> str:
    return f"""You are EduGenie, an expert learning path designer.

Create a personalized, detailed learning roadmap for:
Topic: {topic}
Starting Level: {level}
Target Duration: {duration}

Structure as valid JSON with this EXACT format:
{{
  "topic": "{topic}",
  "level": "{level}",
  "duration": "{duration}",
  "overview": "Brief description of this learning path",
  "phases": [
    {{
      "phase": 1,
      "title": "Phase Title",
      "duration": "X weeks",
      "description": "What you'll learn",
      "milestones": [
        {{
          "title": "Milestone title",
          "description": "Detailed description",
          "resources": [
            {{"type": "video/book/course/article", "title": "Resource name", "url": "#", "free": true}}
          ],
          "completed": false
        }}
      ]
    }}
  ],
  "tools": ["Tool 1", "Tool 2"],
  "tips": ["Tip 1", "Tip 2", "Tip 3"]
}}

Make it practical, progressive, and achievable. Include free resources where possible."""
