const express = require('express');
const { body, validationResult } = require('express-validator');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');

// eslint-disable-next-line new-cap
const router = express.Router();

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
      .isIn(['stripe', 'sslcommerz'])
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

      // Create payment intent
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: enrollment.payment.currency.toLowerCase(),
        metadata: {
          enrollmentId: enrollment._id.toString(),
          courseId: enrollment.course._id.toString(),
          studentId: enrollment.student._id.toString(),
          courseTitle: enrollment.course.title,
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
      console.error('Webhook signature verification failed:', err.message);
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

// @route   GET /api/payments
// @desc    Get payment history
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
      .isIn(['stripe', 'sslcommerz', 'cash'])
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
          break;
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
          select: 'title thumbnail category level instructor',
          populate: {
            path: 'instructor',
            select: 'firstName lastName email',
          },
        },
      })
      .populate('user', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({
        message: 'Payment not found',
      });
    }

    // Check if user owns this payment
    if (payment.user._id.toString() !== req.user._id.toString()) {
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

    // Generate PDF receipt (this would need a PDF generation library)
    // For now, return a simple text receipt
    const receiptText = `
      PAYMENT RECEIPT
      
      Transaction ID: ${payment.transactionId}
      Date: ${payment.createdAt.toLocaleDateString()}
      Amount: ${payment.amount} ${payment.currency}
      Payment Method: ${payment.paymentMethod}
      Status: ${payment.status}
      
      Course: ${payment.enrollment.course.title}
      Student: ${payment.user.firstName} ${payment.user.lastName}
      
      Thank you for your payment!
    `;

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="receipt-${payment._id}.txt"`
    );
    res.send(receiptText);
  } catch (error) {
    console.error('Download receipt error:', error);
    res.status(500).json({
      message: 'Server error while downloading receipt',
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
      receiptEmail: enrollment.student.email,
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

  // eslint-disable-next-line camelcase
  const data = {
    // eslint-disable-next-line camelcase
    total_amount: amount,
    currency: enrollment.payment.currency || 'BDT',
    // eslint-disable-next-line camelcase
    tran_id: `TXN_${Date.now()}`, // Unique transaction ID
    // eslint-disable-next-line camelcase
    success_url: `${process.env.CLIENT_URL}/payment/success`,
    // eslint-disable-next-line camelcase
    fail_url: `${process.env.CLIENT_URL}/payment/failure`,
    // eslint-disable-next-line camelcase
    cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
    // eslint-disable-next-line camelcase
    ipn_url: `${process.env.SERVER_URL}/api/payments/ipn`,
    // eslint-disable-next-line camelcase
    shipping_method: 'NO',
    // eslint-disable-next-line camelcase
    product_name: enrollment.course.title,
    // eslint-disable-next-line camelcase
    product_category: 'Education',
    // eslint-disable-next-line camelcase
    product_profile: 'digital-goods',
    // eslint-disable-next-line camelcase
    cus_name: enrollment.student.firstName + ' ' + enrollment.student.lastName,
    // eslint-disable-next-line camelcase
    // eslint-disable-next-line camelcase
    cus_email: enrollment.student.email,
    // eslint-disable-next-line camelcase
    cus_add1: billingAddress.street,
    // eslint-disable-next-line camelcase
    cus_city: billingAddress.city,
    // eslint-disable-next-line camelcase
    cus_state: billingAddress.state,
    // eslint-disable-next-line camelcase
    cus_postcode: billingAddress.zipCode,
    // eslint-disable-next-line camelcase
    cus_country: billingAddress.country,
    // eslint-disable-next-line camelcase
    cus_phone: enrollment.student.phone || '01700000000',
    // eslint-disable-next-line camelcase
    // eslint-disable-next-line camelcase
    cus_fax: enrollment.student.phone || '01700000000',
    // eslint-disable-next-line camelcase
    ship_name: enrollment.student.firstName + ' ' + enrollment.student.lastName,
    // eslint-disable-next-line camelcase
    ship_add1: billingAddress.street,
    // eslint-disable-next-line camelcase
    ship_city: billingAddress.city,
    // eslint-disable-next-line camelcase
    ship_state: billingAddress.state,
    // eslint-disable-next-line camelcase
    ship_postcode: billingAddress.zipCode,
    // eslint-disable-next-line camelcase
    ship_country: billingAddress.country,
  };

  try {
    const sslcz = new SSLCommerzPayment(
      process.env.SSLCOMMERZ_STORE_ID,
      process.env.SSLCOMMERZ_STORE_PASSWORD,
      process.env.NODE_ENV === 'production'
    );

    const response = await sslcz.init(data);

    if (response.status === 'SUCCESS') {
      return {
        status: 'pending',
        transactionId: data.tran_id,
        gatewayResponse: response,
        redirectUrl: response.redirectGatewayURL,
      };
    }
    throw new Error('SSLCommerz initialization failed');
  } catch (error) {
    console.error('SSLCommerz payment error:', error);
    throw new Error('SSLCommerz payment failed');
  }
}

module.exports = router;
