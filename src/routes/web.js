const { Router, response} = require('express');
const {getHomePage} = require('../controllers/homepageController');
const router = Router();

let initWebRoutes = (app) => {
    router.get('/', getHomePage);

    return app.use('/', router);
}




module.exports = initWebRoutes;