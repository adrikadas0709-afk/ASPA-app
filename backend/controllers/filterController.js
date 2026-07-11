const { generateBode, calcComponents, calcMetrics } = require('../services/filterService');
const { AppError, catchAsync } = require('../utils/AppError');

const VALID_TYPES  = ['Low-Pass', 'High-Pass', 'Band-Pass', 'Notch'];
const VALID_APPROX = ['Butterworth', 'Chebyshev'];

// POST /api/filter/calculate
exports.calculate = catchAsync(async (req, res) => {
  const {
    fc       = 1000,
    bw       = 500,
    order    = 2,
    type     = 'Low-Pass',
    approx   = 'Butterworth',
    ripple   = 1,
    refR     = 10000,
  } = req.body;

  // Validate
  if (!VALID_TYPES.includes(type))   throw new AppError(`Invalid filter type: ${type}`, 400);
  if (!VALID_APPROX.includes(approx)) throw new AppError(`Invalid approximation: ${approx}`, 400);
  if (fc < 1 || fc > 100000)         throw new AppError('Cutoff frequency must be between 1 Hz and 100 kHz', 400);
  if (order < 1 || order > 8)        throw new AppError('Filter order must be 1–8', 400);

  const bodeData   = generateBode({ fc, bw, order, type, approx, ripple });
  const components = calcComponents({ fc, order, type, refR });
  const metrics    = calcMetrics({ fc, order, type, approx, ripple, bw });

  res.json({
    success: true,
    input: { fc, bw, order, type, approx, ripple },
    bodeData,
    components,
    metrics,
    formulae: buildFormulae(type, approx, fc, order, ripple),
  });
});

// POST /api/filter/batch  — calculate multiple filter configs at once
exports.batchCalculate = catchAsync(async (req, res) => {
  const { filters } = req.body;
  if (!Array.isArray(filters) || filters.length > 6) {
    throw new AppError('Provide an array of 1–6 filter configurations', 400);
  }

  const results = filters.map(f => {
    const fc    = f.fc    || 1000;
    const order = f.order || 2;
    const type  = VALID_TYPES.includes(f.type) ? f.type : 'Low-Pass';
    const approx= VALID_APPROX.includes(f.approx) ? f.approx : 'Butterworth';

    return {
      id:     f.id || `filter_${Date.now()}`,
      label:  f.label || `${type} ${fc}Hz`,
      bode:   generateBode({ fc, bw: f.bw, order, type, approx, ripple: f.ripple }),
      metrics: calcMetrics({ fc, order, type, approx }),
    };
  });

  res.json({ success: true, results });
});

function buildFormulae(type, approx, fc, order, ripple) {
  const fc_str = fc >= 1000 ? `${(fc / 1000).toFixed(2)} kHz` : `${fc} Hz`;
  const base = {
    cutoff:  `f_c = 1 / (2π × R × C) = ${fc_str}`,
    rolloff: `Roll-off = ${order * 20} dB/decade (order ${order})`,
  };

  if (approx === 'Butterworth') {
    base.transfer = `|H(jω)|² = 1 / (1 + (ω/ωc)^${2 * order})`;
    base.sallen   = `Sallen-Key: H(s) = ωn² / (s² + (ωn/Q)s + ωn²)`;
  } else {
    const eps = Math.sqrt(Math.pow(10, ripple / 10) - 1).toFixed(4);
    base.transfer = `|H(jω)|² = 1 / (1 + ε²·T${order}²(ω/ωc)),  ε = ${eps}`;
    base.ripple   = `Passband ripple = ${ripple} dB`;
  }

  if (type === 'Band-Pass') {
    base.q = `Q = f₀ / BW`;
    base.center = `Center frequency: ωn = √(ω1 × ω2)`;
  }

  return base;
}
