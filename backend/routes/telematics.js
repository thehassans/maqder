import express from 'express';
import { GeofenceService } from '../services/iot/geofence.service.js';
import { ImmobilizerService } from '../services/iot/immobilizer.service.js';
import RentalCar from '../models/RentalCar.js';

const router = express.Router();

/**
 * Webhook endpoint for Telematics provider (e.g. Teltonika, Wialon)
 * Method: POST /api/v1/telematics/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    
    // Abstract parser assuming a standardized JSON after decoding
    // In a real scenario, binary decoders like Codec 8 might be required here
    const {
      imei,
      lat,
      lng,
      speed,
      ignition,
      odometer
    } = payload;

    console.log(`[Telematics] Received payload for IMEI: ${imei}. Speed: ${speed}, Ign: ${ignition}`);

    // 1. Find Vehicle by IMEI (assuming we added IMEI to RentalCar or a Fleet tracker model)
    const vehicle = await RentalCar.findOne({ /* imei */ }); // Stub query
    
    // 2. Geofence Check
    if (lat && lng) {
      const isInsideBorders = GeofenceService.checkKsaBorders(lat, lng);
      if (!isInsideBorders) {
        // Here we would check the active contract's `crossBorderTafweedAllowed` flag
        // If not allowed, trigger an exception alert or initiate immobilization
        console.warn(`[Telematics] ALERT: Vehicle ${imei} crossed KSA borders.`);
      }
    }

    // 3. Safety Check for pending Immobilization commands
    // Suppose a manager issued a remote cutoff command via Dashboard
    const pendingImmobilization = false; // Stub
    if (pendingImmobilization) {
      await ImmobilizerService.executeCutoff(imei, speed, ignition);
    }

    // 4. Update current odometer
    if (odometer && vehicle) {
      vehicle.currentOdometer = odometer;
      await vehicle.save();
    }

    res.status(200).send('ACK');
  } catch (error) {
    console.error('[Telematics] Webhook processing error:', error);
    res.status(500).send('NACK');
  }
});

export default router;
