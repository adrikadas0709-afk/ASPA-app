/**
 * IBM watsonx.ai service — handles IAM token exchange + chat completions.
 * Falls back to engineering demo responses when credentials are absent.
 */

const axios  = require('axios');

const SYSTEM_PROMPT = `You are ASPA (Audio Signal Processing Assistant Agent), an expert AI engineering assistant specializing in audio signal processing, electronics, and telecommunications engineering.

You help engineers with:
- Audio circuit design: preamplifiers, amplifiers, filters, equalizers
- Signal analysis: frequency response, Bode plots, THD, SNR calculations
- Filter design: Butterworth, Chebyshev, Bessel, Sallen-Key topology
- Amplifier classes: Class A, AB, B, D — efficiency, bias, THD
- Troubleshooting: noise, distortion, oscillation, ground loops
- Audio standards: IEC 61938, AES, dBu/dBV/dBFS conversions

Always provide:
1. Engineering explanations with formulas (use inline code for values)
2. Specific component values and practical design guidance  
3. Numbered step-by-step repair or design procedures
4. References to relevant standards when applicable`;

let _ibmToken     = null;
let _tokenExpiry  = 0;

async function getIBMToken(apiKey) {
  if (!apiKey) return null;
  if (_ibmToken && Date.now() < _tokenExpiry) return _ibmToken;

  const resp = await axios.post(
    'https://iam.cloud.ibm.com/identity/token',
    `grant_type=urn:ibm:params:oauth:grant-type:apikey&apikey=${apiKey}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  _ibmToken    = resp.data.access_token;
  _tokenExpiry = Date.now() + (resp.data.expires_in - 60) * 1000;
  return _ibmToken;
}

async function askWatsonx({ messages, apiKey, projectId, region = 'us-south', modelId }) {
  const mId    = modelId    || process.env.IBM_MODEL_ID    || 'ibm/granite-13b-chat-v2';
  const pId    = projectId  || process.env.IBM_PROJECT_ID;
  const key    = apiKey     || process.env.IBM_API_KEY;
  const reg    = region     || process.env.IBM_REGION      || 'us-south';

  if (!key || !pId) return { text: demoResponse(messages), demo: true };

  try {
    const token   = await getIBMToken(key);
    const baseUrl = process.env.IBM_WATSONX_URL || `https://${reg}.ml.cloud.ibm.com`;

    const payload = {
      model_id:   mId,
      project_id: pId,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.slice(-12),
      ],
      parameters: {
        max_new_tokens: 1024,
        temperature:    0.7,
        top_p:          0.9,
        repetition_penalty: 1.05,
      },
    };

    const resp = await axios.post(
      `${baseUrl}/ml/v1/text/chat?version=2024-05-31`,
      payload,
      { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
    );

    const text =
      resp.data?.results?.[0]?.generated_text ||
      resp.data?.choices?.[0]?.message?.content ||
      'No response generated.';

    return { text, demo: false };
  } catch (err) {
    console.error('watsonx error:', err.response?.data || err.message);
    return { text: demoResponse(messages), demo: true, error: err.message };
  }
}

// ── Simple demo responses (no API credentials needed) ────────────────────────
function demoResponse(messages) {
  const last = (messages.findLast(m => m.role === 'user')?.content || '').toLowerCase();

  if (last.includes('low-pass') || last.includes('lpf'))
    return `## Low-Pass Filter Design\n\n**Cutoff frequency formula:**\n\`f_c = 1 / (2π × R × C)\`\n\nFor a 1kHz 2nd-order Butterworth (Sallen-Key, R = 10kΩ):\n- R1 = R2 = **10 kΩ**\n- C1 = **22.5 nF**, C2 = **11.25 nF**\n- Q = 0.707 (maximally flat)\n\nRecommended op-amp: **NE5532** or **OPA2134** for audio-grade performance.`;

  if (last.includes('noise') || last.includes('hum') || last.includes('ground'))
    return `## Noise & Hum Troubleshooting\n\n**Most likely causes:**\n1. **Ground loop** — multiple ground paths at different potentials\n2. **Power supply ripple** — insufficient filter capacitance\n3. **Insufficient PSR** — op-amp PSRR < 80dB at 50/60Hz\n\n**Immediate steps:**\n1. Measure hum frequency (50Hz = power line, 100Hz = rectifier ripple)\n2. Try star grounding — single-point reference\n3. Add 100µH + 100nF LC filter on supply rail\n4. Replace filter caps (target ESR < 0.5Ω)\n\n**Formula:** PSRR = 20·log₁₀(ΔV_supply / ΔV_out)  → target > 80dB`;

  if (last.includes('clipping') || last.includes('distortion'))
    return `## Clipping & Distortion Diagnosis\n\n**Root causes (by probability):**\n1. Input level exceeds op-amp output swing (most common)\n2. Insufficient supply voltage headroom\n3. Class-B crossover distortion — insufficient bias current\n4. Gain too high for available supply\n\n**Headroom formula:**\n\`Headroom (dBu) = 20·log₁₀(V_swing_RMS / 0.775)\`\n\nFor ±15V supply: max swing ≈ ±13.5V → +22.3dBu headroom\n\n**Fix:** Reduce pre-stage gain or increase supply voltage.`;

  return `## ASPA Engineering Assistant\n\nI'm running in **demo mode** — IBM watsonx.ai credentials are not configured on the server.\n\nConfigure \`IBM_API_KEY\` and \`IBM_PROJECT_ID\` in your backend \`.env\` file to enable full IBM Granite AI responses.\n\n**I can help with:** filter design, amplifier circuits, troubleshooting, SNR calculations, component selection, and audio standards. Please ask your engineering question!`;
}

module.exports = { askWatsonx };
