const { validationResult } = require('express-validator');
const Group = require('../models/Group');
const Membership = require('../models/Membership');
const User = require('../models/User');

const createGroup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description } = req.body;
    const userId = req.user._id;

    // Create group
    const group = new Group({
      name: name.trim(),
      description: description?.trim() || '',
      createdBy: userId
    });

    await group.save();

    // Add creator as admin
    const membership = new Membership({
      userId,
      groupId: group._id,
      role: 'admin'
    });

    await membership.save();

    const populatedGroup = await Group.findById(group._id)
      .populate('createdBy', 'displayName phoneE164')
      .lean();

    res.status(201).json({
      message: 'Group created successfully',
      group: {
        ...populatedGroup,
        memberCount: 1,
        userRole: 'admin'
      }
    });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const memberships = await Membership.find({ userId, isActive: true })
      .populate({
        path: 'groupId',
        match: { isActive: true },
        populate: {
          path: 'createdBy',
          select: 'displayName'
        }
      })
      .lean();

    const groups = [];
    for (const membership of memberships) {
      if (membership.groupId) {
        // Get member count
        const memberCount = await Membership.countDocuments({
          groupId: membership.groupId._id,
          isActive: true
        });

        groups.push({
          ...membership.groupId,
          memberCount,
          userRole: membership.role,
          joinedAt: membership.joinedAt
        });
      }
    }

    res.json({ groups });
  } catch (error) {
    console.error('Get user groups error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const addMember = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: groupId } = req.params;
    const { phoneE164 } = req.body;
    const userId = req.user._id;

    // Check if user is admin of the group
    const userMembership = await Membership.findOne({
      userId,
      groupId,
      role: 'admin',
      isActive: true
    });

    if (!userMembership) {
      return res.status(403).json({ message: 'Only group admins can add members' });
    }

    // Find the user to add
    const userToAdd = await User.findOne({ phoneE164 });
    if (!userToAdd) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    const existingMembership = await Membership.findOne({
      userId: userToAdd._id,
      groupId,
      isActive: true
    });

    if (existingMembership) {
      return res.status(400).json({ message: 'User is already a member of this group' });
    }

    // Add member
    const membership = new Membership({
      userId: userToAdd._id,
      groupId,
      role: 'member'
    });

    await membership.save();

    const populatedMembership = await Membership.findById(membership._id)
      .populate('userId', 'displayName phoneE164')
      .lean();

    res.status(201).json({
      message: 'Member added successfully',
      membership: populatedMembership
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getGroupMembers = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    // Check if user is a member of the group
    const userMembership = await Membership.findOne({
      userId,
      groupId,
      isActive: true
    });

    if (!userMembership) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const members = await Membership.find({ groupId, isActive: true })
      .populate('userId', 'displayName phoneE164 lastActiveAt')
      .sort({ role: -1, joinedAt: 1 })
      .lean();

    res.json({ members });
  } catch (error) {
    console.error('Get group members error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createGroup,
  getUserGroups,
  addMember,
  getGroupMembers
};
