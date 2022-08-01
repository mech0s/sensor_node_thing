// server.js
// Required steps to create a servient for creating a thing
const Servient = require('@node-wot/core').Servient;
const HttpServer = require('@node-wot/binding-http').HttpServer;
const td = require("./sense_hat_env.td.json");

let pressure_state = null;
let humidity_state = null;
let temperature_state = null;

const servient = new Servient();
servient.addServer(new HttpServer());
servient.start().then((WoT) => {
    WoT.produce( td )
    .then((thing) => {
        console.log("Produced " + thing.getThingDescription().title);
        thing
        .setPropertyReadHandler("pressure", async () => pressure_state)
        .setPropertyReadHandler("humidity", async () => humidity_state)
        .setPropertyReadHandler("temperature", async () => temperature_state);


        thing.expose().then(() => {
            console.log(thing.getThingDescription().title + " ready");
        })
    })

});

const sensehat = require('pi-sense-hat').create();
sensehat.on("environment", ({temperature,humidity,pressure}) => 
    {pressure_state = pressure;  humidity_state = humidity, temperature_state = temperature; }
); 
