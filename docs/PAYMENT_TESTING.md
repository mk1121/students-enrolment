# Payment Gateway Testing Documentation

This document provides comprehensive testing strategies and test cases for both Stripe and SSLCommerz payment integrations in the Students Enrollment System.

## Overview

The payment system supports multiple payment gateways:
- **Stripe**: International credit/debit card payments
- **SSLCommerz**: Bangladesh-focused payment gateway
- **PayPal**: Alternative international payment method (future)

## Test Environment Setup

### Required Dependencies
```bash
bun install --save-dev stripe sslcommerz-lts
```

### Environment Variables for Testing
```env
# Stripe Test Configuration
STRIPE_SECRET_KEY=sk_test_your_test_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
STRIPE_WEBHOOK_SECRET=whsec_test_your_webhook_secret

# SSLCommerz Test Configuration
SSLCOMMERZ_STORE_ID=your_test_store_id
SSLCOMMERZ_STORE_PASSWORD=your_test_store_password
SSLCOMMERZ_IS_LIVE=false

# Application URLs
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000
```

### Mock Configuration
```javascript
// tests/setup.js
jest.mock('stripe');
jest.mock('sslcommerz-lts');

// Global test setup for payment mocks
beforeEach(() => {
  // Reset all mocks
  jest.clearAllMocks();
  
  // Setup Stripe mocks
  setupStripeMocks();
  
  // Setup SSLCommerz mocks
  setupSSLCommerzMocks();
});
```

## Stripe Payment Testing

### Test Categories

#### 1. Payment Intent Creation Tests
```javascript
describe('Stripe Payment Intent Creation', () => {
  test('should create payment intent for valid enrollment', async () => {
    const mockPaymentIntent = {
      id: 'pi_test_1234567890',
      client_secret: 'pi_test_1234567890_secret',
      amount: 29900,
      currency: 'usd',
      status: 'requires_payment_method'
    };

    mockStripe.paymentIntents.create.mockResolvedValue(mockPaymentIntent);

    const response = await request(app)
      .post('/api/payments/create-payment-intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        enrollmentId: testEnrollment._id,
        paymentMethod: 'stripe'
      })
      .expect(200);

    expect(response.body.clientSecret).toBe(mockPaymentIntent.client_secret);
    expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith({
      amount: 29900, // $299.00 in cents
      currency: 'usd',
      metadata: {
        enrollmentId: testEnrollment._id.toString(),
        courseId: testCourse._id.toString(),
        studentId: testUser._id.toString(),
        courseTitle: testCourse.title
      },
      description: `Payment for ${testCourse.title} course`,
      receipt_email: testUser.email
    });
  });

  test('should handle insufficient funds error', async () => {
    mockStripe.paymentIntents.create.mockRejectedValue(
      new Error('Your card has insufficient funds.')
    );

    const response = await request(app)
      .post('/api/payments/create-payment-intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        enrollmentId: testEnrollment._id,
        paymentMethod: 'stripe'
      })
      .expect(500);

    expect(response.body.message).toBe('Server error while creating payment intent');
  });

  test('should prevent duplicate payment intents', async () => {
    // Mark enrollment as already paid
    testEnrollment.payment.paymentStatus = 'completed';
    await testEnrollment.save();

    const response = await request(app)
      .post('/api/payments/create-payment-intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        enrollmentId: testEnrollment._id,
        paymentMethod: 'stripe'
      })
      .expect(400);

    expect(response.body.message).toBe('Payment has already been completed for this enrollment');
  });
});
```

#### 2. Payment Confirmation Tests
```javascript
describe('Stripe Payment Confirmation', () => {
  test('should confirm successful payment', async () => {
    const paymentIntent = {
      id: 'pi_test_1234567890',
      status: 'succeeded',
      latest_charge: 'ch_test_1234567890'
    };

    mockStripe.paymentIntents.retrieve.mockResolvedValue(paymentIntent);

    const response = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        paymentIntentId: paymentIntent.id,
        paymentId: testPayment._id
      })
      .expect(200);

    expect(response.body.message).toBe('Payment confirmed successfully');

    // Verify database updates
    const updatedPayment = await Payment.findById(testPayment._id);
    expect(updatedPayment.status).toBe('completed');
    
    const updatedEnrollment = await Enrollment.findById(testEnrollment._id);
    expect(updatedEnrollment.payment.paymentStatus).toBe('completed');
    expect(updatedEnrollment.status).toBe('active');
  });

  test('should handle payment failure', async () => {
    const paymentIntent = {
      id: 'pi_test_1234567890',
      status: 'payment_failed',
      last_payment_error: {
        code: 'card_declined',
        message: 'Your card was declined.'
      }
    };

    mockStripe.paymentIntents.retrieve.mockResolvedValue(paymentIntent);

    const response = await request(app)
      .post('/api/payments/confirm')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        paymentIntentId: paymentIntent.id,
        paymentId: testPayment._id
      })
      .expect(400);

    expect(response.body.message).toBe('Payment failed');

    const updatedPayment = await Payment.findById(testPayment._id);
    expect(updatedPayment.status).toBe('failed');
    expect(updatedPayment.failureReason.code).toBe('card_declined');
  });
});
```

#### 3. Webhook Handling Tests
```javascript
describe('Stripe Webhook Handling', () => {
  test('should process payment_intent.succeeded webhook', async () => {
    const webhookEvent = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_1234567890',
          latest_charge: 'ch_test_1234567890',
          status: 'succeeded'
        }
      }
    };

    mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

    const response = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'valid_signature')
      .send(JSON.stringify(webhookEvent))
      .expect(200);

    expect(response.body.received).toBe(true);

    // Verify payment was updated via webhook
    const payment = await Payment.findOne({ 
      stripePaymentIntentId: 'pi_test_1234567890' 
    });
    expect(payment.status).toBe('completed');
  });

  test('should handle invalid webhook signature', async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const response = await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'invalid_signature')
      .send('{"type": "test"}')
      .expect(400);

    expect(response.text).toContain('Webhook Error: Invalid signature');
  });

  test('should process charge.refunded webhook', async () => {
    const webhookEvent = {
      type: 'charge.refunded',
      data: {
        object: {
          id: 'ch_test_1234567890',
          amount_refunded: 29900,
          refunds: {
            data: [{ id: 're_test_1234567890' }]
          }
        }
      }
    };

    mockStripe.webhooks.constructEvent.mockReturnValue(webhookEvent);

    await request(app)
      .post('/api/payments/webhook')
      .set('stripe-signature', 'valid_signature')
      .send(JSON.stringify(webhookEvent))
      .expect(200);

    const payment = await Payment.findOne({ 
      stripeChargeId: 'ch_test_1234567890' 
    });
    expect(payment.status).toBe('refunded');
    expect(payment.refund.amount).toBe(299);
  });
});
```

#### 4. Refund Processing Tests
```javascript
describe('Stripe Refund Processing', () => {
  test('should process full refund successfully', async () => {
    const mockRefund = {
      id: 're_test_1234567890',
      amount: 29900,
      status: 'succeeded'
    };

    mockStripe.refunds.create.mockResolvedValue(mockRefund);

    const response = await request(app)
      .post(`/api/payments/${testPayment._id}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 299,
        reason: 'Customer requested refund'
      })
      .expect(200);

    expect(response.body.message).toBe('Refund processed successfully');
    expect(mockStripe.refunds.create).toHaveBeenCalledWith({
      charge: testPayment.stripeChargeId,
      amount: 29900,
      reason: 'requested_by_customer',
      metadata: {
        refundReason: 'Customer requested refund',
        processedBy: adminUser._id.toString()
      }
    });
  });

  test('should handle partial refund', async () => {
    const mockRefund = {
      id: 're_test_partial',
      amount: 14950, // $149.50
      status: 'succeeded'
    };

    mockStripe.refunds.create.mockResolvedValue(mockRefund);

    const response = await request(app)
      .post(`/api/payments/${testPayment._id}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 149.50,
        reason: 'Partial course completion'
      })
      .expect(200);

    const updatedPayment = await Payment.findById(testPayment._id);
    expect(updatedPayment.refund.amount).toBe(149.50);
    expect(updatedPayment.status).toBe('completed'); // Still completed, not fully refunded
  });

  test('should reject refund for non-admin user', async () => {
    const response = await request(app)
      .post(`/api/payments/${testPayment._id}/refund`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        amount: 299,
        reason: 'Refund request'
      })
      .expect(403);

    expect(response.body.message).toBe('Access denied. Admin privileges required.');
  });
});
```

## SSLCommerz Payment Testing

### Test Categories

#### 1. Payment Initialization Tests
```javascript
describe('SSLCommerz Payment Initialization', () => {
  test('should initialize payment successfully', async () => {
    const mockSSLResponse = {
      status: 'SUCCESS',
      sessionkey: 'test_session_key_123',
      GatewayPageURL: 'https://sandbox.sslcommerz.com/gwprocess/v3/process.php?Q=pay&SESSIONKEY=test_session_key_123'
    };

    mockSSLCommerz.init.mockResolvedValue(mockSSLResponse);

    const response = await request(app)
      .post('/api/payments/sslcommerz/init')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        enrollmentId: testEnrollment._id
      })
      .expect(200);

    expect(response.body.status).toBe('SUCCESS');
    expect(response.body.gatewayUrl).toBe(mockSSLResponse.GatewayPageURL);
    expect(response.body.sessionkey).toBe(mockSSLResponse.sessionkey);

    // Verify payment record creation
    const payment = await Payment.findById(response.body.paymentId);
    expect(payment.paymentMethod).toBe('sslcommerz');
    expect(payment.status).toBe('pending');
    expect(payment.currency).toBe('BDT');
  });

  test('should handle USD to BDT conversion', async () => {
    // Test enrollment with USD amount
    const usdEnrollment = await createTestEnrollment({
      student: testUser._id,
      course: testCourse._id,
      payment: {
        amount: 100, // $100 USD
        currency: 'USD',
        paymentStatus: 'pending'
      }
    });

    const mockSSLResponse = {
      status: 'SUCCESS',
      sessionkey: 'test_session_key_usd',
      GatewayPageURL: 'https://sandbox.sslcommerz.com/gwprocess/v3/process.php'
    };

    mockSSLCommerz.init.mockResolvedValue(mockSSLResponse);

    const response = await request(app)
      .post('/api/payments/sslcommerz/init')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        enrollmentId: usdEnrollment._id
      })
      .expect(200);

    const payment = await Payment.findById(response.body.paymentId);
    expect(payment.amount).toBe(11000); // $100 * 110 BDT (approximate rate)
    expect(payment.currency).toBe('BDT');
    expect(payment.metadata.originalAmount).toBe(100);
    expect(payment.metadata.originalCurrency).toBe('USD');
  });

  test('should handle initialization failure', async () => {
    mockSSLCommerz.init.mockResolvedValue({
      status: 'FAILED',
      failedreason: 'Store configuration error'
    });

    const response = await request(app)
      .post('/api/payments/sslcommerz/init')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        enrollmentId: testEnrollment._id
      })
      .expect(400);

    expect(response.body.message).toBe('SSLCommerz payment initialization failed');
    expect(response.body.error).toBe('Store configuration error');
  });
});
```

#### 2. Payment Success Handling Tests
```javascript
describe('SSLCommerz Payment Success', () => {
  test('should handle successful payment callback', async () => {
    const mockValidation = {
      status: 'VALID',
      tran_id: 'SSL_TEST_123456',
      amount: '29900.00',
      currency: 'BDT',
      bank_tran_id: 'SSL_BANK_123456'
    };

    mockSSLCommerz.validate.mockResolvedValue(mockValidation);

    const response = await request(app)
      .post('/api/payments/sslcommerz/success')
      .send({
        tran_id: 'SSL_TEST_123456',
        val_id: 'test_validation_id',
        amount: '29900.00',
        card_type: 'VISA',
        store_amount: '29900.00',
        bank_tran_id: 'SSL_BANK_123456',
        status: 'VALID'
      })
      .expect(200);

    expect(response.body.message).toBe('Payment successful');

    // Verify payment update
    const payment = await Payment.findOne({ 
      'metadata.sslTransactionId': 'SSL_TEST_123456' 
    });
    expect(payment.status).toBe('completed');
    expect(payment.transactionId).toBe('SSL_TEST_123456');
    expect(payment.metadata.bankTransactionId).toBe('SSL_BANK_123456');
  });

  test('should handle validation failure', async () => {
    mockSSLCommerz.validate.mockResolvedValue({
      status: 'INVALID',
      reason: 'Transaction amount mismatch'
    });

    const response = await request(app)
      .post('/api/payments/sslcommerz/success')
      .send({
        tran_id: 'SSL_TEST_INVALID',
        val_id: 'invalid_validation_id',
        amount: '29900.00',
        status: 'INVALID'
      })
      .expect(400);

    expect(response.body.message).toBe('Payment validation failed');

    const payment = await Payment.findOne({ 
      'metadata.sslTransactionId': 'SSL_TEST_INVALID' 
    });
    expect(payment.status).toBe('failed');
  });

  test('should detect amount tampering', async () => {
    const mockValidation = {
      status: 'VALID',
      tran_id: 'SSL_TEST_TAMPER',
      amount: '19900.00', // Different from original amount
      currency: 'BDT'
    };

    mockSSLCommerz.validate.mockResolvedValue(mockValidation);

    const response = await request(app)
      .post('/api/payments/sslcommerz/success')
      .send({
        tran_id: 'SSL_TEST_TAMPER',
        val_id: 'tamper_validation_id',
        amount: '19900.00',
        status: 'VALID'
      })
      .expect(400);

    expect(response.body.message).toBe('Payment amount mismatch');
  });
});
```

#### 3. Payment Failure and Cancellation Tests
```javascript
describe('SSLCommerz Payment Failure and Cancellation', () => {
  test('should handle payment failure callback', async () => {
    const response = await request(app)
      .post('/api/payments/sslcommerz/fail')
      .send({
        tran_id: 'SSL_TEST_FAILED',
        error: 'Insufficient funds'
      })
      .expect(200);

    expect(response.body.message).toBe('Payment failed');

    const payment = await Payment.findOne({ 
      'metadata.sslTransactionId': 'SSL_TEST_FAILED' 
    });
    expect(payment.status).toBe('failed');
    expect(payment.failureReason.message).toBe('Insufficient funds');
  });

  test('should handle payment cancellation', async () => {
    const response = await request(app)
      .post('/api/payments/sslcommerz/cancel')
      .send({
        tran_id: 'SSL_TEST_CANCELLED'
      })
      .expect(200);

    expect(response.body.message).toBe('Payment cancelled');

    const payment = await Payment.findOne({ 
      'metadata.sslTransactionId': 'SSL_TEST_CANCELLED' 
    });
    expect(payment.status).toBe('cancelled');
  });
});
```

#### 4. SSLCommerz Refund Tests
```javascript
describe('SSLCommerz Refund Processing', () => {
  test('should process refund successfully', async () => {
    const mockRefundResponse = {
      status: 'success',
      refund_ref_id: 'SSL_REFUND_123456',
      trans_id: 'SSL_TEST_123456'
    };

    mockSSLCommerz.refund.mockResolvedValue(mockRefundResponse);

    const response = await request(app)
      .post(`/api/payments/sslcommerz/${testSSLPayment._id}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 299,
        reason: 'Course cancelled'
      })
      .expect(200);

    expect(response.body.message).toBe('Refund processed successfully');
    expect(mockSSLCommerz.refund).toHaveBeenCalledWith({
      refund_amount: 299,
      refund_remarks: 'Course cancelled',
      bank_tran_id: testSSLPayment.metadata.bankTransactionId,
      refe_id: testSSLPayment.transactionId
    });
  });

  test('should handle refund failure', async () => {
    mockSSLCommerz.refund.mockResolvedValue({
      status: 'failed',
      errorReason: 'Transaction not eligible for refund'
    });

    const response = await request(app)
      .post(`/api/payments/sslcommerz/${testSSLPayment._id}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 299,
        reason: 'Course cancelled'
      })
      .expect(400);

    expect(response.body.message).toBe('Refund failed: Transaction not eligible for refund');
  });
});
```

## Cross-Gateway Integration Tests

### Test Categories

#### 1. Multiple Payment Method Tests
```javascript
describe('Multiple Payment Gateway Integration', () => {
  test('should allow different payment methods for same user', async () => {
    // Create two different enrollments
    const stripeEnrollment = await createTestEnrollment({
      student: testUser._id,
      course: testCourse._id,
      payment: { amount: 299, currency: 'USD', paymentStatus: 'pending' }
    });

    const sslEnrollment = await createTestEnrollment({
      student: testUser._id,
      course: anotherCourse._id,
      payment: { amount: 199, currency: 'BDT', paymentStatus: 'pending' }
    });

    // Test Stripe payment
    mockStripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_stripe_test',
      client_secret: 'pi_stripe_secret'
    });

    const stripeResponse = await request(app)
      .post('/api/payments/create-payment-intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        enrollmentId: stripeEnrollment._id,
        paymentMethod: 'stripe'
      })
      .expect(200);

    // Test SSLCommerz payment
    mockSSLCommerz.init.mockResolvedValue({
      status: 'SUCCESS',
      sessionkey: 'ssl_test_key',
      GatewayPageURL: 'https://ssl.test.com'
    });

    const sslResponse = await request(app)
      .post('/api/payments/sslcommerz/init')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        enrollmentId: sslEnrollment._id
      })
      .expect(200);

    expect(stripeResponse.body.clientSecret).toBeTruthy();
    expect(sslResponse.body.gatewayUrl).toBeTruthy();
  });

  test('should prevent duplicate successful payments', async () => {
    // Complete payment via Stripe
    await Payment.create({
      user: testUser._id,
      enrollment: testEnrollment._id,
      course: testCourse._id,
      amount: 299,
      currency: 'USD',
      paymentMethod: 'stripe',
      status: 'completed',
      netAmount: 299
    });

    testEnrollment.payment.paymentStatus = 'completed';
    await testEnrollment.save();

    // Try to pay again via SSLCommerz
    const response = await request(app)
      .post('/api/payments/sslcommerz/init')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        enrollmentId: testEnrollment._id
      })
      .expect(400);

    expect(response.body.message).toBe('Payment has already been completed for this enrollment');
  });

  test('should allow retry with different gateway after failure', async () => {
    // Create failed Stripe payment
    await Payment.create({
      user: testUser._id,
      enrollment: testEnrollment._id,
      course: testCourse._id,
      amount: 299,
      currency: 'USD',
      paymentMethod: 'stripe',
      status: 'failed',
      netAmount: 299
    });

    // Should allow SSLCommerz attempt
    mockSSLCommerz.init.mockResolvedValue({
      status: 'SUCCESS',
      sessionkey: 'retry_ssl_key',
      GatewayPageURL: 'https://ssl.retry.com'
    });

    const response = await request(app)
      .post('/api/payments/sslcommerz/init')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        enrollmentId: testEnrollment._id
      })
      .expect(200);

    expect(response.body.status).toBe('SUCCESS');

    // Verify multiple payment records exist
    const payments = await Payment.find({ enrollment: testEnrollment._id });
    expect(payments).toHaveLength(2);
    expect(payments.find(p => p.paymentMethod === 'stripe').status).toBe('failed');
    expect(payments.find(p => p.paymentMethod === 'sslcommerz').status).toBe('pending');
  });
});
```

## Security Testing

### Test Categories

#### 1. Authentication and Authorization Tests
```javascript
describe('Payment Security Tests', () => {
  test('should require authentication for payment operations', async () => {
    const response = await request(app)
      .post('/api/payments/create-payment-intent')
      .send({
        enrollmentId: testEnrollment._id,
        paymentMethod: 'stripe'
      })
      .expect(401);

    expect(response.body.message).toBe('Access denied. No token provided.');
  });

  test('should prevent payment for other users enrollments', async () => {
    const otherUser = await createTestUser({ 
      email: 'other@example.com', 
      role: 'student' 
    });

    const response = await request(app)
      .post('/api/payments/create-payment-intent')
      .set('Authorization', `Bearer ${generateToken(otherUser)}`)
      .send({
        enrollmentId: testEnrollment._id,
        paymentMethod: 'stripe'
      })
      .expect(403);

    expect(response.body.message).toBe('Access denied. You can only pay for your own enrollments.');
  });

  test('should require admin role for refunds', async () => {
    const response = await request(app)
      .post(`/api/payments/${testPayment._id}/refund`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        amount: 299,
        reason: 'Refund request'
      })
      .expect(403);

    expect(response.body.message).toBe('Access denied. Admin privileges required.');
  });
});
```

#### 2. Data Validation Tests
```javascript
describe('Payment Data Validation', () => {
  test('should validate enrollment ID format', async () => {
    const response = await request(app)
      .post('/api/payments/create-payment-intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        enrollmentId: 'invalid-id',
        paymentMethod: 'stripe'
      })
      .expect(400);

    expect(response.body.errors).toContainEqual(
      expect.objectContaining({
        msg: 'Valid enrollment ID is required'
      })
    );
  });

  test('should validate payment method', async () => {
    const response = await request(app)
      .post('/api/payments/create-payment-intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        enrollmentId: testEnrollment._id,
        paymentMethod: 'invalid-method'
      })
      .expect(400);

    expect(response.body.errors).toContainEqual(
      expect.objectContaining({
        msg: 'Valid payment method is required'
      })
    );
  });

  test('should validate refund amount', async () => {
    const response = await request(app)
      .post(`/api/payments/${testPayment._id}/refund`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 0,
        reason: 'Refund'
      })
      .expect(400);

    expect(response.body.errors).toContainEqual(
      expect.objectContaining({
        msg: 'Refund amount must be greater than 0'
      })
    );
  });
});
```

## Performance Testing

### Test Categories

#### 1. Concurrent Payment Tests
```javascript
describe('Payment Performance Tests', () => {
  test('should handle concurrent payment requests', async () => {
    const users = await Promise.all([
      createTestUser({ email: 'user1@test.com', role: 'student' }),
      createTestUser({ email: 'user2@test.com', role: 'student' }),
      createTestUser({ email: 'user3@test.com', role: 'student' })
    ]);

    const enrollments = await Promise.all(users.map(user => 
      createTestEnrollment({
        student: user._id,
        course: testCourse._id,
        payment: { amount: 299, currency: 'USD', paymentStatus: 'pending' }
      })
    ));

    mockStripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_concurrent_test',
      client_secret: 'pi_concurrent_secret'
    });

    const paymentPromises = enrollments.map((enrollment, index) =>
      request(app)
        .post('/api/payments/create-payment-intent')
        .set('Authorization', `Bearer ${generateToken(users[index])}`)
        .send({
          enrollmentId: enrollment._id,
          paymentMethod: 'stripe'
        })
    );

    const responses = await Promise.all(paymentPromises);

    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.clientSecret).toBeTruthy();
    });

    expect(mockStripe.paymentIntents.create).toHaveBeenCalledTimes(3);
  });

  test('should handle webhook processing under load', async () => {
    const webhookEvents = Array.from({ length: 5 }, (_, i) => ({
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: `pi_load_test_${i}`,
          latest_charge: `ch_load_test_${i}`,
          status: 'succeeded'
        }
      }
    }));

    // Create corresponding payment records
    await Promise.all(webhookEvents.map((event, i) => 
      Payment.create({
        user: testUser._id,
        enrollment: testEnrollment._id,
        course: testCourse._id,
        amount: 299,
        currency: 'USD',
        paymentMethod: 'stripe',
        status: 'pending',
        stripePaymentIntentId: `pi_load_test_${i}`,
        description: `Load test payment ${i}`,
        netAmount: 299
      })
    ));

    mockStripe.webhooks.constructEvent.mockImplementation((body, sig) => {
      const eventIndex = parseInt(sig.split('_')[2]);
      return webhookEvents[eventIndex];
    });

    const webhookPromises = webhookEvents.map((event, i) =>
      request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', `load_test_${i}`)
        .send(JSON.stringify(event))
    );

    const responses = await Promise.all(webhookPromises);

    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });
  });
});
```

## Error Handling Testing

### Test Categories

#### 1. Gateway Error Scenarios
```javascript
describe('Payment Gateway Error Handling', () => {
  test('should handle Stripe API timeout', async () => {
    mockStripe.paymentIntents.create.mockRejectedValue(
      new Error('Request timeout')
    );

    const response = await request(app)
      .post('/api/payments/create-payment-intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        enrollmentId: testEnrollment._id,
        paymentMethod: 'stripe'
      })
      .expect(500);

    expect(response.body.message).toBe('Server error while creating payment intent');
  });

  test('should handle SSLCommerz service unavailable', async () => {
    mockSSLCommerz.init.mockRejectedValue(
      new Error('Service temporarily unavailable')
    );

    const response = await request(app)
      .post('/api/payments/sslcommerz/init')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        enrollmentId: testEnrollment._id
      })
      .expect(500);

    expect(response.body.message).toBe('Server error while initializing SSLCommerz payment');
  });

  test('should handle database connection issues', async () => {
    // Mock database connection failure
    jest.spyOn(Payment, 'create').mockRejectedValue(
      new Error('Database connection lost')
    );

    mockStripe.paymentIntents.create.mockResolvedValue({
      id: 'pi_db_error_test',
      client_secret: 'pi_db_error_secret'
    });

    const response = await request(app)
      .post('/api/payments/create-payment-intent')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        enrollmentId: testEnrollment._id,
        paymentMethod: 'stripe'
      })
      .expect(500);

    expect(response.body.message).toBe('Server error while creating payment intent');
  });
});
```

## Test Utilities and Helpers

### Payment Test Helpers
```javascript
// tests/helpers/paymentHelpers.js

// Create test payment record
async function createTestPayment(overrides = {}) {
  const defaultPayment = {
    user: testUser._id,
    enrollment: testEnrollment._id,
    course: testCourse._id,
    amount: 299,
    currency: 'USD',
    paymentMethod: 'stripe',
    status: 'pending',
    description: 'Test payment',
    netAmount: 299,
    ...overrides
  };

  return await Payment.create(defaultPayment);
}

// Mock Stripe responses
function setupStripeMocks() {
  mockStripe = {
    paymentIntents: {
      create: jest.fn(),
      retrieve: jest.fn(),
      confirm: jest.fn()
    },
    refunds: {
      create: jest.fn()
    },
    webhooks: {
      constructEvent: jest.fn()
    }
  };

  stripe.mockReturnValue(mockStripe);
}

// Mock SSLCommerz responses
function setupSSLCommerzMocks() {
  mockSSLCommerz = {
    init: jest.fn(),
    validate: jest.fn(),
    refund: jest.fn()
  };

  SSLCommerzPayment.mockImplementation(() => mockSSLCommerz);
}

// Generate payment webhook event
function createWebhookEvent(type, paymentIntentId, overrides = {}) {
  return {
    type,
    data: {
      object: {
        id: paymentIntentId,
        status: 'succeeded',
        latest_charge: `ch_${paymentIntentId.replace('pi_', '')}`,
        ...overrides
      }
    }
  };
}

module.exports = {
  createTestPayment,
  setupStripeMocks,
  setupSSLCommerzMocks,
  createWebhookEvent
};
```

## Coverage Targets

### Payment Testing Coverage
- **Stripe Integration**: 95%+ coverage
- **SSLCommerz Integration**: 95%+ coverage
- **Payment Processing**: 90%+ coverage
- **Error Handling**: 85%+ coverage
- **Security Validation**: 100% coverage

### Critical Test Areas
1. Payment creation and confirmation
2. Webhook handling and validation
3. Refund processing
4. Security and authorization
5. Error scenarios and recovery
6. Cross-gateway compatibility
7. Performance under load

This comprehensive payment testing strategy ensures robust, secure, and reliable payment processing across multiple gateways while maintaining high code quality and user experience standards. 