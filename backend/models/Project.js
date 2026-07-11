const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', required: true, index: true,
  },
  name:        { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 500 },
  tool: {
    type: String,
    enum: [
      'AI Assistant', 'Circuit Troubleshooter', 'Filter Designer',
      'Amplifier Designer', 'Audio Analyzer', 'Frequency Response Plotter',
      'Equalizer', 'Circuit Designer',
    ],
    required: true,
  },
  tags:   { type: [String], default: [] },
  color:  { type: String, default: '#3b82f6' },
  notes:  { type: String, trim: true, maxlength: 2000 },
  params: { type: mongoose.Schema.Types.Mixed, default: {} },
  results:{ type: mongoose.Schema.Types.Mixed, default: {} },
  // Linked audio file
  audioFile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AudioFile',
  },
  // Filter/amplifier specific design data
  designData: {
    filterType:  String,
    order:       Number,
    approx:      String,
    fc:          Number,
    components:  mongoose.Schema.Types.Mixed,
    topology:    String,
    // Amplifier
    ampClass:    String,
    gain:        Number,
    gainDb:      Number,
    supplyV:     Number,
    loadOhm:     Number,
  },
  isFavorite: { type: Boolean, default: false },
  isPublic:   { type: Boolean, default: false },
}, { timestamps: true });

projectSchema.index({ user: 1, createdAt: -1 });
projectSchema.index({ user: 1, tool: 1 });
projectSchema.index({ tags: 1 });

module.exports = mongoose.model('Project', projectSchema);
