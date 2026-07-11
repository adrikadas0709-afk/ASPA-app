const fs        = require('fs');
const path      = require('path');
const AudioFile = require('../models/AudioFile');
const { estimateFromMetadata, buildAnalysisPrompt } = require('../services/audioService');
const { askWatsonx } = require('../services/watsonxService');
const { AppError, catchAsync } = require('../utils/AppError');

// POST /api/audio/upload
exports.upload = catchAsync(async (req, res, next) => {
  if (!req.file) throw new AppError('No audio file uploaded', 400);

  const { originalname, filename, mimetype, size, path: filePath } = req.file;

  // Create DB record
  const audioFile = await AudioFile.create({
    user:         req.user ? req.user._id : undefined,
    originalName: originalname,
    storedName:   filename,
    mimeType:     mimetype,
    sizeBytes:    size,
    path:         filePath,
    metadata: {
      format:  path.extname(originalname).slice(1).toUpperCase(),
      codec:   mimetype.split('/')[1] || 'unknown',
    },
    'analysis.status': 'pending',
  });

  // Kick off analysis asynchronously (don't await)
  analyzeAsync(audioFile._id, req.user).catch(console.error);

  res.status(201).json({
    success: true,
    message: 'File uploaded. Analysis is running in the background.',
    audioFile: {
      id:           audioFile._id,
      originalName: audioFile.originalName,
      mimeType:     audioFile.mimeType,
      sizeBytes:    audioFile.sizeBytes,
      status:       'pending',
    },
  });
});

// GET /api/audio/:id
exports.getAnalysis = catchAsync(async (req, res, next) => {
  const query = req.user ? { _id: req.params.id, user: req.user._id } : { _id: req.params.id };
  const audioFile = await AudioFile.findOne(query);
  if (!audioFile) throw new AppError('Audio file not found', 404);
  res.json({ success: true, audioFile });
});

// GET /api/audio
exports.listFiles = catchAsync(async (req, res) => {
  const query = req.user ? { user: req.user._id } : { user: { $exists: false } }; // Return anonymous files if not logged in
  const files = await AudioFile.find(query)
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();
  res.json({ success: true, files });
});

// DELETE /api/audio/:id
exports.deleteFile = catchAsync(async (req, res, next) => {
  const query = req.user ? { _id: req.params.id, user: req.user._id } : { _id: req.params.id };
  const audioFile = await AudioFile.findOne(query);
  if (!audioFile) throw new AppError('Audio file not found', 404);

  // Delete physical file
  if (fs.existsSync(audioFile.path)) {
    fs.unlinkSync(audioFile.path);
  }
  await AudioFile.deleteOne({ _id: audioFile._id });
  res.json({ success: true, message: 'File deleted' });
});

// ── Background analysis ───────────────────────────────────────────────────────
async function analyzeAsync(fileId, user) {
  try {
    await AudioFile.findByIdAndUpdate(fileId, { 'analysis.status': 'processing' });

    const doc      = await AudioFile.findById(fileId);
    const metadata = doc.metadata || {};

    // Run signal analysis
    const analysisData = estimateFromMetadata(metadata);

    // Get AI recommendations
    const prompt     = buildAnalysisPrompt(analysisData, metadata);
    const aiResult   = await askWatsonx({
      messages: [{ role: 'user', content: prompt }],
      apiKey:    user?.apiConfig?.ibmApiKey,
      projectId: user?.apiConfig?.projectId,
      region:    user?.apiConfig?.region,
      modelId:   user?.apiConfig?.modelId,
    });

    await AudioFile.findByIdAndUpdate(fileId, {
      'analysis.status':             'done',
      'analysis.snrDb':              analysisData.snrDb,
      'analysis.rmsDb':              analysisData.rmsDb,
      'analysis.peakDb':             analysisData.peakDb,
      'analysis.dynamicRangeDb':     analysisData.dynamicRangeDb,
      'analysis.dcOffsetV':          analysisData.dcOffsetV,
      'analysis.clippingDetected':   analysisData.clippingDetected,
      'analysis.clippingSamples':    analysisData.clippingSamples,
      'analysis.noiseFloorDb':       analysisData.noiseFloorDb,
      'analysis.thdPercent':         analysisData.thdPercent,
      'analysis.spectralCentroid':   analysisData.spectralCentroid,
      'analysis.dominantFreqHz':     analysisData.dominantFreqHz,
      'analysis.bandEnergy':         analysisData.bandEnergy,
      'analysis.waveformData':       analysisData.waveformData,
      'analysis.spectrumData':       analysisData.spectrumData,
      'analysis.aiRecommendations':  aiResult.text,
      'analysis.processedAt':        new Date(),
    });
  } catch (err) {
    await AudioFile.findByIdAndUpdate(fileId, {
      'analysis.status': 'error',
      'analysis.error':  err.message,
    });
  }
}
