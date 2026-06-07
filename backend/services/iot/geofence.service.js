/**
 * IoT Geofence Service
 * Validates coordinates against KSA geographical borders.
 */

export class GeofenceService {
  /**
   * Validates if the given coordinates fall within the general bounding box of Saudi Arabia.
   * For production, this should use complex polygon checks (e.g. using turf.js or GeoJSON polygons).
   * 
   * KSA approximate bounding box:
   * North: 32.15° N
   * South: 16.39° N
   * West: 34.57° E
   * East: 55.66° E
   * 
   * @param {Number} lat 
   * @param {Number} lng 
   * @returns {Boolean}
   */
  static checkKsaBorders(lat, lng) {
    if (typeof lat !== 'number' || typeof lng !== 'number') return false;

    const isWithinLat = lat >= 16.39 && lat <= 32.15;
    const isWithinLng = lng >= 34.57 && lng <= 55.66;

    return isWithinLat && isWithinLng;
  }
}
