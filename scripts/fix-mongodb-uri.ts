/**
 * MongoDB URI Fixer and Validator
 * 
 * This script helps diagnose and fix MongoDB URI issues.
 * It will check your current URI and suggest fixes.
 * 
 * Usage: npx tsx scripts/fix-mongodb-uri.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

function analyzeURI(uri: string) {
    console.log('🔍 Analyzing MongoDB URI...\n');
    console.log('='.repeat(60));
    
    try {
        const url = new URL(uri);
        const username = url.username;
        const password = url.password;
        const hostname = url.hostname;
        const pathname = url.pathname;
        const database = pathname.split('/')[1]?.split('?')[0] || null;
        const searchParams = url.searchParams;
        
        console.log('\n📋 URI Components:');
        console.log(`   Protocol:  ${url.protocol}`);
        console.log(`   Username:  ${username || '❌ MISSING'}`);
        console.log(`   Password:  ${password ? `**** (${password.length} chars)` : '❌ MISSING'}`);
        console.log(`   Hostname:  ${hostname || '❌ MISSING'}`);
        console.log(`   Database:  ${database || '⚠️  MISSING (will use default)'}`);
        console.log(`   Query:     ${url.search || 'none'}`);
        
        const issues: string[] = [];
        const suggestions: string[] = [];
        
        // Check for issues
        if (!username) {
            issues.push('Username is missing');
        }
        
        if (!password) {
            issues.push('Password is missing');
        }
        
        if (!hostname) {
            issues.push('Hostname/cluster URL is missing');
        }
        
        if (!database) {
            issues.push('Database name is missing from URI path');
            suggestions.push('Add database name after hostname: mongodb+srv://...@cluster.net/DATABASE_NAME');
        }
        
        // Check password for special characters
        if (password) {
            const specialChars = /[@#/:?=&+% ]/;
            const hasSpecialChars = specialChars.test(password);
            const isEncoded = password.includes('%');
            
            if (hasSpecialChars && !isEncoded) {
                issues.push('Password contains special characters that need URL-encoding');
                suggestions.push('Use the encode:password script to encode your password');
                suggestions.push('Run: npm run encode:password "your-password-here"');
            }
        }
        
        // Check query parameters
        const retryWrites = searchParams.get('retryWrites');
        const w = searchParams.get('w');
        
        if (!retryWrites || retryWrites !== 'true') {
            suggestions.push('Add ?retryWrites=true to query string for better reliability');
        }
        
        if (!w || w !== 'majority') {
            suggestions.push('Add &w=majority to query string for write concern');
        }
        
        console.log('\n' + '='.repeat(60));
        
        if (issues.length > 0) {
            console.log('\n❌ Issues Found:');
            issues.forEach((issue, i) => {
                console.log(`   ${i + 1}. ${issue}`);
            });
        } else {
            console.log('\n✅ No obvious format issues detected');
        }
        
        if (suggestions.length > 0) {
            console.log('\n💡 Suggestions:');
            suggestions.forEach((suggestion, i) => {
                console.log(`   ${i + 1}. ${suggestion}`);
            });
        }
        
        // Generate corrected URI template
        console.log('\n' + '='.repeat(60));
        console.log('\n📝 Correct URI Format:');
        console.log('   mongodb+srv://USERNAME:ENCODED_PASSWORD@HOSTNAME/DATABASE_NAME?retryWrites=true&w=majority');
        
        if (database) {
            console.log('\n✅ Your current URI structure looks correct');
            console.log('   The authentication error is likely due to:');
            console.log('   1. Incorrect username or password');
            console.log('   2. Password needs URL-encoding');
            console.log('   3. Database user doesn\'t have proper permissions');
            console.log('   4. IP address not whitelisted in MongoDB Atlas');
        } else {
            console.log('\n⚠️  Your URI is missing the database name');
            console.log('   Current: mongodb+srv://...@hostname');
            console.log('   Should be: mongodb+srv://...@hostname/DATABASE_NAME');
        }
        
        return {
            username,
            password: password ? '****' : null,
            hostname,
            database,
            hasIssues: issues.length > 0,
            issues,
            suggestions
        };
        
    } catch (error) {
        console.error('❌ Error parsing URI:', error instanceof Error ? error.message : error);
        return null;
    }
}

function main() {
    console.log('🔧 MongoDB URI Fixer and Validator\n');
    
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI is not set in .env file');
        console.error('\n📝 Create a .env file with:');
        console.error('   MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/DATABASE?retryWrites=true&w=majority');
        process.exit(1);
    }
    
    // Show sanitized URI (hide password)
    const sanitized = MONGODB_URI.replace(/:\/\/[^:]+:[^@]+@/, '://****:****@');
    console.log(`Current URI: ${sanitized}\n`);
    
    const analysis = analyzeURI(MONGODB_URI);
    
    if (analysis && analysis.hasIssues) {
        console.log('\n🔧 Next Steps:');
        console.log('   1. Fix the issues listed above');
        console.log('   2. If password has special characters, encode it:');
        console.log('      npm run encode:password "your-password"');
        console.log('   3. Update your .env file with the corrected URI');
        console.log('   4. Test the connection: npm run test:db');
    }
    
    console.log('\n');
}

main();

