import { isAxiosError } from 'axios'

const FALLBACK_ERROR_MESSAGE = 'Something went wrong'

export function getErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data

    if (typeof data?.detail === 'string') return data.detail

    if (typeof data?.message === 'string') return data.message

    if (Array.isArray(data?.non_field_errors)) {
      return data.non_field_errors.join(', ')
    }

    if (error.message) return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  return FALLBACK_ERROR_MESSAGE
}
