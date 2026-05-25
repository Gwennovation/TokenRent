const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { optionalAuth, requireAuth } = require('../middleware/auth.middleware');

router.post('/register',  ctrl.register);
router.post('/login',     ctrl.login);
router.post('/logout',    ctrl.logout);
router.get ('/me',        optionalAuth, ctrl.me);

router.get ('/handcash',           ctrl.handcashStart);
router.get ('/handcash/callback',  ctrl.handcashCallback);

module.exports = router;
