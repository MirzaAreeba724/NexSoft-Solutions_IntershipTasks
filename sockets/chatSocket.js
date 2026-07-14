const Message = require('../models/Message');

// Keep track of active sockets mapping usernames to socket IDs
const onlineUsers = {};

module.exports = function (io) {
    io.on('connection', (socket) => {
        let currentUsername = null;

        // User registers active nickname or session username
        socket.on('registerUser', async (username) => {
            if (!username) return;

            // --- ADD DUPLICATE CHECK HERE ---
            if (onlineUsers[username]) {
                socket.emit('nicknameTaken', 'This nickname is already in use. Please choose another one.');
                return;
            }
            // ---------------------------------

            currentUsername = username;
            onlineUsers[username] = socket.id;

            // Broadcast the updated online users list to all clients
            io.emit('updateUserList', Object.keys(onlineUsers));
            socket.emit('registered', username);
        });

        // Join Group Chat Room
        socket.on('joinRoom', async ({ username, room }) => {
            socket.join(room);

            // Retrieve latest 50 messages for room history from MongoDB
            try {
                const history = await Message.find({ room })
                    .sort({ timestamp: 1 })
                    .limit(50);
                socket.emit('chatHistory', history);
            } catch (err) {
                console.error('Error fetching room history:', err);
            }
        });

        // Leave Group Chat Room
        socket.on('leaveRoom', (room) => {
            socket.leave(room);
        });

        // Fetch Private Chat DM History
        socket.on('getPrivateHistory', async ({ user1, user2 }) => {
            try {
                const history = await Message.find({
                    $or: [
                        { sender: user1, recipient: user2 },
                        { sender: user2, recipient: user1 }
                    ]
                })
                    .sort({ timestamp: 1 })
                    .limit(50);
                socket.emit('privateChatHistory', { otherUser: user2, history });
            } catch (err) {
                console.error('Error fetching private history:', err);
            }
        });

        // Handle Group/Channel Message
        socket.on('groupMessage', async ({ sender, room, message }) => {
            try {
                const newMessage = new Message({ sender, room, message });
                await newMessage.save();

                io.to(room).emit('message', {
                    sender,
                    room,
                    message,
                    timestamp: newMessage.timestamp
                });
            } catch (err) {
                console.error('Error saving group message:', err);
            }
        });

        // Handle Direct Private Message
        socket.on('privateMessage', async ({ sender, recipient, message }) => {
            try {
                const newMessage = new Message({ sender, recipient, message });
                await newMessage.save();

                const recipientSocketId = onlineUsers[recipient];
                const payload = {
                    sender,
                    recipient,
                    message,
                    timestamp: newMessage.timestamp
                };

                // Send to recipient if online
                if (recipientSocketId) {
                    io.to(recipientSocketId).emit('privateMessage', payload);
                }
                // Send back to sender
                socket.emit('privateMessage', payload);
            } catch (err) {
                console.error('Error saving private message:', err);
            }
        });

        // Handle Disconnection
        socket.on('disconnect', () => {
            if (currentUsername) {
                delete onlineUsers[currentUsername];
                io.emit('updateUserList', Object.keys(onlineUsers));
            }
        });
    });
};