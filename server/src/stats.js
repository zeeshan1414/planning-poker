export const DECK = ['1', '2', '3', '5', '8', '13', '21', '?', '☕'];

const isNumeric = (v) => /^\d+$/.test(v);
const NUMERIC_CARDS = DECK.filter(isNumeric).map(Number);

export function computeStats(values) {
  const distribution = DECK.map((card) => ({
    value: card,
    count: values.filter((v) => v === card).length,
  })).filter((d) => d.count > 0);

  const nums = values.filter(isNumeric).map(Number);
  const base = { total: values.length, distribution };

  if (nums.length === 0) {
    return { ...base, average: null, min: null, max: null, suggested: null, consensus: false };
  }

  const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
  // Nearest card to the mean; ties round up (safer to over- than under-estimate).
  const suggested = NUMERIC_CARDS.reduce((best, card) => {
    const d = Math.abs(card - mean);
    const bd = Math.abs(best - mean);
    return d < bd || (d === bd && card > best) ? card : best;
  });

  return {
    ...base,
    average: Math.round(mean * 10) / 10,
    min: Math.min(...nums),
    max: Math.max(...nums),
    suggested: String(suggested),
    consensus: nums.length === values.length && nums.every((n) => n === nums[0]),
  };
}
