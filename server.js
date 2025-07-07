const express = require('express');
const { UAParser } = require('ua-parser-js');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3120;

// Middleware
app.use(express.static('public'));
app.use(express.json({ limit: '50mb' })); // Increase JSON payload limit
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // Increase URL-encoded payload limit

// Set view engine
app.set('view engine', 'html');
app.engine('html', require('fs').readFile);

// Function to check if Android version is 11 or above
function isAndroid11Plus(version) {
    if (!version) return false;
    const versionNumber = parseInt(version.split('.')[0]);
    return versionNumber >= 11;
}

// Function to check if iOS version is 17 or above
function isIOS17Plus(version) {
    if (!version) return false;
    
    // Handle different iOS version formats
    // Examples: "17.0", "17.1.1", "17_0", etc.
    const cleanVersion = version.replace(/_/g, '.');
    const versionNumber = parseInt(cleanVersion.split('.')[0]);
    
    return versionNumber >= 17;
}

// Function to parse and filter user agents with progress tracking and duplicate detection
function parseAndFilterUserAgents(userAgentList, progressCallback = null) {
    const results = [];
    const lines = userAgentList.split('\n').filter(line => line.trim() !== '');
    const total = lines.length;
    const seenUserAgents = new Map(); // Track duplicates with first occurrence index
    let duplicateCount = 0;
    
    console.log(`Processing ${total} user agents...`);
    
    lines.forEach((userAgent, index) => {
        const trimmedUserAgent = userAgent.trim();
        const parser = new UAParser(trimmedUserAgent);
        const result = parser.getResult();
        
        let isValid = false;
        let reason = '';
        let isDuplicate = false;
        
        // Check for duplicates
        if (seenUserAgents.has(trimmedUserAgent)) {
            isDuplicate = true;
            duplicateCount++;
            const firstIndex = seenUserAgents.get(trimmedUserAgent);
            reason = `Duplicate (first seen at line ${firstIndex + 1})`;
        } else {
            seenUserAgents.set(trimmedUserAgent, index);
            
            // Original validation logic
            if (result.os.name === 'Android') {
                if (isAndroid11Plus(result.os.version)) {
                    isValid = true;
                    reason = `Android ${result.os.version} (Valid - Android 11+)`;
                } else {
                    reason = `Android ${result.os.version || 'Unknown'} (Invalid - Below Android 11)`;
                }
            } else if (result.os.name === 'iOS' || result.os.name === 'iPhone OS') {
                // Support both "iOS" and "iPhone OS" naming conventions
                if (isIOS17Plus(result.os.version)) {
                    isValid = true;
                    reason = `iOS ${result.os.version} (Valid - iOS 17+)`;
                } else {
                    reason = `iOS ${result.os.version || 'Unknown'} (Invalid - Below iOS 17)`;
                }
            } else {
                reason = `${result.os.name || 'Unknown OS'} (Invalid - Not Android/iOS)`;
            }
        }
        
        results.push({
            index: index + 1,
            userAgent: trimmedUserAgent,
            browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
            os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
            device: result.device.model || 'Unknown',
            isValid: isValid && !isDuplicate, // Valid only if not duplicate
            isDuplicate,
            reason
        });
        
        // Log progress every 1000 items
        if ((index + 1) % 1000 === 0) {
            console.log(`Processed ${index + 1}/${total} user agents...`);
        }
    });
    
    const validResults = results.filter(r => r.isValid);
    const uniqueCount = total - duplicateCount;
    
    console.log(`Completed processing ${total} user agents.`);
    console.log(`- Unique: ${uniqueCount}, Duplicates: ${duplicateCount}`);
    console.log(`- Valid: ${validResults.length}, Invalid/Filtered: ${total - validResults.length}`);
    
    return {
        results,
        stats: {
            total,
            unique: uniqueCount,
            duplicates: duplicateCount,
            valid: validResults.length,
            invalid: total - validResults.length
        }
    };
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/parse', (req, res) => {
    // Set timeout for large datasets
    req.setTimeout(300000); // 5 minutes timeout
    res.setTimeout(300000);
    
    try {
        const { userAgents } = req.body;
        
        if (!userAgents || userAgents.trim() === '') {
            return res.json({
                success: false,
                message: 'User agents list is required'
            });
        }
        
        console.log(`Received request to parse user agents. Size: ${userAgents.length} characters`);
        
        const parseResult = parseAndFilterUserAgents(userAgents);
        
        res.json({
            success: true,
            total: parseResult.stats.total,
            unique: parseResult.stats.unique,
            duplicates: parseResult.stats.duplicates,
            valid: parseResult.stats.valid,
            invalid: parseResult.stats.invalid,
            results: parseResult.results
        });
        
    } catch (error) {
        console.error('Error parsing user agents:', error);
        res.status(500).json({
            success: false,
            message: 'Error parsing user agents: ' + error.message
        });
    }
});

// New endpoint for downloading results as CSV
app.post('/parse-csv', (req, res) => {
    req.setTimeout(300000); // 5 minutes timeout
    res.setTimeout(300000);
    
    try {
        const { userAgents } = req.body;
        
        if (!userAgents || userAgents.trim() === '') {
            return res.status(400).send('User agents list is required');
        }
        
        console.log(`Received CSV request to parse user agents. Size: ${userAgents.length} characters`);
        
        const parseResult = parseAndFilterUserAgents(userAgents);
        
        // Generate CSV
        let csv = 'Index,Valid,Duplicate,Browser,OS,Device,Reason,User Agent\n';
        parseResult.results.forEach(result => {
            const userAgentEscaped = `"${result.userAgent.replace(/"/g, '""')}"`;
            const reasonEscaped = `"${result.reason.replace(/"/g, '""')}"`;
            csv += `${result.index},${result.isValid ? 'YES' : 'NO'},${result.isDuplicate ? 'YES' : 'NO'},"${result.browser}","${result.os}","${result.device}",${reasonEscaped},${userAgentEscaped}\n`;
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="user-agent-results.csv"');
        res.send(csv);
        
    } catch (error) {
        console.error('Error parsing user agents for CSV:', error);
        res.status(500).send('Error parsing user agents: ' + error.message);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
