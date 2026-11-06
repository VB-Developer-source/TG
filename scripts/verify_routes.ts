import { AVAILABLE_ROUTES } from "../src/game/railway/RouteDatabase";

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

assert(AVAILABLE_ROUTES.length > 0, "Route catalog must not be empty");

const routeIds = new Set<string>();
for (const route of AVAILABLE_ROUTES) {
  assert(route.routeId.trim().length > 0, "Every route must have an ID");
  assert(!routeIds.has(route.routeId), `Duplicate route ID: ${route.routeId}`);
  routeIds.add(route.routeId);

  assert(route.name.trim().length > 0, `${route.routeId}: missing route name`);
  assert(route.curvePoints.length >= 2, `${route.routeId}: route needs at least two geometry points`);
  assert(Number.isFinite(route.totalDistanceM) && route.totalDistanceM > 0, `${route.routeId}: invalid declared route distance`);
  assert(route.stations.length >= 2, `${route.routeId}: route needs at least two station waypoints`);
  assert(route.startStationCode === route.stations[0]?.stationCode, `${route.routeId}: start station disagrees with first waypoint`);
  assert(route.endStationCode === route.stations[route.stations.length - 1]?.stationCode, `${route.routeId}: end station disagrees with last waypoint`);

  for (const [index, point] of route.curvePoints.entries()) {
    assert(
      Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z),
      `${route.routeId}: geometry point ${index} has non-finite coordinates`,
    );
  }

  let previousStopDistance = -Infinity;
  const stationIds = new Set<string>();
  for (const station of route.stations) {
    assert(station.stationId.trim().length > 0, `${route.routeId}: station has no ID`);
    assert(!stationIds.has(station.stationId), `${route.routeId}: duplicate station ID ${station.stationId}`);
    stationIds.add(station.stationId);
    assert(Number.isFinite(station.stopDistanceM), `${route.routeId}: ${station.stationCode} has invalid stop distance`);
    assert(station.stopDistanceM >= 0 && station.stopDistanceM <= route.totalDistanceM, `${route.routeId}: ${station.stationCode} stop is outside the declared route distance`);
    assert(station.stopDistanceM > previousStopDistance, `${route.routeId}: station stop distances are not strictly increasing`);
    previousStopDistance = station.stopDistanceM;
  }

  const signalIds = new Set<string>();
  for (const signal of route.signals) {
    assert(signal.signalId.trim().length > 0, `${route.routeId}: signal has no ID`);
    assert(!signalIds.has(signal.signalId), `${route.routeId}: duplicate signal ID ${signal.signalId}`);
    signalIds.add(signal.signalId);
    assert(Number.isFinite(signal.distanceM) && signal.distanceM >= 0 && signal.distanceM <= route.totalDistanceM, `${route.routeId}: ${signal.signalId} is outside the route`);
    assert(Number.isFinite(signal.protectedBlockEndM) && signal.protectedBlockEndM >= signal.distanceM, `${route.routeId}: ${signal.signalId} has an invalid protected block`);
  }

  for (const restriction of route.speedRestrictions) {
    assert(Number.isFinite(restriction.startM) && Number.isFinite(restriction.endM), `${route.routeId}: ${restriction.id} has non-finite bounds`);
    assert(restriction.startM >= 0 && restriction.endM >= restriction.startM && restriction.endM <= route.totalDistanceM, `${route.routeId}: ${restriction.id} is outside the route`);
    assert(Number.isFinite(restriction.maxSpeedKmh) && restriction.maxSpeedKmh > 0, `${route.routeId}: ${restriction.id} has invalid speed`);
  }
}

console.log(`Route structure validation passed for ${AVAILABLE_ROUTES.length} routes.`);
console.log("This check validates route metadata and geometry inputs; it does not certify surveyed alignment or playable traversal.");
