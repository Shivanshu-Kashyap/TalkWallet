import { io } from 'socket.io-client';
import { store } from '../store';
import { 
  addMessage, 
  setActiveHeading, 
  addOrderItems,
  updateOrderItem // Add this action to messageSlice
} from '../store/slices/messageSlice';
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

    this.socket.on('order_items_added', ({ headingId, items }) => {
      console.log('New order items received:', items);
      store.dispatch(addOrderItems({
        headingId,
        items
      }));
      
      if (items.length > 0) {
        const itemNames = items.map(item => `${item.label} (x${item.quantity})`).join(', ');
        toast.success(`New order: ${itemNames}`);
      }
    });

    // New price and payer events
    this.socket.on('item_price_updated', ({ orderItem }) => {
      store.dispatch(updateOrderItem({
        headingId: orderItem.headingId,
        orderItem
      }));
      toast.success(`Price updated: ₹${orderItem.price}`);
    });

    this.socket.on('item_payers_updated', ({ orderItem }) => {
      store.dispatch(updateOrderItem({
        headingId: orderItem.headingId,
        orderItem
      }));
      const payerNames = orderItem.paidBy.map(p => p.userId.displayName).join(', ');
      toast.success(`Payers assigned: ${payerNames}`);
    });

    this.socket.on('receipt_processing_completed', ({ receipt }) => {
      toast.success('Receipt processed successfully!');
    });

    this.socket.on('receipt_processing_failed', ({ error }) => {
      toast.error(`Receipt processing failed: ${error}`);
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
