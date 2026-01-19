import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';

const mockQuery = jest.fn();

jest.unstable_mockModule('../db/db', () => ({
  default: {
    query: mockQuery,
  },
  __esModule: true,
}));

jest.unstable_mockModule('../middlewares/authenticateToken', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.cookies = { token: 'mockToken' };
    next();
  },
  __esModule: true,
}));

jest.unstable_mockModule('../middlewares/isEmployee', () => ({
    default: (req: any, res: any, next: any) => next(),
    __esModule: true,
}));

jest.unstable_mockModule('../utils/decodeToken', () => ({
    default: async () => ({ id: 1, role: 'employee' }),
    __esModule: true,
}));

// Dynamic imports
const { default: dashboardRouter } = await import('../routes/employees/dashboard');

const app = express();
app.use(express.json());
app.set('trust proxy', 1);
app.use('/employee/dashboard', dashboardRouter);

describe('Clock In IP Restriction', () => {
  beforeEach(() => {
    mockQuery.mockReset();
  });

  it('should deny access if IP is not in allowed_ips', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .post('/employee/dashboard/clock-in')
      .set('X-Forwarded-For', '10.0.0.1');

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('not authorized');
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('SELECT 1 FROM allowed_ips'),
      expect.arrayContaining(['10.0.0.1'])
    );
  });

  it('should allow access if IP is in allowed_ips', async () => {
    mockQuery
        .mockResolvedValueOnce({ rows: [{ '?column?': 1 }] })
        .mockResolvedValueOnce({ rows: [{ check_in_time: '09:00:00', check_out_time: null }] });

    const res = await request(app)
      .post('/employee/dashboard/clock-in')
      .set('X-Forwarded-For', '10.0.0.1');

    expect(res.status).toBe(201);
  });
});
