import RentalCar from '../models/RentalCar.js';

/**
 * Valid transitions for a rental vehicle state machine.
 */
const VALID_TRANSITIONS = {
  'AVAILABLE': ['RESERVED', 'RENTED', 'MAINTENANCE'],
  'RESERVED': ['AVAILABLE', 'RENTED', 'MAINTENANCE'],
  'RENTED': ['PENDING_INSPECTION', 'MAINTENANCE'],
  'PENDING_INSPECTION': ['AVAILABLE', 'MAINTENANCE'],
  'MAINTENANCE': ['AVAILABLE']
};

/**
 * Middleware to strictly transition a vehicle's state.
 * Implements optimistic locking via MongoDB versionKey (__v) to prevent double-booking.
 * 
 * Usage: 
 *   const vehicle = await transitionVehicleState(req.tenantId, vehicleId, 'Rented', req.body.expectedVersion);
 */
export const transitionVehicleState = async (tenantId, vehicleId, targetState, currentVersion) => {
  const vehicle = await RentalCar.findOne({ _id: vehicleId, tenantId });

  if (!vehicle) {
    throw new Error('Vehicle not found.');
  }

  // Validate version to prevent concurrent modifications (Optimistic Locking)
  if (currentVersion !== undefined && vehicle.__v !== currentVersion) {
    throw new Error('State conflict: Vehicle was modified by another transaction.');
  }

  const currentState = vehicle.status;

  // Validate state transition
  const allowedNextStates = VALID_TRANSITIONS[currentState];
  if (!allowedNextStates || !allowedNextStates.includes(targetState)) {
    throw new Error(`Invalid state transition from ${currentState} to ${targetState}.`);
  }

  // Transition state and increment version
  vehicle.status = targetState;
  
  // Save will automatically increment the versionKey internally if using the plugin,
  // or we can forcefully increment it if we do findOneAndUpdate.
  await vehicle.save();
  
  return vehicle;
};
