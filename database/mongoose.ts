import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

declare global {
    var mongooseCache: {
        conn: typeof mongoose | null;
        promise: Promise<typeof mongoose> | null;
    }
}

let cached = global.mongooseCache;

if(!cached) {
    cached = global.mongooseCache = { conn: null, promise: null };
}

/**
 * Validates MongoDB URI format and extracts components for debugging
 */
function validateMongoURI(uri: string): { valid: boolean; issues: string[]; sanitized: string } {
    const issues: string[] = [];
    let sanitized = uri;

    // Check basic format
    if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
        issues.push('URI must start with mongodb:// or mongodb+srv://');
    }

    // Extract components for validation (without exposing password)
    try {
        const url = new URL(uri);
        const username = url.username;
        const password = url.password;
        const hostname = url.hostname;
        const pathname = url.pathname;

        if (!username) {
            issues.push('Username is missing in URI');
        }

        if (!password) {
            issues.push('Password is missing in URI');
        }

        if (!hostname || hostname === '') {
            issues.push('Hostname/cluster URL is missing in URI');
        }

        // Create sanitized version for logging (hide password)
        if (username && password) {
            sanitized = uri.replace(`:${password}@`, ':****@');
        }
    } catch (e) {
        issues.push(`Invalid URI format: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }

    return {
        valid: issues.length === 0,
        issues,
        sanitized
    };
}

export const connectToDatabase = async () => {
    if(!MONGODB_URI) {
        throw new Error('MONGODB_URI must be set within .env file');
    }

    // Validate URI format
    const validation = validateMongoURI(MONGODB_URI);
    if (!validation.valid) {
        console.error('❌ MongoDB URI Validation Issues:');
        validation.issues.forEach(issue => console.error(`   - ${issue}`));
        console.error('\n📝 Expected format:');
        console.error('   mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/DATABASE?retryWrites=true&w=majority');
        console.error('\n⚠️  Important: Special characters in password must be URL-encoded');
        console.error('   Example: @ becomes %40, # becomes %23, etc.');
        throw new Error(`Invalid MongoDB URI format: ${validation.issues.join(', ')}`);
    }

    if(cached.conn) {
        console.log('✅ Using cached MongoDB connection');
        return cached.conn;
    }

    if(!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, { 
            bufferCommands: false,
            serverSelectionTimeoutMS: 10000, // 10 seconds timeout
        });
    }

    try {
        cached.conn = await cached.promise;
        console.log(`✅ Connected to MongoDB (${process.env.NODE_ENV})`);
        console.log(`   URI: ${validation.sanitized}`);
        console.log(`   Database: ${mongoose.connection.db?.databaseName || 'unknown'}`);
    } catch (err: any) {
        cached.promise = null;
        
        // Provide detailed error information
        if (err.name === 'MongoServerError' || err.name === 'MongoAuthenticationError') {
            console.error('❌ MongoDB Authentication Failed');
            console.error(`   Error: ${err.message}`);
            console.error('\n🔍 Troubleshooting Steps:');
            console.error('   1. Verify your username and password in MongoDB Atlas');
            console.error('   2. Check if password contains special characters that need URL-encoding:');
            console.error('      - @ → %40');
            console.error('      - # → %23');
            console.error('      - / → %2F');
            console.error('      - : → %3A');
            console.error('      - ? → %3F');
            console.error('      - & → %26');
            console.error('      - = → %3D');
            console.error('      - + → %2B');
            console.error('      - % → %25');
            console.error('   3. Ensure your IP address is whitelisted in MongoDB Atlas Network Access');
            console.error('   4. Verify database user has correct permissions');
            console.error('   5. Check if the database name in URI is correct');
            console.error('\n📝 To reset credentials:');
            console.error('   - Go to MongoDB Atlas → Database Access → Edit User → Reset Password');
            console.error('   - Update MONGODB_URI in your .env file with new credentials');
        } else if (err.message?.includes('ENOTFOUND') || err.message?.includes('getaddrinfo')) {
            console.error('❌ MongoDB Connection Failed - Network Error');
            console.error(`   Error: ${err.message}`);
            console.error('   Check your internet connection and MongoDB Atlas cluster status');
        } else {
            console.error('❌ MongoDB Connection Failed');
            console.error(`   Error: ${err.message || err}`);
        }
        
        throw err;
    }

    return cached.conn;
}