const environment = require("../environment")
const { copy } = require("../sugar");
const { asBuilder } = require("./gameobject");


const Text = asBuilder(() => ({
  position: { x: 0, y: 0 },
  words: "(Filler)",
  draw(c) {
    let { x, y } = this.position;
    c.font = "20px Arial";
    c.textAlign = "center";
    c.fillText(this.words, x / 2, y / 2);
  }
}));

Text.centered = (words) => {
  let { x, y } = environment.getCanvasShape();
  return Text({ words: words, position: { x: x / 2, y: y /2 }});
}

const Square = asBuilder(() => ({
    outsideCanvas() {
      let canv = environment.getCanvasShape();
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

module.exports = { Square, Text }
