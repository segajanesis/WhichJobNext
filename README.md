# Career Compass - Resume Analyzer

A simple tool that analyzes your resume and suggests similar companies and job titles to explore.

## How It Works

1. User pastes their resume
2. The text is sent to a serverless function
3. The function calls OpenAI's GPT-4 to analyze the resume
4. Results are displayed on the page with:
   - Extracted work history
   - Suggested job titles to search for
   - Companies that might be a good fit (with links)

## Deployment to Netlify

### Step 1: Create a Netlify Account
1. Go to [netlify.com](https://netlify.com)
2. Sign up for a free account (you can use GitHub, GitLab, email, etc.)

### Step 2: Get an OpenAI API Key
1. Go to [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to API Keys section
4. Create a new secret key
5. Copy it somewhere safe (you'll need it in Step 4)

### Step 3: Deploy the Site

**Option A: Drag and Drop (Easiest)**
1. Log into Netlify
2. Go to the Sites page
3. Drag the entire `resume-mapper` folder onto the page
4. Wait for it to deploy

**Option B: Connect to GitHub**
1. Push this folder to a GitHub repository
2. In Netlify, click "Add new site" > "Import an existing project"
3. Connect your GitHub account
4. Select the repository
5. Click "Deploy"

### Step 4: Add Your API Key
1. In Netlify, go to your site's dashboard
2. Click "Site settings"
3. Click "Environment variables" in the left sidebar
4. Click "Add a variable"
5. Set:
   - Key: `OPENAI_API_KEY`
   - Value: Your OpenAI API key from Step 2
6. Click "Create variable"
7. Go to "Deploys" and click "Trigger deploy" > "Deploy site"

### Step 5: Test It!
1. Visit your site URL (something like `your-site-name.netlify.app`)
2. Paste a resume
3. Click "Analyze My Career Path"
4. See your results!

## Local Development

To test locally, you'll need the Netlify CLI:

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Set your API key for local dev
export OPENAI_API_KEY="your-key-here"

# Run the dev server
netlify dev
```

Then open `http://localhost:8888` in your browser.

## Cost Considerations

- **Netlify**: Free tier includes 125,000 function invocations/month
- **OpenAI**: Each resume analysis costs roughly $0.01-0.03 depending on resume length

For personal use or a small project, you'll likely stay well within free/cheap tiers.

## Customization Ideas

- Add more specific prompts for certain industries
- Include salary range estimates
- Add LinkedIn job search links
- Export results to PDF
- Add authentication to track usage
