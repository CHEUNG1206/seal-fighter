// The rules of a fight, with no drawing or camera code, so they can be tested.
// The page calls tick() every frame and seal() whenever a seal is formed, and
// reacts to the events they return.
import { JUTSU, effectiveness, progress, completed } from './jutsu.js';

// pattern: the enemy's actions in order, repeating. 'attack' deals damage,
// 'heavy' charges 1.5× longer and hits twice as hard, 'genjutsu' traps the
// player. Each enemy also has one special trait, triggered once when its
// health falls below `at` (a fraction of its maximum):
//   harden  – grows armour that absorbs `shield` damage
//   decoy   – a water clone that takes the next attack in its place
//   enrage  – charges `speed` times faster and hits `damage` harder
//   phase   – changes element and pattern (the final boss)
export const ENEMIES = [
  { id: 'golem', element: 'earth', hp: 80, chargeSeconds: 14, damage: 15,
    pattern: ['attack'], harden: { at: 0.5, shield: 30 } },
  { id: 'wraith', element: 'water', hp: 110, chargeSeconds: 12, damage: 20,
    pattern: ['attack', 'attack', 'genjutsu'], decoy: { at: 0.6 } },
  { id: 'oni', element: 'fire', hp: 140, chargeSeconds: 10, damage: 25,
    pattern: ['attack', 'genjutsu'], enrage: { at: 0.4, speed: 1.5, damage: 10 } },
  { id: 'tengu', element: 'lightning', hp: 180, chargeSeconds: 11, damage: 22,
    pattern: ['attack', 'attack', 'heavy'],
    phase: { at: 0.5, element: 'wind', pattern: ['genjutsu', 'attack', 'heavy', 'attack'] } },
];

// Enemy speed and damage multipliers.
export const DIFFICULTIES = {
  easy: { speed: 0.75, damage: 0.7 },
  normal: { speed: 1, damage: 1 },
  hard: { speed: 1.3, damage: 1.3 },
};

export const PLAYER_HP = 100;
export const MAX_CHAKRA = 100;
// Slow on purpose: big jutsu should be a decision, not something to spam.
export const CHAKRA_PER_SECOND = 2;
// An enemy's genjutsu wears off on its own after this long if not released.
export const GENJUTSU_SECONDS = 10;
const PAUSE_BETWEEN_ENEMIES = 3; // seconds
const MAX_RECENT = 8;
const HEAVY = { charge: 1.5, damage: 2 };
// An attack pushes the enemy's charge back by this fraction; a
// super-effective attack resets it.
const STAGGER = 0.35;

// S/A/B/C from the health left and the seconds spent fighting.
export function rankFor({ playerHp, seconds }) {
  const score = playerHp * 2 + Math.max(0, 400 - seconds);
  if (score >= 450) return 'S';
  if (score >= 330) return 'A';
  if (score >= 220) return 'B';
  return 'C';
}

export class Battle {
  constructor({ enemies = ENEMIES, jutsu = JUTSU, difficulty = 'normal' } = {}) {
    this.enemies = enemies;
    this.jutsu = jutsu;
    this.difficulty = difficulty;
    this.tuning = DIFFICULTIES[difficulty] ?? DIFFICULTIES.normal;
    this.state = 'ready'; // ready → fighting ⇄ between → won | lost
  }

  start() {
    this.playerHp = PLAYER_HP;
    this.chakra = MAX_CHAKRA;
    this.stage = 0;
    this.casts = 0;
    this.elapsed = 0;
    this.enterStage();
    return [{ type: 'enemy', enemy: this.enemy }];
  }

  enterStage() {
    const e = this.enemies[this.stage];
    this.enemy = { ...e, maxHp: e.hp };
    this.charge = 0; // 0 → 1, acts at 1
    this.attacks = 0;
    this.recent = [];
    this.stunned = 0; // seconds the enemy stays caught in your genjutsu
    this.caught = 0; // seconds you stay caught in the enemy's genjutsu
    this.cloneReady = false;
    this.shield = 0; // armour from `harden`
    this.decoy = false; // a water clone from `decoy`
    this.enraged = false;
    this.phased = false;
    this.triggered = new Set();
    this.pause = 0;
    this.state = 'fighting';
  }

  // The enemy's next action, shown to the player in advance.
  get intent() {
    const pattern = this.enemy.pattern;
    return pattern[this.attacks % pattern.length];
  }

  // How hard the next action will hit, for the intent display.
  get intentDamage() {
    const e = this.enemy;
    const base = e.damage + (this.enraged ? e.enrage.damage : 0);
    const damage = Math.round(base * this.tuning.damage);
    return this.intent === 'heavy' ? damage * HEAVY.damage : damage;
  }

  get chargeSeconds() {
    const e = this.enemy;
    const speed = this.tuning.speed * (this.enraged ? e.enrage.speed : 1);
    return (e.chargeSeconds / speed) * (this.intent === 'heavy' ? HEAVY.charge : 1);
  }

  // Jutsu that can be cast right now: only 解 while caught in a genjutsu,
  // everything else otherwise.
  get available() {
    return this.jutsu.filter(j => (this.caught > 0) === (j.type === 'release'));
  }

  get progressByJutsu() {
    const available = this.available;
    return Object.fromEntries(this.jutsu.map(j => [j.id, available.includes(j) ? progress(this.recent, j) : 0]));
  }

  // Advance time by dt seconds.
  tick(dt) {
    const events = [];
    if (this.state === 'between') {
      this.pause -= dt;
      if (this.pause <= 0) {
        this.stage++;
        this.enterStage();
        events.push({ type: 'enemy', enemy: this.enemy });
      }
      return events;
    }
    if (this.state !== 'fighting') return events;

    this.elapsed += dt;
    if (this.caught > 0) {
      this.caught -= dt;
      if (this.caught <= 0) {
        this.caught = 0;
        this.recent = [];
        events.push({ type: 'genjutsuFaded' });
      }
    } else {
      this.chakra = Math.min(MAX_CHAKRA, this.chakra + CHAKRA_PER_SECOND * dt);
    }

    if (this.stunned > 0) {
      this.stunned = Math.max(0, this.stunned - dt);
      if (this.stunned === 0) events.push({ type: 'stunEnded' });
      return events;
    }

    this.charge += dt / this.chargeSeconds;
    if (this.charge >= 1) {
      this.charge = 0;
      events.push(...this.enemyActs());
    }
    return events;
  }

  enemyActs() {
    const action = this.intent;
    const damage = this.intentDamage;
    this.attacks++;
    if (action === 'genjutsu' && this.caught === 0) {
      this.caught = GENJUTSU_SECONDS;
      this.recent = [];
      return [{ type: 'enemyGenjutsu', seconds: GENJUTSU_SECONDS }];
    }
    if (this.cloneReady) {
      this.cloneReady = false;
      return [{ type: 'dodged', heavy: action === 'heavy' }];
    }
    this.playerHp = Math.max(0, this.playerHp - damage);
    const events = [{ type: 'hit', damage, playerHp: this.playerHp, heavy: action === 'heavy' }];
    if (this.playerHp === 0) {
      this.state = 'lost';
      events.push({ type: 'lost' });
    }
    return events;
  }

  // The player formed `sealId`. Returns events, including a cast when the
  // recent seals complete a jutsu.
  seal(sealId) {
    if (this.state !== 'fighting' || sealId === 'none') return [];
    this.recent = [...this.recent, sealId].slice(-MAX_RECENT);
    const events = [{ type: 'seal', seal: sealId, progress: this.progressByJutsu }];
    const done = completed(this.recent, this.available);
    if (done) events.push(...this.cast(done));
    return events;
  }

  cast(jutsu) {
    this.recent = [];
    if (this.chakra < jutsu.chakra) {
      return [{ type: 'noChakra', jutsu, chakra: this.chakra }];
    }
    this.chakra -= jutsu.chakra;
    this.casts++;
    const cast = { type: 'cast', jutsu };

    if (jutsu.type === 'heal') {
      const before = this.playerHp;
      this.playerHp = Math.min(PLAYER_HP, this.playerHp + jutsu.power);
      return [{ ...cast, healed: this.playerHp - before }];
    }
    if (jutsu.type === 'genjutsu') {
      this.stunned = jutsu.power;
      return [{ ...cast, seconds: jutsu.power }];
    }
    if (jutsu.type === 'clone') {
      this.cloneReady = true;
      return [cast];
    }
    if (jutsu.type === 'release') {
      this.caught = 0;
      return [cast];
    }
    return this.attack(jutsu, cast);
  }

  attack(jutsu, cast) {
    const factor = effectiveness(jutsu.element, this.enemy.element);
    if (this.decoy) {
      // The water clone takes the whole hit and bursts.
      this.decoy = false;
      return [{ ...cast, damage: 0, factor, enemyHp: this.enemy.hp }, { type: 'decoyPopped' }];
    }
    let damage = Math.round(jutsu.power * factor);
    const events = [];
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, damage);
      this.shield -= absorbed;
      damage -= absorbed;
      events.push({ type: this.shield === 0 ? 'shieldBroken' : 'shieldHit', absorbed });
    }
    this.enemy.hp = Math.max(0, this.enemy.hp - damage);
    this.charge = factor > 1 ? 0 : Math.max(0, this.charge - STAGGER);
    events.unshift({ ...cast, damage, factor, enemyHp: this.enemy.hp });

    if (this.enemy.hp === 0) {
      events.push({ type: 'defeated', enemy: this.enemy });
      if (this.stage === this.enemies.length - 1) {
        this.state = 'won';
        const result = { casts: this.casts, seconds: this.elapsed, playerHp: this.playerHp };
        events.push({ type: 'won', ...result, rank: rankFor(result) });
      } else {
        this.state = 'between';
        this.pause = PAUSE_BETWEEN_ENEMIES;
      }
      return events;
    }
    return [...events, ...this.checkTraits()];
  }

  // Special traits fire once, when health first falls below their threshold.
  checkTraits() {
    const e = this.enemy;
    const below = (name) => e[name] && !this.triggered.has(name) && e.hp <= e.maxHp * e[name].at
      && this.triggered.add(name);
    const events = [];
    if (below('harden')) {
      this.shield = e.harden.shield;
      events.push({ type: 'harden', shield: this.shield });
    }
    if (below('decoy')) {
      this.decoy = true;
      events.push({ type: 'decoy' });
    }
    if (below('enrage')) {
      this.enraged = true;
      events.push({ type: 'enraged' });
    }
    if (below('phase')) {
      this.phased = true;
      e.element = e.phase.element;
      e.pattern = e.phase.pattern;
      this.attacks = 0;
      this.charge = 0;
      events.push({ type: 'phase', element: e.element });
    }
    return events;
  }
}
