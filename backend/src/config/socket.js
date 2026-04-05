let socketServer = null;

export const setSocketServer = (io) => {
  socketServer = io;
};

export const joinUserRooms = (socket, { userId, role } = {}) => {
  if (userId) {
    socket.join(`user:${userId}`);
  }

  if (role) {
    socket.join(`role:${role}`);
  }
};

export const emitNotification = ({ userIds = [], roles = [], notification }) => {
  if (!socketServer || !notification) {
    return;
  }

  const targets = new Set();

  userIds.filter(Boolean).forEach((userId) => targets.add(`user:${userId}`));
  roles.filter(Boolean).forEach((role) => targets.add(`role:${role}`));

  targets.forEach((target) => {
    socketServer.to(target).emit('notification', notification);
  });
};
