import jwt from 'jsonwebtoken'

export const setupSocket = (io) => {

    // Middleware to authenticate socket connection using JWT
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;

        if (!token) {
            return next(new Error('unauthorized'))
        }

        try {
            // Verify token and attach user to socket
            socket.user = jwt.verify(token, process.env.JWT_SECRET)
            next()
        } catch (err) {
            next(new Error('Invalid token'))
        }
    })

    io.on('connection', (socket) => {
        console.log(`User connected: ${socket.user.name}`);

        // Join personal room for user-specific events (notifications, etc.)
        socket.join(`user:${socket.user.uid}`);

        // Join/leave project-specific rooms
        socket.on('join:project', (projectId) => socket.join(`project:${projectId}`));
        socket.on('leave:project', (projectId) => socket.leave(`project:${projectId}`));

        // Broadcast task movement to other users in same project
        socket.on('task:move', (data) => {
            socket.to(`project:${data.projectId}`).emit('task:moved', data);
        });

        // Handle disconnect
        socket.on('disconnect', () => console.log(`User disconnected: ${socket.user.name}`));
    })
}