const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin.middleware');

router.use(requireAuth, requireAdmin);

// User management
router.get   ('/users',          ctrl.listUsers);
router.patch ('/users/:id',      ctrl.updateUser);
router.delete('/users/:id',      ctrl.deleteUser);

// Disputes
router.get   ('/disputes',                 ctrl.listDisputes);
router.patch ('/disputes/:id/resolve',     ctrl.resolveDispute);

// Analytics
router.get   ('/analytics',      ctrl.analytics);

module.exports = router;
