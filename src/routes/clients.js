const { Router, response } = require('express');
const { isLoggedIn } = require('../helpers/auth');
const Client = require('../models/client');
const Visit = require('../models/visit');
const Order = require('../models/order');
const Contact = require('../models/contact');
const router = Router();

router.get('/dashboard', isLoggedIn, async (req, res) => {
    var resp = await Client.find();
    var clients = [];
    var prosp = [];
    var prospC = [];
    var clients = [];
    var clientsF = [];
    var profPic = "";
    resp.forEach(async e => {
        if (!e.isClient) {
            if(!e.profilePic){profPic = e.profilePic}else{profPic = "/img/default-profile.png"}

            prosp.push({
                id: e.id,
                name: e.firstName + ' ' + e.lastName,
                profilePic: profPic, //e.profilePic,
            });
            var contacted = await Contact.find({ client: e });
            if (contacted.length > 0) {
                prospC.push({
                    id: e.id,
                    name: e.firstName + ' ' + e.lastName,
                    profilePic: e.profilePic,
                });
            }

        } else {
            clients.push({
                id: e.id,
                name: e.firstName + ' ' + e.lastName,
                profilePic: e.profilePic,
            });
            var frecuent = await Order.find({ client: e });
            if (frecuent.length > 3) {
                clientsF.push({
                    id: e.id,
                    name: e.firstName + ' ' + e.lastName,
                    profilePic: e.profilePic,
                });
            }
        }

    });

    res.render('clients/dashboard', { prosp, prospC, clients, clientsF });
});


router.get('/show/prospect', isLoggedIn, async (req, res) => {
    res.render('clients/prospect', {});
});

router.get('/show/contacted', isLoggedIn, async (req, res) => {
    res.render('clients/contacted', {});
});
router.get('/show/client', isLoggedIn, async (req, res) => {
    res.render('clients/client', {});
});
router.get('/show/frecuent', isLoggedIn, async (req, res) => {
    res.render('clients/frecuent', {});
});



module.exports = router;