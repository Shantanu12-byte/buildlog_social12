require('dotenv').config();
const express = require('express');
const cors = require('cors');
const githubAuthRoutes = require('./routes/githubAuth');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth/github', githubAuthRoutes);
app.use('/api/user/github', githubAuthRoutes); // Re-using for simplicity in this lightweight setup

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`BuildLog Backend running on port ${PORT}`);
});
