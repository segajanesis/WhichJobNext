# Which Job Next?

A lightweight career-mapping utility that analyzes a resume and suggests job titles and companies to explore.

## How it works

1. Paste a text-only resume into the web app.
2. The resume is sent to a Netlify serverless function.
3. The function asks OpenAI to extract work history and generate career suggestions.
4. The results are displayed in the browser and are not saved by this application.

## Privacy and accuracy

Resume text is transmitted to OpenAI for analysis. Do not include highly sensitive information such as Social Security numbers, passwords, or unnecessary personal contact information. The application does not store results locally.

Recommendations are AI-generated suggestions, not guarantees. Verify company information, career-page links, job availability, and fit independently.
