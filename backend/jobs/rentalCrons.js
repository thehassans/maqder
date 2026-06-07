import cron from 'node-cron';
import RentalContract from '../models/RentalContract.js';
import RentalCar from '../models/RentalCar.js';
import { sendNotification } from '../utils/notifications.js'; // Assuming a notification utility exists or will be stubbed

export const initRentalCrons = () => {
  console.log('[Crons] Initializing Rental Module Crons...');

  // 1. Tafweed Expiry Monitor: Runs every hour (0 * * * *)
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[Cron] Running Tafweed Expiry Monitor');
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Find active contracts where the expected return date (Tafweed end) is within 24 hours
      const expiringContracts = await RentalContract.find({
        status: 'OPEN',
        'rentPeriod.end': { $gt: now, $lte: in24Hours }
      }).populate('customerId vehicleId');

      for (const contract of expiringContracts) {
        // Mock notification logic
        console.log(`[Alert] Tafweed for contract ${contract.contractNumber} is expiring soon.`);
        // sendNotification('admin', `Tafweed for contract ${contract.contractNumber} expiring in < 24h.`);
      }
    } catch (err) {
      console.error('[Cron] Error in Tafweed Expiry Monitor:', err);
    }
  });

  // 2. Fleet Preventive Maintenance: Runs daily at 01:00 AM (0 1 * * *)
  cron.schedule('0 1 * * *', async () => {
    try {
      console.log('[Cron] Running Fleet Preventive Maintenance Monitor');
      const now = new Date();
      const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      // We look for cars that are currently available, rented, or pending inspection
      // that either have > 4500km since last oil change (assuming 5000 is milestone)
      // or istimaraExpiry within 30 days.
      const carsNeedingMaintenance = await RentalCar.find({
        status: { $in: ['Available', 'Rented', 'Pending_Inspection'] },
        $or: [
          // If the difference between nextOilChangeKm and currentOdometer is <= 500
          { $expr: { $lte: [{ $subtract: ['$nextOilChangeKm', '$currentOdometer'] }, 500] } },
          { istimaraExpiry: { $gt: now, $lte: in30Days } }
        ]
      });

      for (const car of carsNeedingMaintenance) {
        if (car.status === 'Available') {
          car.status = 'Maintenance';
          await car.save();
          console.log(`[Maintenance] Shifted car ${car.plateNumber} to Maintenance.`);
        } else {
          console.log(`[Maintenance] Car ${car.plateNumber} flagged for maintenance upon return.`);
          // E.g., add a flag to the document so Check-in knows to shift it.
          // car.maintenanceFlagged = true; await car.save();
        }
      }
    } catch (err) {
      console.error('[Cron] Error in Fleet Maintenance Monitor:', err);
    }
  });
};
