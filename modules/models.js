const { copy, maybe } = require("./copy")
const option = require("option");

module.exports = (environment) => {
  function TestLevel() {
    return [Player(), KeyState()];
  }

  function Square(config) {
    return copy({
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
        return { x: (v.x > 0) ? 1 : -1, y: (v.y > 0) ? 1 : -1 }
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
    }, config);
  }

  function Player() { return {
      shape: Square({
        dimensions: { x: 5, y: 5 },
        velocity: { x: 1, y: 1 }
      }),
      projectileCooldown: 0,
      limit({x,y}) {
        let max = 4;
        let min = max * -1;
        function ranged(s) {
          return Math.max(Math.min(s, max), min);
        }
        return { x: ranged(x), y: ranged(y) }
      },
      next(state, events) {
        let ks = events.keystate;
        let acc = { x: 0, y: 0 };

        if (ks.left)  acc.x -= (acc.x > 0) ? 4 : 2;
        if (ks.right) acc.x += (acc.x < 0) ? 4 : 2;
        if (ks.up)    acc.y -= (acc.y > 0) ? 4 : 2;
        if (ks.down)  acc.y += (acc.x < 0) ? 4 : 2;
        let outside = this.shape.outsideCanvas()
        let bearing = this.shape.bearing();
        let bounceX = outside.x !== 0 && bearing.x === outside.x ? -0.25 : 1;
        let bounceY = outside.y !== 0 && bearing.y === outside.y ? -0.25 : 1;
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
          shape: Square({
            velocity: { x: 0, y: -10 },
            position: this.shape.position,
            dimensions: {x: 3, y: 3 }
          })
        });
        return [copy(this, { projectileCooldown: 10 }), projectile]
      },
      draw(c) {
        this.shape.draw(c);
      }
    }
  }

  function KeyState() {
    const emptystate = {
      left: false, right: false, up: false, down: false, space: false
    };
    let mutableState = Object.assign({}, emptystate);

    let instance = {
      initialize() {
        environment.registerKeyListener((keyName) => {
          mutableState[keyName] = true;
        });
      },
      keystate: emptystate,
      events() {
        return { keystate: this.keystate };
      },
      next(state, events) {
        const newState = mutableState;
        mutableState = Object.assign({}, emptystate); // reset
        return copy(this, { keystate: newState });
      }
    };
    instance.initialize();
    return instance;
  }

  function Projectile(config) {
    return copy({
      shape: Square({ dimensions: {x: 1, y: 1 }}),
      draw(c) {
        this.shape.draw(c);
      },
      next(state, events) {
        let { x, y } = this.shape.outsideCanvas()
        if (x !== 0 || y !== 0) {
          return [];
        } else {
          return copy(this, {
            shape: this.shape.next(events, state)
          });
        }
      }
    }, config)
  }
  return {
    TestLevel, Player, KeyState
  }
}
