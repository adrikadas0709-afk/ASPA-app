const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Name is required'],
    trim: true, minlength: 2, maxlength: 80,
  },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
  },
  password: {
    type: String, required: [true, 'Password is required'],
    minlength: 8, select: false,
  },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  apiConfig: {
    ibmApiKey:   { type: String, default: '' },
    projectId:   { type: String, default: '' },
    region:      { type: String, default: 'us-south' },
    modelId:     { type: String, default: 'ibm/granite-13b-chat-v2' },
  },
  preferences: {
    theme:     { type: String, enum: ['light', 'dark'], default: 'dark' },
    language:  { type: String, default: 'en' },
  },
  lastLogin: { type: Date },
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

// Hide sensitive fields
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  if (obj.apiConfig) delete obj.apiConfig.ibmApiKey;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
