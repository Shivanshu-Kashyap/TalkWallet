const Message = require('../models/Message');
const Membership = require('../models/Membership');

const getMessages = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Check if user is a member of the group
    const membership = await Membership.findOne({
      userId,
      groupId,
      isActive: true
    });

    if (!membership) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const messages = await Message.find({ groupId })
      .populate('senderId', 'displayName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    // Reverse to show oldest first
    messages.reverse();

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMessages
};
