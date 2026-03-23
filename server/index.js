require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const githubAuthRoutes = require('./routes/githubAuth');
const githubPortfolioRoutes = require('./routes/githubPortfolio');
const campusCommunityRoutes = require('./routes/campusCommunity');
const { initChatService } = require('./ChatServiceController');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth/github', githubAuthRoutes);
app.use('/api/user/github', githubAuthRoutes);
app.use('/api/user/projects', githubPortfolioRoutes);
app.use('/api/user/campus', campusCommunityRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

initChatService(server);

server.listen(PORT, () => {
  console.log(`BuildLog Backend running on port ${PORT}`);
});
