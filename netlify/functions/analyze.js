// netlify/functions/analyze.js

export async function handler(event, context) {
    // Only allow POST requests
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    // Parse the request body
    let resumeText;
    try {
        const body = JSON.parse(event.body);
        resumeText = body.resume;
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid request body' })
        };
    }

    if (!resumeText || resumeText.length < 50) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Resume text is required' })
        };
    }

    // Get OpenAI API key from environment variable
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'API key not configured' })
        };
    }

    // The prompt that does all the work
    const systemPrompt = `You are a career advisor that analyzes resumes and suggests similar companies and job titles. 

Your task:
1. Extract the work history from the resume (company names, job titles, and a brief summary of responsibilities)
2. Suggest 8-12 job titles the person should search for based on their experience
3. Suggest 8-10 companies that would be a good fit, based on similarity to where they've worked

For company suggestions, think about:
- Direct competitors in the same industry
- Companies with similar cultures or operational complexity
- Adjacent industries where their skills transfer well
- Companies of similar size/stage where they'd feel comfortable

Return your response as valid JSON with this exact structure:
{
    "workHistory": [
        {
            "company": "Company Name",
            "title": "Job Title",
            "summary": "Brief 1-2 sentence summary of what they did"
        }
    ],
    "suggestedTitles": [
        "Job Title 1",
        "Job Title 2"
    ],
    "suggestedCompanies": [
        {
            "name": "Company Name",
            "url": "https://company-careers-page-or-homepage.com",
            "reason": "Why this company is a good fit (1-2 sentences)",
            "basedOn": "Which of their previous companies this is similar to"
        }
    ]
}

Important:
- For URLs, use the company's actual careers page if you know it, otherwise use their homepage
- Be specific in your reasoning - reference actual aspects of their experience
- Include a mix of obvious fits and some stretch opportunities
- Address the user as "you" and use "you/your" tense 
- Only return valid JSON, no markdown or explanation`;

    const userPrompt = `Here is the resume to analyze:\n\n${resumeText}`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI API error:', errorData);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to analyze resume' })
            };
        }

        const data = await response.json();
        const content = data.choices[0].message.content;

        // Parse the JSON response from GPT
        let parsedContent;
        try {
            // Remove any markdown code blocks if present
            const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsedContent = JSON.parse(cleanContent);
        } catch (e) {
            console.error('Failed to parse GPT response:', content);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Failed to parse analysis results' })
            };
        }

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(parsedContent)
        };

    } catch (error) {
        console.error('Error calling OpenAI:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to analyze resume' })
        };
    }
}
