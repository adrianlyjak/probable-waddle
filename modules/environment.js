const Canvas = require("drawille-canvas");
const { copy } = require("./copy")

function Environment() {
  let listeners = [];

  function onKeyPress (keyName) {
    listeners.forEach(l => l(keyName));
  }

  const canvas = new Canvas();
  const c = canvas.getContext('2d');
  c.font = '17px sans-serif';

  let Constructor = (typeof document !== "undefined") ? BrowserEnvironment : CLIEnvironment
  let subinstance = Constructor(c, onKeyPress)

  return copy(subinstance, {
    registerKeyListener(cb) {
      listeners.push(cb);
    },
    removeKeyListener(cb) {
      listeners = listeners.filter((x) => x !== cb);
    },
    canvas: c,
    c: c
  });
}

function BrowserEnvironment(c /*: Canvas */, onKeyPress /*: String => Unit */) {
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
    getCanvasShape() {
      return { x: c.canvas.width, y: c.canvas.height }
    }
  }
}

function CLIEnvironment(c /*: Canvas*/, onKeyPress /*: String => Unit */) {

  const stdin = process.stdin;
  const keyMap = new Map([
    ["\u001B\u005B\u0041", "up"],
    ["\u001B\u005B\u0043", "right"],
    ["\u001B\u005B\u0042", "down"],
    ["\u001B\u005B\u0044", "left"],
    ["\u0020",             "space"],
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
    getCanvasShape() {
      return { x: c.width, y: c.height }
    }
  }
}

module.exports = Environment
