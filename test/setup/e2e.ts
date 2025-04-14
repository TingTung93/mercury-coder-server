import { config } from 'dotenv';
import { resolve } from 'path';

// Load test environment variables
config({ path: resolve(process.cwd(), '.env.test') });

// Extend timeout for E2E tests
jest.setTimeout(30000);