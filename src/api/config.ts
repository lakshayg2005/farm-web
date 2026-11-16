/** Base URL of the API gateway. Every service lives under it at /<service>/... */
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '/api/v1').replace(/\/$/, '')
