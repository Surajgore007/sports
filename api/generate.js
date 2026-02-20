export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { target } = req.body;
    if (!target) {
        return res.status(400).json({ error: 'Target sector is required' });
    }

    const API_KEY = process.env.GEMINI_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    try {
        const promptText = `Generate a simulated supply chain anomaly prediction report for the sector/shipment "${target}".
        Return ONLY a JSON object with this exact structure:
        {
            "summary": "High-level summary of global logistics risks for this sector",
            "anomalies": [
                {
                    "type": "Port Congestion/Weather/Cyber Attack/Fuel Spike",
                    "severity": "Critical/High/Medium/Low",
                    "description": "description of the specific bottleneck",
                    "date": "2026-02-20"
                },
                { "type": "...", "severity": "...", "description": "...", "date": "..." },
                { "type": "...", "severity": "...", "description": "...", "date": "..." },
                { "type": "...", "severity": "...", "description": "...", "date": "..." },
                { "type": "...", "severity": "...", "description": "...", "date": "..." }
            ],
            "visual_prompt": "Description of a futuristic cargo ship or automated warehouse in a storm, cyberpunk/digital twin style, high detail"
        }`;

        // Using 1.5-flash as per user rules for stability/free tier
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || `Gemini API Error: ${response.status}`);
        }

        const data = await response.json();
        const rawText = data.candidates[0].content.parts[0].text;
        const cleanText = rawText.replace(/```json|```/g, '').trim();

        res.status(200).json(JSON.parse(cleanText));

    } catch (error) {
        console.error('Backend Error:', error);
        res.status(500).json({ error: error.message });
    }
}
