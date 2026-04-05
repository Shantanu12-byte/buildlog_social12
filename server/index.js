require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const githubAuthRoutes = require('./routes/githubAuth');
const githubPortfolioRoutes = require('./routes/githubPortfolio');
const githubDataFixRoutes = require('./routes/githubDataFix');
const campusCommunityRoutes = require('./routes/campusCommunity');
const userOnboardingRoutes = require('./routes/userOnboarding');
const userProfileRoutes = require('./routes/userRoutes');
const pushNotificationRoutes = require('./routes/pushNotifications');
const chatRoutes = require('./routes/chat');
const { initChatService } = require('./ChatServiceController');
const { initStreakReminder } = require('./cron/streakReminder');
const { initDailyNotifications } = require('./cron/dailyNews');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth/github', githubAuthRoutes);
app.use('/api/user/projects', githubPortfolioRoutes);
app.use('/api/user/github', githubDataFixRoutes);
app.use('/api/user/campus', campusCommunityRoutes);
app.use('/api/user/profile', userProfileRoutes);
app.use('/api/user/push', pushNotificationRoutes);
app.use('/api/user', userOnboardingRoutes);
app.use('/api/chat', chatRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

initChatService(server);
initStreakReminder();
initDailyNotifications();

server.listen(PORT, () => {
  console.log(`BuildLog Backend running on port ${PORT}`);
});
