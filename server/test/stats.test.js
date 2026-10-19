import test from 'node:test';
import assert from 'node:assert/strict';
import { computeStats } from '../src/stats.js';

test('average, min, max, suggestion for numeric votes', () => {
  const s = computeStats(['3', '5', '8']);
  assert.equal(s.average, 5.3);
  assert.equal(s.min, 3);
  assert.equal(s.max, 8);
  assert.equal(s.suggested, '5');
  assert.equal(s.consensus, false);
  assert.deepEqual(s.distribution, [
    { value: '3', count: 1 },
    { value: '5', count: 1 },
    { value: '8', count: 1 },
  ]);
});

test('suggestion ties round up', () => {
  assert.equal(computeStats(['2', '3']).suggested, '3');
});

test('consensus requires identical numeric votes only', () => {
  assert.equal(computeStats(['5', '5']).consensus, true);
  assert.equal(computeStats(['5', '5', '?']).consensus, false);
  assert.equal(computeStats(['?', '?']).consensus, false);
});

test('non-numeric cards are excluded from the average', () => {
  const s = computeStats(['8', '?', '☕']);
  assert.equal(s.average, 8);
  assert.equal(s.total, 3);
});

test('no numeric votes', () => {
  const s = computeStats(['?']);
  assert.equal(s.average, null);
  assert.equal(s.suggested, null);
});
