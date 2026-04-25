/**
 * Manual mock for src/api/axios.js
 * Every test file that imports api from '../../api/axios' gets this mock instead.
 * Individual tests can override specific methods with jest.fn().mockResolvedValueOnce(…)
 */

const api = {
  get: jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({ data: {} })),
  put: jest.fn(() => Promise.resolve({ data: {} })),
  delete: jest.fn(() => Promise.resolve({ data: {} })),
  patch: jest.fn(() => Promise.resolve({ data: {} })),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  defaults: { headers: { common: {} } },
};

export default api;