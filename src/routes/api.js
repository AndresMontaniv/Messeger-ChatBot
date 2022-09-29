/*
    path : api/login
*/

const { Router, response } = require('express');
const { check } = require('express-validator');
const { createProduct } = require('../controllers/productController');
const { validarCampos } = require('../middlewares/validar-campos');

const router = Router();

router.get('/test', (req, res) => {
    res.json({ ok: true, msg: "Todo bien" });
});

router.post('/product/create', [
    check('name', 'name Es obligatorio').not().isEmpty(),
    check('description', 'description Es obligatorio').not().isEmpty(),
    check('price', 'price Es obligatorio').not().isEmpty(),
    check('img', 'img Es obligatorio').not().isEmpty(),
    validarCampos
], createProduct);



module.exports = router;