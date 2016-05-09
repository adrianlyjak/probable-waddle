const environment = require("./environment");
const { KeyState } = require("./keystate");
const { Enemy, Player } = require("./models");

module.exports = {
  testLevel: [Player(), KeyState.origin,
      Enemy({ shape: { position: { x: 20,  y: 20 }}}),
      Enemy({ shape: { position: { x: 40,  y: 20 }}}),
      Enemy({ shape: { position: { x: 60,  y: 20 }}}),
      Enemy({ shape: { position: { x: 80,  y: 20 }}}),
      Enemy({ shape: { position: { x: 100, y: 20 }}}),
      Enemy({ shape: { position: { x: 120, y: 20 }}}),
      Enemy({ shape: { position: { x: 140, y: 20 }}}),
      Enemy({ shape: { position: { x: 160, y: 20 }}}),
      Enemy({ shape: { position: { x: 20,  y: 40 }}}),
      Enemy({ shape: { position: { x: 40,  y: 40 }}}),
      Enemy({ shape: { position: { x: 60,  y: 40 }}}),
      Enemy({ shape: { position: { x: 80,  y: 40 }}}),
      Enemy({ shape: { position: { x: 100, y: 40 }}}),
      Enemy({ shape: { position: { x: 120, y: 40 }}}),
      Enemy({ shape: { position: { x: 140, y: 40 }}}),
      Enemy({ shape: { position: { x: 160, y: 40 }}}),
      Enemy({ shape: { position: { x: 20,  y: 60 }}}),
      Enemy({ shape: { position: { x: 40,  y: 60 }}}),
      Enemy({ shape: { position: { x: 60,  y: 60 }}}),
      Enemy({ shape: { position: { x: 80,  y: 60 }}}),
      Enemy({ shape: { position: { x: 100, y: 60 }}}),
      Enemy({ shape: { position: { x: 120, y: 60 }}}),
      Enemy({ shape: { position: { x: 140, y: 60 }}}),
      Enemy({ shape: { position: { x: 160, y: 60 }}}),
    ]
}
