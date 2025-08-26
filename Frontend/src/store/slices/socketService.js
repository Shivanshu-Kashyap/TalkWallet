import { io } from 'socket.io-client';
import { store } from '../store';
import { addMessage, setActiveHeading } from '../store/slices/messageSlice';
import toast from 'react-hot-toast';

class SocketService {
  socket = null;
  
  connect(token) {
    if (this.socket?.connected) return;
    
    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    this.socket.on('new_message', (message) => {
      store.dispatch(addMessage({
        groupId: message.groupId,
        message
      }));
    });

    this.socket.on('heading_opened', ({ heading, message: notificationMessage }) => {
      store.dispatch(setActiveHeading({
        groupId: heading.groupId,
        heading
      }));
      toast.success(notificationMessage);
    });

    this.socket.on('joined_group', ({ groupId }) => {
      console.log('Joined group:', groupId);
    });

    this.socket.on('error', ({ message }) => {
      toast.error(message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinGroup(groupId) {
    if (this.socket) {
      this.socket.emit('join_group', groupId);
    }
  }

  sendMessage(groupId, text) {
    if (this.socket) {
      this.socket.emit('send_message', { groupId, text });
    }
  }

  emitHeadingOpened(groupId, headingId) {
    if (this.socket) {
      this.socket.emit('heading_opened', { groupId, headingId });
    }
  }
}

export default new SocketService();
