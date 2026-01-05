const dotenv = require('dotenv');
const { execSync } = require('child_process');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('Environment loaded. Checking TURSO_DATABASE_URL...');
if (!process.env.TURSO_DATABASE_URL) {
    console.error('Error: TURSO_DATABASE_URL not found in environment.');
    process.exit(1);
}

console.log('Running prisma migrate...');
try {
    execSync('npx prisma migrate dev --name add_system_management_models', {
        stdio: 'inherit',
        env: process.env
    });
    console.log('Migration successful.');
} catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
}
