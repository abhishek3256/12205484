import axios from 'axios';
export async function logEvent({ stack, level, packageName, message }) {
  try {
    const response = await axios.post('http://20.244.56.144/evaluation-service/logs', {
      stack,
      level,
      package: packageName,
      message,
    });
    return response.data;
  } catch {
    return { logID: null, message: 'Logging failed' };
  }
} 