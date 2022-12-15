/*
    path : api/login
*/

const { Router, response } = require('express');
const { check } = require('express-validator');
const { createProduct } = require('../controllers/productController');
const { validarCampos } = require('../middlewares/validar-campos');
const {io}=require('socket.io-client');
const router = Router();

router.get('/test', async (req, res) => {
    console.log("provando")
    const url= process.env.URL_SERVER
    try {
        const socket = io(url);
        socket.emit('new-user');
        socket.disconnect()
    }catch(e){
        console.log(e)
    }
    res.json({ ok: true, msg: "Todo bien" });
});

router.post('/product/create', [
    check('name', 'name Es obligatorio').not().isEmpty(),
    check('description', 'description Es obligatorio').not().isEmpty(),
    check('price', 'price Es obligatorio').not().isEmpty(),
    check('category', 'category Es obligatorio').not().isEmpty(),
    validarCampos
], createProduct);



module.exports = router;