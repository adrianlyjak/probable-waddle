var Canvas = require("drawille-canvas");

let fps = 30;

const canvas = new Canvas();
const c = canvas.getContext('2d');
c.font = '17px sans-serif';


const listeners = [];
function registerKeyListener(cb) {
    listeners.push(cb);
}
function onKeyPress (keyName) {
  listeners.forEach(l => l(keyName));
}

const { flush, canvasShape } = (function(c, onKeyPress) {
  /** Browser **/
  if (typeof document !== "undefined") {
    function setCanvas() {
      c.canvas.width = window.innerWidth - 20;
      c.canvas.height = window.innerHeight - 20;
    }
    window.addEventListener("resize", setCanvas);
    document.body.appendChild(c.canvas);

    const keyMap = new Map([
      [32, "space"], [37, "left"], [38, "up"], [39, "right"], [40, "down"]
    ]);
    document.addEventListener("keydown", function (e) {
      const keyName = keyMap.get(e.keyCode);
      if (keyName) onKeyPress(keyName);
    });

    return {
      flush() {},
      canvasShape(c) {
        return { x: c.canvas.width, y: c.canvas.height }
      }
    }
  } else {
    const stdin = process.stdin;
    const keyMap = new Map([
      ["\u001B\u005B\u0041", "up"],
      ["\u001B\u005B\u0043", "right"],
      ["\u001B\u005B\u0042", "down"],
      ["\u001B\u005B\u0044", "left"],
      ["\u0020", "space"],
    ]);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');

    stdin.on('data', function(key){
      if ( key === '\u0003' ) process.exit();
      const keyName = keyMap.get(key)
      if (keyName) {
        onKeyPress(keyName);
      }
    });
    let count = 0;
    return {
      flush() {
        console.log(c.toString());
      },
      canvasShape(c) {
        return { x: c.width, y: c.height }
      }
    }
  }
})(c, onKeyPress);


function copy(...objects) {
  return Object.freeze(Object.assign({}, ...objects));
}

function draw(previousState, c) {

  // events
  const events = previousState.reduce((soFar, gameobject) => {
    if (gameobject.events) {
      return copy(soFar, gameobject.events(previousState) || {});
    } else {
      return soFar;
    }
  }, {});

  // state
  const currentState = previousState.reduce((soFar, gameobject) => {
    var next = gameobject.next ? gameobject.next(previousState, events) : [gameobject];
    return soFar.concat(next);
  }, []);

  // draw
  currentState.forEach((e) => {
    if (e.draw) e.draw(c);
  });

  return currentState;
}

function createWorld() {
  return [Player(), KeyState()];
}

function Player() { return {
    position: { x: 0, y: 0 },
    velocity: { x: 1, y: 1 },
    dimensions: { x: 5, y: 5 },
    limit({x,y}) {
      let max = 4;
      let min = max * -1;
      function ranged(s) {
        return Math.max(Math.min(s, max), min);
      }
      return { x: ranged(x), y: ranged(y) }
    },
    next(state, events) {
      let pos = this.position;
      let vel = this.velocity;
      let dim = this.dimensions;
      let ks = events.keystate;
      let acc = { x: 0, y: 0 };
      if (ks.left)  acc.x -= (acc.x > 0) ? 4 : 2;
      if (ks.right) acc.x += (acc.x < 0) ? 4 : 2;
      if (ks.up)    acc.y -= (acc.y > 0) ? 4 : 2;
      if (ks.down)  acc.y += (acc.x < 0) ? 4 : 2;
      let canv = canvasShape(c)
      let reverseX =  (vel.x < 0 && pos.x < 0) ||
                      (vel.x > 0 && pos.x + dim.x >= canv.x)
                        ? -0.25 : 1;
      let reverseY =  (vel.y < 0 && pos.y < 0) ||
                      (vel.y > 0 && pos.y + dim.y >= canv.y)
                        ? -0.25 : 1;
      let nextVel = this.limit({ x: (vel.x + acc.x) * reverseX, y: (vel.y + acc.y) * reverseY })
      let next = [copy(this, {
        position: { x: pos.x + nextVel.x, y: pos.y + nextVel.y },
        velocity: nextVel
      })];
      return next;
    },
    draw(c) {
      c.fillStyle = "#333333";
      let pos = this.position;
      let dim = this.dimensions;
      c.fillRect(pos.x, pos.y, dim.x, dim.y);
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
      registerKeyListener((keyName) => mutableState[keyName] = true);
    },
    keystate: emptystate,
    events() {
      return { keystate: this.keystate };
    },
    next() {
      const newState = mutableState;
      mutableState = Object.assign({}, emptystate); // reset
      return copy(this, { keystate: newState });
    }
  };
  instance.initialize();
  return instance;
}


let world = createWorld();
setInterval(() => {
  c.clearRect(0, 0, canvas.width, canvas.height);
  world = draw(world, c);
  flush();
}, 1000/fps);
