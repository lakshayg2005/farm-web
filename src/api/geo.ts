/** Why a "Use my location" attempt failed, in words a farmer can act on. */
export function geoProblem(err?: GeolocationPositionError): string {
  if (!window.isSecureContext) {
    return 'Your browser blocks location on this address because it is not HTTPS. Type the coordinates instead.'
  }
  if (err?.code === err?.PERMISSION_DENIED) {
    return 'Location is blocked for this site. Allow it in the browser address bar, or type the coordinates.'
  }
  if (err?.code === err?.TIMEOUT) return 'Finding your location took too long. Try again, or type the coordinates.'
  return 'Could not get your location. Type the coordinates instead.'
}
