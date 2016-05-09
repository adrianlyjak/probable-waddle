const { copy } = require("./copy");
const environment = require("./environment");

function Engine(initialState) {
  let isRunning = false;
  const engine = {
    locks: {
      renderLoop: null,
      gameLoop: null,
    },
    hook: {
      next(state, events) {
        if (events.playerDead) {
          pause(); console.log("YOU DEAD");
          engine.frame = initialState;
          play();
        } else if (events.playerWon) {
          pause(); console.log("YOU WON");
        }
      }
    },
    frame: Frame(initialState),
    play(renderFps = 30, gameFps = 30) {
      this.pause();
      isRunning = true;
      this.locks.renderLoop = setInterval(() => {
        let { x, y } = environment.getCanvasShape();
        environment.canvas.clearRect(0, 0, x, y);
        this.frame.draw(environment.canvas);
        environment.flush();
      }, 1000/renderFps);
      this.locks.gameLoop = setInterval(() => {
        this.frame = this.frame.next();
      }, 1000/gameFps);
    },
    pause() {
      if (this.locks.renderLoop) clearInterval(this.locks.renderLoop);
      if (this.locks.gameLoop) clearInterval(this.locks.gameLoop);
      isRunning = false;
    }
  }
  return engine;
}

function Frame(state) {
  console.log(state);
  return Object.freeze({
    currentState: state,
    draw(c) {
      this.currentState.forEach((e) => {
        if (e.draw) e.draw(c);
      });
    },
    next() {
      // events
      const events = this.currentState.reduce((soFar, gameobject) => {
        if (gameobject.events) {
          return copy(soFar, gameobject.events(this.currentState) || {});
        } else {
          return soFar;
        }
      }, {});

      // state
      const nextState = this.currentState.reduce((soFar, gameobject) => {
        var next = gameobject.next ? gameobject.next(this.currentState, events) : [gameobject];
        return soFar.concat(next);
      }, []);

      return copy(this, { currentState: nextState });
    }
  });
}

module.exports = Engine
