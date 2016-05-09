const Environment     = require("./environment");
const models           = require("./models")
const Engine          = require("./engine")

const env = Environment();
const initialState = models(env).TestLevel();
const engine = Engine(env, initialState);
engine.play();
