import * as THREE from "three";

/**
 * Geographic Positioning & Projection Engine for Mumbai Metropolitan Region.
 * Datum origin: Dadar Junction (19.0178° N, 72.8428° E).
 *
 * Coordinate Convention:
 * - X: Easting in metres (East positive, West negative)
 * - Y: Elevation in metres (Sea level datum)
 * - Z: Southing in metres (South positive towards CSMT/Churchgate, North negative towards Kalyan/Virar)
 */
export class GeographicConverter {
  // Dadar Junction reference origin
  static readonly ORIGIN_LAT = 19.0178;
  static readonly ORIGIN_LON = 72.8428;
  static readonly ORIGIN_ELEV = 7.0; // Metres above MSL

  // Geodetic constants for 19.0° N (WGS-84)
  static readonly METRES_PER_DEG_LAT = 110700; // ~110.7 km / deg
  static readonly METRES_PER_DEG_LON = 105150; // ~105.15 km / deg at 19° N

  /**
   * Converts real GPS Latitude and Longitude to Three.js world coordinates.
   */
  static geoToWorld(lat: number, lon: number, elev: number = GeographicConverter.ORIGIN_ELEV): THREE.Vector3 {
    const deltaLon = lon - GeographicConverter.ORIGIN_LON;
    const deltaLat = lat - GeographicConverter.ORIGIN_LAT;

    const x = deltaLon * GeographicConverter.METRES_PER_DEG_LON;
    // North is negative Z in standard Three.js railway convention
    const z = -deltaLat * GeographicConverter.METRES_PER_DEG_LAT;
    const y = Math.max(0, elev - GeographicConverter.ORIGIN_ELEV);

    return new THREE.Vector3(x, y, z);
  }

  /**
   * Converts Three.js world position back to WGS-84 coordinates.
   */
  static worldToGeo(point: THREE.Vector3): { lat: number; lon: number; elevation: number } {
    const deltaLon = point.x / GeographicConverter.METRES_PER_DEG_LON;
    const deltaLat = -point.z / GeographicConverter.METRES_PER_DEG_LAT;

    return {
      lat: GeographicConverter.ORIGIN_LAT + deltaLat,
      lon: GeographicConverter.ORIGIN_LON + deltaLon,
      elevation: point.y + GeographicConverter.ORIGIN_ELEV,
    };
  }

  /**
   * Great-circle distance between two geographic coordinates in metres (Haversine formula).
   */
  static haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in metres
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculates azimuth / compass heading in degrees from point 1 to point 2.
   */
  static headingDegrees(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const y = Math.sin(((lon2 - lon1) * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180);
    const x =
      Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
      Math.sin((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.cos(((lon2 - lon1) * Math.PI) / 180);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  }
}
