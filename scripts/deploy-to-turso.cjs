const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const tursoUrl = process.env.TURSO_DATABASE_URL;
const tursoToken = process.env.TURSO_AUTH_TOKEN;

if (!tursoUrl) {
    console.error('Error: TURSO_DATABASE_URL is not set in .env');
    process.exit(1);
}

// Construct the URL with auth token if necessary
let connectionUrl = tursoUrl;
if (!tursoUrl.includes('authToken=') && tursoToken) {
    connectionUrl += (tursoUrl.includes('?') ? '&' : '?') + `authToken=${tursoToken}`;
}

console.log('Deploying migrations to Turso...');
// Masking the credential for log safety
const maskedUrl = connectionUrl.replace(/authToken=[^&]+/, 'authToken=***');
console.log(`Target URL: ${maskedUrl}`);

try {
    execSync('npx prisma migrate deploy', {
        stdio: 'inherit',
        env: {
            ...process.env,
            DATABASE_URL: connectionUrl
        }
    });
    console.log('Successfully deployed migrations to Turso.');
} catch (e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
}
