require('dotenv').config();
const { Router, response } = require('express');
const request = require('request');
const { isLoggedIn } = require('../helpers/auth');
const { timeago } = require('../helpers/handlebars');
const Deal = require('../models/deal');
const Image = require('../models/image');
const Product = require('../models/product');
const Discount = require('../models/discount');
const { helpers } = require('handlebars');
const router = Router();

router.get('/menu', async (req, res) => {

    var deals = await Deal.find();

    res.render('deals/menu', { deals });
});

router.get('/create', async (req, res) => {
    res.render('deals/create', {});
});

router.post('/create', async (req, res) => {
    var prom = req.body;
    var mI = parseInt(prom.mIni) - 1;
    var mF = parseInt(prom.mFin) - 1;
    var aI = parseInt(prom.aIni);
    var aF = parseInt(prom.aFin);
    var dI = parseInt(prom.dIni);
    var dF = parseInt(prom.dFin);
    var name = prom.name;
    var dcto = prom.dcto;


    const deal = new Deal({
        name: name,
        from: new Date(aI, mI, dI),
        to: new Date(aF, mF, dF),
        discount: dcto,
    });

    console.log(deal)
    await deal.save();

    const id = deal._id;

    const pageId = process.env.PAGE_ID;
    const debugToken = process.env.DEBUG_TOKEN;

    var msg = "Hola amigos, le tenemos la nueva promo " + deal.name + " !!!.\n Valida desde " + deal.from.toLocaleDateString("es-Es") + " hasta " + deal.to.toLocaleDateString("es-Es") + ".\n Ven y aprovecha este " + deal.discount + "% .\n Te esperamos!!";

    if (id != null) {
        request({
            uri: "https://graph.facebook.com/100633766169633/feed",
            qs: {
                access_token: debugToken,
                message: msg
            },
            method: "POST",
        }, (err, res, body) => {
            if (!err) {
                console.log('message sent!')
            } else {
                console.error("Unable to send message:" + err);
            }
        });
    }

    res.redirect("/deals/products?idDeal=" + id);

    // res.render('deals/products', );
});

//mandar el id de la promocion creada

router.get('/products', async (req, res) => {
    const { idDeal } = req.query
    console.log(idDeal)
    var resDB = await Product.find();
    var products = [];

    for (var i = 0; i < resDB.length; i++) {
        var prod = resDB[i];
        var imagen = await Image.findOne({ product: prod._id });
        products.push({
            "id": prod._id,
            "name": prod.name,
            "price": prod.price,
            "image": imagen.url,
        });

    }


    res.render('deals/products', { products, idDeal });
});

router.get('/list/:id', isLoggedIn, async (req, res) => {

    const { id } = req.params;
    var e = await Deal.findById(id);
    if (e == null) {
        res.redirect('/clients/dashboard');
    }

    const descuentoDB = await Discount.find({ deal: id });
    var products = [];

    for (var i = 0; i < descuentoDB.length; i++) {
        var d = descuentoDB[i];
        var prod = await Product.findById(d.product);
        var imagen = await Image.findOne({ product: prod._id });
        products.push({
            "id": prod._id,
            "name": prod.name,
            "price": prod.price,
            "discount": prod.price - (e.discount / 100) * prod.price,
            "image": imagen.url,
        });

    }

    res.render('deals/list', { products });
});


module.exports = router;
