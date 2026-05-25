/**
 * Vercel serverless entry — Express app exported as the function handler.
 * vercel.json routes /api/* and /auth/* to this file.
 */
require('dotenv').config();
const app = require('../backend/app');

module.exports = app;
