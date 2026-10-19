import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, ENEMIES, PLAYER_HP } from '../src/battle.js';
import { JUTSU, effectiveness, counterTo, progress, ELEMENT_CYCLE } from '../src/jutsu.js';
import { sealById } from '../src/seals.js';

const byId = id => JUTSU.find(j => j.id === id);
const castAll = (battle, jutsu) => jutsu.seals.flatMap(s => battle.seal(s));

test('every jutsu uses known seals and has a unique sequence', () => {
  for (const j of JUTSU) for (const s of j.seals) assert.ok(sealById(s), `${j.id}: ${s}`);
  assert.equal(new Set(JUTSU.map(j => j.seals.join())).size, JUTSU.length);
  assert.deepEqual(new Set(JUTSU.map(j => j.element)), new Set(ELEMENT_CYCLE));
});

test('elements beat the next one in the cycle', () => {
  assert.equal(effectiveness('fire', 'wind'), 2);
  assert.equal(effectiveness('wind', 'fire'), 0.5);
  assert.equal(effectiveness('water', 'fire'), 2, 'the cycle wraps around');
  assert.equal(effectiveness('fire', 'earth'), 1);
  for (const e of ELEMENT_CYCLE) assert.equal(effectiveness(counterTo(e), e), 2);
});

test('progress counts how much of a jutsu the latest seals match', () => {
  const ember = byId('ember'); // snake horse boar
  assert.equal(progress([], ember), 0);
  assert.equal(progress(['snake'], ember), 1);
  assert.equal(progress(['rat', 'snake', 'horse'], ember), 2);
  assert.equal(progress(['snake', 'horse', 'rat'], ember), 0);
  assert.equal(progress(['snake', 'horse', 'boar'], ember), 3);
});

test('completing a sequence casts and damages the enemy', () => {
  const b = new Battle();
  b.start();
  const events = castAll(b, byId('ember')); // fire against earth: normal
  const cast = events.find(e => e.type === 'cast');
  assert.equal(cast.damage, 25);
  assert.equal(b.enemy.hp, ENEMIES[0].hp - 25);
  assert.deepEqual(b.recent, [], 'seals are used up');
});

test('a wrong seal in the middle does not cast', () => {
  const b = new Battle();
  b.start();
  const events = ['snake', 'dog', 'boar'].flatMap(s => b.seal(s));
  assert.ok(!events.some(e => e.type === 'cast'));
});

test('a mistake can be recovered by starting the sequence again', () => {
  const b = new Battle();
  b.start();
  const events = ['snake', 'dog', 'snake', 'horse', 'boar'].flatMap(s => b.seal(s));
  assert.equal(events.filter(e => e.type === 'cast').length, 1);
});

test('the counter element deals double damage and resets the charge', () => {
  const b = new Battle();
  b.start();
  b.tick(5);
  const cast = castAll(b, byId('spark')).find(e => e.type === 'cast'); // lightning beats earth
  assert.equal(cast.factor, 2);
  assert.equal(cast.damage, 50);
  assert.equal(b.charge, 0);
});

test('the enemy attacks when its charge fills', () => {
  const b = new Battle();
  b.start();
  const events = b.tick(ENEMIES[0].chargeSeconds + 0.01);
  assert.deepEqual(events, [{ type: 'hit', damage: 15, playerHp: PLAYER_HP - 15 }]);
});

test('"none" and seals outside a fight are ignored', () => {
  const b = new Battle();
  assert.deepEqual(b.seal('snake'), [], 'not started');
  b.start();
  assert.deepEqual(b.seal('none'), []);
});

test('defeating an enemy pauses, then brings the next one', () => {
  const b = new Battle();
  b.start();
  castAll(b, byId('spark'));
  const events = castAll(b, byId('spark')); // 60 hp, 50 per hit
  assert.ok(events.some(e => e.type === 'defeated'));
  assert.equal(b.state, 'between');
  assert.deepEqual(b.seal('snake'), [], 'no seals during the pause');
  assert.deepEqual(b.tick(1), []);
  const next = b.tick(2);
  assert.equal(next[0].type, 'enemy');
  assert.equal(b.enemy.name, ENEMIES[1].name);
  assert.equal(b.charge, 0);
});

test('beating every enemy wins; running out of hp loses', () => {
  const b = new Battle();
  b.start();
  let won = null;
  for (let guard = 0; guard < 50 && !won; guard++) {
    const counter = JUTSU.find(j => effectiveness(j.element, b.enemy.element) === 2);
    won = castAll(b, counter).find(e => e.type === 'won');
    b.tick(3);
  }
  assert.ok(won, 'won');
  assert.equal(b.state, 'won');

  const loser = new Battle();
  loser.start();
  let lost = false;
  for (let guard = 0; guard < 500 && !lost; guard++) lost = loser.tick(1).some(e => e.type === 'lost');
  assert.ok(lost);
  assert.equal(loser.playerHp, 0);
  assert.deepEqual(loser.tick(10), [], 'nothing happens after losing');
});
