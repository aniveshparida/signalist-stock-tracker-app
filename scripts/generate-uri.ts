/**
 * MongoDB URI Generator
 * 
 * This script helps you generate a correctly formatted MongoDB URI
 * by asking for the necessary components.
 * 
 * Usage: npx tsx scripts/generate-uri.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import * as readline from 'readline';

// Load existing .env if available
config({ path: resolve(process.cwd(), '.env') });

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(prompt, resolve);
    });
}

function encodePassword(password: string): string {
    return encodeURIComponent(password);
}

async function main() {
    console.log('🔧 MongoDB URI Generator\n');
    console.log('This will help you create a correctly formatted MongoDB URI.\n');
    console.log('='.repeat(60));
    
    // Get current values if they exist
    const currentURI = process.env.MONGODB_URI;
    let currentUsername = '';
    let currentHostname = '';
    
    if (currentURI) {
        try {
            const url = new URL(currentURI);
            currentUsername = url.username;
            currentHostname = url.hostname;
            console.log('\n📋 Current URI detected:');
            console.log(`   Username: ${currentUsername}`);
            console.log(`   Hostname: ${currentHostname}`);
            console.log('\n💡 You can press Enter to keep current values or type new ones.\n');
        } catch (e) {
            // Ignore
        }
    }
    
    // Get username
    const usernamePrompt = currentUsername 
        ? `Username [${currentUsername}]: `
        : 'Username: ';
    let username = await question(usernamePrompt);
    username = username.trim() || currentUsername;
    
    if (!username) {
        console.error('❌ Username is required');
        rl.close();
        process.exit(1);
    }
    
    // Get password
    const password = await question('Password: ');
    if (!password) {
        console.error('❌ Password is required');
        rl.close();
        process.exit(1);
    }
    
    // Check if password needs encoding
    const specialChars = /[@#/:?=&+% ]/;
    const needsEncoding = specialChars.test(password);
    const encodedPassword = encodePassword(password);
    
    if (needsEncoding && password !== encodedPassword) {
        console.log(`\n⚠️  Password contains special characters. Encoded version: ${encodedPassword}`);
    }
    
    // Get hostname
    const hostnamePrompt = currentHostname
        ? `Hostname/Cluster URL [${currentHostname}]: `
        : 'Hostname/Cluster URL (e.g., cluster0.xxxxx.mongodb.net): ';
    let hostname = await question(hostnamePrompt);
    hostname = hostname.trim() || currentHostname;
    
    if (!hostname) {
        console.error('❌ Hostname is required');
        rl.close();
        process.exit(1);
    }
    
    // Get database name
    const databaseName = await question('Database Name (e.g., stocks-app, myapp): ');
    if (!databaseName.trim()) {
        console.warn('⚠️  No database name provided. Using "stocks-app" as default.');
    }
    const dbName = databaseName.trim() || 'stocks-app';
    
    // Build URI
    const uri = `mongodb+srv://${username}:${encodedPassword}@${hostname}/${dbName}?retryWrites=true&w=majority`;
    
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Generated MongoDB URI:\n');
    console.log(uri);
    console.log('\n' + '='.repeat(60));
    console.log('\n📝 Add this to your .env file:');
    console.log(`MONGODB_URI=${uri}\n`);
    
    // Ask if they want to test it
    const test = await question('Would you like to test this connection now? (y/n): ');
    if (test.toLowerCase() === 'y' || test.toLowerCase() === 'yes') {
        console.log('\n🧪 Testing connection...\n');
        rl.close();
        
        // Set the URI temporarily and test
        process.env.MONGODB_URI = uri;
        
        // Import and run test
        const mongoose = require('mongoose');
        mongoose.connect(uri, {
            serverSelectionTimeoutMS: 10000,
            bufferCommands: false,
        })
        .then(() => {
            console.log('✅ Connection successful!');
            console.log(`   Database: ${mongoose.connection.db?.databaseName}`);
            mongoose.disconnect();
            process.exit(0);
        })
        .catch((error: any) => {
            console.error('❌ Connection failed:', error.message);
            if (error.name === 'MongoServerError' || error.name === 'MongoAuthenticationError') {
                console.error('\n🔧 Possible issues:');
                console.error('   1. Wrong username or password');
                console.error('   2. IP address not whitelisted in MongoDB Atlas');
                console.error('   3. User doesn\'t have proper permissions');
            }
            process.exit(1);
        });
    } else {
        rl.close();
        console.log('\n💡 Remember to:');
        console.log('   1. Update your .env file with the URI above');
        console.log('   2. Test the connection: npm run test:db');
        console.log('   3. Ensure your IP is whitelisted in MongoDB Atlas\n');
    }
}

main().catch(console.error);

