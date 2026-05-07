import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-2.5-flash';

const PROMPT = `You are an expert botanist and plant disease specialist. Analyze this plant photo carefully and respond with ONLY valid JSON in exactly this format (no markdown, no explanation, just the JSON object):
{
  "species": "common name of the plant",
  "scientific_name": "scientific name in italics format",
  "confidence": 0.95,
  "disease": null,
  "disease_confidence": 0,
  "care_advice": "one concise care tip for this plant",
  "description": "one sentence describing the plant"
}

Rules:
- confidence is a number from 0.0 to 1.0 (your certainty about the identification)
- disease is null if the plant looks healthy, or a string like "Leaf blight" if disease is detected
- disease_confidence is 0 if no disease, or 0.0-1.0 if disease detected
- If you cannot identify it, use "Unknown plant" for species and low confidence
- Never wrap the JSON in markdown code blocks`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: { code: 'NO_API_KEY', message: 'OPENROUTER_API_KEY not configured' } },
      { status: 503 }
    );
  }

  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;
    if (!image) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_IMAGE', message: 'No image provided' } },
        { status: 422 }
      );
    }

    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mimeType = image.type || 'image/jpeg';

    const start = Date.now();
    const res = await fetch(OPENROUTER_API, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://greenycorner.ae',
        'X-Title': 'Greeny Corner Plant Identifier',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
              { type: 'text', text: PROMPT },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
    });

    const latency_ms = Date.now() - start;

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { success: false, error: { code: 'OPENROUTER_ERROR', message: err } },
        { status: res.status }
      );
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? '';

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim());
    } catch {
      return NextResponse.json(
        { success: false, error: { code: 'PARSE_ERROR', message: 'Gemini returned non-JSON response', raw: text } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        species: parsed.species ?? 'Unknown plant',
        scientific_name: parsed.scientific_name ?? '',
        confidence: Number(parsed.confidence ?? 0),
        disease: parsed.disease ?? null,
        disease_confidence: Number(parsed.disease_confidence ?? 0),
        care_advice: parsed.care_advice ?? null,
        description: parsed.description ?? '',
        model_used: 'gemini-2.5-flash',
        latency_ms,
      },
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { success: false, error: { code: 'PROXY_ERROR', message: String(e) } },
      { status: 502 }
    );
  }
}
