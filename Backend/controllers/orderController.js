const OrderItem = require('../models/OrderItem');
const Membership = require('../models/Membership');
const Heading = require('../models/Heading');

const getOrderItems = async (req, res) => {
  try {
    const { headingId } = req.params;
    const userId = req.user._id;

    // Find the heading and verify access
    const heading = await Heading.findById(headingId).populate('groupId');
    if (!heading) {
      return res.status(404).json({ message: 'Heading not found' });
    }

    // Check if user is a member of the group
    const membership = await Membership.findOne({
      userId,
      groupId: heading.groupId._id,
      isActive: true
    });

    if (!membership) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get order items
    const orderItems = await OrderItem.find({ 
      headingId, 
      isActive: true 
    })
    .populate('requestedBy', 'displayName')
    .sort({ createdAt: 1 })
    .lean();

    res.json({ orderItems });
  } catch (error) {
    console.error('Get order items error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteOrderItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const userId = req.user._id;

    const orderItem = await OrderItem.findById(itemId).populate({
      path: 'headingId',
      populate: { path: 'groupId' }
    });

    if (!orderItem) {
      return res.status(404).json({ message: 'Order item not found' });
    }

    // Check if user can delete (either the requester or group admin)
    const membership = await Membership.findOne({
      userId,
      groupId: orderItem.headingId.groupId._id,
      isActive: true
    });

    if (!membership) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const canDelete = orderItem.requestedBy.toString() === userId.toString() || 
                     membership.role === 'admin';

    if (!canDelete) {
      return res.status(403).json({ message: 'You can only delete your own items' });
    }

    orderItem.isActive = false;
    await orderItem.save();

    res.json({ message: 'Order item deleted successfully' });
  } catch (error) {
    console.error('Delete order item error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getOrderItems,
  deleteOrderItem
};
