# Which Job Next?

A lightweight career-mapping utility that analyzes a resume and suggests job titles and companies to explore.

## How it works

1. Paste a text-only resume into the web app.
2. The resume is sent to a Netlify serverless function.
3. The function asks OpenAI to extract work history and generate career suggestions.
4. The results are displayed in the browser and are not saved by this application.

## Local development

1. Install the [Netlify CLI](https://docs.netlify.com/cli/get-started/).
2. Set the `OPENAI_API_KEY` environment variable in your Netlify environment or local shell.
3. Start the site with:

   ```bash
   netlify dev
   ```

The site is configured in `netlify.toml` to serve the repository root and discover functions in `netlify/functions`.

## Configuration

The serverless function requires:

- `OPENAI_API_KEY` — an OpenAI API key. Never commit this value to the repository or expose it in browser JavaScript.

The function rejects resumes shorter than 50 characters or longer than 30,000 characters and applies a request timeout to upstream analysis calls.

## Privacy and accuracy

Resume text is transmitted to OpenAI for analysis. Do not include highly sensitive information such as Social Security numbers, passwords, or unnecessary personal contact information. The application does not intentionally persist resumes or reports, but users should review the data-retention policies of the hosting and AI providers.

Recommendations are AI-generated suggestions, not guarantees. Verify company information, career-page links, job availability, and fit independently.

## Deployment

Deploy the repository through Netlify and configure `OPENAI_API_KEY` in the site's environment variables. The `netlify.toml` file contains the build and function-directory configuration.
