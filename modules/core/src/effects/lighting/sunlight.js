import {DirectionalLight} from '@luma.gl/core';

const DAY_IN_MS = 864e5;
const RADIAN_PER_DEGREE = Math.PI / 180;

function getDayOfYear(timestamp) {
  const date = new Date(timestamp);
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = timestamp - start.getTime();
  return Math.floor(diff / DAY_IN_MS);
}

function sin(degrees) {
  return Math.sin(degrees * RADIAN_PER_DEGREE);
}

function cos(degrees) {
  return Math.cos(degrees * RADIAN_PER_DEGREE);
}

// degrees
function acos(val) {
  return Math.acos(val) / RADIAN_PER_DEGREE;
}

// degrees
function asin(val) {
  return Math.asin(val) / RADIAN_PER_DEGREE;
}

// LST: Local Solar Time (hr)
// LS: Local Time (hr)
// LSTM: Local Standard Time Meridian (hr)
// EoT: Equation of Time (min)
// TC: Time Correction Factor
// https://www.pveducation.org/pvcdrom/properties-of-sunlight/solar-time
function getLST(longitude, dateOfYear, timestamp) {
  const date = new Date(timestamp);
  const timezoneOffsetMinutes = -date.getTimezoneOffset();
  const delta_T_UTC = Math.floor(timezoneOffsetMinutes / 60);
  const LSTM = 15 * delta_T_UTC;

  const B = (360 / 365) * (dateOfYear - 81);
  const EoT = 9.87 * sin(2 * B) - 7.53 * cos(B) - 1.5 * sin(B);

  const LT = date.getHours() + date.getMinutes() / 60;
  const TC = 4 * (longitude - LSTM) + EoT;

  const LST = LT + TC / 60;

  return LST;
}

// HRA: Hour Angle
function getHRA(LST) {
  return 15 * (LST - 12);
}

// alpha
function getElevationAngle({latitude, declinationAngle, HRA}) {
  // asin(sin_delta * sin_phi + cos_delta * cos_phi * cos_HRA)
  const delta = declinationAngle;
  const phi = latitude;
  return asin(sin(delta) * sin(phi) + cos(delta) * cos(phi) * cos(HRA));
}

// delta
function getDeclinationAngle(dateOfYear) {
  return 23.45 * sin((360 / 365) * (dateOfYear + 284));
}

// https://www.pveducation.org/pvcdrom/properties-of-sunlight/azimuth-angle
function getAzimuthAngle({latitude, declinationAngle, elevationAngle, HRA, LST}) {
  // acos(sin(delta) * cos(phi) - cos(delta) * sin(phi) * cos(HRA)) / cos(alpha)
  const delta = declinationAngle;
  const phi = latitude;
  const alpha = elevationAngle;
  const azi = acos(sin(delta) * cos(phi) - cos(delta) * sin(phi) * cos(HRA)) / cos(alpha);

  if (LST < 12 || HRA < 0) {
    return azi;
  }

  return 360 - azi;
}

export default class Sunlight extends DirectionalLight {
  constructor({latitude, longitude, timestamp, ...others}) {
    super(others);
    // phi
    this.elevationAngle = null;
    this.azimuthAngle = null;

    this.setProps({latitude, longitude, timestamp});
  }

  get elevation() {
    return this.elevationAngle;
  }

  get azimuth() {
    return this.azimuthAngle;
  }

  getDirection() {
    const dateOfYear = getDayOfYear(this.timestamp);
    const LST = getLST(this.longitude, dateOfYear, this.timestamp);
    const HRA = getHRA(LST);
    const latitude = this.latitude;

    const declinationAngle = getDeclinationAngle(dateOfYear);
    const elevationAngle = getElevationAngle({latitude, declinationAngle, HRA});
    const azimuthAngle = getAzimuthAngle({latitude, declinationAngle, elevationAngle, HRA, LST});

    this.elevationAngle = elevationAngle;
    this.azimuthAngle = azimuthAngle;

    return [cos(this.azimuthAngle), sin(this.azimuthAngle), sin(this.elevationAngle)];
  }

  setProps(props) {
    if (props.latitude) {
      this.latitude = props.latitude;
    }

    if (props.longitude) {
      this.longitude = props.longitude;
    }

    if (props.timestamp) {
      this.timestamp = props.timestamp;
    }

    this.direction = this.getDirection();
  }
}
