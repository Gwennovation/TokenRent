const router = require('express').Router();
const ctrl = require('../controllers/rentals.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.use(requireAuth); // every rental endpoint is private

router.post  ('/',                   ctrl.create);
router.get   ('/mine',               ctrl.mine);
router.get   ('/:id',                ctrl.getOne);
router.patch ('/:id/accept',         ctrl.accept);
router.patch ('/:id/decline',        ctrl.decline);
router.patch ('/:id/cancel',         ctrl.cancel);
router.patch ('/:id/return',         ctrl.markReturned);
router.post  ('/:id/review',         ctrl.review);

module.exports = router;
