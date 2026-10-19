// The rules of a fight, with no drawing or camera code, so they can be tested.
// The page calls tick() every frame and seal() whenever a seal is formed, and
// reacts to the events they return.
import { JUTSU, BASE_DAMAGE, effectiveness, progress } from './jutsu.js';

export const ENEMIES = [
  { name: '泥偶', title: 'Clay Golem', element: 'earth', hp: 60, chargeSeconds: 14, damage: 15 },
  { name: '水妖', title: 'Water Wraith', element: 'water', hp: 90, chargeSeconds: 12, damage: 20 },
  { name: '炎鬼', title: 'Flame Oni', element: 'fire', hp: 120, chargeSeconds: 10, damage: 25 },
];

export const PLAYER_HP = 100;
const PAUSE_BETWEEN_ENEMIES = 2.5; // seconds
const MAX_RECENT = 6;
// A cast pushes the enemy's charge back by this fraction; a super-effective
// cast resets it.
const STAGGER = 0.35;

export class Battle {
  constructor({ enemies = ENEMIES, jutsu = JUTSU } = {}) {
    this.enemies = enemies;
    this.jutsu = jutsu;
    this.state = 'ready'; // ready → fighting ⇄ between → won | lost
  }

  start() {
    this.playerHp = PLAYER_HP;
    this.stage = 0;
    this.casts = 0;
    this.elapsed = 0;
    this.enterStage();
    return [{ type: 'enemy', enemy: this.enemy }];
  }

  enterStage() {
    const e = this.enemies[this.stage];
    this.enemy = { ...e, maxHp: e.hp };
    this.charge = 0; // 0 → 1, attacks at 1
    this.recent = [];
    this.pause = 0;
    this.state = 'fighting';
  }

  get progressByJutsu() {
    return Object.fromEntries(this.jutsu.map(j => [j.id, progress(this.recent, j)]));
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
    this.charge += dt / this.enemy.chargeSeconds;
    if (this.charge >= 1) {
      this.charge = 0;
      this.playerHp = Math.max(0, this.playerHp - this.enemy.damage);
      events.push({ type: 'hit', damage: this.enemy.damage, playerHp: this.playerHp });
      if (this.playerHp === 0) {
        this.state = 'lost';
        events.push({ type: 'lost' });
      }
    }
    return events;
  }

  // The player formed `sealId`. Returns events, including a cast when the
  // recent seals complete a jutsu.
  seal(sealId) {
    if (this.state !== 'fighting' || sealId === 'none') return [];
    this.recent = [...this.recent, sealId].slice(-MAX_RECENT);
    const events = [{ type: 'seal', seal: sealId, progress: this.progressByJutsu }];

    const done = this.jutsu.find(j => progress(this.recent, j) === j.seals.length);
    if (done) events.push(...this.cast(done));
    return events;
  }

  cast(jutsu) {
    const factor = effectiveness(jutsu.element, this.enemy.element);
    const damage = Math.round(BASE_DAMAGE * factor);
    this.enemy.hp = Math.max(0, this.enemy.hp - damage);
    this.charge = factor > 1 ? 0 : Math.max(0, this.charge - STAGGER);
    this.recent = [];
    this.casts++;
    const events = [{ type: 'cast', jutsu, damage, factor, enemyHp: this.enemy.hp }];

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
