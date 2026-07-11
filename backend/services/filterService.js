/**
 * ASPA Filter Calculator Service
 * All signal processing math lives here — no external deps.
 */

const TWO_PI = 2 * Math.PI;

// ── Generic helpers ──────────────────────────────────────────────────────────
const log10 = (x) => Math.log(x) / Math.LN10;
const dB = (h2) => 10 * log10(Math.max(h2, 1e-20));

// ── Butterworth magnitude-squared ────────────────────────────────────────────
function bwLPF(f, fc, n)  { return 1 / (1 + Math.pow(f / fc, 2 * n)) }
function bwHPF(f, fc, n)  { return 1 / (1 + Math.pow(fc / f, 2 * n)) }
function bwBPF(f, f0, bw, n) {
  const Q = f0 / bw, r = f / f0 - f0 / f;
  return 1 / (1 + Math.pow(Q * r, 2 * n));
}
function bwNotch(f, f0, bw, n) { return 1 - bwBPF(f, f0, bw, n); }

// ── Chebyshev Type-I ────────────────────────────────────────────────────────
function chebyI(f, fc, n, rippleDb) {
  const eps = Math.sqrt(Math.pow(10, rippleDb / 10) - 1);
  const x = f / fc;
  const Tn = x <= 1 ? Math.cos(n * Math.acos(x)) : Math.cosh(n * Math.acosh(x));
  return 1 / (1 + eps * eps * Tn * Tn);
}

// ── Phase (LPF Butterworth) ───────────────────────────────────────────────────
function phaseLPF(f, fc, n) { return -n * Math.atan(f / fc) * 180 / Math.PI; }
function phaseHPF(f, fc, n) { return n * (90 - Math.atan(f / fc) * 180 / Math.PI); }

// ── Bode data generation ─────────────────────────────────────────────────────
function generateBode({ fc, bw = fc / 2, order = 2, type, approx, ripple = 1 }) {
  const points = [];
  for (let i = 0; i <= 300; i++) {
    const f  = 10 * Math.pow(22000 / 10, i / 300);
    let  h2  = 1;

    if (approx === 'Chebyshev') {
      h2 = type === 'High-Pass' ? chebyI(fc, f, order, ripple) : chebyI(f, fc, order, ripple);
    } else {
      if (type === 'Low-Pass')   h2 = bwLPF(f, fc, order);
      else if (type === 'High-Pass')  h2 = bwHPF(f, fc, order);
      else if (type === 'Band-Pass')  h2 = bwBPF(f, fc, bw, order);
      else if (type === 'Notch')      h2 = bwNotch(f, fc, bw, order);
    }

    const phase = type === 'High-Pass' ? phaseHPF(f, fc, order) : phaseLPF(f, fc, order);

    points.push({
      freqHz:      parseFloat(f.toFixed(2)),
      magnitudeDb: parseFloat(Math.max(dB(h2), -80).toFixed(2)),
      phaseDb:     parseFloat(phase.toFixed(1)),
    });
  }
  return points;
}

// ── Component calculator (Sallen-Key, R = 10kΩ reference) ──────────────────
function calcComponents({ fc, order, type = 'Low-Pass' }) {
  const R = 10000;
  const C = 1 / (TWO_PI * fc * R);
  const stages = [];

  for (let i = 1; i <= Math.ceil(order / 2); i++) {
    const Qi = order >= 2
      ? 1 / (2 * Math.sin(((2 * i - 1) * Math.PI) / (2 * order)))
      : 0.5;

    stages.push({
      stage:    i,
      topology: 'Sallen-Key',
      R1:       `${(R / 1000).toFixed(1)} kΩ`,
      R2:       `${(R / 1000).toFixed(1)} kΩ`,
      C1:       `${(C * 1e9).toFixed(2)} nF`,
      C2:       `${(C * 1e9 * (order >= 2 ? 1 / (4 * Qi * Qi) : 1)).toFixed(2)} nF`,
      Q:        order >= 2 ? Qi.toFixed(3) : '0.500',
    });
  }
  return stages;
}

// ── Key metrics ──────────────────────────────────────────────────────────────
function calcMetrics({ fc, order, type, approx = 'Butterworth', ripple = 1, bw }) {
  const rolloff = order * 20;
  let magAtFc;

  if (approx === 'Chebyshev') {
    magAtFc = dB(chebyI(fc, fc, order, ripple));
  } else {
    if (type === 'Low-Pass')  magAtFc = dB(bwLPF(fc, fc, order));
    else if (type === 'High-Pass') magAtFc = dB(bwHPF(fc, fc, order));
    else if (type === 'Band-Pass') magAtFc = dB(bwBPF(fc, fc, bw || fc / 2, order));
    else magAtFc = dB(bwNotch(fc, fc, bw || fc / 2, order));
  }

  return {
    rolloffDb:         rolloff,
    rolloffLabel:      `${rolloff} dB/decade`,
    magnitudeAtFc:     parseFloat(magAtFc.toFixed(2)),
    attenuationAt2Fc:  parseFloat((rolloff * log10(2)).toFixed(1)),
    groupDelay:        parseFloat((order / (TWO_PI * fc)).toFixed(6)),
    qualityFactor:     bw ? parseFloat((fc / bw).toFixed(3)) : null,
  };
}

module.exports = { generateBode, calcComponents, calcMetrics };
