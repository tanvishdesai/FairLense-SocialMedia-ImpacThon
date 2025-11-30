const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

console.log('Checking .env.local at:', envPath);

if (!fs.existsSync(envPath)) {
    console.error('ERROR: .env.local file NOT found!');
    process.exit(1);
}

try {
    const content = fs.readFileSync(envPath, 'utf8');
    console.log('File content length:', content.length);
    
    const lines = content.split('\n');
    let found = false;
    
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('GEMINI_API_KEY')) {
            found = true;
            console.log(`Line ${index + 1}: Found GEMINI_API_KEY`);
            
            const parts = trimmed.split('=');
            if (parts.length < 2) {
                console.error('ERROR: Invalid format. Expected KEY=VALUE');
            } else {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                
                if (key !== 'GEMINI_API_KEY') {
                    console.error(`ERROR: Key name mismatch. Found "${key}"`);
                }
                
                if (value.length === 0) {
                    console.error('ERROR: Value is empty');
                } else {
                    console.log('Value length:', value.length);
                    console.log('Value starts with:', value.substring(0, 4) + '...');
                    // Check for quotes
                    if (value.startsWith('"') || value.startsWith("'")) {
                        console.log('NOTE: Value is quoted');
                    }
                }
            }
        }
    });
    
    if (!found) {
        console.error('ERROR: GEMINI_API_KEY not found in file');
        console.log('Raw content preview:', content.substring(0, 50) + '...');
    }

} catch (err) {
    console.error('Error reading file:', err);
}
