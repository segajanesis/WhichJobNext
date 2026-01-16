# Which Job Next? 

A simple tool that analyzes your resume and suggests similar companies and job titles to explore.

## How It Works

1. User pastes their resume
2. The text is sent to a serverless function
3. The function calls OpenAI's GPT4 to analyze the resume
4. Results are displayed on the page with:
   - Extracted work history
   - Suggested job titles to search for
   - Companies that might be a good fit (with links)

## Deployment to Netlify
