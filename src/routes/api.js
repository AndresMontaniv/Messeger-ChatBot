/*
    path : api/login
*/

const { Router, response } = require('express');

const router = Router();

router.post('/test', (req, res) => {
    res.json({ ok: true, msg: "Todo bien" });
})



module.exports = router;