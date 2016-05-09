const { copy } = require("./copy");

function Engine(environment, initialState) {
  let frame = Frame(initialState);
  let intervalId;
  let isRunning = false;
  return {
    play(fps = 30) {
      this.pause();
      isRunning = true;
      intervalId = setInterval(() => {
        let { x, y } = environment.getCanvasShape();
        environment.canvas.clearRect(0, 0, x, y);
        frame.draw(environment.canvas);
        environment.flush();
        frame = frame.next();
      }, 1000/fps);
    },
    pause() {
      if (intervalId) clearInterval(intervalId);
      isRunning = false;
    }
  }

}

function Frame(state) {
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
