const $ = require("jquery");
const log = require("./log");

function range(start, stop, step = 1) {
  const count = Math.abs((stop - start) / step);
  return Array.from(Array(count)).map((_,i) => ((i * step) + start));
}

const gui = ({canvasShape = {x: 480, y: 320}, parentElement = 'body'}) => {

  const state = {
    keys: {
      left: false,
      right: false,
      up: false,
      down: false,
      spacebar: false
    }
  }

  var canvasElement = $("<canvas width='"+canvasShape.x+"' height='"+canvasShape.y+"'></canvas>");
  var canvas = canvasElement.get(0).getContext("2d");

  let playBtnHandler = null;
  const playBtn = $("<button>play|pause</button>");
  let reverseBtnHandler = null;
  const reverseBtn = $("<button>forward|reverse</button>");

  [canvasElement, playBtn, reverseBtn].forEach((el) => el.appendTo(parentElement));

  playBtn.click(() => { if (playBtnHandler != null) playBtnHandler(); });
  reverseBtn.click(() => { if (reverseBtnHandler != null) reverseBtnHandler(); });

  return {
    canvas, canvasShape,
    handlePlayPause(cb) {
      playBtnHandler = cb;
    },
    handleReverse(cb) {
      reverseBtnHandler = cb;
    },
    clearCanvas() {
      this.canvas.clearRect(0, 0, canvasShape.x, canvasShape.y);
    }
}};

const world = (({ gui, gameobjects }) => {
  return {
        iteration: 0,
        logSometimes(...args) {
          if (this.iteration % 30 === 0) console.log(...args);
        },
        gameobjects: gameobjects,
        gui: gui,
        state: gui.state,
        canvas: gui.canvas,
        canvasShape: gui.canvasShape,
        next() {
            const futureobjects = this.gameobjects.reduce((accumulator, gameobject, i) => {
              return accumulator.concat(gameobject.next(this));
            }, []);
            console.log("futureobjects", futureobjects);
            return Object.assign({}, this,
              { gameobjects: futureobjects, iteration: this.iteration + 1 });
        },
        draw() {
          this.gui.clearCanvas();
          this.gameobjects.forEach((_) => _.draw(this));
        }
      }
    });

const _gui = gui;
const engine = ({ scenario }) => {
  const gui = _gui({}); //configurable?
  const initialWorld = world({gameobjects: scenario.gameobjects, gui: gui})
  const state = { // mutable private state
    currentWorld: initialWorld,
    fps: 1,
    history: [initialWorld]
  };
  const instance = {
    initialize() {
      // TODO, write uninitialize function
      this.gui.handlePlayPause(() => this.playPause());
      this.gui.handleReverse(() => this.reverse());
    },
    get currentWorldIdx() { return state.history.indexOf(state.currentWorld) },
    gui: gui,
    scenario: scenario,
    gameloop({ getNextFrame }) {
      log.debug("begin looping ...");
      state.isRunning = true;
      state.loopId = setInterval(() => {
        state.currentWorld.draw();
        const next = getNextFrame(state.currentWorld);
        if (!next) {
          log.debug("no more frames");
          this.pause()
        } else {
          state.currentWorld = next;
        }

      }, 1000/state.fps);
    },
    play() {
      const frameIndex = this.currentWorldIdx;
      if (frameIndex > -1 && frameIndex <= state.history.length) {
        log.info("future state taking alternate path. Forgetting previous future");
        state.history = state.history.slice(0, frameIndex);
      }
      this.gameloop({
        getNextFrame: (currentFrame) => {
          // TODO add event stage that's passed to next()
          const events = {};
          const next = state.currentWorld.next(events);
          state.history.push(next);
          return next;
        }
      });
    },
    pause() {
      if (state.isRunning) {
        log.debug("pausing loop ...");
        clearInterval(state.loopId);
        state.isRunning = false;
      }
    },
    replay({ frames }) {
      const queue = frames.slice().map((index) => this.history[index]);
      this.gameloop({ getNextFrame(currentFrame) {
        return queue.shift();
      }})
    },
    playPause() {
      if (state.isRunning) this.pause(); else this.play({});
    },
    reverse() {
      this.replay({frames: range(this.currentWorldIdx, -1, -1)})
    }
  }
  instance.initialize();
  return instance;
};
module.exports = engine;
