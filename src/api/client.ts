import axios from 'axios'

import { API_BASE_URL } from './constants'

// Bare axios instance; interceptors are attached in ./index.
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  paramsSerializer: params => {
    const sp = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        value.forEach(v => sp.append(key, String(v)))
      } else if (value != null) {
        sp.append(key, String(value))
      }
    }
    return sp.toString()
  }
})
