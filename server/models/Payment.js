const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: [true, 'Enrollment is required'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    currency: {
      type: String,
      default: 'BDT',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'BDT'],
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'cash', 'sslcommerz'],
      required: [true, 'Payment method is required'],
    },
    status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'completed',
        'failed',
        'cancelled',
        'refunded',
      ],
      default: 'pending',
    },
    stripePaymentIntentId: {
      type: String,
    },
    stripeChargeId: {
      type: String,
    },
    transactionId: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Payment description is required'],
    },
    metadata: {
      customerEmail: String,
      customerName: String,
      courseTitle: String,
      courseId: String,
      enrollmentId: String,
      // SSLCommerz specific fields
      sslTransactionId: String,
      sessionkey: String,
      validationId: String,
      bankTransactionId: String,
      cardType: String,
      storeAmount: Number,
      originalAmount: Number,
      originalCurrency: String,
    },
    billingDetails: {
      name: String,
      email: String,
      phone: String,
      address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
      },
    },
    refund: {
      amount: {
        type: Number,
        default: 0,
      },
      reason: String,
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      processedAt: Date,
      stripeRefundId: String,
    },
    fees: {
      stripe: {
        type: Number,
        default: 0,
      },
      platform: {
        type: Number,
        default: 0,
      },
    },
    tax: {
      amount: {
        type: Number,
        default: 0,
      },
      rate: {
        type: Number,
        default: 0,
      },
      country: String,
    },
    discount: {
      amount: {
        type: Number,
        default: 0,
      },
      code: String,
      type: {
        type: String,
        enum: ['percentage', 'fixed'],
      },
    },
    netAmount: {
      type: Number,
      required: [true, 'Net amount is required'],
    },
    failureReason: {
      code: String,
      message: String,
    },
    webhookEvents: [
      {
        event: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        data: mongoose.Schema.Types.Mixed,
      },
    ],
    isTest: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
paymentSchema.index({ user: 1 });
paymentSchema.index({ enrollment: 1 });
paymentSchema.index({ course: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ stripeChargeId: 1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function getFormattedAmount() {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: this.currency,
  }).format(this.amount);
});

// Virtual for formatted net amount
paymentSchema
  .virtual('formattedNetAmount')
  .get(function getFormattedNetAmount() {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this.currency,
    }).format(this.netAmount);
  });

// Virtual for isRefunded
paymentSchema.virtual('isRefunded').get(function getIsRefunded() {
  return this.status === 'refunded' || this.refund.amount > 0;
});

// Virtual for refundable amount
paymentSchema.virtual('refundableAmount').get(function getRefundableAmount() {
  if (this.status === 'completed' && !this.isRefunded) {
    return this.amount - this.refund.amount;
  }
  return 0;
});

// Method to generate transaction ID
paymentSchema.methods.generateTransactionId = function generateTransactionId() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substr(2, 9);
  return `TXN-${timestamp}-${random}`.toUpperCase();
};

// Method to process refund
paymentSchema.methods.processRefund = function processRefund(
  amount,
  reason,
  processedBy
) {
  if (amount > this.refundableAmount) {
    throw new Error('Refund amount exceeds refundable amount');
  }

  this.refund.amount += amount;
  this.refund.reason = reason;
  this.refund.processedBy = processedBy;
  this.refund.processedAt = new Date();

  if (this.refund.amount >= this.amount) {
    this.status = 'refunded';
  }
};

// Method to add webhook event
paymentSchema.methods.addWebhookEvent = function addWebhookEvent(event, data) {
  this.webhookEvents.push({ event, data });
};

// Pre-save middleware to generate transaction ID
paymentSchema.pre('save', function preSaveGenerateTransaction(next) {
  if (!this.transactionId) {
    this.transactionId = this.generateTransactionId();
  }

  // Calculate net amount
  this.netAmount = this.amount - this.discount.amount + this.tax.amount;

  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
