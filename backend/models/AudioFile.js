const mongoose = require('mongoose');

const audioFileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', index: true,
  },
  originalName:  { type: String, required: true },
  storedName:    { type: String, required: true },
  mimeType:      { type: String, required: true },
  sizeBytes:     { type: Number, required: true },
  path:          { type: String, required: true },
  // Extracted metadata
  metadata: {
    duration:    Number,   // seconds
    sampleRate:  Number,
    channels:    Number,
    bitDepth:    Number,
    bitrate:     Number,
    codec:       String,
    format:      String,
  },
  // Analysis results (populated by the analysis service)
  analysis: {
    status: {
      type: String,
      enum: ['pending', 'processing', 'done', 'error'],
      default: 'pending',
    },
    snrDb:            Number,
    rmsDb:            Number,
    peakDb:           Number,
    dynamicRangeDb:   Number,
    dcOffsetV:        Number,
    clippingDetected: Boolean,
    clippingSamples:  Number,
    noiseFloorDb:     Number,
    thdPercent:       Number,
    spectralCentroid: Number,
    dominantFreqHz:   Number,
    // Frequency band energy (dBFS)
    bandEnergy: {
      subBass:    Number,
      bass:       Number,
      lowMid:     Number,
      mid:        Number,
      highMid:    Number,
      presence:   Number,
      brilliance: Number,
    },
    // Waveform data (downsampled to ~500 points)
    waveformData: [Number],
    // Spectrum data (log-spaced bins)
    spectrumData: [{
      freqHz: Number,
      powerDb: Number,
    }],
    // AI-generated recommendations
    aiRecommendations: String,
    processedAt: Date,
    error: String,
  },
}, { timestamps: true });

audioFileSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('AudioFile', audioFileSchema);
