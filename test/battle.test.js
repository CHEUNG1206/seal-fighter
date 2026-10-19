import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Battle, ENEMIES, PLAYER_HP, MAX_CHAKRA, GENJUTSU_SECONDS } from '../src/battle.js';
import { JUTSU, jutsuById, effectiveness, counterTo, progress, completed, ELEMENT_CYCLE } from '../src/jutsu.js';
import { sealById } from '../src/seals.js';

const castAll = (battle, id) => jutsuById(id).seals.flatMap(s => battle.seal(s));
const castEvent = events => events.find(e => e.type === 'cast');
const fresh = () => {
  const b = new Battle();
  b.start();
  return b;
};

test('every jutsu uses known seals and has a unique sequence', () => {
  for (const j of JUTSU) for (const s of j.seals) assert.ok(sealById(s), `${j.id}: ${s}`);
  assert.equal(new Set(JUTSU.map(j => j.seals.join())).size, JUTSU.length);
  const attackElements = new Set(JUTSU.filter(j => j.type === 'attack').map(j => j.element));
  assert.deepEqual(attackElements, new Set(ELEMENT_CYCLE), 'an attack for every element');
});

test('no jutsu fires halfway through another', () => {
  // A shorter sequence found inside a longer one, anywhere but its end, would
  // cast before the longer one is finished. 解 is exempt: it only works while
  // caught in a genjutsu, when nothing else can be cast.
  const castable = JUTSU.filter(j => j.type !== 'release');
  for (const short of castable) {
    for (const long of castable) {
      if (short === long) continue;
      for (let i = 0; i + short.seals.length < long.seals.length; i++) {
        const inside = short.seals.every((s, k) => long.seals[i + k] === s);
        assert.ok(!inside, `${short.id} is inside ${long.id}`);
      }
    }
  }
});

test('elements beat the next one in the cycle', () => {
  assert.equal(effectiveness('fire', 'wind'), 2);
  assert.equal(effectiveness('wind', 'fire'), 0.5);
  assert.equal(effectiveness('water', 'fire'), 2, 'the cycle wraps around');
  assert.equal(effectiveness('fire', 'earth'), 1);
  for (const e of ELEMENT_CYCLE) assert.equal(effectiveness(counterTo(e), e), 2);
});

test('progress and completion follow the latest seals', () => {
  const chidori = jutsuById('chidori'); // ox hare monkey
  assert.equal(progress([], chidori), 0);
  assert.equal(progress(['rat', 'ox', 'hare'], chidori), 2);
  assert.equal(progress(['ox', 'hare', 'rat'], chidori), 0);
  assert.equal(completed(['ox', 'hare', 'monkey'], JUTSU).id, 'chidori');
  const longer = { id: 'long', seals: ['rat', 'ox', 'hare', 'monkey'] };
  assert.equal(completed(['rat', 'ox', 'hare', 'monkey'], [chidori, longer]).id, 'long', 'the longest wins');
});

test('an attack spends chakra and damages the enemy', () => {
  const b = fresh();
  const cast = castEvent(castAll(b, 'dragonFlame')); // fire against earth: normal
  assert.equal(cast.damage, 35);
  assert.equal(b.enemy.hp, ENEMIES[0].hp - 35);
  assert.equal(b.chakra, MAX_CHAKRA - 35);
  assert.deepEqual(b.recent, [], 'seals are used up');
});

test('the counter element deals double damage and resets the charge', () => {
  const b = fresh();
  b.tick(5);
  const cast = castEvent(castAll(b, 'chidori')); // lightning beats earth
  assert.equal(cast.factor, 2);
  assert.equal(cast.damage, 60);
  assert.equal(b.charge, 0);
});

test('without enough chakra nothing is cast, and chakra comes back over time', () => {
  const b = fresh();
  castAll(b, 'waterShark'); // 60
  const events = castAll(b, 'fireball'); // 50 > 40 left
  assert.ok(events.some(e => e.type === 'noChakra'));
  assert.ok(!castEvent(events));
  assert.equal(b.chakra, MAX_CHAKRA - 60);
  b.tick(2);
  assert.equal(b.chakra, MAX_CHAKRA - 50);
  b.tick(100);
  assert.equal(b.chakra, MAX_CHAKRA, 'never above the maximum');
});

test('a wrong seal in the middle does not cast, and a restart recovers', () => {
  const b = fresh();
  assert.ok(!castEvent(['ox', 'dog', 'monkey'].flatMap(s => b.seal(s))));
  assert.ok(castEvent(['ox', 'hare', 'monkey'].flatMap(s => b.seal(s))));
});

test('healing restores health up to the maximum', () => {
  const b = fresh();
  b.tick(ENEMIES[0].chargeSeconds + 0.01); // hit for 15
  const cast = castEvent(castAll(b, 'mysticalPalm'));
  assert.equal(cast.healed, 15);
  assert.equal(b.playerHp, PLAYER_HP);
});

test('your genjutsu freezes the enemy charge for a while', () => {
  const b = fresh();
  b.tick(3);
  const before = b.charge;
  castAll(b, 'hellViewing');
  b.tick(5);
  assert.equal(b.charge, before, 'frozen');
  const events = b.tick(1.5);
  assert.ok(events.some(e => e.type === 'stunEnded'));
  b.tick(1);
  assert.ok(b.charge > before, 'charging again');
});

test('a clone dodges the next attack only', () => {
  const b = fresh();
  castAll(b, 'clone');
  assert.deepEqual(b.tick(ENEMIES[0].chargeSeconds + 0.01), [{ type: 'dodged' }]);
  assert.equal(b.playerHp, PLAYER_HP);
  assert.equal(b.tick(ENEMIES[0].chargeSeconds + 0.01)[0].type, 'hit');
});

test('an enemy genjutsu blocks every jutsu except 解', () => {
  const b = fresh();
  b.stage = 2; // the oni casts genjutsu on every second action
  b.enterStage();
  b.tick(ENEMIES[2].chargeSeconds + 0.01); // 1st: hit
  const events = b.tick(ENEMIES[2].chargeSeconds + 0.01); // 2nd: genjutsu
  assert.deepEqual(events, [{ type: 'enemyGenjutsu', seconds: GENJUTSU_SECONDS }]);
  const chakra = b.chakra;
  b.tick(2);
  assert.equal(b.chakra, chakra, 'no chakra while caught');
  assert.ok(!castEvent(castAll(b, 'chidori')), 'other jutsu fail');
  const release = castEvent(b.seal('tiger'));
  assert.equal(release.jutsu.id, 'release');
  assert.equal(b.caught, 0);
  assert.ok(castEvent(castAll(b, 'chidori')), 'free again');
});

test('解 does nothing when you are not caught', () => {
  const b = fresh();
  assert.ok(!castEvent(b.seal('tiger')));
});

test('an enemy genjutsu fades on its own', () => {
  const b = fresh();
  b.stage = 2;
  b.enterStage();
  b.tick(ENEMIES[2].chargeSeconds + 0.01);
  b.tick(ENEMIES[2].chargeSeconds + 0.01);
  const events = b.tick(GENJUTSU_SECONDS + 0.01);
  assert.ok(events.some(e => e.type === 'genjutsuFaded'));
  assert.equal(b.caught, 0);
});

test('the enemy attacks when its charge fills', () => {
  const b = fresh();
  assert.deepEqual(b.tick(ENEMIES[0].chargeSeconds + 0.01), [{ type: 'hit', damage: 15, playerHp: PLAYER_HP - 15 }]);
});

test('"none" and seals outside a fight are ignored', () => {
  const b = new Battle();
  assert.deepEqual(b.seal('snake'), [], 'not started');
  b.start();
  assert.deepEqual(b.seal('none'), []);
});

test('defeating an enemy pauses, then brings the next one', () => {
  const b = fresh();
  castAll(b, 'chidori');
  b.tick(10); // chakra back
  const events = castAll(b, 'chidori'); // 80 hp, 60 per hit
  assert.ok(events.some(e => e.type === 'defeated'));
  assert.equal(b.state, 'between');
  assert.deepEqual(b.seal('snake'), [], 'no seals during the pause');
  assert.equal(b.tick(3)[0].type, 'enemy');
  assert.equal(b.enemy.id, ENEMIES[1].id);
});

test('beating every enemy wins; running out of health loses', () => {
  const b = fresh();
  let won = null;
  for (let guard = 0; guard < 200 && !won; guard++) {
    if (b.state === 'fighting' && b.caught > 0) b.seal('tiger');
    const counter = JUTSU.find(j => j.type === 'attack' && effectiveness(j.element, b.enemy.element) === 2 && j.chakra <= b.chakra);
    if (b.state === 'fighting' && counter) won = castAll(b, counter.id).find(e => e.type === 'won');
    b.tick(1);
  }
  assert.ok(won, 'won');
  assert.equal(b.state, 'won');

  const loser = fresh();
  let lost = false;
  for (let guard = 0; guard < 500 && !lost; guard++) lost = loser.tick(1).some(e => e.type === 'lost');
  assert.ok(lost);
  assert.equal(loser.playerHp, 0);
  assert.deepEqual(loser.tick(10), [], 'nothing happens after losing');
});
