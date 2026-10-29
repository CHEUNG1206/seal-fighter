// The rules of a fight, with no drawing or camera code, so they can be tested.
// The page calls tick() every frame and seal() whenever a seal is formed, and
// reacts to the events they return.
import { JUTSU, effectiveness, progress, completed } from './jutsu.js';

// genjutsuEvery: every nth attack is a genjutsu instead of damage (0 = never).
export const ENEMIES = [
  { id: 'golem', element: 'earth', hp: 80, chargeSeconds: 14, damage: 15, genjutsuEvery: 0 },
  { id: 'wraith', element: 'water', hp: 110, chargeSeconds: 12, damage: 20, genjutsuEvery: 3 },
  { id: 'oni', element: 'fire', hp: 140, chargeSeconds: 10, damage: 25, genjutsuEvery: 2 },
];

export const PLAYER_HP = 100;
export const MAX_CHAKRA = 100;
// Slow on purpose: big jutsu should be a decision, not something to spam.
export const CHAKRA_PER_SECOND = 2;
// An enemy's genjutsu wears off on its own after this long if not released.
export const GENJUTSU_SECONDS = 10;
const PAUSE_BETWEEN_ENEMIES = 2.5; // seconds
// After the seals of a breath jutsu, the player has this long to blow.
export const BREATH_SECONDS = 3;
// A breath jutsu released without blowing comes out at this strength.
const WEAK_BREATH = 0.5;
// Guarding (both hands raised) takes this fraction of an attack's damage.
const GUARD_FACTOR = 0.5;
const MAX_RECENT = 8;
// An attack pushes the enemy's charge back by this fraction; a
// super-effective attack resets it.
const STAGGER = 0.35;

export class Battle {
  constructor({ enemies = ENEMIES, jutsu = JUTSU } = {}) {
    this.enemies = enemies;
    this.jutsu = jutsu;
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
    this.breath = null; // {jutsu, left} while waiting for the player to blow
    this.guarding = false;
    this.pause = 0;
    this.state = 'fighting';
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
    } else if (!this.guarding) {
      // Guarding has a price: chakra does not recover while your hands are up.
      this.chakra = Math.min(MAX_CHAKRA, this.chakra + CHAKRA_PER_SECOND * dt);
    }

    if (this.breath) {
      this.breath.left -= dt;
      if (this.breath.left <= 0) {
        const { jutsu } = this.breath;
        this.breath = null;
        events.push({ type: 'breathFaded', jutsu },
          ...this.attack(jutsu, { type: 'cast', jutsu, breathed: false }, WEAK_BREATH));
        if (this.state !== 'fighting') return events;
      }
    }

    if (this.stunned > 0) {
      this.stunned = Math.max(0, this.stunned - dt);
      if (this.stunned === 0) events.push({ type: 'stunEnded' });
      return events;
    }

    this.charge += dt / this.enemy.chargeSeconds;
    if (this.charge >= 1) {
      this.charge = 0;
      events.push(...this.enemyActs());
    }
    return events;
  }

  enemyActs() {
    this.attacks++;
    const e = this.enemy;
    if (e.genjutsuEvery && this.attacks % e.genjutsuEvery === 0 && this.caught === 0) {
      this.caught = GENJUTSU_SECONDS;
      this.recent = [];
      return [{ type: 'enemyGenjutsu', seconds: GENJUTSU_SECONDS }];
    }
    if (this.cloneReady) {
      this.cloneReady = false;
      return [{ type: 'dodged' }];
    }
    const damage = this.guarding ? Math.round(e.damage * GUARD_FACTOR) : e.damage;
    this.playerHp = Math.max(0, this.playerHp - damage);
    const events = [{ type: 'hit', damage, playerHp: this.playerHp, guarded: this.guarding }];
    if (this.playerHp === 0) {
      this.state = 'lost';
      events.push({ type: 'lost' });
    }
    return events;
  }

  // The player formed `sealId`. Returns events, including a cast when the
  // recent seals complete a jutsu.
  seal(sealId) {
    // While a breath jutsu waits to be blown out, seals are ignored.
    if (this.state !== 'fighting' || sealId === 'none' || this.breath) return [];
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
    if (jutsu.breath) {
      this.breath = { jutsu, left: BREATH_SECONDS };
      return [{ type: 'breathReady', jutsu, seconds: BREATH_SECONDS }];
    }
    return this.attack(jutsu, cast);
  }

  // The player hands are raised (pose) or the guard key is held.
  setGuard(on) {
    this.guarding = Boolean(on) && this.state === 'fighting';
  }

  // The player opened their mouth (or pressed the breath key) in time.
  breathe() {
    if (this.state !== 'fighting' || !this.breath) return [];
    const { jutsu } = this.breath;
    this.breath = null;
    return this.attack(jutsu, { type: 'cast', jutsu, breathed: true });
  }

  attack(jutsu, cast, strength = 1) {
    const factor = effectiveness(jutsu.element, this.enemy.element);
    const damage = Math.round(jutsu.power * factor * strength);
    this.enemy.hp = Math.max(0, this.enemy.hp - damage);
    this.charge = factor > 1 ? 0 : Math.max(0, this.charge - STAGGER);
    const events = [{ ...cast, damage, factor, enemyHp: this.enemy.hp }];

    if (this.enemy.hp === 0) {
      events.push({ type: 'defeated', enemy: this.enemy });
      if (this.stage === this.enemies.length - 1) {
        this.state = 'won';
        events.push({ type: 'won', casts: this.casts, seconds: this.elapsed, playerHp: this.playerHp });
      } else {
        this.state = 'between';
        this.pause = PAUSE_BETWEEN_ENEMIES;
      }
    }
    return events;
  }
}
