const { Router, response } = require('express');
const { isLoggedIn } = require('../helpers/auth');
const { timeago } = require('../helpers/handlebars');
const Client = require('../models/client');
const Visit = require('../models/visit');
const Order = require('../models/order');
const Contact = require('../models/contact');
const Detail = require('../models/detail');
const { helpers } = require('handlebars');
const router = Router();

router.get('/dashboard', isLoggedIn, async (req, res) => {

    var resp = await Client.find();
   // var clients = [];
    var prosp = [];
    var prospC = [];
    var clients = [];
    var clientsF = [];

    //var contacted = await Contact.find();
   
    resp.forEach(async e => {
        if (!e.isClient) {
        

            prosp.push({
                id: e.id,
                name: e.firstName + ' ' + e.lastName,
                profilePic: e.profilePic,
            });
            var contacted = await Contact.find({ client: e.id });
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
      //  console.log(pContac);

    });
    console.log(clients);
    res.render('clients/dashboard', { prosp, prospC, clients, clientsF });
});


router.get('/show/prospect/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    var e = await Client.findById(id);
    if (e == null) {
        res.redirect('/clients/dashboard');
    }
    var visits = await Visit.find({ client: e }).sort({ created_at: -1 });
    var numVisits = visits.length;
    var lastVisit = visits.length > 0 ? visits[0].createdAt : null;
    var client = {
        id: e.id,
        name: e.firstName + ' ' + e.lastName,
        profilePic: e.profilePic,
        facebookId: e.facebookId,
        email: e.email,
        phone: e.phone,
        visits: numVisits,
        lastVisit: lastVisit,
    }
    res.render('clients/prospect', { client });
});

router.get('/show/contacted/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    var e = await Client.findById(id);
    if (e == null) {
        res.redirect('/clients/dashboard');
    }
    var contacted = await Contact.find({ client: e }).sort({ created_at: -1 });
    var notes = '';
    for (const contact in contacted) {
        if (contact.notes != null) {
            notes += contact.notes + '\n';
        }
    }
    var numContacted = contacted.length;
    var lastContact = contacted.length > 0 ? contacted[0].createdAt : null;
    var client = {
        id: e.id,
        name: e.firstName + ' ' + e.lastName,
        profilePic: e.profilePic,
        facebookId: e.facebookId,
        email: e.email,
        phone: e.phone,
        contacts: numContacted,
        lastContact: lastContact,
        notes: notes,
    }
    res.render('clients/contacted', { client });

});

router.get('/show/client/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    var e = await Client.findById(id);
    if (e == null) {
        res.redirect('/clients/dashboard');
    }
    var orders = await Order.find({ client: e }).sort({ created_at: -1 });
    var numOrders = orders.length;
    var lastOrder = orders.length > 0 ? orders[0] : null;
    var lastOrderDate = lastOrder == null ? null : lastOrder.createdAt;
    var details = lastOrder == null ? null : await Detail.find({ order: lastOrder });
    var client = {
        id: e.id,
        name: e.firstName + ' ' + e.lastName,
        profilePic: e.profilePic,
        facebookId: e.facebookId,
        email: e.email,
        phone: e.phone,
        numOrders: numOrders,
        lastOrder: lastOrder,
        lastOrderDate: lastOrderDate,
        details: details,
    }
    res.render('clients/client', { client });
});

router.get('/show/frecuent/:id', isLoggedIn, async (req, res) => {
    console.log('llego');
    const { id } = req.params;
    var e = await Client.findById(id);
    if (e == null) {
        res.redirect('/clients/dashboard');
    }
    var contacted = await Contact.find({ client: e }).sort({ created_at: -1 });
    var lastContact = contacted.length > 0 ? contacted[0].createdAt : null;
    var orders = await Order.find({ client: e }).sort({ created_at: -1 });
    var numOrders = orders.length;
    var avgTotal = 0;
    var total = 0;
    for (const order in orders) {
        total += order.total;
    }
    if (numOrders > 0) {
        avgTotal = Math.round((total / numOrders) * 100) / 100;
    }
    var client = {
        id: e.id,
        name: e.firstName + ' ' + e.lastName,
        profilePic: e.profilePic,
        facebookId: e.facebookId,
        email: e.email,
        phone: e.phone,
        lastContact: lastContact,
        numOrders: numOrders,
        avgTotal: avgTotal,
    }
    res.render('clients/frecuent', { client });
});


router.get('/contacto/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    var e = await Client.findById(id);
    if (e == null) {
        res.redirect('/clients/dashboard');
    }
    var client = {
        id: e.id,
        name: e.firstName + ' ' + e.lastName,
        profilePic: e.profilePic,
        email: e.email,

    }

    res.render('clients/contacto', {client});
});


router.post('/contacto', async (req, res) => {
    var prom = req.body;
  
    var descripcion = prom.desc;
    var id = prom.id;

    console.log(descripcion, id);
    const contact = new Contact({
        notes: descripcion,
        client: id,
    });
    
    await contact.save();


    res.redirect('/clients/dashboard');
});



module.exports = router;