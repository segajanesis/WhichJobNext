# Which Job Next?

A lightweight career-mapping utility that analyzes a resume and suggests job titles and companies to explore.

## How it works

1. The user pastes their text-only resume after being asked to remove highly sensitive information 
2. The resume paste is formatted into JSON and sent to a Netlify serverless function
3. The function asks OpenAI to extract work history and generate career suggestions
4. The results are generated from the passed-back JSON and displayed in the browser as formatted text 
