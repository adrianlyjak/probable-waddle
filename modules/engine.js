const { copy, asArray } = require("./sugar");
const environment = require("./environment");

function Engine(initialState) {
  if (!initialState) throw new Error("falsey initial state: " + initialState)
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
    frame: Frame(initialState, () => engine),
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
    playNext(world) {
      this.pause();
      let next = Engine(world);
      next.play();
      return next;
    },
    pause() {
      if (this.locks.renderLoop) clearInterval(this.locks.renderLoop);
      if (this.locks.gameLoop) clearInterval(this.locks.gameLoop);
      isRunning = false;
    }
  }
  return engine;
}

Engine.hooks = {
  GAME_OVER: "GAME_OVER",
  GAME_WON:  "GAME_WON"
}

function Frame(state, getEngine) {
  if (!state) throw new Error("falsey state: " + state);
  return Object.freeze({
    currentState: state,
    index: 0,
    draw(c) {
      this.currentState.forEach((e) => {
        if (e.draw) e.draw(c);
      });
    },
    buildEventMap(eventBuilders, soFar = {}) {
      delete soFar.registers
      if (eventBuilders.length === 0 || eventBuilders.size === 0) return soFar;
      soFar.registers = new Map();
      const events = eventBuilders.forEach((gameobject) => {
        if (gameobject.events) {
          let events = asArray(gameobject.events(this.currentState));
          events.forEach((e) => {
            if (e.isHook) {
              e.action(getEngine());
            }
            if (e.isEventRegister) {
              if (!soFar.registers.get(e.registerBuilder)) {
                soFar.registers.set(e.registerBuilder, e.build());
              }
              const instance = soFar.registers.get(e.registerBuilder);
              asArray(e.components).forEach((e) => {
                instance.register(e)
              });
            } else {
              Object.assign(soFar, e);
            }
          });
        }
        return soFar;
      });

      return this.buildEventMap(soFar.registers, soFar);
    },
    next() {
      const events = this.buildEventMap(this.currentState)
      const nextState = this.currentState.reduce((soFar, gameobject) => {
        var next = gameobject.next ? gameobject.next(this.currentState, events) : [gameobject];
        return soFar.concat(next);
      }, []);

      return copy(this, { currentState: nextState, index: this.index + 1 });
    }
  });
}

module.exports = Engine
