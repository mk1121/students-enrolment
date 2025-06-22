const express = require('express');
const { body, validationResult } = require('express-validator');
const SSLCommerzPayment = require('sslcommerz-lts');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');

const router = express.Router();

// Initialize SSLCommerz
const store_id = process.env.SSLCOMMERZ_STORE_ID;
const store_passwd = process.env.SSLCOMMERZ_STORE_PASSWORD;
const is_live = process.env.SSLCOMMERZ_IS_LIVE === 'true';

// @route   POST /api/payments/sslcommerz/init
// @desc    Initialize SSLCommerz payment
// @access  Private
router.post('/init', [
  authenticateToken,
  body('enrollmentId')
    .isMongoId()
    .withMessage('Valid enrollment ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { enrollmentId } = req.body;

    // Get enrollment
    const enrollment = await Enrollment.findById(enrollmentId)
      .populate('course')
      .populate('student');

    if (!enrollment) {
      return res.status(404).json({ 
        message: 'Enrollment not found' 
      });
    }

    // Check if user owns this enrollment
    if (enrollment.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ 
        message: 'Access denied. You can only pay for your own enrollments.' 
      });
    }

    if (enrollment.payment.paymentStatus === 'completed') {
      return res.status(400).json({ 
        message: 'Payment has already been completed for this enrollment' 
      });
    }

    // Generate unique transaction ID
    const transactionId = `SSL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Convert USD to BDT (approximate rate for demo)
    const bdtAmount = enrollment.payment.currency === 'USD' 
      ? Math.round(enrollment.payment.amount * 110) 
      : enrollment.payment.amount;

    // SSLCommerz payment data
    const data = {
      total_amount: bdtAmount,
      currency: 'BDT',
      tran_id: transactionId,
      success_url: `${process.env.CLIENT_URL}/payment/sslcommerz/success`,
      fail_url: `${process.env.CLIENT_URL}/payment/sslcommerz/fail`,
      cancel_url: `${process.env.CLIENT_URL}/payment/sslcommerz/cancel`,
      ipn_url: `${process.env.SERVER_URL}/api/payments/sslcommerz/ipn`,
      shipping_method: 'NO',
      product_name: enrollment.course.title,
      product_category: 'Education',
      product_profile: 'digital-goods',
      cus_name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
      cus_email: enrollment.student.email,
      cus_add1: enrollment.student.profile?.address || 'N/A',
      cus_city: enrollment.student.profile?.city || 'Dhaka',
      cus_state: enrollment.student.profile?.state || 'Dhaka',
      cus_postcode: enrollment.student.profile?.postalCode || '1000',
      cus_country: enrollment.student.profile?.country || 'Bangladesh',
      cus_phone: enrollment.student.profile?.phone || '01700000000',
      ship_name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
      ship_add1: enrollment.student.profile?.address || 'N/A',
      ship_city: enrollment.student.profile?.city || 'Dhaka',
      ship_state: enrollment.student.profile?.state || 'Dhaka',
      ship_postcode: enrollment.student.profile?.postalCode || '1000',
      ship_country: enrollment.student.profile?.country || 'Bangladesh'
    };

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const apiResponse = await sslcz.init(data);

    if (apiResponse?.status === 'SUCCESS') {
      // Create payment record
      const payment = new Payment({
        user: req.user._id,
        enrollment: enrollmentId,
        course: enrollment.course._id,
        amount: bdtAmount,
        currency: 'BDT',
        paymentMethod: 'sslcommerz',
        status: 'pending',
        description: `Payment for ${enrollment.course.title} course`,
        netAmount: bdtAmount,
        metadata: {
          sslTransactionId: transactionId,
          sessionkey: apiResponse.sessionkey,
          customerEmail: enrollment.student.email,
          customerName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
          courseTitle: enrollment.course.title,
          courseId: enrollment.course._id.toString(),
          enrollmentId: enrollment._id.toString(),
          originalAmount: enrollment.payment.amount,
          originalCurrency: enrollment.payment.currency
        }
      });

      await payment.save();

      res.json({
        status: 'SUCCESS',
        sessionkey: apiResponse.sessionkey,
        gatewayUrl: apiResponse.GatewayPageURL,
        paymentId: payment._id,
        transactionId: transactionId
      });
    } else {
      res.status(400).json({
        message: 'SSLCommerz payment initialization failed',
        error: apiResponse?.failedreason || 'Unknown error'
      });
    }

  } catch (error) {
    console.error('SSLCommerz init error:', error);
    res.status(500).json({ 
      message: 'Server error while initializing SSLCommerz payment' 
    });
  }
});

// @route   POST /api/payments/sslcommerz/success
// @desc    Handle SSLCommerz success callback
// @access  Public
router.post('/success', async (req, res) => {
  try {
    const { tran_id, val_id, amount, card_type, store_amount, bank_tran_id, status } = req.body;

    if (status !== 'VALID') {
      return res.status(400).json({
        message: 'Payment validation failed',
        status: status
      });
    }

    // Find payment record
    const payment = await Payment.findOne({ 
      'metadata.sslTransactionId': tran_id 
    }).populate('enrollment').populate('user').populate('course');

    if (!payment) {
      return res.status(404).json({
        message: 'Payment record not found'
      });
    }

    // Validate with SSLCommerz
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const validation = await sslcz.validate({ val_id });

    if (validation?.status === 'VALID') {
      // Check amount matches
      if (parseFloat(validation.amount) !== payment.amount) {
        return res.status(400).json({
          message: 'Payment amount mismatch'
        });
      }

      // Update payment status
      payment.status = 'completed';
      payment.transactionId = tran_id;
      payment.paymentDate = new Date();
      payment.metadata.bankTransactionId = bank_tran_id;
      payment.metadata.cardType = card_type;
      payment.metadata.storeAmount = store_amount;
      payment.metadata.validationId = val_id;

      // Update enrollment
      const enrollment = await Enrollment.findById(payment.enrollment);
      if (enrollment) {
        enrollment.payment.paymentStatus = 'completed';
        enrollment.payment.paymentDate = new Date();
        enrollment.payment.transactionId = tran_id;
        enrollment.status = 'active';
        enrollment.startDate = new Date();
        await enrollment.save();
      }

      await payment.save();

      // Send confirmation email
      try {
        await sendEmail({
          to: payment.user.email,
          subject: 'Payment Confirmation - Students Enrollment System',
          ...emailTemplates.paymentConfirmation(
            payment.user.firstName,
            payment.course.title,
            payment.metadata.originalAmount || payment.amount,
            payment.transactionId
          )
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }

      res.json({
        message: 'Payment successful',
        transactionId: tran_id,
        payment: payment
      });
    } else {
      // Mark payment as failed
      payment.status = 'failed';
      payment.failureReason = {
        code: 'validation_failed',
        message: validation?.reason || 'Payment validation failed'
      };
      await payment.save();

      res.status(400).json({
        message: 'Payment validation failed',
        reason: validation?.reason
      });
    }

  } catch (error) {
    console.error('SSLCommerz success handler error:', error);
    res.status(500).json({ 
      message: 'Server error while processing payment success' 
    });
  }
});

// @route   POST /api/payments/sslcommerz/fail
// @desc    Handle SSLCommerz failure callback
// @access  Public
router.post('/fail', async (req, res) => {
  try {
    const { tran_id, error } = req.body;

    // Find and update payment record
    const payment = await Payment.findOne({ 
      'metadata.sslTransactionId': tran_id 
    });

    if (payment) {
      payment.status = 'failed';
      payment.failureReason = {
        code: 'payment_failed',
        message: error || 'Payment failed'
      };
      await payment.save();
    }

    res.json({
      message: 'Payment failed',
      transactionId: tran_id
    });

  } catch (error) {
    console.error('SSLCommerz fail handler error:', error);
    res.status(500).json({ 
      message: 'Server error while processing payment failure' 
    });
  }
});

// @route   POST /api/payments/sslcommerz/cancel
// @desc    Handle SSLCommerz cancellation callback
// @access  Public
router.post('/cancel', async (req, res) => {
  try {
    const { tran_id } = req.body;

    // Find and update payment record
    const payment = await Payment.findOne({ 
      'metadata.sslTransactionId': tran_id 
    });

    if (payment) {
      payment.status = 'cancelled';
      await payment.save();
    }

    res.json({
      message: 'Payment cancelled',
      transactionId: tran_id
    });

  } catch (error) {
    console.error('SSLCommerz cancel handler error:', error);
    res.status(500).json({ 
      message: 'Server error while processing payment cancellation' 
    });
  }
});

// @route   POST /api/payments/sslcommerz/ipn
// @desc    Handle SSLCommerz IPN (Instant Payment Notification)
// @access  Public
router.post('/ipn', async (req, res) => {
  try {
    const { tran_id, val_id, status, amount } = req.body;

    // Find payment record
    const payment = await Payment.findOne({ 
      'metadata.sslTransactionId': tran_id 
    });

    if (!payment) {
      return res.status(404).json({
        message: 'Payment record not found'
      });
    }

    // Validate with SSLCommerz
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const validation = await sslcz.validate({ val_id });

    if (validation?.status === 'VALID' && status === 'VALID') {
      if (payment.status !== 'completed') {
        // Update payment status
        payment.status = 'completed';
        payment.transactionId = tran_id;
        payment.paymentDate = new Date();
        payment.metadata.validationId = val_id;

        // Update enrollment
        const enrollment = await Enrollment.findById(payment.enrollment);
        if (enrollment) {
          enrollment.payment.paymentStatus = 'completed';
          enrollment.payment.paymentDate = new Date();
          enrollment.payment.transactionId = tran_id;
          enrollment.status = 'active';
          enrollment.startDate = new Date();
          await enrollment.save();
        }

        await payment.save();
      }
    }

    res.json({ received: true });

  } catch (error) {
    console.error('SSLCommerz IPN handler error:', error);
    res.status(500).json({ 
      message: 'Server error while processing IPN' 
    });
  }
});

// @route   POST /api/payments/sslcommerz/:id/refund
// @desc    Process SSLCommerz refund
// @access  Private (Admin)
router.post('/:id/refund', [
  authenticateToken,
  requireAdmin,
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be greater than 0'),
  body('reason')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Reason must be between 5 and 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { amount, reason } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ 
        message: 'Payment not found' 
      });
    }

    if (payment.paymentMethod !== 'sslcommerz') {
      return res.status(400).json({ 
        message: 'This endpoint is only for SSLCommerz payments' 
      });
    }

    if (payment.status !== 'completed') {
      return res.status(400).json({ 
        message: 'Only completed payments can be refunded' 
      });
    }

    if (amount > payment.refundableAmount) {
      return res.status(400).json({ 
        message: 'Refund amount exceeds refundable amount' 
      });
    }

    // Process refund through SSLCommerz
    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    
    const refundData = {
      refund_amount: amount,
      refund_remarks: reason,
      bank_tran_id: payment.metadata.bankTransactionId,
      refe_id: payment.transactionId
    };

    const refundResponse = await sslcz.refund(refundData);

    if (refundResponse?.status === 'success') {
      // Update payment record
      payment.processRefund(amount, reason, req.user._id);
      payment.refund.sslRefundId = refundResponse.refund_ref_id;
      await payment.save();

      // Update enrollment
      const enrollment = await Enrollment.findById(payment.enrollment);
      if (enrollment) {
        enrollment.payment.refundAmount += amount;
        enrollment.payment.refundReason = reason;
        enrollment.payment.refundDate = new Date();
        
        if (payment.refund.amount >= payment.amount) {
          enrollment.status = 'refunded';
          enrollment.payment.paymentStatus = 'refunded';
        }
        
        await enrollment.save();
      }

      res.json({
        message: 'Refund processed successfully',
        payment,
        refundId: refundResponse.refund_ref_id
      });
    } else {
      res.status(400).json({
        message: `Refund failed: ${refundResponse?.errorReason || 'Unknown error'}`
      });
    }

  } catch (error) {
    console.error('SSLCommerz refund error:', error);
    res.status(500).json({ 
      message: 'Server error while processing refund' 
    });
  }
});

// @route   POST /api/payments/sslcommerz/query
// @desc    Query transaction status from SSLCommerz
// @access  Private (Admin)
router.post('/query', [
  authenticateToken,
  requireAdmin,
  body('transactionId')
    .notEmpty()
    .withMessage('Transaction ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: errors.array() 
      });
    }

    const { transactionId } = req.body;

    const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
    const queryResponse = await sslcz.transactionQueryByTransactionId({
      tran_id: transactionId
    });

    res.json({
      transactionId,
      status: queryResponse?.status,
      data: queryResponse
    });

  } catch (error) {
    console.error('SSLCommerz query error:', error);
    res.status(500).json({ 
      message: 'Server error while querying transaction' 
    });
  }
});

module.exports = router; 