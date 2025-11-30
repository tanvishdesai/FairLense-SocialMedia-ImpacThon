const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

try {
    const buffer = fs.readFileSync(envPath);
    let content = '';

    // Check for UTF-16 LE BOM
    if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
        console.log('Detected UTF-16 LE encoding. Converting to UTF-8...');
        content = buffer.toString('utf16le');
    } 
    // Check for UTF-16 BE BOM
    else if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
        console.log('Detected UTF-16 BE encoding. Converting to UTF-8...');
        content = buffer.toString('utf16be');
    }
    // Check for UTF-8 BOM
    else if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        console.log('Detected UTF-8 BOM. Stripping...');
        content = buffer.toString('utf8').slice(1);
    }
    else {
        console.log('No BOM detected. Assuming UTF-8 or ASCII.');
        content = buffer.toString('utf8');
    }

    // Clean up content
    const cleanContent = content.trim();
    
    // Validate it looks like an env file
    if (!cleanContent.includes('=')) {
        console.warn('WARNING: Converted content does not look like a valid env file (no "=" found). Aborting write.');
        console.log('Preview:', cleanContent.substring(0, 50));
        process.exit(1);
    }

    fs.writeFileSync(envPath, cleanContent, 'utf8');
    console.log('Successfully fixed .env.local encoding to UTF-8.');
    console.log('New content preview:', cleanContent.substring(0, 20) + '...');

} catch (err) {
    console.error('Error fixing file:', err);
    process.exit(1);
}
