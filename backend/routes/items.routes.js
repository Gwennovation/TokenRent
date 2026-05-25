const router = require('express').Router();
const ctrl = require('../controllers/items.controller');
const { requireAuth, optionalAuth } = require('../middleware/auth.middleware');
const { uploadItemPhotos } = require('../middleware/upload.middleware');

// Listing browse — public
router.get('/',     optionalAuth, ctrl.list);
router.get('/mine', requireAuth,  ctrl.mine);
router.get('/:id',  optionalAuth, ctrl.getOne);

// Mutations — require auth
router.post  ('/',    requireAuth, uploadItemPhotos, ctrl.create);
router.patch ('/:id', requireAuth, ctrl.update);
router.delete('/:id', requireAuth, ctrl.remove);

module.exports = router;
