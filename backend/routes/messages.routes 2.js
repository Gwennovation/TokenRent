/**
 * Messages routes — nested under /api/rentals/:id/messages.
 * mergeParams: true gives access to :id from the parent rentals router.
 * requireAuth is inherited from the parent router's router.use(requireAuth).
 */
const router = require('express').Router({ mergeParams: true });
const ctrl   = require('../controllers/messages.controller');

router.get ('/', ctrl.list);
router.post('/', ctrl.send);

module.exports = router;
