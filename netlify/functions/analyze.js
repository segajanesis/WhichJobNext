// netlify/functions/analyze.js

const MAX_RESUME_LENGTH = 30000;
const MIN_RESUME_LENGTH = 50;
const OPENAI_TIMEOUT_MS = 55000;

function jsonResponse(statusCode, payload, extraHeaders = {}) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
            ...extraHeaders
        },
        body: JSON.stringify(payload)
    };
}

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function validateAnalysis(result) {
    if (!result || typeof result !== 'object') return false;
    if (!Array.isArray(result.workHistory)) return false;
    if (!Array.isArray(result.suggestedTitles)) return false;
    if (!Array.isArray(result.suggestedCompanies)) return false;

    const validHistory = result.workHistory.every((job) =>
        job &&
        isNonEmptyString(job.company) &&
        isNonEmptyString(job.title) &&
        isNonEmptyString(job.summary)
    );

    const validTitles = result.suggestedTitles.every(isNonEmptyString);
    const validCompanies = result.suggestedCompanies.every((company) =>
        company &&
        isNonEmptyString(company.name) &&
        isNonEmptyString(company.url) &&
        isNonEmptyString(company.reason) &&
        isNonEmptyString(company.basedOn)
    );

    return validHistory && validTitles && validCompanies;
}

function isSafeUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
}

export async function handler(event, context) {
    if (event.httpMethod !== 'POST') {
        return jsonResponse(405, { error: 'Method not allowed' }, { Allow: 'POST' });
    }

    let body;
    try {
        body = JSON.parse(event.body || '{}');
    } catch {
        return jsonResponse(400, { error: 'Invalid request body' });
    }

    const resumeText = typeof body.resume === 'string' ? body.resume.trim() : '';
    if (resumeText.length < MIN_RESUME_LENGTH || resumeText.length > MAX_RESUME_LENGTH) {
        return jsonResponse(400, {
            error: `Resume text must be between ${MIN_RESUME_LENGTH} and ${MAX_RESUME_LENGTH} characters.`
        });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('OPENAI_API_KEY is not configured');
        return jsonResponse(500, { error: 'Analysis service is not configured' });
    }

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

Return a JSON object with this exact structure:
{
    "workHistory": [{ "company": "Company Name", "title": "Job Title", "summary": "Brief 1-2 sentence summary" }],
    "suggestedTitles": ["Job Title 1", "Job Title 2"],
    "suggestedCompanies": [{ "name": "Company Name", "url": "https://example.com", "reason": "Why this may be a good fit", "basedOn": "Similar previous company" }]
}

Important:
- Use a company's actual careers page when you know it; otherwise use its homepage.
- Only include valid http or https URLs.
- Be specific and reference actual aspects of the user's experience.
- Include a mix of obvious fits and stretch opportunities.
- Address the user as "you" and use "you/your" tense.
- Return JSON only, with no Markdown or additional explanation.`;

    const userPrompt = `Here is the resume to analyze:\n\n${resumeText}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: 'json_object' },
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            console.error('OpenAI request failed', {
                status: response.status,
                requestId: context?.awsRequestId
            });
            const statusCode = response.status === 429 ? 429 : 502;
            return jsonResponse(statusCode, {
                error: statusCode === 429
                    ? 'The analysis service is busy. Please try again shortly.'
                    : 'The analysis service could not complete the request.'
            });
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (!isNonEmptyString(content)) {
            throw new Error('OpenAI returned an empty response');
        }

        let parsedContent;
        try {
            parsedContent = JSON.parse(content);
        } catch {
            console.error('OpenAI returned invalid JSON', {
                requestId: context?.awsRequestId
            });
            return jsonResponse(502, { error: 'The analysis service returned invalid results.' });
        }

        if (!validateAnalysis(parsedContent)) {
            console.error('OpenAI returned an unexpected response shape', {
                requestId: context?.awsRequestId
            });
            return jsonResponse(502, { error: 'The analysis service returned incomplete results.' });
        }

        const safeCompanies = parsedContent.suggestedCompanies.filter((company) => isSafeUrl(company.url));
        return jsonResponse(200, {
            ...parsedContent,
            suggestedCompanies: safeCompanies
        });
    } catch (error) {
        if (error.name === 'AbortError') {
            return jsonResponse(504, { error: 'The analysis took too long. Please try again.' });
        }

        console.error('Error calling OpenAI', {
            message: error.message,
            requestId: context?.awsRequestId
        });
        return jsonResponse(502, { error: 'The analysis service is temporarily unavailable.' });
    } finally {
        clearTimeout(timeout);
    }
}
