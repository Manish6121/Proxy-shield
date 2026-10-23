// 1. 1-Click Auto-Fence Engine (5-Point Pentagon)
function generateAutoPentagon(lat, lng, alt = 212.0, radiusMeters = 8.0) {
  const earthRadius = 6378137.0;
  const corners = [];

  for (let i = 0; i < 5; i++) {
    const angle = (i * 72) * (Math.PI / 180); // 72 degree steps
    const dx = radiusMeters * Math.cos(angle);
    const dy = radiusMeters * Math.sin(angle);

    const dLat = (dy / earthRadius) * (180 / Math.PI);
    const dLng = (dx / (earthRadius * Math.cos(lat * Math.PI / 180))) * (180 / Math.PI);

    corners.push([
      parseFloat((lat + dLat).toFixed(6)),
      parseFloat((lng + dLng).toFixed(6))
    ]);
  }

  return {
    polygon: corners,
    zMin: parseFloat((alt - 0.5).toFixed(2)),
    zMax: parseFloat((alt + 2.2).toFixed(2))
  };
}

// 2. 3D Geofence Engine (Ray-Casting Point-in-Polygon + Elevation Check)
function isInside3DGeofence(point, polygon, alt, zMin, zMax) {
  const [x, y] = point;
  let inside2D = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside2D = !inside2D;
  }

  if (!inside2D) return { valid: false, reason: 'OUTSIDE_2D_GEOFENCE' };

  if (alt !== null && alt !== undefined && zMin !== null && zMax !== null) {
    if (alt < zMin || alt > zMax) {
      return { valid: false, reason: 'WRONG_FLOOR_ALTITUDE' };
    }
  }

  return { valid: true, reason: 'SUCCESS' };
}

module.exports = { generateAutoPentagon, isInside3DGeofence };
