const Project  = require('../models/Project');
const { AppError, catchAsync } = require('../utils/AppError');

// GET /api/projects
exports.getProjects = catchAsync(async (req, res) => {
  const { tool, tag, search, favorite, page = 1, limit = 20 } = req.query;
  const filter = { user: req.user._id };

  if (tool)     filter.tool = tool;
  if (tag)      filter.tags = tag;
  if (favorite === 'true') filter.isFavorite = true;
  if (search)   filter.$or = [
    { name:        { $regex: search, $options: 'i' } },
    { description: { $regex: search, $options: 'i' } },
    { notes:       { $regex: search, $options: 'i' } },
    { tags:        { $regex: search, $options: 'i' } },
  ];

  const skip  = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const total = await Project.countDocuments(filter);
  const projects = await Project.find(filter)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  res.json({
    success: true,
    total,
    page:  parseInt(page),
    pages: Math.ceil(total / parseInt(limit)),
    projects,
  });
});

// POST /api/projects
exports.createProject = catchAsync(async (req, res) => {
  const { name, tool, description, tags, color, notes, params, results, designData } = req.body;
  if (!name || !tool) throw new AppError('Name and tool are required', 400);

  const project = await Project.create({
    user: req.user._id, name, tool, description, tags, color, notes, params, results, designData,
  });
  res.status(201).json({ success: true, project });
});

// GET /api/projects/:id
exports.getProject = catchAsync(async (req, res, next) => {
  const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
  if (!project) throw new AppError('Project not found', 404);
  res.json({ success: true, project });
});

// PUT /api/projects/:id
exports.updateProject = catchAsync(async (req, res, next) => {
  const allowed = ['name', 'tool', 'description', 'tags', 'color', 'notes', 'params', 'results', 'designData', 'isFavorite'];
  const update  = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) update[f] = req.body[f]; });

  const project = await Project.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    update,
    { new: true, runValidators: true }
  );
  if (!project) throw new AppError('Project not found', 404);
  res.json({ success: true, project });
});

// DELETE /api/projects/:id
exports.deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!project) throw new AppError('Project not found', 404);
  res.json({ success: true, message: 'Project deleted' });
});

// PATCH /api/projects/:id/favorite
exports.toggleFavorite = catchAsync(async (req, res, next) => {
  const project = await Project.findOne({ _id: req.params.id, user: req.user._id });
  if (!project) throw new AppError('Project not found', 404);
  project.isFavorite = !project.isFavorite;
  await project.save();
  res.json({ success: true, isFavorite: project.isFavorite });
});

// GET /api/projects/tags
exports.getTags = catchAsync(async (req, res) => {
  const tags = await Project.distinct('tags', { user: req.user._id });
  res.json({ success: true, tags: tags.filter(Boolean).sort() });
});
