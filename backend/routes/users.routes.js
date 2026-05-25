const router = require('express').Router();
const ctrl = require('../controllers/users.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { uploadDisputeEvidence } = require('../middleware/upload.middleware');

router.use(requireAuth);

router.get  ('/me',         ctrl.me);
router.patch('/me',         ctrl.updateMe);
router.get  ('/me/stats',   ctrl.myStats);
router.post ('/disputes',   uploadDisputeEvidence, ctrl.openDispute);

module.exports = router;
