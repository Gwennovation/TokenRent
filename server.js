/**
 * Local development entry — runs the Express app on PORT (default 3000).
 * On Vercel, this file is NOT used; api/index.js is the serverless entry.
 */
require('dotenv').config();
const app = require('./backend/app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n  T0kenRent server: http://localhost:${PORT}`);
  console.log(`   Environment:  ${process.env.NODE_ENV || 'development'}\n`);
});
