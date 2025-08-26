const { validationResult } = require('express-validator');
const Heading = require('../models/Heading');
const Membership = require('../models/Membership');

const createHeading = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id: groupId } = req.params;
    const { title } = req.body;
    const userId = req.user._id;

    // Check if user is a member of the group
    const membership = await Membership.findOne({
      userId,
      groupId,
      isActive: true
    });

    if (!membership) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if there's already an open heading
    const existingHeading = await Heading.findOne({
      groupId,
      status: 'OPEN'
    });

    if (existingHeading) {
      return res.status(400).json({ message: 'There is already an active bill-splitting session' });
    }

    const heading = new Heading({
      groupId,
      createdBy: userId,
      title: title.trim()
    });

    await heading.save();

    const populatedHeading = await Heading.findById(heading._id)
      .populate('createdBy', 'displayName')
      .lean();

    res.status(201).json({
      message: 'Bill-splitting session started',
      heading: populatedHeading
    });
  } catch (error) {
    console.error('Create heading error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getActiveHeading = async (req, res) => {
  try {
    const { id: groupId } = req.params;
    const userId = req.user._id;

    // Check if user is a member of the group
    const membership = await Membership.findOne({
      userId,
      groupId,
      isActive: true
    });

    if (!membership) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const heading = await Heading.findOne({
      groupId,
      status: 'OPEN'
    }).populate('createdBy', 'displayName').lean();

    res.json({ heading });
  } catch (error) {
    console.error('Get active heading error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createHeading,
  getActiveHeading
};
