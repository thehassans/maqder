/**
 * Yakeen / Absher Integration Service
 * Handles KYC and identity verification.
 */

import axios from 'axios';

const YAKEEN_API_BASE_URL = process.env.YAKEEN_API_BASE_URL || 'https://sandbox.yakeen.com.sa/api/v1';

export class YakeenService {
  /**
   * Verifies an Iqama/National ID against the date of birth.
   * Also verifies if the driving license is active and valid.
   * @param {String} iqamaId 
   * @param {String} dateOfBirth (YYYY-MM-DD)
   * @returns {Object} { isValid, isLicenseActive, blockFlag, data }
   */
  static async verifyIdentityAndLicense(iqamaId, dateOfBirth) {
    try {
      // In a real environment, this makes a secure REST call to Yakeen gateway
      /*
      const response = await axios.post(`${YAKEEN_API_BASE_URL}/verify`, { iqamaId, dateOfBirth }, {
        headers: { 'Authorization': `Bearer ${process.env.YAKEEN_API_KEY}` }
      });
      return response.data;
      */

      // Sandbox Mock Response
      console.log(`[Yakeen] Verifying identity for ${iqamaId} with DOB ${dateOfBirth}`);
      
      // Mock validation logic for sandbox
      if (!iqamaId || iqamaId.length !== 10) {
        return { isValid: false, isLicenseActive: false, blockFlag: true, error: 'Invalid ID format' };
      }

      return {
        isValid: true,
        isLicenseActive: true,
        blockFlag: false,
        data: {
          fullNameEn: 'Sandbox User',
          fullNameAr: 'مستخدم تجريبي',
          licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        }
      };
    } catch (error) {
      console.error('[Yakeen] Error verifying identity:', error.message);
      return { isValid: false, isLicenseActive: false, blockFlag: true, error: error.message };
    }
  }
}
