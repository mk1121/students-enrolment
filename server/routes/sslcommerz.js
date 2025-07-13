/* eslint-disable camelcase, no-console */
const express = require('express');
const { body, validationResult } = require('express-validator');
const fetch = require('node-fetch');
const querystring = require('querystring');
const SSLCommerzPayment = require('sslcommerz-lts');
const Payment = require('../models/Payment');
const Enrollment = require('../models/Enrollment');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../utils/email');

// eslint-disable-next-line new-cap
const router = express.Router();

// Initialize SSLCommerz
/* eslint-disable camelcase */
const store_id = process.env.SSLCOMMERZ_STORE_ID || process.env.SSLCZ_STORE_ID;
const store_passwd =
  process.env.SSLCOMMERZ_STORE_PASSWORD || process.env.SSLCZ_STORE_PASSWD;
const is_live =
  (process.env.SSLCOMMERZ_IS_LIVE || process.env.SSLCZ_IS_LIVE) === 'true';

// Debug logging for environment variables (only in development)
if (process.env.NODE_ENV !== 'test') {
  console.log('SSLCommerz Environment Variables:');
  console.log('SSLCOMMERZ_STORE_ID:', store_id);
  console.log('SSLCOMMERZ_STORE_PASSWORD:', store_passwd ? '***' : 'undefined');
  console.log('SSLCOMMERZ_IS_LIVE:', is_live);
}
/* eslint-enable camelcase */

// Validate environment variables
if (!store_id || !store_passwd) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(
      'SSLCommerz configuration error: Missing required environment variables'
    );
    console.error(
      'Required: SSLCOMMERZ_STORE_ID (or SSLCZ_STORE_ID), SSLCOMMERZ_STORE_PASSWORD (or SSLCZ_STORE_PASSWD)'
    );
  }
}

// Direct SSLCommerz API call function
async function callSSLCommerzAPI(data) {
  const url = is_live
    ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
    : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

  // Convert data to URL-encoded format
  const formData = querystring.stringify(data);

  if (process.env.NODE_ENV !== 'test') {
    console.log('Sending request to URL:', url);
    console.log('Form data:', formData);
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(formData),
    },
    body: formData,
  });

  const result = await response.json();
  if (process.env.NODE_ENV !== 'test') {
    console.log('Raw API response:', result);
  }
  return result;
}

// @route   POST /api/payments/sslcommerz/init
// @desc    Initialize SSLCommerz payment
// @access  Private
router.post(
  '/init',
  [
    authenticateToken,
    body('enrollmentId')
      .isMongoId()
      .withMessage('Valid enrollment ID is required'),
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

      const { enrollmentId } = req.body;

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

      // Check if this is a free course
      if (enrollment.payment.amount === 0) {
        return res.status(400).json({
          message: 'This is a free course. No payment is required.',
        });
      }

      // Generate unique transaction ID
      const transactionId = `SSL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (process.env.NODE_ENV !== 'test') {
        console.log('Generated transaction ID:', transactionId);
      }

      // Convert amount to BDT if needed (SSLCommerz only accepts BDT)
      let bdtAmount = enrollment.payment.amount;
      let originalAmount = enrollment.payment.amount;
      let originalCurrency = enrollment.payment.currency;

      if (enrollment.payment.currency === 'USD') {
        // Convert USD to BDT (approximate rate - in production use real-time rates)
        bdtAmount = Math.round(enrollment.payment.amount * 110);
      } else if (enrollment.payment.currency !== 'BDT') {
        // For other currencies, assume conversion rate of 1:1 for demo
        bdtAmount = enrollment.payment.amount;
      }

      // Ensure minimum amount for SSLCommerz (10 BDT)
      if (bdtAmount < 10) {
        bdtAmount = 10;
      }

      // SSLCommerz payment data
      /* eslint-disable camelcase */
      const data = {
        store_id: store_id,
        store_passwd: store_passwd,
        total_amount: bdtAmount,
        currency: 'BDT',
        tran_id: transactionId,
        success_url: `${process.env.SERVER_URL}/api/payments/sslcommerz/callback/success`,
        fail_url: `${process.env.SERVER_URL}/api/payments/sslcommerz/callback/fail`,
        cancel_url: `${process.env.SERVER_URL}/api/payments/sslcommerz/callback/cancel`,
        ipn_url: `${process.env.SERVER_URL}/api/payments/sslcommerz/ipn`,
        shipping_method: 'NO',
        product_name: enrollment.course.title,
        product_category: 'Education',
        productcategory: 'Education', // Required field for SSLCommerz
        product_profile: 'digital-goods',
        num_of_item: 1, // Required field for SSLCommerz
        // Customer Info - all required fields
        cus_name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        cus_email: enrollment.student.email,
        cus_add1: enrollment.student.profile?.address || 'Test Address',
        cus_add2: 'Test Address 2',
        cus_city: enrollment.student.profile?.city || 'Dhaka',
        cus_state: enrollment.student.profile?.state || 'Dhaka',
        cus_postcode: enrollment.student.profile?.postalCode || '1000',
        cus_country: enrollment.student.profile?.country || 'Bangladesh',
        cus_phone: enrollment.student.profile?.phone || '01700000000',
        cus_fax: '01700000000',
        // Shipping Info - all required fields
        ship_name: `${enrollment.student.firstName} ${enrollment.student.lastName}`,
        ship_add1: enrollment.student.profile?.address || 'Test Address',
        ship_add2: 'Test Address 2',
        ship_city: enrollment.student.profile?.city || 'Dhaka',
        ship_state: enrollment.student.profile?.state || 'Dhaka',
        ship_postcode: enrollment.student.profile?.postalCode || '1000',
        ship_country: enrollment.student.profile?.country || 'Bangladesh',
        // Additional fields
        multi_card_name: '',
        value_a: '',
        value_b: '',
        value_c: '',
        value_d: '',
      };
      /* eslint-enable camelcase */

      if (process.env.NODE_ENV !== 'test') {
        console.log('Creating SSLCommerz payment with:');
        console.log('store_id:', store_id);
        console.log('store_passwd:', store_passwd ? '***' : 'undefined');
        console.log('is_live:', is_live);
        console.log('Data object:', JSON.stringify(data, null, 2));
      }

      // Check if SSLCommerz credentials are configured
      if (!store_id || !store_passwd) {
        return res.status(500).json({
          message: 'SSLCommerz payment gateway is not properly configured',
        });
      }

      if (process.env.NODE_ENV !== 'test') {
        console.log('Calling SSLCommerz API...');
      }
      const apiResponse = await callSSLCommerzAPI(data);
      if (process.env.NODE_ENV !== 'test') {
        console.log('SSLCommerz API Response:', apiResponse);
      }

      if (apiResponse?.status === 'SUCCESS') {
        // Create payment record
        console.log('Creating payment record for transaction:', transactionId);
        console.log('TransactionId type:', typeof transactionId);
        console.log('TransactionId value:', transactionId);

        const paymentData = {
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
            originalAmount: originalAmount,
            originalCurrency: originalCurrency,
          },
        };

        console.log(
          'Payment data metadata:',
          JSON.stringify(paymentData.metadata, null, 2)
        );

        const payment = new Payment(paymentData);

        try {
          await payment.save();
          console.log('Payment record created successfully:', payment._id);
          console.log(
            'Saved payment metadata:',
            JSON.stringify(payment.metadata, null, 2)
          );
        } catch (paymentSaveError) {
          console.error('Failed to save payment record:', paymentSaveError);
          // This is critical - if we can't save the payment record,
          // we should not proceed with the payment
          return res.status(500).json({
            message: 'Failed to create payment record',
            error: paymentSaveError.message,
          });
        }

        res.json({
          status: 'SUCCESS',
          sessionkey: apiResponse.sessionkey,
          gatewayUrl: apiResponse.GatewayPageURL,
          paymentId: payment._id,
          transactionId: transactionId,
        });
      } else {
        res.status(400).json({
          message: 'SSLCommerz payment initialization failed',
          error: apiResponse?.failedreason || 'Unknown error',
        });
      }
    } catch (error) {
      console.error('SSLCommerz init error:', error);
      res.status(500).json({
        message: 'Server error while initializing SSLCommerz payment',
      });
    }
  }
);

// @route   POST /api/payments/sslcommerz/success
// @desc    Handle SSLCommerz success callback
// @access  Public
router.post('/success', async (req, res) => {
  try {
    const {
      tran_id,
      val_id,
      card_type,
      store_amount,
      bank_tran_id,
      status,
      amount,
    } = req.body;

    console.log('SSLCommerz success callback received:');
    console.log('tran_id:', tran_id);
    console.log('val_id:', val_id);
    console.log('status:', status);
    console.log('status type:', typeof status);
    console.log('status length:', status ? status.length : 'N/A');
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', JSON.stringify(req.headers, null, 2));

    // Accept various status values that indicate success
    const validStatuses = ['VALID', 'SUCCESS', 'VALIDATED', 'SUCCESSFUL'];

    // If status is undefined or empty, log this for debugging
    if (!status) {
      console.log('Warning: Status parameter is missing or empty');
      console.log('Available request body keys:', Object.keys(req.body));
      console.log(
        'Available query params:',
        JSON.stringify(req.query, null, 2)
      );

      // In sandbox mode, if we have transaction ID and validation ID, we can proceed
      if (!is_live && tran_id && val_id) {
        console.log('SANDBOX MODE: Proceeding without status parameter');
        // We'll validate using SSLCommerz API instead of relying on status parameter
      } else {
        return res.status(400).json({
          message: 'Payment validation failed',
          status: status,
          details: 'Status parameter is required',
          receivedStatus: status,
          availableKeys: Object.keys(req.body),
          debugInfo: {
            tran_id: tran_id,
            val_id: val_id,
            requestBody: req.body,
            queryParams: req.query,
          },
        });
      }
    } else if (!validStatuses.includes(status)) {
      console.log('Invalid status received:', status);
      console.log('Valid statuses:', validStatuses);

      // In sandbox mode, be more lenient with status validation
      if (!is_live && tran_id && val_id) {
        console.log(
          'SANDBOX MODE: Accepting status despite validation failure'
        );
        console.log('Will validate using SSLCommerz API instead');
      } else {
        return res.status(400).json({
          message: 'Payment validation failed',
          status: status,
          details: `Status must be one of: ${validStatuses.join(', ')}`,
          receivedStatus: status,
          debugInfo: {
            tran_id: tran_id,
            val_id: val_id,
            requestBody: req.body,
            queryParams: req.query,
          },
        });
      }
    }

    // Find payment record
    let payment = await Payment.findOne({
      'metadata.sslTransactionId': tran_id,
    })
      .populate('enrollment')
      .populate('user')
      .populate('course');

    console.log('Payment record found:', payment ? 'Yes' : 'No');
    if (payment) {
      console.log('Payment ID:', payment._id);
      console.log('Payment status:', payment.status);
      console.log('Payment amount:', payment.amount);
    }

    // If payment record doesn't exist, try to create it from the callback data
    if (!payment) {
      console.log('Payment record not found for transaction:', tran_id);
      console.log('Attempting to create payment record from callback data...');

      // This should not happen in normal flow, but let's handle it gracefully
      // Log this as an error but try to recover
      console.error('ERROR: Payment record missing for transaction', tran_id);
      console.error(
        'This indicates the payment was not properly initialized through /init endpoint'
      );

      return res.status(404).json({
        message:
          'Payment record not found. Payment may not have been properly initialized.',
        transactionId: tran_id,
      });
    }

    // Validate with SSLCommerz
    console.log('Validating with SSLCommerz...');
    console.log('Environment - is_live:', is_live);
    console.log('Store ID:', store_id);
    console.log('Validation ID for validation:', val_id);

    let validation;
    let isValidPayment = false;

    try {
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      validation = await sslcz.validate({ val_id });
      console.log('SSLCommerz validation response:', validation);

      // In sandbox mode, SSLCommerz often returns INVALID_TRANSACTION for test payments
      // We need to handle this case and validate manually using callback data
      if (validation?.status === 'VALID') {
        // Check amount matches - use validation response if callback doesn't have amount
        let callbackAmount = parseFloat(amount || store_amount || 0);

        // If callback doesn't have amount fields, use the validation response
        if (callbackAmount === 0 && validation.amount) {
          callbackAmount = parseFloat(validation.amount);
        }

        const expectedAmount = payment.amount; // Compare with BDT amount stored in DB

        console.log('Amount validation:');
        console.log('Raw amount field:', amount);
        console.log('Raw store_amount field:', store_amount);
        console.log('Validation amount:', validation.amount);
        console.log('Callback amount (parsed):', callbackAmount);
        console.log('Expected amount (BDT):', expectedAmount);
        console.log('Payment amount (BDT):', payment.amount);

        if (
          callbackAmount > 0 &&
          Math.abs(callbackAmount - expectedAmount) < 1.0
        ) {
          // Allow for integer vs float differences
          isValidPayment = true;
          console.log('Amount validation passed');
        } else {
          console.log('Amount mismatch detected');
          return res.status(400).json({
            message: 'Payment amount mismatch',
            expected: expectedAmount,
            received: callbackAmount,
            rawAmount: amount,
            rawStoreAmount: store_amount,
            validationAmount: validation.amount,
          });
        }
      } else if (validation?.status === 'INVALID_TRANSACTION' && !is_live) {
        // In sandbox mode, we can validate manually using the callback data
        console.log(
          'SANDBOX MODE: INVALID_TRANSACTION received, validating manually...'
        );

        // Manual validation for sandbox mode
        // Check if the callback data looks valid
        if (tran_id && val_id && status === 'VALID' && bank_tran_id) {
          // For manual validation, we rely on the validation response amount if available
          let callbackAmount = parseFloat(amount || store_amount || 0);
          if (callbackAmount === 0 && validation?.amount) {
            callbackAmount = parseFloat(validation.amount);
          }

          const expectedAmount = payment.amount; // Compare with BDT amount stored in DB

          console.log('Manual validation in sandbox mode:');
          console.log('Transaction ID:', tran_id);
          console.log('Validation ID:', val_id);
          console.log('Status:', status);
          console.log('Raw amount field:', amount);
          console.log('Raw store_amount field:', store_amount);
          console.log('Validation amount:', validation?.amount);
          console.log('Callback amount (parsed):', callbackAmount);
          console.log('Expected amount (BDT):', expectedAmount);

          if (
            callbackAmount > 0 &&
            Math.abs(callbackAmount - expectedAmount) < 1.0
          ) {
            isValidPayment = true;
            console.log('Manual validation passed');
          } else {
            console.log('Manual validation failed: amount mismatch');
          }
        } else {
          console.log('Manual validation failed: missing required fields');
          console.log('Available fields:', {
            tran_id,
            val_id,
            status,
            amount,
            store_amount,
            bank_tran_id,
          });
        }
      } else {
        console.log(
          'Payment validation failed - unknown status:',
          validation?.status
        );
        console.log(
          'Full validation response:',
          JSON.stringify(validation, null, 2)
        );

        // Add detailed logging for debugging
        console.log('Validation debugging:');
        console.log('- Validation status:', validation?.status);
        console.log('- Is live mode:', is_live);
        console.log('- Transaction ID:', tran_id);
        console.log('- Validation ID:', val_id);
        console.log('- Status from callback:', status);
        console.log('- Amount from callback:', amount);
        console.log('- Store amount from callback:', store_amount);
        console.log('- Bank transaction ID:', bank_tran_id);
      }
    } catch (validationError) {
      console.error('SSLCommerz validation error:', validationError);

      // Fallback: if validation API fails, try manual validation in sandbox mode
      if (!is_live && tran_id && val_id && status === 'VALID') {
        console.log(
          'Validation API failed, attempting manual validation for sandbox...'
        );
        const callbackAmount = parseFloat(
          amount || store_amount || payment.amount || 0
        );
        const expectedAmount = payment.amount; // Compare with BDT amount stored in DB

        console.log('Fallback validation:');
        console.log('Raw amount field:', amount);
        console.log('Raw store_amount field:', store_amount);
        console.log('Callback amount (parsed):', callbackAmount);
        console.log('Expected amount (BDT):', expectedAmount);

        if (
          callbackAmount > 0 &&
          Math.abs(callbackAmount - expectedAmount) < 1.0
        ) {
          isValidPayment = true;
          console.log('Fallback manual validation passed');
        } else {
          console.log('Fallback manual validation failed - amount mismatch');
        }
      } else if (!is_live && tran_id && val_id) {
        // In sandbox mode, if we have the basic required fields, consider it valid
        console.log('SANDBOX MODE: Lenient validation - basic fields present');
        console.log('Available fields:', {
          tran_id,
          val_id,
          status,
          amount,
          store_amount,
          bank_tran_id,
        });

        // For sandbox testing, we can be more lenient
        if (status === 'VALID' || status === 'SUCCESS') {
          isValidPayment = true;
          console.log('SANDBOX MODE: Accepting payment based on status field');
        }
      }
    }

    if (isValidPayment) {
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
          ),
        });
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
      }

      res.json({
        message: 'Payment successful',
        transactionId: tran_id,
        payment: payment,
      });
    } else {
      // Mark payment as failed
      payment.status = 'failed';
      payment.failureReason = {
        code: 'validation_failed',
        message: validation?.reason || 'Payment validation failed',
      };
      await payment.save();

      console.log('Payment validation failed for transaction:', tran_id);
      console.log('Validation result:', validation);
      console.log('isValidPayment:', isValidPayment);
      console.log('Expected conditions for valid payment:');
      console.log('- Status should be VALID or SUCCESS');
      console.log('- Amount should match');
      console.log('- Transaction ID should exist');

      res.status(400).json({
        message: 'Payment validation failed',
        reason: validation?.reason,
        details: 'Check server logs for more information',
        transactionId: tran_id,
      });
    }
  } catch (error) {
    console.error('SSLCommerz success handler error:', error);
    res.status(500).json({
      message: 'Server error while processing payment success',
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
      'metadata.sslTransactionId': tran_id,
    });

    if (payment) {
      payment.status = 'failed';
      payment.failureReason = {
        code: 'payment_failed',
        message: error || 'Payment failed',
      };
      await payment.save();
    }

    res.json({
      message: 'Payment failed',
      transactionId: tran_id,
    });
  } catch (error) {
    console.error('SSLCommerz fail handler error:', error);
    res.status(500).json({
      message: 'Server error while processing payment failure',
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
      'metadata.sslTransactionId': tran_id,
    });

    if (payment) {
      payment.status = 'cancelled';
      await payment.save();
    }

    res.json({
      message: 'Payment cancelled',
      transactionId: tran_id,
    });
  } catch (error) {
    console.error('SSLCommerz cancel handler error:', error);
    res.status(500).json({
      message: 'Server error while processing payment cancellation',
    });
  }
});

// @route   POST /api/payments/sslcommerz/ipn
// @desc    Handle SSLCommerz IPN (Instant Payment Notification)
// @access  Public
router.post('/ipn', async (req, res) => {
  try {
    console.log('SSLCommerz IPN received:');
    console.log('Request body:', JSON.stringify(req.body, null, 2));

    const { tran_id, val_id, status } = req.body;

    if (!tran_id) {
      console.log('IPN: Missing transaction ID');
      return res.status(400).json({
        message: 'Missing transaction ID',
      });
    }

    // Find payment record
    const payment = await Payment.findOne({
      'metadata.sslTransactionId': tran_id,
    });

    console.log('IPN: Payment record found:', payment ? 'Yes' : 'No');
    if (payment) {
      console.log('IPN: Payment ID:', payment._id);
      console.log('IPN: Payment status:', payment.status);
    }

    if (!payment) {
      console.log('IPN: Payment record not found for transaction:', tran_id);
      console.error(
        'ERROR: IPN received for non-existent payment record:',
        tran_id
      );
      console.error(
        'This indicates the payment was not properly initialized through /init endpoint'
      );

      return res.status(404).json({
        message: 'Payment record not found',
        transactionId: tran_id,
      });
    }

    // Validate with SSLCommerz
    let isValidPayment = false;
    let validation;

    try {
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      validation = await sslcz.validate({ val_id });
      console.log('IPN: SSLCommerz validation response:', validation);

      if (validation?.status === 'VALID' && status === 'VALID') {
        isValidPayment = true;
        console.log('IPN: Official validation successful');
      } else if (
        validation?.status === 'INVALID_TRANSACTION' &&
        !is_live &&
        status === 'VALID'
      ) {
        // In sandbox mode, we can validate manually using the callback data
        console.log(
          'IPN: Sandbox mode - INVALID_TRANSACTION received, validating manually...'
        );

        const { amount, store_amount } = req.body;
        if (tran_id && val_id) {
          // Use validation response amount if callback doesn't have amount
          let callbackAmount = parseFloat(amount || store_amount || 0);
          if (callbackAmount === 0 && validation?.amount) {
            callbackAmount = parseFloat(validation.amount);
          }

          const expectedAmount = payment.amount; // Compare with BDT amount stored in DB

          console.log('IPN: Manual validation in sandbox mode:');
          console.log('IPN: Raw amount field:', amount);
          console.log('IPN: Raw store_amount field:', store_amount);
          console.log('IPN: Validation amount:', validation?.amount);
          console.log('IPN: Callback amount (parsed):', callbackAmount);
          console.log('IPN: Expected amount (BDT):', expectedAmount);

          if (
            callbackAmount > 0 &&
            Math.abs(callbackAmount - expectedAmount) < 1.0
          ) {
            isValidPayment = true;
            console.log('IPN: Manual validation passed');
          } else {
            console.log('IPN: Manual validation failed: amount mismatch');
          }
        } else {
          console.log('IPN: Manual validation failed: missing required fields');
        }
      } else {
        console.log('IPN: Payment validation failed');
        console.log('IPN: Validation status:', validation?.status);
        console.log('IPN: Request status:', status);
      }
    } catch (error) {
      console.error('IPN: SSLCommerz validation error:', error); // Fallback: if validation API fails, try manual validation in sandbox mode
      if (!is_live && status === 'VALID') {
        console.log(
          'IPN: Validation API failed, attempting manual validation for sandbox...'
        );
        const { amount, store_amount } = req.body;
        if (tran_id && val_id) {
          const callbackAmount = parseFloat(
            amount || store_amount || payment.amount || 0
          );
          const expectedAmount = payment.amount; // Compare with BDT amount stored in DB

          console.log('IPN: Fallback validation:');
          console.log('IPN: Raw amount field:', amount);
          console.log('IPN: Raw store_amount field:', store_amount);
          console.log('IPN: Callback amount (parsed):', callbackAmount);
          console.log('IPN: Expected amount (BDT):', expectedAmount);

          if (
            callbackAmount > 0 &&
            Math.abs(callbackAmount - expectedAmount) < 1.0
          ) {
            isValidPayment = true;
            console.log('IPN: Fallback manual validation passed');
          }
        }
      }
    }

    if (isValidPayment) {
      if (payment.status !== 'completed') {
        console.log('IPN: Updating payment status to completed');

        // Update payment status
        payment.status = 'completed';
        payment.transactionId = tran_id;
        payment.paymentDate = new Date();
        payment.metadata.validationId = val_id;

        // Update enrollment
        const enrollment = await Enrollment.findById(payment.enrollment);
        if (enrollment) {
          console.log('IPN: Updating enrollment status to active');
          enrollment.payment.paymentStatus = 'completed';
          enrollment.payment.paymentDate = new Date();
          enrollment.payment.transactionId = tran_id;
          enrollment.status = 'active';
          enrollment.startDate = new Date();
          await enrollment.save();
        } else {
          console.error('IPN: Enrollment not found for payment:', payment._id);
        }

        await payment.save();
        console.log('IPN: Payment and enrollment updated successfully');
      } else {
        console.log('IPN: Payment already completed, skipping update');
      }
    } else {
      console.log('IPN: Payment validation failed');
      console.log('IPN: Validation status:', validation?.status);
      console.log('IPN: Request status:', status);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('SSLCommerz IPN handler error:', error);
    res.status(500).json({
      message: 'Server error while processing IPN',
    });
  }
});

// @route   POST /api/payments/sslcommerz/:id/refund
// @desc    Process SSLCommerz refund
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

      if (payment.paymentMethod !== 'sslcommerz') {
        return res.status(400).json({
          message: 'This endpoint is only for SSLCommerz payments',
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

      // Process refund through SSLCommerz
      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);

      const refundData = {
        refund_amount: amount,
        refund_remarks: reason,
        bank_tran_id: payment.metadata.bankTransactionId,
        refe_id: payment.transactionId,
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
          refundId: refundResponse.refund_ref_id,
        });
      } else {
        res.status(400).json({
          message: `Refund failed: ${refundResponse?.errorReason || 'Unknown error'}`,
        });
      }
    } catch (error) {
      console.error('SSLCommerz refund error:', error);
      res.status(500).json({
        message: 'Server error while processing refund',
      });
    }
  }
);

// @route   POST /api/payments/sslcommerz/query
// @desc    Query transaction status from SSLCommerz
// @access  Private (Admin)
router.post(
  '/query',
  [
    authenticateToken,
    requireAdmin,
    body('transactionId').notEmpty().withMessage('Transaction ID is required'),
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

      const { transactionId } = req.body;

      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      const queryResponse = await sslcz.transactionQueryByTransactionId({
        tran_id: transactionId,
      });

      res.json({
        transactionId,
        status: queryResponse?.status,
        data: queryResponse,
      });
    } catch (error) {
      console.error('SSLCommerz query error:', error);
      res.status(500).json({
        message: 'Server error while querying transaction',
      });
    }
  }
);

// @route   POST /api/payments/sslcommerz/callback/success
// @desc    Handle direct SSLCommerz success callback (server-to-server)
// @access  Public
router.post('/callback/success', async (req, res) => {
  try {
    console.log('SSLCommerz success callback received:', req.body);

    const { tran_id, val_id, status } = req.body;

    // Redirect to frontend with query parameters
    const redirectUrl = `${process.env.CLIENT_URL}/payment/sslcommerz/success?tran_id=${tran_id}&val_id=${val_id}&status=${status}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('SSLCommerz success callback error:', error);
    res.redirect(
      `${process.env.CLIENT_URL}/payment/sslcommerz/fail?error=callback_error`
    );
  }
});

// @route   POST /api/payments/sslcommerz/callback/fail
// @desc    Handle direct SSLCommerz fail callback (server-to-server)
// @access  Public
router.post('/callback/fail', async (req, res) => {
  try {
    console.log('SSLCommerz fail callback received:', req.body);

    const { tran_id, error } = req.body;

    // Redirect to frontend with query parameters
    const redirectUrl = `${process.env.CLIENT_URL}/payment/sslcommerz/fail?tran_id=${tran_id}&error=${error || 'payment_failed'}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('SSLCommerz fail callback error:', error);
    res.redirect(
      `${process.env.CLIENT_URL}/payment/sslcommerz/fail?error=callback_error`
    );
  }
});

// @route   POST /api/payments/sslcommerz/callback/cancel
// @desc    Handle direct SSLCommerz cancel callback (server-to-server)
// @access  Public
router.post('/callback/cancel', async (req, res) => {
  try {
    console.log('SSLCommerz cancel callback received:', req.body);

    const { tran_id } = req.body;

    // Redirect to frontend with query parameters
    const redirectUrl = `${process.env.CLIENT_URL}/payment/sslcommerz/cancel?tran_id=${tran_id}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('SSLCommerz cancel callback error:', error);
    res.redirect(
      `${process.env.CLIENT_URL}/payment/sslcommerz/cancel?error=callback_error`
    );
  }
});

// @route   GET /api/payments/sslcommerz/debug/recent
// @desc    Debug endpoint to list recent payment records and transactions
// @access  Private (Admin)
router.get(
  '/debug/recent',
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      // Get recent payment records
      const recentPayments = await Payment.find({
        paymentMethod: 'sslcommerz',
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .populate('user', 'firstName lastName email')
        .populate('course', 'title')
        .populate('enrollment');

      // Format the data for debugging
      const formattedPayments = recentPayments.map(payment => ({
        _id: payment._id,
        transactionId: payment.metadata?.sslTransactionId,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        user: payment.user
          ? `${payment.user.firstName} ${payment.user.lastName} (${payment.user.email})`
          : 'N/A',
        course: payment.course?.title || 'N/A',
        paymentDate: payment.paymentDate,
        createdAt: payment.createdAt,
        sessionkey: payment.metadata?.sessionkey,
        enrollmentId: payment.metadata?.enrollmentId,
      }));

      res.json({
        totalRecords: recentPayments.length,
        payments: formattedPayments,
      });
    } catch (error) {
      console.error('Debug recent payments error:', error);
      res.status(500).json({
        message: 'Server error while fetching recent payments',
      });
    }
  }
);

// @route   POST /api/payments/sslcommerz/verify
// @desc    Verify SSLCommerz payment for frontend
// @access  Public
router.post('/verify', async (req, res) => {
  try {
    const { tran_id, val_id, status } = req.body;

    console.log('Frontend payment verification request:');
    console.log('tran_id:', tran_id);
    console.log('val_id:', val_id);
    console.log('status:', status);

    if (!tran_id || !val_id) {
      return res.status(400).json({
        message: 'Missing required parameters',
        required: ['tran_id', 'val_id'],
        received: { tran_id, val_id, status },
      });
    }

    // Find payment record
    const payment = await Payment.findOne({
      'metadata.sslTransactionId': tran_id,
    })
      .populate('enrollment')
      .populate('user', 'firstName lastName email')
      .populate(
        'course',
        'title description thumbnail category level duration price currency'
      );

    if (!payment) {
      return res.status(404).json({
        message: 'Payment record not found',
        transactionId: tran_id,
      });
    }

    // Check payment status
    if (payment.status === 'completed') {
      // Payment already verified, get populated enrollment
      const enrollment = await Enrollment.findById(payment.enrollment).populate(
        'course',
        'title description thumbnail category level duration price currency'
      );

      return res.json({
        message: 'Payment already verified',
        payment: payment,
        enrollment: enrollment,
        transactionId: tran_id,
        verified: true,
      });
    }

    // If payment is pending, verify it with SSLCommerz
    if (payment.status === 'pending') {
      let isValidPayment = false;
      let validation;

      try {
        const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
        validation = await sslcz.validate({ val_id });
        console.log(
          'Frontend verification - SSLCommerz validation response:',
          validation
        );

        if (validation?.status === 'VALID') {
          isValidPayment = true;
        } else if (validation?.status === 'INVALID_TRANSACTION' && !is_live) {
          // In sandbox mode, we can validate manually
          console.log(
            'Sandbox mode: INVALID_TRANSACTION received, validating manually...'
          );
          if (status === 'VALID') {
            isValidPayment = true;
            console.log(
              'Sandbox mode: Accepting payment based on status field'
            );
          }
        }
      } catch (validationError) {
        console.error(
          'Frontend verification - SSLCommerz validation error:',
          validationError
        );

        // Fallback for sandbox mode
        if (!is_live && status === 'VALID') {
          console.log(
            'Sandbox mode: Validation API failed, accepting based on status'
          );
          isValidPayment = true;
        }
      }

      if (isValidPayment) {
        // Update payment status
        payment.status = 'completed';
        payment.transactionId = tran_id;
        payment.paymentDate = new Date();
        payment.metadata.validationId = val_id;

        // Update enrollment
        const enrollment = await Enrollment.findById(
          payment.enrollment
        ).populate(
          'course',
          'title description thumbnail category level duration price currency'
        );
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
            ),
          });
        } catch (emailError) {
          console.error('Email sending failed:', emailError);
        }

        return res.json({
          message: 'Payment verified successfully',
          payment: payment,
          enrollment: enrollment, // Use the populated enrollment
          transactionId: tran_id,
          verified: true,
        });
      }
      // Mark payment as failed
      payment.status = 'failed';
      payment.failureReason = {
        code: 'verification_failed',
        message: validation?.reason || 'Payment verification failed',
      };
      await payment.save();

      return res.status(400).json({
        message: 'Payment verification failed',
        reason: validation?.reason || 'Verification failed',
        transactionId: tran_id,
        verified: false,
      });
    }

    // If payment is already failed or cancelled
    return res.status(400).json({
      message: `Payment ${payment.status}`,
      payment: payment,
      transactionId: tran_id,
      verified: false,
    });
  } catch (error) {
    console.error('Frontend payment verification error:', error);
    res.status(500).json({
      message: 'Server error while verifying payment',
      error: error.message,
    });
  }
});

module.exports = router;
