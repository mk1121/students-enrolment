#!/usr/bin/env bun
// Quick test script to verify payment endpoint

const axios = require('axios');

async function testPayment() {
  try {
    console.log('Testing payment endpoint...');

    // First, let's test the health endpoint
    const healthResponse = await axios.get('http://localhost:5001/api/health');
    console.log('Health check:', healthResponse.data);

    // Test with dummy data - this should fail with authentication error
    const paymentData = {
      enrollmentId: '675936784078730010000c71',
      paymentMethod: 'stripe',
    };

    console.log('Testing payment intent creation...');
    const response = await axios.post(
      'http://localhost:5001/api/payments/create-payment-intent',
      paymentData
    );
    console.log('Payment response:', response.data);
  } catch (error) {
    console.error('Error testing payment:');
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
  }
}

testPayment();
