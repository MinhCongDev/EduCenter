import axios from 'axios';

const NETWORK_ERROR_MESSAGE =
  'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.';
const TIMEOUT_ERROR_MESSAGE = 'Máy chủ phản hồi quá lâu. Vui lòng thử lại sau.';

interface ApiErrorBody {
  message?: string;
}

/**
 * Resolve a user-facing error message from an API failure.
 *
 * Prefers the message returned by the backend. When the request never got a
 * response (server down, CORS, offline, timeout) it reports a connection
 * problem instead of blaming the user's input.
 */
export const getApiErrorMessage = (err: unknown, fallback: string): string => {
  if (!axios.isAxiosError(err)) return fallback;

  const message = (err.response?.data as ApiErrorBody | undefined)?.message;
  if (message) return message;

  if (!err.response) {
    return err.code === 'ECONNABORTED' ? TIMEOUT_ERROR_MESSAGE : NETWORK_ERROR_MESSAGE;
  }

  return fallback;
};
