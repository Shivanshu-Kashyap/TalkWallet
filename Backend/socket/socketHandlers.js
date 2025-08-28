const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Membership = require('../models/Membership');
const Heading = require('../models/Heading');
const OrderItem = require('../models/OrderItem');
const AIExtractionAgent = require('../services/AIExtractionAgent');

const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

const handleConnection = (io, socket) => {
  console.log(`User ${socket.user.displayName} connected`);

  // Join user to their groups
  const joinUserGroups = async () => {
    try {
      const memberships = await Membership.find({
        userId: socket.userId,
        isActive: true
      }).populate('groupId');

      memberships.forEach(membership => {
        if (membership.groupId && membership.groupId.isActive) {
          socket.join(`group_${membership.groupId._id}`);
        }
      });
    } catch (error) {
      console.error('Error joining groups:', error);
    }
  };

  joinUserGroups();

  // Handle sending messages with AI extraction
  socket.on('send_message', async (data) => {
    try {
      const { groupId, text } = data;

      if (!groupId || !text || !text.trim()) {
        socket.emit('error', { message: 'Invalid message data' });
        return;
      }

      // Verify user is member of group
      const membership = await Membership.findOne({
        userId: socket.userId,
        groupId,
        isActive: true
      });

      if (!membership) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      // Create message
      const message = new Message({
        groupId,
        senderId: socket.userId,
        text: text.trim(),
        messageType: 'text'
      });

      await message.save();

      const populatedMessage = await Message.findById(message._id)
        .populate('senderId', 'displayName')
        .lean();

      // Broadcast to group
      io.to(`group_${groupId}`).emit('new_message', populatedMessage);

      // Check for active heading and extract orders
      const activeHeading = await Heading.findOne({ 
        groupId, 
        status: 'OPEN' 
      });

      if (activeHeading) {
        console.log(`Processing message for active heading: ${activeHeading.title}`);
        
        try {
          const extractedItems = await AIExtractionAgent.extractOrders(text, socket.userId);
          console.log('Extracted items:', extractedItems);

          if (extractedItems && extractedItems.length > 0) {
            const newOrderItems = [];

            for (const item of extractedItems) {
              const newOrderItem = new OrderItem({
                headingId: activeHeading._id,
                requestedBy: socket.userId,
                label: item.label,
                quantity: item.quantity || 1,
                options: item.options || [],
                rawTextMessage: text,
              });

              await newOrderItem.save();
              activeHeading.items.push(newOrderItem._id);
              
              // Populate for broadcasting
              const populatedItem = await OrderItem.findById(newOrderItem._id)
                .populate('requestedBy', 'displayName')
                .lean();

              newOrderItems.push(populatedItem);
            }

            await activeHeading.save();

            // Broadcast all new items to the group
            io.to(`group_${groupId}`).emit('order_items_added', {
              headingId: activeHeading._id,
              items: newOrderItems
            });

            console.log(`Broadcasted ${newOrderItems.length} new order items`);
          }
        } catch (aiError) {
          console.error('AI extraction error:', aiError);
          // Continue without AI extraction if it fails
        }
      }

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Handle joining specific group room
  socket.on('join_group', async (groupId) => {
    try {
      const membership = await Membership.findOne({
        userId: socket.userId,
        groupId,
        isActive: true
      });

      if (membership) {
        socket.join(`group_${groupId}`);
        socket.emit('joined_group', { groupId });
      } else {
        socket.emit('error', { message: 'Access denied' });
      }
    } catch (error) {
      console.error('Join group error:', error);
      socket.emit('error', { message: 'Failed to join group' });
    }
  });

  // Handle heading events
  socket.on('heading_opened', async (data) => {
    try {
      const { groupId, headingId } = data;

      const heading = await Heading.findOne({
        _id: headingId,
        groupId,
        status: 'OPEN'
      }).populate('createdBy', 'displayName');

      if (!heading) {
        socket.emit('error', { message: 'Heading not found' });
        return;
      }

      const membership = await Membership.findOne({
        userId: socket.userId,
        groupId,
        isActive: true
      });

      if (!membership) {
        socket.emit('error', { message: 'Access denied' });
        return;
      }

      io.to(`group_${groupId}`).emit('heading_opened', {
        heading,
        message: `${socket.user.displayName} started a bill-splitting session: "${heading.title}"`
      });
    } catch (error) {
      console.error('Heading opened error:', error);
      socket.emit('error', { message: 'Failed to process heading' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User ${socket.user.displayName} disconnected`);
  });
};

module.exports = {
  authenticateSocket,
  handleConnection
};
