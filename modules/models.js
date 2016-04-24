import $ from "jquery";
import { buildFrom, createBuilders } from "./classless";

const models = createBuilders({
  gameobject() {
    return {
      next() {
        return [this];
      },
      draw(world) { /*no-op*/ },
    }
  },
  color() { return {
      r: 0, g: 0, b: 0, a: 1,
      toCss() {
        return `rgba(${this.r}, ${this.g}, ${this.b}, ${this.a})`;
      }
    }
  },
  bouncingRectangle() {
    return buildFrom(models.gameobject(), {
      position: {x: 0,y: 0},
      velocity: {x: 1,y: 1},
      dimensions: {x: 20,y: 20},
      color: models.color({g:100}),
      next(world) {
        const handleWorldEdges = (getDimension) => {
          const position_ = getDimension(this.position),
                velocity_ = getDimension(this.velocity),
                max_ = getDimension(world.canvasShape),
                dimension_ = getDimension(this.dimensions);
          const maybeReverse = (velocity_ > 0 && (position_ + dimension_ * 2 >= max_)) || (velocity_ < 0 && position_ - (dimension_ * 2) <= 0) ? -1 : 1
          return velocity_ * maybeReverse;
        }
        const nextOne = buildFrom(this, {
          position: { x: this.position.x + this.velocity.x, y: this.position.y + this.velocity.y },
          velocity: {
            x: handleWorldEdges((shape) => shape.x),
            y: handleWorldEdges((shape) => shape.y)
          }
        });
        const outer = this;
        const ghost = models.ghost({
          gameobject: this,
          animation(self) {
            const alpha = (self.iteration % 10 === 0) ? self.progress() * 0.5 : 0;
            return { color: buildFrom(outer.color, { a: alpha }) };
          }
        });
        return [ghost, nextOne];
      },
      draw({ canvas }) {
        canvas.fillStyle = this.color.toCss();
        canvas.fillRect(this.position.x, this.position.y, this.dimensions.x, this.dimensions.y);
      }
    });
  },
  ghost() {
    return buildFrom(models.gameobject(), {
      gameobject: models.gameobject(),
      iteration: 0,
      lifespan: 100,
      progress() { return (this.lifespan - this.iteration) / this.lifespan },
      animation(self) { return {} },
      buildGhostObject() {
        return buildFrom(this.gameobject, this.animation(this));
      },
      next() {
        if (this.iteration >= this.lifespan) { return []; }
        else { return [buildFrom(this, { iteration: this.iteration + 1 })]; }
      },
      draw(world) {
        this.buildGhostObject().draw(world);
      }
    })
  },

});

export default models;
