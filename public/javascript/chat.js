document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    // DOM Selections
    const authOverlay = document.getElementById('auth-overlay');
    const nicknameInput = document.getElementById('nickname-input');
    const joinBtn = document.getElementById('join-btn');

    const chatWrapper = document.querySelector('.chat-wrapper');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const messageInput = document.getElementById('message-input');

    const activeChatTitle = document.getElementById('active-chat-title');
    const currentUserSpan = document.getElementById('current-user');
    const usersList = document.getElementById('users-list');
    const channelItems = document.querySelectorAll('.channel-item');

    // Runtime state tracking
    let myUsername = currentUserSpan.textContent.trim();
    let activeTarget = 'General';
    let isGroupChat = true;

    // Auto registration if session is populated
    if (myUsername) {
        socket.emit('registerUser', myUsername);
        socket.emit('joinRoom', { username: myUsername, room: activeTarget });
    }

    // Manual Form Submission Registration
    joinBtn.addEventListener('click', () => {
        const nick = nicknameInput.value.trim();
        if (nick) {
            myUsername = nick;
            currentUserSpan.textContent = nick;
            socket.emit('registerUser', nick);
        }
    });

    socket.on('registered', (username) => {
        authOverlay.style.display = 'none';
        chatWrapper.style.display = 'grid';
        socket.emit('joinRoom', { username, room: activeTarget });
    });

    // Listen for nickname collision rejection from the server
    socket.on('nicknameTaken', (errorMessage) => {
        alert(errorMessage); // Shows a browser prompt with the error
        nicknameInput.value = '';
        nicknameInput.focus();
    });

    // Room Routing logic
    channelItems.forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.channel-item, .user-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');

            const targetRoom = item.getAttribute('data-room');
            if (isGroupChat && activeTarget === targetRoom) return;

            if (isGroupChat) {
                socket.emit('leaveRoom', activeTarget);
            }

            isGroupChat = true;
            activeTarget = targetRoom;
            activeChatTitle.textContent = `Group Chat: #${targetRoom}`;
            chatMessages.innerHTML = '';

            socket.emit('joinRoom', { username: myUsername, room: activeTarget });
        });
    });

    // Handle Online List update and Private DM Switch trigger
    socket.on('updateUserList', (users) => {
        usersList.innerHTML = '';
        users.forEach(user => {
            if (user === myUsername) return; // omit self from active online list

            const li = document.createElement('li');
            li.className = 'user-item';
            li.textContent = user;
            li.setAttribute('data-username', user);

            if (!isGroupChat && activeTarget === user) {
                li.classList.add('active');
            }

            li.addEventListener('click', () => {
                document.querySelectorAll('.channel-item, .user-item').forEach(el => el.classList.remove('active'));
                li.classList.add('active');

                if (isGroupChat) {
                    socket.emit('leaveRoom', activeTarget);
                }

                isGroupChat = false;
                activeTarget = user;
                activeChatTitle.textContent = `Direct Chat: @${user}`;
                chatMessages.innerHTML = '';

                socket.emit('getPrivateHistory', { user1: myUsername, user2: user });
            });

            usersList.appendChild(li);
        });
    });

    // Post Messages
    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = messageInput.value.trim();
        if (!text) return;

        if (isGroupChat) {
            socket.emit('groupMessage', {
                sender: myUsername,
                room: activeTarget,
                message: text
            });
        } else {
            socket.emit('privateMessage', {
                sender: myUsername,
                recipient: activeTarget,
                message: text
            });
        }

        messageInput.value = '';
        messageInput.focus();
    });

    // Receive channel updates
    socket.on('message', (msg) => {
        if (isGroupChat && msg.room === activeTarget) {
            appendMessage(msg, msg.sender === myUsername ? 'outgoing' : 'incoming');
        }
    });

    // Receive direct chats
    socket.on('privateMessage', (msg) => {
        const isCurrentPrivateRecipient = (!isGroupChat) && (
            (msg.sender === myUsername && msg.recipient === activeTarget) ||
            (msg.sender === activeTarget && msg.recipient === myUsername)
        );

        if (isCurrentPrivateRecipient) {
            appendMessage(msg, msg.sender === myUsername ? 'outgoing' : 'incoming');
        }
    });

    // Render general logs
    socket.on('chatHistory', (history) => {
        chatMessages.innerHTML = '';
        history.forEach(msg => {
            appendMessage(msg, msg.sender === myUsername ? 'outgoing' : 'incoming');
        });
    });

    socket.on('privateChatHistory', ({ otherUser, history }) => {
        if (!isGroupChat && activeTarget === otherUser) {
            chatMessages.innerHTML = '';
            history.forEach(msg => {
                appendMessage(msg, msg.sender === myUsername ? 'outgoing' : 'incoming');
            });
        }
    });

    function appendMessage(msg, type) {
        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${type}`;

        const meta = document.createElement('div');
        meta.className = 'msg-meta';

        const senderSpan = document.createElement('span');
        senderSpan.className = 'msg-sender';
        senderSpan.textContent = msg.sender;

        const timeSpan = document.createElement('span');
        timeSpan.className = 'msg-time';
        const date = new Date(msg.timestamp);
        timeSpan.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        meta.appendChild(senderSpan);
        meta.appendChild(timeSpan);

        const textDiv = document.createElement('div');
        textDiv.className = 'msg-text';
        textDiv.textContent = msg.message;

        bubble.appendChild(meta);
        bubble.appendChild(textDiv);

        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});