import { buildFrom, createBuilders, factory } from "./classless";
import $ from "jquery";


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
        gameobjects: gameobjects,
        gui: gui,
        state: gui.state,
        canvas: gui.canvas,
        canvasShape: gui.canvasShape,
        next() {
            const futureobjects = this.gameobjects.reduce((accumulator, gameobject) => {
              return accumulator.concat(gameobject.next(this) || []);
            }, []);
            return buildFrom(
              this,
              { gameobjects: futureobjects, iteration: this.iteration + 1 });
        },
        draw() {
          gui.clearCanvas();
          this.gameobjects.forEach((_) => _.draw(this));
        }
      }
    });

const _gui = gui;
const engine = ({ scenario, gui = _gui({}) }) => {
  const engine0 = {
    history: [],
    gui: gui,
    scenario: scenario,
    state: { },
    gameloop({fps = 30, getNextFrame}) {
      const state = this.state;
      if (state.isRunning) {
        clearInterval(state.loopId);
        state.isRunning = false;
      }
      if (fps > 0) {
        state.isRunning = true;
        if (!state.currentWorld) { // lazy initialize world from scenario
          state.currentWorld = world({
            gameobjects: scenario.gameobjects, gui: gui
          });
          this.history.push(state.currentWorld);
        }
        state.loopId = setInterval(() => {
          state.currentWorld.draw();
          const next = getNextFrame(state.currentWorld);
          if (!next) {
            console.log("no more frames");
            this.pause()
          } else {
            state.currentWorld = next;
          }

        }, 1000/fps);
      }
    },
    currentWorldIdx() {
      return this.history.indexOf(this.state.currentWorld)
    },
    play({ fps = 30 }) {
      const frameIndex = this.currentWorldIdx();
      if (frameIndex > -1 && frameIndex >= this.history.length) {
        console.log("future state taking alternate path. Forgetting previous future");
        this.history = this.history.slice(0, frameIndex);
      }
      this.gameloop({
        fps: fps,
        getNextFrame: (currentFrame) => {
          // TODO add event stage that's passed to next()
          const events = {};
          const next = this.state.currentWorld.next(events);
          this.history.push(next);
          return next;
        }
      })
    },
    pause() {
      this.gameloop({fps: 0});
    },
    replay({ frames, fps }) {
      const queue = frames.slice(0).map((index) => this.history[index]);
      this.gameloop({fps: fps, getNextFrame(currentFrame) {
        return queue.shift();
      }})
    },
    playPause() {
      if (this.state.isRunning) {
        this.pause();
      } else {
        this.play({});
      }
    },
    reverse() {
      this.replay({frames: range(this.currentWorldIdx(), -1, -1)})
    }
  }

  gui.handlePlayPause(() => engine0.playPause());
  gui.handleReverse(() => engine0.reverse());
  return engine0;
};

export default engine;
