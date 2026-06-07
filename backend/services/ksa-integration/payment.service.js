/**
 * Payment Integration Service
 * Wraps Moyasar/STC Pay/Mada. Handles strict halala sub-unit calculations.
 */

import axios from 'axios';

const MOYASAR_API_KEY = process.env.MOYASAR_API_KEY || 'sk_test_mock';
const MOYASAR_BASE_URL = 'https://api.moyasar.com/v1';

export class PaymentService {
  /**
   * Converts SAR (Saudi Riyals) to Halalas (sub-units)
   * Prevents floating point issues.
   * @param {Number} amountInSar 
   */
  static toHalalas(amountInSar) {
    return Math.round(amountInSar * 100);
  }

  /**
   * Converts Halalas to SAR
   * @param {Number} amountInHalalas 
   */
  static toSar(amountInHalalas) {
    return amountInHalalas / 100;
  }

  /**
   * Creates a payment request intent.
   * @param {Object} paymentData { amount, description, source }
   */
  static async createPayment(paymentData) {
    const amountInHalalas = this.toHalalas(paymentData.amount);

    console.log(`[Payment] Creating charge for ${amountInHalalas} halalas. Desc: ${paymentData.description}`);

    try {
      /*
      const response = await axios.post(`${MOYASAR_BASE_URL}/payments`, {
        amount: amountInHalalas,
        currency: 'SAR',
        description: paymentData.description,
        source: paymentData.source // e.g. { type: 'creditcard', ... }
      }, {
        auth: {
          username: MOYASAR_API_KEY,
          password: ''
        }
      });
      return response.data;
      */

      // Mock Sandbox Response
      return {
        id: `pay_${Date.now()}`,
        status: 'initiated',
        amount: amountInHalalas,
        currency: 'SAR',
        description: paymentData.description,
        source: paymentData.source
      };
    } catch (error) {
      console.error('[Payment] Error creating payment:', error.message);
      throw error;
    }
  }

  /**
   * Verifies the status of a transaction (e.g. after 3D secure redirect)
   * @param {String} paymentId 
   */
  static async verifyPayment(paymentId) {
    console.log(`[Payment] Verifying payment ${paymentId}`);
    return {
      id: paymentId,
      status: 'paid', // mocked
      message: 'Payment completed successfully'
    };
  }
}
