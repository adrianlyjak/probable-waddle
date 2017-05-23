const { copy, lazy } = require("../sugar");
const { asBuilder, asHook, lazyProp } = require("./gameobject");
const environment = require("../environment");
const { Square, Text } = require("./basic");
const { ColliderRegister, Collidable } = require("./collidable");

const Volatile = asBuilder(() => ({
  targets: new Set(["ENEMY"]),
  name: "PROJECTILE",
  explodes(that) {
    return (that.targets && that.targets.has(this.name)) || (that.name && this.targets.has(that.name));
  },
  detectExplosion(those) {
    return those.find((that) => {
      let v = that.constructor === Volatile ? that : that.volatile;
      return this.explodes(v);
    }) !== undefined;
  }
}));

const Projectile = asBuilder(() => ({
  __lazy__: {},
  volatile: Volatile({ targets: new Set(["ENEMY"]), name: "PROJECTILE" }),
  shape: Square({ dimensions: { x: 2, y: 2 }}),
  get collisionPoint() {
    return lazyProp(this, "collisionPoint", () => Collidable.fromSquare(this.shape));
  },
  draw(c) {
    this.shape.draw(c);
  },
  events(world) {
    return ColliderRegister.register(this);
  },
  next(state, events) {
    let { x, y } = this.shape.outsideCanvas();
    if (x !== 0 || y !== 0 || this.volatile.detectExplosion(Collidable.get(this, events))) {
      return [];
    } else {
      return copy(this, {
        shape: this.shape.next(state, events)
      });
    }
  }
}));

module.exports = { Projectile, Volatile }
