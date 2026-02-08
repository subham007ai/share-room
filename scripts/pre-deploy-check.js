
const https = require('https');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

console.log(`${colors.blue}Starting pre-deploy check...${colors.reset}\n`);

let hasError = false;

// 1. Check for .env file or environment variables
const envPath = path.join(__dirname, '..', '.env');
let envVars = {};

try {
    if (fs.existsSync(envPath)) {
        console.log(`${colors.green}✓ .env file found${colors.reset}`);
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2) {
                envVars[parts[0].trim()] = parts.slice(1).join('=').trim();
            }
        });
    } else {
        console.log(`${colors.yellow}⚠ .env file not found (checking process.env)${colors.reset}`);
        envVars = process.env;
    }
} catch (e) {
    console.log(`${colors.red}✗ Error reading .env file${colors.reset}`);
    hasError = true;
}

// 2. Check Required Environment Variables
const requiredVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
const missingVars = requiredVars.filter(v => !envVars[v] && !process.env[v]);

if (missingVars.length > 0) {
    console.log(`${colors.red}✗ Missing required environment variables:${colors.reset}`);
    missingVars.forEach(v => console.log(`  - ${v}`));
    hasError = true;
} else {
    console.log(`${colors.green}✓ All required environment variables present${colors.reset}`);
}

// 3. Connectivity Check (Simple URL check)
const supabaseUrl = envVars['VITE_SUPABASE_URL'] || process.env['VITE_SUPABASE_URL'];

if (supabaseUrl) {
    try {
        const url = new URL(supabaseUrl);
        console.log(`${colors.blue}Testing connectivity to ${url.hostname}...${colors.reset}`);

        const req = https.request({
            hostname: url.hostname,
            port: 443,
            path: '/',
            method: 'HEAD',
            timeout: 5000
        }, (res) => {
            console.log(`${colors.green}✓ Connectivity check passed (${res.statusCode})${colors.reset}`);
            finish();
        });

        req.on('error', (e) => {
            console.log(`${colors.red}✗ Connectivity check failed: ${e.message}${colors.reset}`);
            hasError = true;
            finish();
        });

        req.on('timeout', () => {
            req.destroy();
            console.log(`${colors.red}✗ Connectivity check timed out${colors.reset}`);
            hasError = true;
            finish();
        });

        req.end();
    } catch (e) {
        console.log(`${colors.red}✗ Invalid Supabase URL format${colors.reset}`);
        hasError = true;
        finish();
    }
} else {
    finish();
}

function finish() {
    console.log('\n');
    if (hasError) {
        console.log(`${colors.red}Checks FAILED. Please fix issues before deploying.${colors.reset}`);
        process.exit(1);
    } else {
        console.log(`${colors.green}Checks PASSED. Ready for build/deploy.${colors.reset}`);
        process.exit(0);
    }
}
