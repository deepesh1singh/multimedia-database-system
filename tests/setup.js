// Test setup file
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.PORT = 3001;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.testUtils = {
  generateTestUser: () => ({
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'client'
  }),
  
  generateTestContent: (type = 'book') => ({
    id: 'test-content-id',
    title: 'Test Content',
    description: 'Test description',
    author: 'Test Author',
    content_type: type,
    created_at: new Date()
  }),
  
  generateTestPlaylist: () => ({
    id: 'test-playlist-id',
    name: 'Test Playlist',
    description: 'Test playlist description',
    user_id: 'test-user-id',
    is_public: false,
    total_items: 0
  })
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
}); 