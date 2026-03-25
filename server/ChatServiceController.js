const { Server } = require("socket.io");
const { cleanText, isFiltered } = require("./utils/contentFilter");

const ALLOWED_CAMPUSES = ['ram_meghe_eng', 'sipna_eng'];

// Mock mapping of groups to campuses so we can validate
const groupCampusMap = {
  'g1': 'ram_meghe_eng',
  'g2': 'ram_meghe_eng',
  'g3': 'sipna_eng',
};

function initChatService(server) {
  const io = new Server(server, {
    cors: {
      origin: "*", // Adjust in production
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('User connected to socket:', socket.id);

    // joinGroup(userId, groupId, campusId)
    socket.on('joinGroup', ({ userId, groupId, campusId }) => {
      console.log(`User ${userId} attempting to join group ${groupId} for campus ${campusId}`);

      // Strict server-side check ensuring the groupId belongs to the user's authorized campusId
      if (!ALLOWED_CAMPUSES.includes(campusId)) {
        console.error(`Unauthorized campusId: ${campusId}`);
        socket.emit('error_alert', { message: 'Unauthorized campus. Joining denied.' });
        return;
      }

      const mappedCampus = groupCampusMap[groupId];
      if (mappedCampus !== campusId) {
        console.error(`Group ${groupId} does not belong to campus ${campusId}`);
        socket.emit('error_alert', { message: 'You are not authorized to join this group. It does not belong to your campus.' });
        return;
      }

      // Authorized, join the room
      socket.join(groupId);
      console.log(`User ${userId} joined room ${groupId}`);
      socket.emit('joined_success', { groupId, message: `Successfully joined ${groupId}` });
    });

    socket.on('sendMessage', ({ groupId, message, userId }) => {
      // Validate the user is in the room
      if (socket.rooms.has(groupId)) {
        // Apply Zero-Cost Profanity Filter
        const filteredMessage = cleanText(message);
        const wasFiltered = isFiltered(message);

        io.to(groupId).emit('newMessage', { 
          groupId, 
          message: filteredMessage, 
          userId, 
          wasFiltered, // Metadata flag for frontend feedback
          timestamp: new Date() 
        });
      } else {
        socket.emit('error_alert', { message: 'You must join the group before sending messages.' });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}

module.exports = { initChatService };
