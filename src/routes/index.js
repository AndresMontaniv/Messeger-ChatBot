const { Router, response } = require('express');
const { getWebHook, postWebHook } = require('../controllers/chatBotController');
const router = Router();

router.get('/', (req, res) => {
    return res.render('index');
});
router.get('/webhook', getWebHook);
router.post('/webhook', postWebHook);

module.exports = router;