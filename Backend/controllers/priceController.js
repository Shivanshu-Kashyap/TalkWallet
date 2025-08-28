const OrderItem = require('../models/OrderItem');
const Receipt = require('../models/Receipt');
const Heading = require('../models/Heading');
const Membership = require('../models/Membership');
const User = require('../models/User');
const cloudinary = require('../config/cloudinary');
const OCRAgent = require('../services/OCRAgent');
const AIMappingAgent = require('../services/AIMappingAgent');

const addManualPrice = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { price } = req.body;
    const userId = req.user._id;

    if (!price || price <= 0) {
      return res.status(400).json({ message: 'Valid price is required' });
    }

    const orderItem = await OrderItem.findById(itemId).populate({
      path: 'headingId',
      populate: { path: 'groupId' }
    });

    if (!orderItem) {
      return res.status(404).json({ message: 'Order item not found' });
    }

    // Check if user has access to the group
    const membership = await Membership.findOne({
      userId,
      groupId: orderItem.headingId.groupId,
      isActive: true
    });

    if (!membership) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update price
    orderItem.price = parseFloat(price);
    orderItem.isPriceConfirmed = true;
    await orderItem.save();

    const populatedItem = await OrderItem.findById(itemId)
      .populate('requestedBy', 'displayName')
      .populate('paidBy.userId', 'displayName');

    res.json({
      message: 'Price added successfully',
      orderItem: populatedItem
    });

    // Broadcast the update via socket if available
    if (req.io) {
      req.io.to(`group_${orderItem.headingId.groupId}`).emit('item_price_updated', {
        orderItem: populatedItem
      });
    }

  } catch (error) {
    console.error('Add manual price error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const uploadReceipt = async (req, res) => {
  try {
    const { headingId } = req.params;
    const userId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Verify heading exists and user has access
    const heading = await Heading.findById(headingId).populate('groupId');
    if (!heading) {
      return res.status(404).json({ message: 'Heading not found' });
    }

    const membership = await Membership.findOne({
      userId,
      groupId: heading.groupId._id,
      isActive: true
    });

    if (!membership) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'smartsplit/receipts',
          resource_type: 'image'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(req.file.buffer);
    });

    // Create receipt record
    const receipt = new Receipt({
      headingId,
      uploadedBy: userId,
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      status: 'PROCESSING'
    });

    await receipt.save();

    // Start OCR processing asynchronously
    processReceiptOCR(receipt._id, req.io);

    res.json({
      message: 'Receipt uploaded successfully',
      receipt: {
        _id: receipt._id,
        imageUrl: receipt.imageUrl,
        status: receipt.status,
        uploadedBy: { displayName: req.user.displayName }
      }
    });

  } catch (error) {
    console.error('Upload receipt error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const processReceiptOCR = async (receiptId, io) => {
  try {
    const receipt = await Receipt.findById(receiptId).populate({
      path: 'headingId',
      populate: { path: 'groupId' }
    });

    if (!receipt) return;

    // Perform OCR
    const ocrResult = await OCRAgent.extractTextFromImage(receipt.imageUrl);
    
    receipt.ocrRawText = ocrResult.rawText;
    receipt.ocrParsedLines = ocrResult.parsedLines;

    if (!ocrResult.success) {
      receipt.status = 'FAILED';
      receipt.errorMessage = ocrResult.message;
      await receipt.save();
      
      if (io) {
        io.to(`group_${receipt.headingId.groupId._id}`).emit('receipt_processing_failed', {
          receiptId: receipt._id,
          error: ocrResult.message
        });
      }
      return;
    }

    // Get order items for this heading
    const orderItems = await OrderItem.find({
      headingId: receipt.headingId._id,
      isActive: true,
      isPriceConfirmed: false
    });

    if (orderItems.length > 0) {
      // AI mapping
      const mappingResult = await AIMappingAgent.mapOrdersToReceipt(orderItems, ocrResult.parsedLines);
      
      if (mappingResult.success) {
        receipt.aiMappings = mappingResult.mappings;
        receipt.status = 'NEEDS_REVIEW';
      } else {
        receipt.status = 'NEEDS_REVIEW'; // Still allow manual review
      }
    } else {
      receipt.status = 'COMPLETED';
    }

    await receipt.save();

    const populatedReceipt = await Receipt.findById(receiptId)
      .populate('uploadedBy', 'displayName')
      .populate('aiMappings.orderItemId');

    // Broadcast completion
    if (io) {
      io.to(`group_${receipt.headingId.groupId._id}`).emit('receipt_processing_completed', {
        receipt: populatedReceipt
      });
    }

  } catch (error) {
    console.error('OCR Processing Error:', error);
    
    await Receipt.findByIdAndUpdate(receiptId, {
      status: 'FAILED',
      errorMessage: error.message
    });

    // Notify about failure
    const receipt = await Receipt.findById(receiptId).populate({
      path: 'headingId',
      populate: { path: 'groupId' }
    });

    if (io && receipt) {
      io.to(`group_${receipt.headingId.groupId._id}`).emit('receipt_processing_failed', {
        receiptId,
        error: error.message
      });
    }
  }
};

const confirmMapping = async (req, res) => {
  try {
    const { mappingId } = req.params;
    const { confirmed, customPrice } = req.body;
    const userId = req.user._id;

    // Find the receipt and mapping
    const receipt = await Receipt.findOne({
      'aiMappings._id': mappingId
    }).populate({
      path: 'headingId',
      populate: { path: 'groupId' }
    });

    if (!receipt) {
      return res.status(404).json({ message: 'Mapping not found' });
    }

    // Check access
    const membership = await Membership.findOne({
      userId,
      groupId: receipt.headingId.groupId._id,
      isActive: true
    });

    if (!membership) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const mapping = receipt.aiMappings.id(mappingId);
    if (!mapping) {
      return res.status(404).json({ message: 'Mapping not found' });
    }

    if (confirmed) {
      // Update the order item with confirmed price
      const orderItem = await OrderItem.findById(mapping.orderItemId);
      if (orderItem) {
        orderItem.price = customPrice || mapping.extractedPrice;
        orderItem.isPriceConfirmed = true;
        orderItem.matchedReceiptLine = mapping.matchedReceiptLine;
        orderItem.confidenceScore = mapping.confidenceScore;
        await orderItem.save();

        const populatedItem = await OrderItem.findById(orderItem._id)
          .populate('requestedBy', 'displayName')
          .populate('paidBy.userId', 'displayName');

        // Broadcast update
        if (req.io) {
          req.io.to(`group_${receipt.headingId.groupId._id}`).emit('item_price_updated', {
            orderItem: populatedItem
          });
        }
      }
    }

    res.json({ message: 'Mapping processed successfully' });

  } catch (error) {
    console.error('Confirm mapping error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const assignPayer = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { payers } = req.body; // Array of { userId, amount }
    const userId = req.user._id;

    if (!payers || !Array.isArray(payers) || payers.length === 0) {
      return res.status(400).json({ message: 'Valid payers array is required' });
    }

    const orderItem = await OrderItem.findById(itemId).populate({
      path: 'headingId',
      populate: { path: 'groupId' }
    });

    if (!orderItem) {
      return res.status(404).json({ message: 'Order item not found' });
    }

    // Check access
    const membership = await Membership.findOne({
      userId,
      groupId: orderItem.headingId.groupId._id,
      isActive: true
    });

    if (!membership) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate total amount
    const totalAmount = payers.reduce((sum, payer) => sum + payer.amount, 0);
    if (orderItem.price && Math.abs(totalAmount - orderItem.price) > 0.01) {
      return res.status(400).json({ 
        message: 'Total payer amount must match item price' 
      });
    }

    // Validate payer users exist and are group members
    const payerUserIds = payers.map(p => p.userId);
    const validMembers = await Membership.find({
      groupId: orderItem.headingId.groupId._id,
      userId: { $in: payerUserIds },
      isActive: true
    });

    if (validMembers.length !== payerUserIds.length) {
      return res.status(400).json({ 
        message: 'All payers must be group members' 
      });
    }

    // Update paidBy array
    orderItem.paidBy = payers.map(payer => ({
      userId: payer.userId,
      amount: payer.amount
    }));

    await orderItem.save();

    const populatedItem = await OrderItem.findById(itemId)
      .populate('requestedBy', 'displayName')
      .populate('paidBy.userId', 'displayName');

    res.json({
      message: 'Payers assigned successfully',
      orderItem: populatedItem
    });

    // Broadcast update
    if (req.io) {
      req.io.to(`group_${orderItem.headingId.groupId._id}`).emit('item_payers_updated', {
        orderItem: populatedItem
      });
    }

  } catch (error) {
    console.error('Assign payer error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getReceipts = async (req, res) => {
  try {
    const { headingId } = req.params;
    const userId = req.user._id;

    // Verify access
    const heading = await Heading.findById(headingId).populate('groupId');
    if (!heading) {
      return res.status(404).json({ message: 'Heading not found' });
    }

    const membership = await Membership.findOne({
      userId,
      groupId: heading.groupId._id,
      isActive: true
    });

    if (!membership) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const receipts = await Receipt.find({ headingId })
      .populate('uploadedBy', 'displayName')
      .populate('aiMappings.orderItemId')
      .sort({ createdAt: -1 });

    res.json({ receipts });

  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addManualPrice,
  uploadReceipt,
  confirmMapping,
  assignPayer,
  getReceipts
};
