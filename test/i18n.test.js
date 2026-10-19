import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STRINGS, LANGUAGES, t, setLang, getLang } from '../src/i18n.js';
import { JUTSU } from '../src/jutsu.js';
import { ENEMIES } from '../src/battle.js';
import { SEALS } from '../src/seals.js';
import { POSES } from '../src/poses.js';
import { readFileSync } from 'node:fs';

const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort();

test('every language has every key, with the same placeholders', () => {
  const keys = Object.keys(STRINGS.en);
  for (const { id } of LANGUAGES) {
    assert.deepEqual(Object.keys(STRINGS[id]).sort(), [...keys].sort(), `${id} keys`);
    for (const key of keys) assert.deepEqual(placeholders(STRINGS[id][key]), placeholders(STRINGS.en[key]), `${id} ${key}`);
  }
});

test('names exist for every jutsu, enemy, element, type and seal in every language', () => {
  for (const { id } of LANGUAGES) {
    for (const j of JUTSU) assert.ok(j.name[id], `${j.id} ${id}`);
    for (const e of ENEMIES) assert.ok(STRINGS[id][`enemy.${e.id}`], `${e.id} ${id}`);
    for (const j of JUTSU) {
      assert.ok(STRINGS[id][`type.${j.type}`], `type ${j.type} ${id}`);
      if (j.element) assert.ok(STRINGS[id][`el.${j.element}`], `element ${j.element} ${id}`);
    }
    for (const s of SEALS) assert.ok(STRINGS[id][`animal.${s.id}`], `${s.id} ${id}`);
  }
});

test('every key used in the pages and scripts exists', () => {
  const files = ['index.html', 'trainer.html', 'src/game.js', 'src/trainer.js', 'src/camera.js']
    .map(f => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8')).join('\n');
  const used = new Set([
    ...[...files.matchAll(/data-i18n(?:-html|-title)?="([\w.]+)"/g)].map(m => m[1]),
    ...[...files.matchAll(/\bt\('([\w.]+)'/g)].map(m => m[1]),
  ]);
  for (const key of used) assert.ok(key in STRINGS.en, key);
});

test('t fills in values and follows the chosen language', () => {
  const before = getLang();
  setLang('en');
  assert.equal(t('label.stage', { n: 2, total: 3 }), 'Battle 2 / 3');
  setLang('ja');
  assert.equal(t('label.stage', { n: 2, total: 3 }), '第 2 / 3 戦');
  setLang('yue');
  assert.equal(t('msg.hit', { enemy: '炎鬼', n: 25 }), '炎鬼出手！你受咗 25 點傷害');
  assert.equal(t('no.such.key'), 'no.such.key');
  setLang(before);
});

test('there is a hint pose for every seal', () => {
  for (const s of SEALS.filter(s => s.id !== 'none')) {
    assert.equal(POSES[s.id]?.length, 2, s.id);
    for (const hand of POSES[s.id]) assert.equal(hand.length, 21);
  }
});
