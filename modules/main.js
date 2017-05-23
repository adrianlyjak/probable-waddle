const environment      = require("./environment");
const levels           = require("./gamecomponents/levels");
const Engine           = require("./engine");

const initialState = levels.testLevel;
const engine = Engine(initialState);
engine.play(60,60);
