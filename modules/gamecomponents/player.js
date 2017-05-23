const { copy, lazy } = require("../sugar");
const { asBuilder, asHook, lazyProp } = require("./gameobject");
const environment = require("../environment");
const { Square, Text } = require("./basic");
const { ColliderRegister, Collidable } = require("./collidable");
const { Projectile, Volatile } = require("./projectile");

const { sqrt, pow } = Math;

const Player = asBuilder({
    __lazy__: {},
    volatile: Volatile({ targets: new Set(["ENEMY"]), name: "PLAYER" }),
    shape: Square({
      position: { x: environment.getCanvasShape().x / 2, y: environment.getCanvasShape().y },
      dimensions: { x: 5, y: 5 },
      velocity: { x: 0, y: 0 },
    }),
    destroyed: false,
    get collisionPoint() {
      return lazyProp(this, "collisionPoint", () => Collidable.fromSquare(this.shape));
    },
    projectileCooldown: 0,
    limit({x,y}) {
      let max = 2;
      let min = max * -1;
      function ranged(s) {
        return Math.max(Math.min(s, max), min);
      }
      return { x: ranged(x), y: ranged(y) }
    },
    events(world) {
      if (this.destroyed) {
        return asHook((engine) => {
          let { x, y } = environment.getCanvasShape();
          engine.playNext([Text.centered("You Lost")]);
        });
      } else {
        return ColliderRegister.register(this);
      }
    },
    next(state, events) {
      if (this.destroyed) {
        return [];
      } else {
        let ks = events.keystate;
        let acc = { x: 0, y: 0 };

        if (ks.left)  acc.x -= 2;
        if (ks.right) acc.x += 2;
        if (ks.up)    acc.y -= 2;
        if (ks.down)  acc.y += 2;
        let outside = this.shape.outsideCanvas();
        let bearing = this.shape.bearing();
        let bounceX = outside.x !== 0 && bearing.x === outside.x ? 0 : 1;
        let bounceY = outside.y !== 0 && bearing.y === outside.y ? 0 : 1;
        let vel = this.shape.velocity;
        let nextVel = this.limit({ x: (vel.x + acc.x) * bounceX, y: (vel.y + acc.y) * bounceY });

        let nextShape = copy(this.shape, { velocity: nextVel }).next(state, events);
        let next = copy(this, {
          shape: nextShape,
          projectileCooldown: Math.max(0, this.projectileCooldown - 1),
          destroyed: this.destroyed || this.volatile.detectExplosion(Collidable.get(this, events))
        });
        if (ks.space && this.projectileCooldown === 0) {
          return next.withProjectile();
        } else {
          return [next];
        }
      }
    },
    withProjectile() {
      console.log("projectile fired!");
      let {x: px, y: py} = this.shape.position
      let projectile = Projectile({
        volatile: Volatile({ targets: new Set(["ENEMY"]), name: "PROJECTILE" }),
        shape: {
          velocity: { x: this.shape.velocity.x, y: -4 },
          position: { x: px, y: py - this.collisionPoint.r - 0.01}
        }
      });
      return [copy(this, { projectileCooldown: 7 }), projectile]
    },
    draw(c) {
      this.shape.draw(c);
    }
  });

module.exports = { Player }
