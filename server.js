//* 1. Import Dependencies
const express = require('express');
const viewEngine = require('./src/config/viewEngine');
const initWebRoute = require('./src/routes/web');
const bodyParser = require('body-parser');


const app = express();
require('dotenv').config();

// config view engine
viewEngine(app);




// use body parser to post data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


//init all web routes
initWebRoute(app);




//Start Server
const port= process.env.PORT || 5000
app.listen(port, ()=> {
    console.log('Server Listening on port ', port);
});