const fs = require('fs');
const path = 'd:\\تطبيقي\\app\\department\\[id]\\page.tsx';

try {
    const content = fs.readFileSync(path, 'utf8');
    const lines = content.split('\n');
    console.log('Searching for "correctivePlanFacilities" or "متابعة الخطط التصحيحية"...');
    lines.forEach((line, i) => {
        if (line.includes('correctivePlanFacilities') || line.includes('متابعة الخطط التصحيحية')) {
            // Print context (clean line)
            if (line.trim().length > 0 && !line.trim().startsWith('//')) {
                console.log(`Line ${i + 1}: ${line.trim().substring(0, 100)}`);
            }
        }
    });
} catch (err) {
    console.error('Error reading file:', err);
}
