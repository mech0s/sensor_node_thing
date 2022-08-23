// server.js
// Required steps to create a servient for creating a thing
const Servient = require('@node-wot/core').Servient;
const HttpServer = require('@node-wot/binding-http').HttpServer;
const { SenseHat } = require('pi-sense-hat');
const envTd = require("./sense_hat_env.td.json");
const thresholdTd = require("./sense_hat_thresholds.td.json");

let pressure_state = null;
let humidity_state = null;
let temperature_state = null;
let temperature_threshold = 44;
let humidity_threshold = 31;
let filter = 0.4;
let temperature_xbase = () => temperature_threshold - 4;
let humidity_ybase = () => humidity_threshold - 4;
const clamp07 = (num) => Math.round(Math.min(Math.max(num,0),7))
let displayRefreshMs = 100;


const servient = new Servient();
servient.addServer(new HttpServer());
servient.start().then((WoT) => {
    WoT.produce( envTd )
    .then((thing) => {
        console.log("Produced " + thing.getThingDescription().title);
        thing
        .setPropertyReadHandler("pressure", async () => pressure_state)
        .setPropertyReadHandler("humidity", async () => humidity_state)
        .setPropertyReadHandler("temperature", async () => temperature_state);
        thing.expose().then(() => {
            console.log(thing.getThingDescription().title + " ready");
        })
    });
    WoT.produce( thresholdTd )
    .then((thing) => {
        console.log("Produced " + thing.getThingDescription().title);
        thing
        .setPropertyReadHandler("pressure-threshold", async () => 0) // not implemented
        .setPropertyReadHandler("humidity-threshold", async () => humidity_threshold)
        .setPropertyReadHandler("temperature-threshold", async () => temperature_threshold);
        thing.expose().then(() => {
            console.log(thing.getThingDescription().title + " ready");
        })
    });
});

const sensehat = require('pi-sense-hat').create();
sensehat.on("environment", ({temperature,humidity,pressure}) => 
    {   pressure_state = pressure * filter + (1-filter) * pressure_state ;  
        humidity_state = humidity  * filter + (1-filter) * humidity_state, 
        temperature_state = temperature * filter + (1-filter) * temperature_state; }
);

setInterval(() => {
    if ( temperature_state && humidity_state ){
        sensehat.setPixelColour(
            '0-3','0-3','black',
            '0-3','4-7','blue',
            '4-7','0-3','red',
            '4-7','4-7','magenta',
             clamp07(Math.floor(temperature_state) - temperature_xbase()),
             clamp07(Math.floor(humidity_state) - humidity_ybase()) ,
            'white'
                            );
    }}, displayRefreshMs);

sensehat.on("joystick", (args) => 
    {
        console.log(args);
        let {key, state} = args;
        if ( state > 0 ) {
            if ( key === "ENTER" ){
                temperature_threshold = Math.round(temperature_state + 1.0);
                humidity_threshold = Math.round(humidity_state + 1.0);
            } 
            else if ( key === "DOWN" ) humidity_threshold ++;
            else if ( key === "UP" ) humidity_threshold --;
            else if ( key === "RIGHT" ) temperature_threshold ++;
            else if ( key === "LEFT" ) temperature_threshold --;
        }
    });