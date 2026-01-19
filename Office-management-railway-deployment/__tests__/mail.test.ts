import { jest, describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import request from 'supertest';

const mockSendEmail = jest.fn();

jest.unstable_mockModule('../db/db', () => ({
  default: {
    query: jest.fn(),
  },
  __esModule: true,
}));

jest.unstable_mockModule('node-cron', () => ({
  default: {
    schedule: jest.fn(),
  },
  schedule: jest.fn(),
  __esModule: true,
}));

jest.unstable_mockModule('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    use: jest.fn(),
    on: jest.fn(),
  })),
  __esModule: true,
}));

jest.unstable_mockModule('../routes/chat', () => ({
  default: (req: any, res: any, next: any) => next(),
  __esModule: true,
}));

jest.unstable_mockModule('../controllers/chatController', () => ({
  handleSocketConnection: jest.fn(),
  __esModule: true,
}));

jest.unstable_mockModule('../scheduler', () => ({
  initScheduler: jest.fn(),
  __esModule: true,
}));

jest.unstable_mockModule('../utils/mailer', () => ({
  sendEmail: mockSendEmail,
  __esModule: true,
}));

// Dynamic import
const { default: app } = await import('../index');

describe('Debug Mail Route', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockReset();
    mockSendEmail.mockResolvedValue({ messageId: 'test' });
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('should return 400 if DEBUG_MAIL_TO is not set', async () => {
    delete process.env.DEBUG_MAIL_TO;

    const res = await request(app).get('/debug-mail');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("DEBUG_MAIL_TO environment variable is not set");
  });

  it('should send email if DEBUG_MAIL_TO is set', async () => {
    process.env.DEBUG_MAIL_TO = 'test@example.com';

    const res = await request(app).get('/debug-mail');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(mockSendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'test@example.com'
    }));
  });
});
