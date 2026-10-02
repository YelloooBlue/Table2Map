const PI = Math.PI;
const A = 6378245.0;
const EE = 0.00669342162296594323;

function outsideChina(longitude: number, latitude: number) {
  return (
    longitude < 72.004 ||
    longitude > 137.8347 ||
    latitude < 0.8293 ||
    latitude > 55.8271
  );
}

function transformLatitude(longitude: number, latitude: number) {
  let result =
    -100 +
    2 * longitude +
    3 * latitude +
    0.2 * latitude * latitude +
    0.1 * longitude * latitude +
    0.2 * Math.sqrt(Math.abs(longitude));
  result +=
    ((20 * Math.sin(6 * longitude * PI) + 20 * Math.sin(2 * longitude * PI)) *
      2) /
    3;
  result +=
    ((20 * Math.sin(latitude * PI) + 40 * Math.sin((latitude / 3) * PI)) * 2) /
    3;
  return (
    result +
    ((160 * Math.sin((latitude / 12) * PI) +
      320 * Math.sin((latitude * PI) / 30)) *
      2) /
      3
  );
}

function transformLongitude(longitude: number, latitude: number) {
  let result =
    300 +
    longitude +
    2 * latitude +
    0.1 * longitude * longitude +
    0.1 * longitude * latitude +
    0.1 * Math.sqrt(Math.abs(longitude));
  result +=
    ((20 * Math.sin(6 * longitude * PI) + 20 * Math.sin(2 * longitude * PI)) *
      2) /
    3;
  result +=
    ((20 * Math.sin(longitude * PI) + 40 * Math.sin((longitude / 3) * PI)) *
      2) /
    3;
  return (
    result +
    ((150 * Math.sin((longitude / 12) * PI) +
      300 * Math.sin((longitude / 30) * PI)) *
      2) /
      3
  );
}

/** Converts a GCJ-02 coordinate to the WGS-84 coordinate used by the initial Tianditu layer. */
export function gcj02ToWgs84(longitude: number, latitude: number) {
  if (outsideChina(longitude, latitude)) return { longitude, latitude };
  const deltaLatitude = transformLatitude(longitude - 105, latitude - 35);
  const deltaLongitude = transformLongitude(longitude - 105, latitude - 35);
  const radians = (latitude / 180) * PI;
  const magic = 1 - EE * Math.sin(radians) * Math.sin(radians);
  const sqrtMagic = Math.sqrt(magic);
  const adjustedLatitude =
    (deltaLatitude * 180) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI);
  const adjustedLongitude =
    (deltaLongitude * 180) / ((A / sqrtMagic) * Math.cos(radians) * PI);
  return {
    longitude: longitude - adjustedLongitude,
    latitude: latitude - adjustedLatitude,
  };
}
