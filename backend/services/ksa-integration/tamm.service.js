/**
 * Tamm (Tafweed) Integration Service
 * Handles issuance, extension, and termination of digital authorizations.
 */

import axios from 'axios';

const TAMM_API_BASE_URL = process.env.TAMM_API_BASE_URL || 'https://sandbox.tamm.com.sa/api/v1';
const TAMM_API_KEY = process.env.TAMM_API_KEY || 'sandbox_tamm_key';

export class TammService {
  /**
   * Issues a new Tafweed.
   * @param {Object} payload { driverIqama, plateArabic, plateEnglish, sequenceNumber, startDate, endDate }
   * @returns {Object} { success, tafweedId, status, error }
   */
  static async issueTafweed(payload) {
    try {
      // In a real environment, this makes a secure REST call to Tamm gateway
      /*
      const response = await axios.post(`${TAMM_API_BASE_URL}/tafweed/issue`, payload, {
        headers: { 'Authorization': `Bearer ${TAMM_API_KEY}` }
      });
      return response.data;
      */

      // Sandbox Mock Response
      console.log(`[Tamm] Issuing Tafweed for driver ${payload.driverIqama} on vehicle ${payload.sequenceNumber}`);
      return {
        success: true,
        tafweedId: `TFW-${Date.now()}`,
        status: 'ACTIVE'
      };
    } catch (error) {
      console.error('[Tamm] Error issuing Tafweed:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Extends an active Tafweed.
   * @param {String} tafweedId 
   * @param {Date} newEndDate 
   */
  static async extendTafweed(tafweedId, newEndDate) {
    try {
      console.log(`[Tamm] Extending Tafweed ${tafweedId} until ${newEndDate}`);
      return {
        success: true,
        tafweedId,
        newEndDate,
        status: 'EXTENDED'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Terminates an active Tafweed.
   * @param {String} tafweedId 
   */
  static async terminateTafweed(tafweedId) {
    try {
      console.log(`[Tamm] Terminating Tafweed ${tafweedId}`);
      return {
        success: true,
        tafweedId,
        status: 'TERMINATED'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
