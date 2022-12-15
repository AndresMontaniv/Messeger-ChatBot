//* 1. Import Dependencies
const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const morgan = require('morgan');
const methodOverride = require('method-override');
const session = require('express-session');
const flash = require('connect-flash');
const bodyParser = require('body-parser');
const passport = require('passport');
const Handlebars = require('handlebars');
const { dbConnection } = require('./src/database/config');
const { socketController } = require('./src/sockets/controller');

const app = express();
require('dotenv').config();

// DB Config MONGODB

dbConnection();



// settings
app.set('port', process.env.PORT || 5000);
/* SOCKET SERVER */
const server = require('http').createServer( app );
let io     = require('socket.io')( server );

const { allowInsecurePrototypeAccess } = require('@handlebars/allow-prototype-access');

app.set('views', path.join(__dirname, 'src/views'));
app.engine('.hbs', exphbs.engine({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: require('./src/helpers/handlebars'),
    handlebars: allowInsecurePrototypeAccess(Handlebars)
}));
app.set('view engine', '.hbs');

//Middlewares
app.use(methodOverride('_method'));
app.use(session({
    secret: 'mysecretapp',
    resave: true,
    saveUninitialized: true,
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
require('./src/helpers/passport');

//Global Variables

app.use((req, res, next) => {
    app.locals.success = req.flash('success');
    app.locals.message = req.flash('message');
    app.locals.user = req.user;
    next();
});





//init all web routes
app.use(require('./src/routes'));
app.use(require('./src/routes/auth'));
app.use('/api', require('./src/routes/api'));
app.use('/clients', require('./src/routes/clients'));
app.use('/deals', require('./src/routes/deals'));

//Routes
app.use(express.static(path.join(__dirname, 'src/public')));


/* Start socket */
io.on('connection', ( socket ) => socketController(socket, io ) )
//Start Server
server.listen(app.get('port'), () => {
    console.log('Server Listening on port ', app.get('port'));
});