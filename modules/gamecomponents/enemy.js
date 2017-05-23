const environment = require("../environment");
const { copy } = require("../sugar");
const { asEventRegister, asBuilder, asHook, lazyProp } = require("./gameobject");
const { Square, Text } = require("./basic");
const { Collidable, ColliderRegister } = require("./collidable");
const { Projectile, Volatile } = require("./projectile");


const EnemyRegister = asEventRegister(() => ({
  enemies: [],
  register(element) {
    this.enemies.push(element);
  },
  events(world) {
    return {
      enemies: this.enemies
    }
  }
}));

const WinIfEnemiesDead = asBuilder(() => ({
  hasWon: false,
  events(world) {
    if (this.hasWon) {
      return asHook((engine) => engine.playNext([Text.centered("You Won!")]))
    }
  },
  next(world, events) {
    return copy(this, { hasWon: !events.enemies || events.enemies.length === 0 })
  }
}));

function randomCountdown() {
  return Math.ceil(Math.random() * 500) + 80;
}

const Enemy = asBuilder(() => ({
  __lazy__: {},
  shape: Square({ dimensions: { x: 8, y: 8 }, velocity: { x: 0.25, y: 0 }}),
  volatile: Volatile({ targets: new Set(["PLAYER"]), name: "ENEMY" }),
  firingCountdown: -1,
  get collisionPoint() {
    return lazyProp(this, "collisionPoint", () => Collidable.fromSquare(this.shape));
  },
  countdown: 0,
  horizontalDirection: 1,
  speed: 0.25,
  draw(c) {
    this.shape.draw(c);
  },
  events(world) {
    return [ColliderRegister.register(this), EnemyRegister.register(this)];
  },
  isAtHorizontalLimit() {
    let p = this.shape.position;
    return this.countdown === 0 && (
      (this.horizontalDirection > 0 && environment.getCanvasShape().x - p.x <= 20) ||
      (this.horizontalDirection < 0 && p.x <= 20));
  },
  isAtVerticalLimit() {
    return this.countdown === 1;
  },
  continuePath(state, events) {
    if (this.isAtHorizontalLimit()) {
      return copy(this, {
        shape: copy(
          this.shape,
          { velocity: { y: this.speed * 1, x: 0 }}
        ).next(state, events),
        horizontalDirection: this.horizontalDirection * -1,
        countdown: 40,
      });
    } else if (this.isAtVerticalLimit()) {
        return copy(this, {
          countdown: 0,
          shape: copy(
            this.shape,
            { velocity: { y: 0, x: this.speed * this.horizontalDirection }}
          ).next(state, events)
        });
    } else {
      return copy(this, {
        shape: this.shape.next(state, events),
        countdown: Math.max(0, this.countdown - 1)
      });
    }
  },
  withProjectile() {
    let projectile = [];
    if (this.firingCountdown === 0) {
      let { x: px, y: py } = this.shape.position;
      projectile.push(Projectile({
        volatile: Volatile({ targets: new Set(["PLAYER"]), name: "PROJECTILE" }),
        shape: {
          velocity: { x: this.shape.velocity.x * 2, y: 4 },
          position: { x: px, y: py + this.collisionPoint.r + 20}
        }
      }));
    }
    let nextCountdown = this.firingCountdown <= 0 ? randomCountdown() : this.firingCountdown - 1;
    return projectile.concat(copy(this, { firingCountdown: nextCountdown }));
  },
  next(state, events) {
    if (this.volatile.detectExplosion(Collidable.get(this, events))) {
      console.log(this, "boom");
      return []; // health?
    } else {
      return this.continuePath(state, events).withProjectile();
    }
  }
}));

module.exports = { Enemy, WinIfEnemiesDead }
