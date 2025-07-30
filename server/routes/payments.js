/* eslint-disable no-console */
const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');

// eslint-disable-next-line new-cap
const router = express.Router();

// Utility functions for receipt generation
function formatPrice(amount, currency) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Factory function for Stripe - allows for better testing
let testStripeInstance = null;

function getStripe() {
  if (process.env.NODE_ENV === 'test' && testStripeInstance) {
    return testStripeInstance;
  }
  if (process.env.NODE_ENV === 'test') {
    // Return the mocked stripe function
    const stripeMock = require('stripe');
    return stripeMock();
  }

  // Validate Stripe secret key
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    throw new Error(
      'STRIPE_SECRET_KEY appears to be invalid (should start with sk_)'
    );
  }

  return require('stripe')(process.env.STRIPE_SECRET_KEY);
}

// @route   POST /api/payments/create-payment-intent
// @desc    Create Stripe payment intent
// @access  Private
router.post(
  '/create-payment-intent',
  [
    authenticateToken,
    body('enrollmentId')
      .isMongoId()
      .withMessage('Valid enrollment ID is required'),
    body('paymentMethod')
      .isIn(['stripe'])
      .withMessage('Valid payment method is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { enrollmentId, paymentMethod } = req.body;

      // Get enrollment
      const enrollment = await Enrollment.findById(enrollmentId)
        .populate('course')
        .populate('student');

      if (!enrollment) {
        return res.status(404).json({
          message: 'Enrollment not found',
        });
      }

      // Check if user owns this enrollment
      if (enrollment.student._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'Access denied. You can only pay for your own enrollments.',
        });
      }

      if (enrollment.payment.paymentStatus === 'completed') {
        return res.status(400).json({
          message: 'Payment has already been completed for this enrollment',
        });
      }

      // Calculate amount in cents (Stripe requires amounts in cents)
      const amountInCents = Math.round(enrollment.payment.amount * 100);

      // Handle currency for Stripe - convert BDT to USD if needed
      let stripeCurrency = enrollment.payment.currency.toLowerCase();
      let stripeAmount = amountInCents;

      // Stripe has limited support for BDT, so we might need to convert
      // For now, if the course is in BDT, we'll keep it as BDT but add a note
      // You can modify this logic based on your business requirements
      if (stripeCurrency === 'bdt') {
        // Stripe supports BDT, but with limitations. Keeping as BDT.
        // If you want to convert to USD, uncomment the lines below:
        // stripeCurrency = 'usd';
        // stripeAmount = Math.round((enrollment.payment.amount / 110) * 100); // Approximate BDT to USD conversion
      }

      // Create payment intent
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: stripeAmount,
        currency: stripeCurrency,
        metadata: {
          enrollmentId: enrollment._id.toString(),
          courseId: enrollment.course._id.toString(),
          studentId: enrollment.student._id.toString(),
          courseTitle: enrollment.course.title,
          originalCurrency: enrollment.payment.currency,
          originalAmount: enrollment.payment.amount.toString(),
        },
        description: `Payment for ${enrollment.course.title} course`,
        // eslint-disable-next-line camelcase
        receipt_email: enrollment.student.email,
      });

      // Create payment record
      const payment = new Payment({
        user: req.user._id,
        enrollment: enrollmentId,
        course: enrollment.course._id,
        amount: enrollment.payment.amount,
        currency: enrollment.payment.currency,
        paymentMethod,
        status: 'pending',
        stripePaymentIntentId: paymentIntent.id,
        description: `Payment for ${enrollment.course.title} course`,
        netAmount: enrollment.payment.amount,
        metadata: {
          customerEmail: enrollment.student.email,
          customerName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
          courseTitle: enrollment.course.title,
          courseId: enrollment.course._id.toString(),
          enrollmentId: enrollment._id.toString(),
        },
      });

      await payment.save();

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        paymentId: payment._id,
      });
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Create payment intent error:', error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error type:', error.type);
        console.error(
          'Stripe secret key exists:',
          !!process.env.STRIPE_SECRET_KEY
        );
        console.error(
          'Stripe secret key length:',
          process.env.STRIPE_SECRET_KEY
            ? process.env.STRIPE_SECRET_KEY.length
            : 'undefined'
        );
      }

      // More specific error responses
      if (error.type === 'StripeCardError') {
        return res.status(400).json({
          message: 'Payment failed - card error',
          error: error.message,
        });
      } else if (error.type === 'StripeInvalidRequestError') {
        return res.status(400).json({
          message: 'Invalid payment request',
          error: error.message,
        });
      } else if (error.type === 'StripeAPIError') {
        return res.status(500).json({
          message: 'Payment service error',
          error: 'Stripe API error',
        });
      } else if (error.type === 'StripeConnectionError') {
        return res.status(500).json({
          message: 'Payment service connection error',
          error: 'Unable to connect to payment service',
        });
      } else if (error.type === 'StripeAuthenticationError') {
        return res.status(500).json({
          message: 'Payment service authentication error',
          error: 'Invalid API key',
        });
      }

      res.status(500).json({
        message: 'Server error while creating payment intent',
        error:
          process.env.NODE_ENV === 'development'
            ? error.message
            : 'Internal server error',
      });
    }
  }
);

// @route   POST /api/payments/confirm
// @desc    Confirm payment and update enrollment
// @access  Private
router.post(
  '/confirm',
  [
    authenticateToken,
    body('paymentIntentId')
      .notEmpty()
      .withMessage('Payment intent ID is required'),
    body('paymentId').isMongoId().withMessage('Valid payment ID is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { paymentIntentId, paymentId } = req.body;

      // Get payment record
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        return res.status(404).json({
          message: 'Payment not found',
        });
      }

      // Check if user owns this payment
      if (payment.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'Access denied. You can only confirm your own payments.',
        });
      }

      // Verify payment intent with Stripe
      const stripe = getStripe();
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Update payment status
        payment.status = 'completed';
        payment.stripeChargeId = paymentIntent.latest_charge;
        payment.paymentDate = new Date();
        payment.transactionId = paymentIntent.id;

        // Update enrollment
        const enrollment = await Enrollment.findById(payment.enrollment);
        if (enrollment) {
          enrollment.payment.paymentStatus = 'completed';
          enrollment.payment.paymentDate = new Date();
          enrollment.payment.transactionId = paymentIntent.id;
          enrollment.status = 'active';
          enrollment.startDate = new Date();
          await enrollment.save();
        }

        await payment.save();

        // Send confirmation email
        try {
          const course = await Course.findById(payment.course);
          const user = await require('../models/User').findById(payment.user);

          await sendEmail({
            to: user.email,
            subject: 'Payment Confirmation - Students Enrollment System',
            html: emailTemplates.paymentConfirmation(
              user.firstName,
              course.title,
              payment.amount,
              payment.transactionId
            ),
          });
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
        }

        res.json({
          message: 'Payment confirmed successfully',
          payment,
        });
      } else {
        payment.status = 'failed';
        payment.failureReason = {
          code: paymentIntent.last_payment_error?.code || 'unknown',
          message:
            paymentIntent.last_payment_error?.message || 'Payment failed',
        };
        await payment.save();

        res.status(400).json({
          message: 'Payment failed',
          error:
            paymentIntent.last_payment_error?.message ||
            'Payment was not successful',
        });
      }
    } catch (error) {
      console.error('Confirm payment error:', error);
      res.status(500).json({
        message: 'Server error while confirming payment',
      });
    }
  }
);

// @route   POST /api/payments/confirm-success
// @desc    Confirm payment success and update enrollment status
// @access  Private
router.post(
  '/confirm-success',
  [
    authenticateToken,
    body('enrollmentId')
      .isMongoId()
      .withMessage('Valid enrollment ID is required'),
    body('paymentIntentId')
      .notEmpty()
      .withMessage('Payment intent ID is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { enrollmentId, paymentIntentId } = req.body;

      // Verify the enrollment belongs to the user
      const enrollment =
        await Enrollment.findById(enrollmentId).populate('course');
      if (!enrollment) {
        return res.status(404).json({
          message: 'Enrollment not found',
        });
      }

      if (enrollment.student.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'Access denied. You can only confirm your own payments.',
        });
      }

      // Verify payment intent with Stripe
      const stripe = getStripe();
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({
          message: 'Payment has not succeeded yet',
          paymentStatus: paymentIntent.status,
        });
      }

      // Update enrollment status if payment succeeded
      if (enrollment.payment.paymentStatus !== 'completed') {
        enrollment.payment.paymentStatus = 'completed';
        enrollment.payment.paymentDate = new Date();
        enrollment.payment.transactionId = paymentIntentId;
        enrollment.status = 'active';
        enrollment.startDate = new Date();
        await enrollment.save();

        // Update payment record if it exists
        const payment = await Payment.findOne({
          stripePaymentIntentId: paymentIntentId,
        });

        if (payment && payment.status !== 'completed') {
          payment.status = 'completed';
          payment.stripeChargeId = paymentIntent.latest_charge;
          payment.paymentDate = new Date();
          payment.transactionId = paymentIntentId;
          await payment.save();
        }

        console.log(
          `Payment confirmed for enrollment ${enrollmentId}, status updated to active`
        );
      }

      res.json({
        message: 'Payment confirmed and enrollment activated',
        enrollment: {
          id: enrollment._id,
          status: enrollment.status,
          paymentStatus: enrollment.payment.paymentStatus,
          startDate: enrollment.startDate,
        },
      });
    } catch (error) {
      console.error('Confirm payment success error:', error);
      res.status(500).json({
        message: 'Server error while confirming payment',
        error: error.message,
      });
    }
  }
);

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhooks
// @access  Public
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      if (process.env.NODE_ENV !== 'test') {
        console.error('Webhook signature verification failed:', err.message);
      }
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await handlePaymentSuccess(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await handlePaymentFailure(event.data.object);
          break;
        case 'charge.refunded':
          await handleRefund(event.data.object);
          break;
        default:
          // eslint-disable-next-line no-console
          console.log(`Unhandled event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

// Handle payment success
async function handlePaymentSuccess(paymentIntent) {
  const payment = await Payment.findOne({
    stripePaymentIntentId: paymentIntent.id,
  });

  if (payment && payment.status !== 'completed') {
    payment.status = 'completed';
    payment.stripeChargeId = paymentIntent.latest_charge;
    payment.paymentDate = new Date();
    payment.transactionId = paymentIntent.id;
    await payment.save();

    // Update enrollment
    const enrollment = await Enrollment.findById(payment.enrollment);
    if (enrollment) {
      enrollment.payment.paymentStatus = 'completed';
      enrollment.payment.paymentDate = new Date();
      enrollment.payment.transactionId = paymentIntent.id;
      enrollment.status = 'active';
      enrollment.startDate = new Date();
      await enrollment.save();
    }
  }
}

// Handle payment failure
async function handlePaymentFailure(paymentIntent) {
  const payment = await Payment.findOne({
    stripePaymentIntentId: paymentIntent.id,
  });

  if (payment) {
    payment.status = 'failed';
    payment.failureReason = {
      code: paymentIntent.last_payment_error?.code || 'unknown',
      message: paymentIntent.last_payment_error?.message || 'Payment failed',
    };
    await payment.save();
  }
}

// Handle refund
async function handleRefund(charge) {
  const payment = await Payment.findOne({
    stripeChargeId: charge.id,
  });

  if (payment) {
    payment.status = 'refunded';
    payment.refund.amount = charge.amount_refunded / 100; // Convert from cents
    payment.refund.processedAt = new Date();
    payment.refund.stripeRefundId = charge.refunds.data[0]?.id;
    await payment.save();

    // Update enrollment
    const enrollment = await Enrollment.findById(payment.enrollment);
    if (enrollment) {
      enrollment.status = 'refunded';
      enrollment.payment.paymentStatus = 'refunded';
      enrollment.payment.refundAmount = charge.amount_refunded / 100;
      enrollment.payment.refundDate = new Date();
      await enrollment.save();
    }
  }
}

// @route   GET /api/payments/my-payments
// @desc    Get user's payment history
// @access  Private
router.get('/my-payments', [authenticateToken], async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = { user: req.user._id };
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const payments = await Payment.find(filter)
      .populate('course', 'title category level thumbnail')
      .populate('enrollment', 'status startDate')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Payment.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit, 10));

    res.json({
      payments,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages,
        total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    console.error('Get user payments error:', error);
    res.status(500).json({
      message: 'Server error while fetching payment history',
    });
  }
});

// @route   GET /api/payments
// @desc    Get payment history (Admin only)
// @access  Private
router.get('/', [authenticateToken, requireAdmin], async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const payments = await Payment.find(filter)
      .populate('user', 'firstName lastName email')
      .populate('course', 'title')
      .populate('enrollment')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const total = await Payment.countDocuments(filter);
    const totalPages = Math.ceil(total / parseInt(limit, 10));

    res.json({
      payments,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages,
        total,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: parseInt(limit, 10),
      },
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      message: 'Server error while fetching payments',
    });
  }
});

// @route   POST /api/payments/:id/refund
// @desc    Process refund
// @access  Private (Admin)
router.post(
  '/:id/refund',
  [
    authenticateToken,
    requireAdmin,
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('Refund amount must be greater than 0'),
    body('reason')
      .trim()
      .isLength({ min: 5, max: 500 })
      .withMessage('Reason must be between 5 and 500 characters'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const { amount, reason } = req.body;

      const payment = await Payment.findById(req.params.id);
      if (!payment) {
        return res.status(404).json({
          message: 'Payment not found',
        });
      }

      if (payment.status !== 'completed') {
        return res.status(400).json({
          message: 'Only completed payments can be refunded',
        });
      }

      if (amount > payment.refundableAmount) {
        return res.status(400).json({
          message: 'Refund amount exceeds refundable amount',
        });
      }

      // Process refund through Stripe
      const stripe = getStripe();
      const refund = await stripe.refunds.create({
        charge: payment.stripeChargeId,
        amount: Math.round(amount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          refundReason: reason,
          processedBy: req.user._id.toString(),
        },
      });

      // Update payment record
      payment.processRefund(amount, reason, req.user._id);
      payment.refund.stripeRefundId = refund.id;
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
        refundId: refund.id,
      });
    } catch (error) {
      console.error('Process refund error:', error);
      res.status(500).json({
        message: 'Server error while processing refund',
      });
    }
  }
);

// @route   POST /api/payments/process
// @desc    Process payment with different payment methods
// @access  Private
router.post(
  '/process',
  [
    authenticateToken,
    body('enrollmentId')
      .isMongoId()
      .withMessage('Valid enrollment ID is required'),
    body('paymentMethod')
      .isIn(['stripe', 'sslcommerz'])
      .withMessage('Valid payment method is required'),
    body('amount').isNumeric().withMessage('Valid amount is required'),
    body('billingAddress')
      .isObject()
      .withMessage('Billing address is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: 'Validation failed',
          errors: errors.array(),
        });
      }

      const {
        enrollmentId,
        paymentMethod,
        amount,
        billingAddress,
        cardDetails,
      } = req.body;

      // Get enrollment
      const enrollment = await Enrollment.findById(enrollmentId)
        .populate('course')
        .populate('student');

      if (!enrollment) {
        return res.status(404).json({
          message: 'Enrollment not found',
        });
      }

      // Check if user owns this enrollment
      if (enrollment.student._id.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          message: 'Access denied. You can only pay for your own enrollments.',
        });
      }

      if (enrollment.payment.paymentStatus === 'completed') {
        return res.status(400).json({
          message: 'Payment has already been completed for this enrollment',
        });
      }

      let paymentResult;

      switch (paymentMethod) {
        case 'stripe':
          paymentResult = await processStripePayment(
            enrollment,
            amount,
            billingAddress,
            cardDetails
          );
          break;
        case 'sslcommerz':
          paymentResult = await processSSLCommerzPayment(
            enrollment,
            amount,
            billingAddress
          );
          // For SSLCommerz, we don't create a payment record here as it's already created
          return res.json({
            success: true,
            message: 'Payment initiated',
            paymentId: paymentResult.paymentId,
            transactionId: paymentResult.transactionId,
            gatewayUrl: paymentResult.gatewayUrl,
            sessionkey: paymentResult.sessionkey,
          });
        default:
          return res.status(400).json({
            message: 'Unsupported payment method',
          });
      }

      // Create payment record
      const payment = new Payment({
        user: req.user._id,
        enrollment: enrollmentId,
        course: enrollment.course._id,
        amount: amount,
        currency: enrollment.payment.currency || 'BDT',
        paymentMethod,
        paymentGateway: paymentMethod,
        transactionId: paymentResult.transactionId,
        gatewayResponse: paymentResult.gatewayResponse,
        status: paymentResult.status,
        billingAddress,
        metadata: {
          courseTitle: enrollment.course.title,
          studentEmail: enrollment.student.email,
        },
      });

      await payment.save();

      // Update enrollment payment status
      enrollment.payment.paymentStatus = paymentResult.status;
      enrollment.payment.transactionId = paymentResult.transactionId;
      enrollment.payment.paymentDate = new Date();
      enrollment.payment.paymentMethod = paymentMethod;

      if (paymentResult.status === 'completed') {
        enrollment.status = 'active';
      }

      await enrollment.save();

      res.json({
        success: true,
        message:
          paymentResult.status === 'completed'
            ? 'Payment successful!'
            : 'Payment initiated',
        payment: payment,
        paymentId: payment._id,
        redirectUrl: paymentResult.redirectUrl,
      });
    } catch (error) {
      console.error('Process payment error:', error);
      res.status(500).json({
        message: 'Server error while processing payment',
      });
    }
  }
);

// @route   GET /api/payments/:paymentId
// @desc    Get payment details
// @access  Private
router.get('/:paymentId', authenticateToken, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate({
        path: 'enrollment',
        populate: {
          path: 'course',
          select:
            'title thumbnail category level instructor description duration',
          populate: {
            path: 'instructor',
            select: 'firstName lastName email',
          },
        },
      })
      .populate('user', 'firstName lastName email phone')
      .populate(
        'course',
        'title thumbnail category level description duration'
      );

    if (!payment) {
      return res.status(404).json({
        message: 'Payment not found',
      });
    }

    // Check if user owns this payment (or is admin)
    if (
      payment.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Access denied. You can only view your own payments.',
      });
    }

    res.json({
      payment,
      enrollment: payment.enrollment,
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({
      message: 'Server error while fetching payment',
    });
  }
});

// @route   POST /api/payments/:paymentId/send-receipt
// @desc    Send payment receipt via email
// @access  Private
router.post('/:paymentId/send-receipt', authenticateToken, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate('enrollment')
      .populate('user');

    if (!payment) {
      return res.status(404).json({
        message: 'Payment not found',
      });
    }

    // Check if user owns this payment
    if (payment.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Access denied.',
      });
    }

    // Send receipt email
    await sendEmail(
      payment.user.email,
      'Payment Receipt',
      emailTemplates.paymentReceipt({
        user: payment.user,
        payment: payment,
        enrollment: payment.enrollment,
      })
    );

    res.json({
      message: 'Receipt sent successfully',
    });
  } catch (error) {
    console.error('Send receipt error:', error);
    res.status(500).json({
      message: 'Server error while sending receipt',
    });
  }
});

// @route   GET /api/payments/:paymentId/receipt
// @desc    Download payment receipt PDF
// @access  Private
router.get('/:paymentId/receipt', authenticateToken, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId)
      .populate({
        path: 'enrollment',
        populate: {
          path: 'course',
          select:
            'title thumbnail category level instructor description duration',
          populate: {
            path: 'instructor',
            select: 'firstName lastName email',
          },
        },
      })
      .populate('user', 'firstName lastName email phone')
      .populate(
        'course',
        'title thumbnail category level description duration'
      );

    if (!payment) {
      return res.status(404).json({
        message: 'Payment not found',
      });
    }

    // Check if user owns this payment (or is admin)
    if (
      payment.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Access denied. You can only view your own payments.',
      });
    }

    // Validate payment has required data
    if (!payment.user || !payment.enrollment || !payment.course) {
      return res.status(400).json({
        message: 'Payment information missing. Please contact support.',
      });
    }

    // Generate PDF receipt
    const htmlPdf = require('html-pdf-node');

    // Create HTML content for PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Payment Receipt</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 20px;
                color: #333;
                background: #fff;
            }
            .receipt-container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border: 1px solid #ddd;
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 2px solid #1976d2;
                padding-bottom: 20px;
            }
            .header h1 {
                color: #1976d2;
                margin: 0;
                font-size: 32px;
            }
            .header .status {
                background: #4caf50;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                display: inline-block;
                margin-top: 10px;
                font-weight: bold;
            }
            .company-info {
                text-align: center;
                margin-bottom: 30px;
                color: #666;
            }
            .company-info h2 {
                color: #1976d2;
                margin: 0 0 10px 0;
            }
            .details-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin-bottom: 30px;
            }
            .details-section {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #1976d2;
            }
            .details-section h3 {
                color: #1976d2;
                margin-top: 0;
                margin-bottom: 15px;
            }
            .detail-row {
                margin-bottom: 15px;
                padding-bottom: 8px;
                border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-label {
                font-weight: bold;
                color: #666;
                font-size: 14px;
                margin-bottom: 4px;
            }
            .detail-value {
                color: #333;
                font-size: 16px;
            }
            .course-section {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
                border-left: 4px solid #1976d2;
            }
            .course-section h3 {
                color: #1976d2;
                margin-top: 0;
            }
            .course-info {
                display: flex;
                align-items: flex-start;
                gap: 20px;
            }
            .course-details h4 {
                margin: 0 0 10px 0;
                color: #333;
                font-size: 20px;
            }
            .course-meta {
                display: flex;
                gap: 10px;
                margin-top: 10px;
            }
            .course-tag {
                background: #e3f2fd;
                color: #1976d2;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: bold;
            }
            .payment-summary {
                background: #f0f0f0;
                padding: 20px;
                border-radius: 8px;
                margin-bottom: 30px;
            }
            .payment-summary h3 {
                color: #1976d2;
                margin-top: 0;
            }
            .summary-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
                padding: 8px 0;
            }
            .summary-row.total {
                border-top: 2px solid #1976d2;
                font-weight: bold;
                font-size: 18px;
                color: #1976d2;
                margin-top: 15px;
                padding-top: 15px;
            }
            .footer {
                text-align: center;
                color: #666;
                font-size: 14px;
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
            }
            .receipt-number {
                background: #fff3cd;
                color: #856404;
                padding: 10px;
                border-radius: 4px;
                text-align: center;
                margin-bottom: 20px;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="receipt-container">
            <div class="header">
                <h1>Payment Receipt</h1>
                <div class="status">✓ Payment ${payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}</div>
            </div>

            <div class="receipt-number">
                Receipt #${payment._id.toString().slice(-8).toUpperCase()}
            </div>

            <div class="company-info">
                <h2>Students Enrollment System</h2>
                <p>Online Learning Platform<br>
                Email: support@studentsenrollment.com</p>
            </div>

            <div class="details-grid">
                <div class="details-section">
                    <h3>Payment Information</h3>
                    <div class="detail-row">
                        <div class="detail-label">Transaction ID</div>
                        <div class="detail-value">${payment.transactionId || payment.metadata?.sslTransactionId || 'N/A'}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Payment Date</div>
                        <div class="detail-value">${formatDate(payment.paymentDate || payment.updatedAt)}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Payment Method</div>
                        <div class="detail-value">${(() => {
                          if (payment.paymentMethod === 'sslcommerz') {
                            return 'SSLCommerz';
                          }
                          if (payment.paymentMethod === 'stripe') {
                            return 'Credit/Debit Card';
                          }
                          return payment.paymentMethod?.toUpperCase();
                        })()}</div>
                    </div>
                    ${
                      payment.metadata?.cardType
                        ? `
                    <div class="detail-row">
                        <div class="detail-label">Card Type</div>
                        <div class="detail-value">${payment.metadata.cardType}</div>
                    </div>`
                        : ''
                    }
                    ${
                      payment.metadata?.bankTransactionId
                        ? `
                    <div class="detail-row">
                        <div class="detail-label">Bank Transaction ID</div>
                        <div class="detail-value">${payment.metadata.bankTransactionId}</div>
                    </div>`
                        : ''
                    }
                </div>

                <div class="details-section">
                    <h3>Customer Information</h3>
                    <div class="detail-row">
                        <div class="detail-label">Student Name</div>
                        <div class="detail-value">${payment.user?.firstName} ${payment.user?.lastName}</div>
                    </div>
                    <div class="detail-row">
                        <div class="detail-label">Email Address</div>
                        <div class="detail-value">${payment.user?.email}</div>
                    </div>
                    ${
                      payment.user?.phone
                        ? `
                    <div class="detail-row">
                        <div class="detail-label">Phone Number</div>
                        <div class="detail-value">${payment.user.phone}</div>
                    </div>`
                        : ''
                    }
                </div>
            </div>

            <div class="course-section">
                <h3>Course Information</h3>
                <div class="course-info">
                    <div class="course-details">
                        <h4>${payment.course?.title || payment.metadata?.courseTitle}</h4>
                        <p>${payment.course?.description || payment.description}</p>
                        ${
                          payment.course
                            ? `
                        <div class="course-meta">
                            <span class="course-tag">${payment.course.category}</span>
                            <span class="course-tag">${payment.course.level}</span>
                            <span class="course-tag">${payment.course.duration} hours</span>
                        </div>`
                            : ''
                        }
                    </div>
                </div>
            </div>

            <div class="payment-summary">
                <h3>Payment Summary</h3>
                <div class="summary-row">
                    <span>Course Price:</span>
                    <span>${
                      payment.metadata?.originalAmount &&
                      payment.metadata?.originalCurrency
                        ? formatPrice(
                            payment.metadata.originalAmount,
                            payment.metadata.originalCurrency
                          )
                        : formatPrice(payment.amount, payment.currency)
                    }</span>
                </div>
                ${
                  payment.metadata?.originalAmount &&
                  payment.metadata?.originalCurrency
                    ? `
                <div class="summary-row">
                    <span>Amount in BDT:</span>
                    <span>${formatPrice(payment.amount, payment.currency)}</span>
                </div>`
                    : ''
                }
                <div class="summary-row">
                    <span>Processing Fee:</span>
                    <span>${formatPrice(0, payment.currency)}</span>
                </div>
                <div class="summary-row">
                    <span>Tax:</span>
                    <span>${formatPrice(payment.tax?.amount || 0, payment.currency)}</span>
                </div>
                <div class="summary-row total">
                    <span>Total Paid:</span>
                    <span>${
                      payment.metadata?.originalAmount &&
                      payment.metadata?.originalCurrency
                        ? formatPrice(
                            payment.metadata.originalAmount,
                            payment.metadata.originalCurrency
                          )
                        : formatPrice(payment.amount, payment.currency)
                    }</span>
                </div>
            </div>

            <div class="footer">
                <p><strong>Thank you for choosing Students Enrollment System!</strong></p>
                <p>For any questions about this payment, please contact our support team at support@studentsenrollment.com</p>
                <p><em>This is an electronically generated receipt.</em></p>
            </div>
        </div>
    </body>
    </html>
    `;

    const options = {
      format: 'A4',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in',
      },
    };

    // For development, if PDF generation fails, return HTML that can be printed
    console.log('Generating PDF for payment:', payment._id);

    try {
      const file = { content: htmlContent };
      const pdfBuffer = await htmlPdf.generatePdf(file, options);
      console.log(
        'PDF generated successfully, buffer length:',
        pdfBuffer.length
      );

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="receipt-${payment._id}.pdf"`
      );
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF
      res.send(pdfBuffer);
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError.message);

      // Fallback: return HTML for browser printing
      if (req.query.fallback === 'html') {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.send(htmlContent);
        return;
      }

      throw pdfError;
    }
  } catch (error) {
    console.error('Download receipt error:', error.message);

    // If PDF generation fails, suggest HTML fallback
    res.status(500).json({
      message:
        'PDF generation currently unavailable. Use ?fallback=html for printable HTML version.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      fallbackUrl: `/api/payments/${req.params.paymentId}/receipt?fallback=html`,
    });
  }
});

// Helper functions for different payment methods
async function processStripePayment(
  enrollment,
  amount,
  _billingAddress,
  _cardDetails
) {
  const stripe = getStripe();

  try {
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: enrollment.payment.currency.toLowerCase(),
      metadata: {
        enrollmentId: enrollment._id.toString(),
        courseId: enrollment.course._id.toString(),
        studentId: enrollment.student._id.toString(),
      },
      description: `Payment for ${enrollment.course.title}`,
      // eslint-disable-next-line camelcase
      receipt_email: enrollment.student.email,
    });

    // For demo purposes, we'll simulate a successful payment
    // In production, you'd confirm the payment with the actual card details
    return {
      status: 'completed',
      transactionId: paymentIntent.id,
      gatewayResponse: paymentIntent,
    };
  } catch (error) {
    console.error('Stripe payment error:', error);
    throw new Error('Stripe payment failed');
  }
}

async function processSSLCommerzPayment(enrollment, amount, billingAddress) {
  // Initialize SSLCommerz
  const SSLCommerzPayment = require('sslcommerz-lts');

  // Convert amount to BDT if necessary (approximate rate for demo)
  const bdtAmount =
    enrollment.payment.currency === 'USD' ? Math.round(amount * 110) : amount;

  // Generate unique transaction ID
  const transactionId = `SSL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // eslint-disable-next-line camelcase
  const data = {
    // eslint-disable-next-line camelcase
    total_amount: bdtAmount,
    currency: 'BDT',
    // eslint-disable-next-line camelcase
    tran_id: transactionId,
    // eslint-disable-next-line camelcase
    success_url: `${process.env.CLIENT_URL}/payment/sslcommerz/success`,
    // eslint-disable-next-line camelcase
    fail_url: `${process.env.CLIENT_URL}/payment/sslcommerz/fail`,
    // eslint-disable-next-line camelcase
    cancel_url: `${process.env.CLIENT_URL}/payment/sslcommerz/cancel`,
    // eslint-disable-next-line camelcase
    ipn_url: `${process.env.SERVER_URL}/api/payments/sslcommerz/ipn`,
    // eslint-disable-next-line camelcase
    shipping_method: 'NO',
    // eslint-disable-next-line camelcase
    product_name: enrollment.course.title,
    // eslint-disable-next-line camelcase
    product_category: 'Education',
    // eslint-disable-next-line camelcase
    product_profile: 'digital-goods',
    // eslint-disable-next-line camelcase
    cus_name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
    // eslint-disable-next-line camelcase
    cus_email: enrollment.student.email,
    // eslint-disable-next-line camelcase
    cus_add1: billingAddress.street || 'N/A',
    // eslint-disable-next-line camelcase
    cus_city: billingAddress.city || 'Dhaka',
    // eslint-disable-next-line camelcase
    cus_state: billingAddress.state || 'Dhaka',
    // eslint-disable-next-line camelcase
    cus_postcode: billingAddress.zipCode || '1000',
    // eslint-disable-next-line camelcase
    cus_country: billingAddress.country || 'Bangladesh',
    // eslint-disable-next-line camelcase
    cus_phone: enrollment.student.profile?.phone || '01700000000',
    // eslint-disable-next-line camelcase
    ship_name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
    // eslint-disable-next-line camelcase
    ship_add1: billingAddress.street || 'N/A',
    // eslint-disable-next-line camelcase
    ship_city: billingAddress.city || 'Dhaka',
    // eslint-disable-next-line camelcase
    ship_state: billingAddress.state || 'Dhaka',
    // eslint-disable-next-line camelcase
    ship_postcode: billingAddress.zipCode || '1000',
    // eslint-disable-next-line camelcase
    ship_country: billingAddress.country || 'Bangladesh',
  };

  try {
    const sslcz = new SSLCommerzPayment(
      process.env.SSLCOMMERZ_STORE_ID,
      process.env.SSLCOMMERZ_STORE_PASSWORD,
      process.env.SSLCOMMERZ_IS_LIVE === 'true'
    );

    const response = await sslcz.init(data);

    if (response.status === 'SUCCESS') {
      // Create payment record
      const Payment = require('../models/Payment');
      const payment = new Payment({
        user: enrollment.student._id,
        enrollment: enrollment._id,
        course: enrollment.course._id,
        amount: bdtAmount,
        currency: 'BDT',
        paymentMethod: 'sslcommerz',
        status: 'pending',
        description: `Payment for ${enrollment.course.title} course`,
        netAmount: bdtAmount,
        metadata: {
          sslTransactionId: transactionId,
          sessionkey: response.sessionkey,
          customerEmail: enrollment.student.email,
          customerName: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
          courseTitle: enrollment.course.title,
          courseId: enrollment.course._id.toString(),
          enrollmentId: enrollment._id.toString(),
          originalAmount: amount,
          originalCurrency: enrollment.payment.currency,
        },
      });

      await payment.save();

      return {
        status: 'pending',
        transactionId: transactionId,
        paymentId: payment._id,
        gatewayUrl: response.GatewayPageURL,
        sessionkey: response.sessionkey,
      };
    }
    throw new Error('SSLCommerz initialization failed');
  } catch (error) {
    console.error('SSLCommerz payment error:', error);
    throw new Error('SSLCommerz payment failed');
  }
}

// SSLCommerz success endpoint
router.post('/sslcommerz/success', async (req, res) => {
  try {
    // eslint-disable-next-line camelcase
    const { tran_id, val_id } = req.body;

    // eslint-disable-next-line camelcase
    if (!tran_id || !val_id) {
      return res
        .status(400)
        .json({ message: 'Missing payment verification parameters' });
    }

    // Initialize SSLCommerz for validation
    const SSLCommerzPayment = require('sslcommerz-lts');
    const sslcz = new SSLCommerzPayment(
      process.env.SSLCOMMERZ_STORE_ID,
      process.env.SSLCOMMERZ_STORE_PASSWORD,
      process.env.SSLCOMMERZ_IS_LIVE === 'true'
    );

    // Validate payment with SSLCommerz
    // eslint-disable-next-line camelcase
    const validation = await sslcz.validate({ val_id });

    // eslint-disable-next-line camelcase
    if (validation.status === 'VALID' && validation.tran_id === tran_id) {
      // Find the payment by transaction ID
      const Payment = require('../models/Payment');
      const payment = await Payment.findOne({
        // eslint-disable-next-line camelcase
        'metadata.sslTransactionId': tran_id,
      }).populate('user enrollment course');

      if (!payment) {
        return res.status(404).json({ message: 'Payment not found' });
      }

      // Update payment status
      payment.status = 'completed';
      payment.paymentStatus = 'completed';
      // eslint-disable-next-line camelcase
      payment.transactionId = tran_id;
      payment.paymentDate = new Date();

      // Add bank transaction details if available
      if (validation.bank_tran_id) {
        payment.metadata.bankTransactionId = validation.bank_tran_id;
      }
      if (validation.card_type) {
        payment.metadata.cardType = validation.card_type;
      }
      if (validation.card_no) {
        payment.metadata.cardNo = validation.card_no;
      }

      await payment.save();

      // Update enrollment status
      const Enrollment = require('../models/Enrollment');
      const enrollment = await Enrollment.findById(payment.enrollment);
      if (enrollment) {
        enrollment.status = 'active';
        enrollment.paymentStatus = 'completed';
        await enrollment.save();
      }

      res.json({
        success: true,
        message: 'Payment verified successfully',
        payment: payment.toObject(),
        enrollment: enrollment?.toObject(),
      });
    } else {
      return res.status(400).json({ message: 'Payment verification failed' });
    }
  } catch (error) {
    console.error('SSLCommerz success verification error:', error);
    res.status(500).json({
      message: 'Payment verification failed',
      error: error.message,
    });
  }
});

// SSLCommerz IPN (Instant Payment Notification) endpoint
router.post('/sslcommerz/ipn', async (req, res) => {
  try {
    // eslint-disable-next-line camelcase
    const { tran_id, val_id } = req.body;

    // eslint-disable-next-line camelcase
    if (!tran_id || !val_id) {
      return res.status(400).send('Missing parameters');
    }

    // Initialize SSLCommerz for validation
    const SSLCommerzPayment = require('sslcommerz-lts');
    const sslcz = new SSLCommerzPayment(
      process.env.SSLCOMMERZ_STORE_ID,
      process.env.SSLCOMMERZ_STORE_PASSWORD,
      process.env.SSLCOMMERZ_IS_LIVE === 'true'
    );

    // Validate payment
    // eslint-disable-next-line camelcase
    const validation = await sslcz.validate({ val_id });

    // eslint-disable-next-line camelcase
    if (validation.status === 'VALID' && validation.tran_id === tran_id) {
      // Find and update payment
      const Payment = require('../models/Payment');
      const payment = await Payment.findOne({
        // eslint-disable-next-line camelcase
        'metadata.sslTransactionId': tran_id,
      });

      if (payment && payment.status === 'pending') {
        payment.status = 'completed';
        payment.paymentStatus = 'completed';
        // eslint-disable-next-line camelcase
        payment.transactionId = tran_id;
        payment.paymentDate = new Date();

        // Add bank transaction details if available
        if (validation.bank_tran_id) {
          payment.metadata.bankTransactionId = validation.bank_tran_id;
        }
        if (validation.card_type) {
          payment.metadata.cardType = validation.card_type;
        }

        await payment.save();

        // Update enrollment status
        const Enrollment = require('../models/Enrollment');
        const enrollment = await Enrollment.findById(payment.enrollment);
        if (enrollment) {
          enrollment.status = 'active';
          enrollment.paymentStatus = 'completed';
          await enrollment.save();
        }
      }

      res.status(200).send('OK');
    } else {
      res.status(400).send('Invalid payment');
    }
  } catch (error) {
    console.error('SSLCommerz IPN error:', error);
    res.status(500).send('Server error');
  }
});

// @route   GET /api/payments/stripe/:paymentIntentId
// @desc    Get payment details by Stripe payment intent ID
// @access  Private
router.get('/stripe/:paymentIntentId', authenticateToken, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      stripePaymentIntentId: req.params.paymentIntentId,
    })
      .populate({
        path: 'enrollment',
        populate: {
          path: 'course',
          select:
            'title thumbnail category level instructor description duration',
          populate: {
            path: 'instructor',
            select: 'firstName lastName email',
          },
        },
      })
      .populate('user', 'firstName lastName email phone')
      .populate(
        'course',
        'title thumbnail category level description duration'
      );

    if (!payment) {
      return res.status(404).json({
        message: 'Payment not found',
      });
    }

    // Check if user owns this payment (or is admin)
    if (
      payment.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Access denied. You can only view your own payments.',
      });
    }

    res.json({
      payment,
      enrollment: payment.enrollment,
    });
  } catch (error) {
    console.error('Get payment by stripe intent error:', error);
    res.status(500).json({
      message: 'Server error while fetching payment',
    });
  }
});

// @route   GET /api/payments/enrollment/:enrollmentId
// @desc    Get payment details by enrollment ID
// @access  Private
router.get('/enrollment/:enrollmentId', authenticateToken, async (req, res) => {
  try {
    const payment = await Payment.findOne({
      enrollment: req.params.enrollmentId,
    })
      .populate({
        path: 'enrollment',
        populate: {
          path: 'course',
          select:
            'title thumbnail category level instructor description duration',
          populate: {
            path: 'instructor',
            select: 'firstName lastName email',
          },
        },
      })
      .populate('user', 'firstName lastName email phone')
      .populate(
        'course',
        'title thumbnail category level description duration'
      );

    if (!payment) {
      return res.status(404).json({
        message: 'Payment not found',
      });
    }

    // Check if user owns this payment (or is admin)
    if (
      payment.user._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Access denied. You can only view your own payments.',
      });
    }

    res.json({
      payment,
      enrollment: payment.enrollment,
    });
  } catch (error) {
    console.error('Get payment by enrollment error:', error);
    res.status(500).json({
      message: 'Server error while fetching payment',
    });
  }
});

// @route   GET /api/payments/stripe/:paymentIntentId/receipt
// @desc    Download payment receipt PDF by Stripe payment intent ID
// @access  Private
router.get(
  '/stripe/:paymentIntentId/receipt',
  authenticateToken,
  async (req, res) => {
    try {
      const payment = await Payment.findOne({
        stripePaymentIntentId: req.params.paymentIntentId,
      })
        .populate({
          path: 'enrollment',
          populate: {
            path: 'course',
            select:
              'title thumbnail category level instructor description duration',
            populate: {
              path: 'instructor',
              select: 'firstName lastName email',
            },
          },
        })
        .populate('user', 'firstName lastName email phone')
        .populate(
          'course',
          'title thumbnail category level description duration'
        );

      if (!payment) {
        return res.status(404).json({
          message: 'Payment not found',
        });
      }

      // Check if user owns this payment (or is admin)
      if (
        payment.user._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({
          message: 'Access denied. You can only view your own payments.',
        });
      }

      // Redirect to the main receipt endpoint
      res.redirect(
        `/api/payments/${payment._id}/receipt${req.query.fallback ? '?fallback=html' : ''}`
      );
    } catch (error) {
      console.error('Get receipt by stripe intent error:', error);
      res.status(500).json({
        message: 'Server error while fetching receipt',
      });
    }
  }
);

// @route   GET /api/payments/enrollment/:enrollmentId/receipt
// @desc    Download payment receipt PDF by enrollment ID
// @access  Private
router.get(
  '/enrollment/:enrollmentId/receipt',
  authenticateToken,
  async (req, res) => {
    try {
      const payment = await Payment.findOne({
        enrollment: req.params.enrollmentId,
      })
        .populate({
          path: 'enrollment',
          populate: {
            path: 'course',
            select:
              'title thumbnail category level instructor description duration',
            populate: {
              path: 'instructor',
              select: 'firstName lastName email',
            },
          },
        })
        .populate('user', 'firstName lastName email phone')
        .populate(
          'course',
          'title thumbnail category level description duration'
        );

      if (!payment) {
        return res.status(404).json({
          message: 'Payment not found',
        });
      }

      // Check if user owns this payment (or is admin)
      if (
        payment.user._id.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin'
      ) {
        return res.status(403).json({
          message: 'Access denied. You can only view your own payments.',
        });
      }

      // Redirect to the main receipt endpoint
      res.redirect(
        `/api/payments/${payment._id}/receipt${req.query.fallback ? '?fallback=html' : ''}`
      );
    } catch (error) {
      console.error('Get receipt by enrollment error:', error);
      res.status(500).json({
        message: 'Server error while fetching receipt',
      });
    }
  }
);

module.exports = router;
