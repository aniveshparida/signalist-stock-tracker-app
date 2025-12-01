/**
 * MongoDB Connection Test Script
 * 
 * This script tests the MongoDB connection and provides detailed diagnostics.
 * Run with: npx tsx scripts/test-mongodb-connection.ts
 * 
 * Make sure you have a .env file with MONGODB_URI set.
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import mongoose from 'mongoose';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

async function testConnection() {
    console.log('🔍 MongoDB Connection Test\n');
    console.log('='.repeat(50));

    // Step 1: Check if MONGODB_URI exists
    console.log('\n1️⃣  Checking environment variable...');
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI is not set in .env file');
        console.error('\n📝 Create a .env file in the root directory with:');
        console.error('   MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/DATABASE?retryWrites=true&w=majority');
        process.exit(1);
    }
    console.log('✅ MONGODB_URI is set');

    // Step 2: Validate URI format
    console.log('\n2️⃣  Validating URI format...');
    try {
        const url = new URL(MONGODB_URI);
        const username = url.username;
        const password = url.password;
        const hostname = url.hostname;
        const pathname = url.pathname;
        const database = pathname.split('/')[1]?.split('?')[0] || 'default';

        console.log(`   Protocol: ${url.protocol}`);
        console.log(`   Username: ${username || '❌ MISSING'}`);
        console.log(`   Password: ${password ? '**** (hidden)' : '❌ MISSING'}`);
        console.log(`   Hostname: ${hostname || '❌ MISSING'}`);
        console.log(`   Database: ${database || '❌ MISSING'}`);

        if (!username) {
            console.error('\n❌ Username is missing in URI');
            console.error('   Format: mongodb+srv://USERNAME:PASSWORD@...');
            process.exit(1);
        }

        if (!password) {
            console.error('\n❌ Password is missing in URI');
            console.error('   Format: mongodb+srv://USERNAME:PASSWORD@...');
            process.exit(1);
        }

        if (!hostname) {
            console.error('\n❌ Hostname/cluster URL is missing');
            process.exit(1);
        }

        // Check for common special characters that might need encoding
        const specialChars = /[@#/:?=&+%]/;
        if (specialChars.test(password) && !password.includes('%')) {
            console.warn('\n⚠️  Warning: Password contains special characters that may need URL-encoding');
            console.warn('   Special characters should be encoded:');
            console.warn('   @ → %40, # → %23, / → %2F, : → %3A, ? → %3F, & → %26, = → %3D, + → %2B, % → %25');
        }

        console.log('✅ URI format is valid');
    } catch (error) {
        console.error('❌ Invalid URI format:', error instanceof Error ? error.message : error);
        console.error('\n📝 Expected format:');
        console.error('   mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/DATABASE?retryWrites=true&w=majority');
        process.exit(1);
    }

    // Step 3: Test connection
    console.log('\n3️⃣  Testing MongoDB connection...');
    try {
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            bufferCommands: false,
        });

        console.log('✅ Successfully connected to MongoDB!');
        console.log(`   Database: ${mongoose.connection.db?.databaseName || 'unknown'}`);
        console.log(`   Host: ${mongoose.connection.host || 'unknown'}`);
        console.log(`   Port: ${mongoose.connection.port || 'unknown'}`);

        // Test a simple operation
        const collections = await mongoose.connection.db?.listCollections().toArray();
        console.log(`   Collections: ${collections?.length || 0} found`);

        await mongoose.disconnect();
        console.log('\n✅ Connection test completed successfully!');
        process.exit(0);
    } catch (error: any) {
        console.error('\n❌ Connection failed!');
        
        if (error.name === 'MongoServerError' || error.name === 'MongoAuthenticationError') {
            console.error(`   Error Type: Authentication Error`);
            console.error(`   Message: ${error.message}`);
            console.error('\n🔧 Possible Solutions:');
            console.error('   1. Verify username and password in MongoDB Atlas');
            console.error('   2. URL-encode special characters in password');
            console.error('   3. Check MongoDB Atlas → Database Access → User permissions');
            console.error('   4. Ensure IP address is whitelisted in Network Access');
            console.error('   5. Verify database name is correct');
        } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('getaddrinfo')) {
            console.error(`   Error Type: Network Error`);
            console.error(`   Message: ${error.message}`);
            console.error('\n🔧 Possible Solutions:');
            console.error('   1. Check internet connection');
            console.error('   2. Verify cluster URL is correct');
            console.error('   3. Check MongoDB Atlas cluster status');
        } else if (error.message?.includes('timeout')) {
            console.error(`   Error Type: Connection Timeout`);
            console.error(`   Message: ${error.message}`);
            console.error('\n🔧 Possible Solutions:');
            console.error('   1. Check firewall settings');
            console.error('   2. Verify IP whitelist in MongoDB Atlas');
            console.error('   3. Check network connectivity');
        } else {
            console.error(`   Error Type: ${error.name || 'Unknown'}`);
            console.error(`   Message: ${error.message || error}`);
        }

        process.exit(1);
    }
}

// Run the test
testConnection().catch(console.error);

