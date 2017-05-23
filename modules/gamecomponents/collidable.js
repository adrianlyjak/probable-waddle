const { asEventRegister, asBuilder } = require("./gameobject");
const { asArray } = require("../sugar");
const { sqrt, pow } = Math

const ColliderRegister = asEventRegister(() => ({ // implements EventRegister interface
  elements: [],
  register(element) {
    this.elements.push(element);
  },
  events() {
    // detect collisions and build map;
    let collisionMap = new Map();
    for (let a of this.elements) {
      collisionMap.set(a, []);
    }
    let seen = new Set();
    for (let a of this.elements) {
      for (let b of this.elements) {
        if (a !== b && !seen.has(b)) {
          let { x: a_x, y: a_y, r: a_r } = a.collisionPoint;
          let { x: b_x, y: b_y, r: b_r } = b.collisionPoint;
          let threshold = a_r + b_r;
          let distance = sqrt(pow(a_x - b_x, 2) + pow(a_y - b_y, 2));
          if (distance <= threshold) {
            collisionMap.get(a).push(b)
            collisionMap.get(b).push(a)
          }
        }
      }
      seen.add(a);
    }
    return [{ collisionMap }];
  }
}));

const Collidable = asBuilder(() => ({
  x: 0,
  y: 0,
  r: 1,
  events(world) {
    return ColliderRegister.register(this);
  }
}));

Collidable.fromSquare = (sqr) => {
  let { x: px, y: py } = sqr.position;
  let { x: dx, y: dy } = sqr.dimensions;
  return Collidable({ x: px + dx/2, y: py + dy/2, r: dx / 2});
}

Collidable.get = (key, events) => {
  if (events.collisionMap) {
      let got = events.collisionMap.get(key);
      if (got) return got;
  }
  return [];
}

module.exports = { ColliderRegister, Collidable }
