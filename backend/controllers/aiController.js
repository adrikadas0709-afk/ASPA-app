const { askWatsonx } = require('../services/watsonxService');
const { AppError, catchAsync } = require('../utils/AppError');

// POST /api/ai/chat
exports.chat = catchAsync(async (req, res) => {
  const { messages } = req.body;
  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    throw new AppError('messages array is required', 400);
  }

  // Use per-user credentials if stored, else fall back to env
  const user = req.user;
  const result = await askWatsonx({
    messages,
    apiKey:    user?.apiConfig?.ibmApiKey,
    projectId: user?.apiConfig?.projectId,
    region:    user?.apiConfig?.region,
    modelId:   user?.apiConfig?.modelId,
  });

  res.json({
    success:  true,
    message:  result.text,
    demo:     result.demo,
    model:    user?.apiConfig?.modelId || process.env.IBM_MODEL_ID || 'ibm/granite-13b-chat-v2',
  });
});

// POST /api/ai/troubleshoot  — structured troubleshooting query
exports.troubleshoot = catchAsync(async (req, res) => {
  const { circuitType, symptoms, notes } = req.body;
  if (!symptoms?.length) throw new AppError('At least one symptom is required', 400);

  const prompt = `I'm troubleshooting a ${circuitType || 'audio circuit'}.\n\nSymptoms: ${symptoms.join(', ')}.\n${notes ? `Additional notes: ${notes}` : ''}\n\nPlease provide:\n1. Most likely root causes for each symptom\n2. Step-by-step diagnostic procedure\n3. Specific component checks with test values\n4. Recommended fixes with component values\n5. Prevention tips`;

  const result = await askWatsonx({
    messages: [{ role: 'user', content: prompt }],
    apiKey:    req.user?.apiConfig?.ibmApiKey,
    projectId: req.user?.apiConfig?.projectId,
    region:    req.user?.apiConfig?.region,
  });

  res.json({ success: true, recommendation: result.text, demo: result.demo });
});

// POST /api/ai/explain-filter  — explain a filter design
exports.explainFilter = catchAsync(async (req, res) => {
  const { type, approx, order, fc, topology } = req.body;
  const fcStr = fc >= 1000 ? `${(fc/1000).toFixed(2)} kHz` : `${fc} Hz`;

  const prompt = `Explain this audio filter design to an ECE student:\n- Type: ${type}\n- Approximation: ${approx}\n- Order: ${order}\n- Cutoff: ${fcStr}\n- Topology: ${topology}\n\nCover: transfer function, component values (using R = 10kΩ), frequency response characteristics, phase behaviour, and when to choose this configuration over alternatives.`;

  const result = await askWatsonx({
    messages: [{ role: 'user', content: prompt }],
    apiKey:    req.user?.apiConfig?.ibmApiKey,
    projectId: req.user?.apiConfig?.projectId,
  });

  res.json({ success: true, explanation: result.text, demo: result.demo });
});
