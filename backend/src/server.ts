import { app } from './app.ts';
import { config } from './config/index.ts';
import { initDatabase } from './database/connection.ts';

// Initialize SQLite Schema & Tables
try {
  initDatabase();
  console.log('Database initialized successfully.');
} catch (err) {
  console.error('Failed to initialize database:', err);
  process.exit(1);
}

const PORT = config.port;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
