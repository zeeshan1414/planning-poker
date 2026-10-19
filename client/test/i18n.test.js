import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { messages, LANGUAGES, detectLanguage, translate, translateError } from '../src/lib/messages.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (dir) =>
  fs.readdirSync(dir, { recursive: true })
    .filter((f) => /\.jsx?$/.test(f))
    .map((f) => fs.readFileSync(path.join(dir, f), 'utf8'))
    .join('\n');

const placeholders = (s) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test('every language has exactly the English keys and placeholders', () => {
  const enKeys = Object.keys(messages.en).sort();
  for (const { code } of LANGUAGES) {
    assert.deepEqual(Object.keys(messages[code]).sort(), enKeys, `${code} keys`);
    for (const key of enKeys) {
      assert.deepEqual(placeholders(messages[code][key]), placeholders(messages.en[key]), `${code}:${key} placeholders`);
    }
  }
});

test('every t() key used in the client exists', () => {
  const src = read(path.join(here, '../src'));
  const used = [...src.matchAll(/\bt\('([\w.]+)'/g)].map((m) => m[1]);
  assert.ok(used.length > 30);
  for (const key of used) assert.ok(key in messages.en, `missing key ${key}`);
});

test('every server and client error message has a Japanese translation', () => {
  const sources = [read(path.join(here, '../../server/src')), read(path.join(here, '../src/lib'))].join('\n');
  const literals = [
    ...[...sources.matchAll(/new RoomError\('([^']+)'\)/g)].map((m) => m[1]),
    ...[...sources.matchAll(/(?:setToast|setError)\('([^']+)'\)|\?\? '([^']+)'\)/g)].map((m) => m[1] ?? m[2]),
  ];
  assert.ok(literals.length > 10);
  for (const msg of literals) assert.notEqual(translateError('ja', msg), msg, `untranslated: ${msg}`);

  assert.equal(translateError('ja', 'Name is required'), '名前は必須です');
  assert.equal(translateError('ja', 'Story must be at most 200 characters'), 'ストーリーは200文字以内で入力してください');
  assert.equal(translateError('ja', 'Room name must be text'), 'ルーム名はテキストで入力してください');
  assert.equal(translateError('en', 'Invalid card'), 'Invalid card');
});

test('translate interpolates and falls back', () => {
  assert.equal(translate('ja', 'controls.voted', { voted: 2, total: 3 }), '3 人中 2 人が投票済み');
  assert.equal(translate('en', 'controls.voted', { voted: 2, total: 3 }), '2 of 3 voted');
  assert.equal(translate('xx', 'stats.min'), 'Min');
  assert.equal(translate('en', 'no.such.key'), 'no.such.key');
});

test('language detection', () => {
  assert.equal(detectLanguage('ja', ['en-US']), 'ja');
  assert.equal(detectLanguage(null, ['ja-JP', 'en']), 'ja');
  assert.equal(detectLanguage(null, ['fr-FR', 'en-GB']), 'en');
  assert.equal(detectLanguage('bogus', ['de']), 'en');
});
