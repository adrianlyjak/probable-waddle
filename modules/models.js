const { copy, lazy } = require("./copy");
const { asBuilder } = require("./gameobject");
const environment = require("./environment");

const Square = asBuilder(() => ({
    outsideCanvas() {
      let canv = environment.getCanvasShape()
      let { p, d } = this.shorthand();
      let rel_x, rel_y;

      if  (p.x < 0)                 { rel_x = -1; }
      else if (p.x + d.x >= canv.x) { rel_x =  1; }
      else                          { rel_x =  0; }

      if  (p.y < 0)                 { rel_y = -1; }
      else if (p.y + d.y >= canv.y) { rel_y =  1; }
      else                          { rel_y =  0; }

      return { x: rel_x, y: rel_y };
    },
    bearing() {
      let v = this.velocity
      return {
        x: v.x === 0
              ? 0
              : (v.x > 0 ? 1 : -1),
        y: v.y === 0
              ? 0
              : (v.y > 0 ? 1 : -1)
      }
    },
    position: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 },
    dimensions: { x: 5, y: 5 },
    shorthand() {
      return { p: this.position, v: this.velocity, d: this.dimensions }
    },
    next(state, events) {
      let { p, v } = this.shorthand()
      return copy(this, {
        position: { x: p.x + v.x, y: p.y + v.y }
      });
    },
    draw(c) {
      let { p, d } = this.shorthand();
      c.fillRect(p.x, p.y, d.x, d.y);
    }
  }));

const Player = asBuilder({
    shape: Square({
      position: { x: environment.getCanvasShape().x / 2, y: environment.getCanvasShape().y },
      dimensions: { x: 5, y: 5 },
      velocity: { x: 0, y: 0 }
    }),
    projectileCooldown: 0,
    limit({x,y}) {
      let max = 1;
      let min = max * -1;
      function ranged(s) {
        return Math.max(Math.min(s, max), min);
      }
      return { x: ranged(x), y: ranged(y) }
    },
    next(state, events) {
      let ks = events.keystate;
      let acc = { x: 0, y: 0 };

      if (ks.left)  acc.x -= 1;
      if (ks.right) acc.x += 1;
      if (ks.up)    acc.y -= 1;
      if (ks.down)  acc.y += 1;
      let outside = this.shape.outsideCanvas()
      let bearing = this.shape.bearing();
      let bounceX = outside.x !== 0 && bearing.x === outside.x ? 0 : 1;
      let bounceY = outside.y !== 0 && bearing.y === outside.y ? 0 : 1;
      let vel = this.shape.velocity;
      let nextVel = this.limit({ x: (vel.x + acc.x) * bounceX, y: (vel.y + acc.y) * bounceY });

      let nextShape = copy(this.shape, { velocity: nextVel }).next(state, events);
      let next = copy(this, { shape: nextShape, projectileCooldown: Math.max(0, this.projectileCooldown - 1) });
      if (ks.space && this.projectileCooldown === 0) {
        return next.withProjectile();
      } else {
        return [next];
      }
    },
    withProjectile() {
      console.log("projectile fired!");
      let projectile = Projectile({
        shape: {
          velocity: { x: 0, y: -3 },
          position: this.shape.position
        }
      });
      return [copy(this, { projectileCooldown: 15 }), projectile]
    },
    draw(c) {
      this.shape.draw(c);
    }
  });

const Projectile = asBuilder(() => ({
  shape: Square({ dimensions: { x: 2, y: 2 }}),
  draw(c) {
    this.shape.draw(c);
  },
  next(state, events) {
    let { x, y } = this.shape.outsideCanvas()
    if (x !== 0 || y !== 0) {
      return [];
    } else {
      return copy(this, {
        shape: this.shape.next(state, events)
      });
    }
  }
}));

const Enemy = asBuilder(() => ({
  shape: Square({ dimensions: { x: 8, y: 8 }, velocity: { x: 0.25, y: 0 }}),
  countdown: 0,
  horizontalDirection: 1,
  speed: 0.25,
  draw(c) {
    this.shape.draw(c);
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
  next(state, events) {
    if (events.projectileCollisions && events.projectileCollisions.has(this)) {
      return []; // health?
    } else {
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
    }
  }
}));

module.exports = { Player, Enemy }
