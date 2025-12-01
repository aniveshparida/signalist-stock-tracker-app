/**
 * Password URL Encoding Utility
 * 
 * This script helps you encode special characters in your MongoDB password
 * to ensure proper authentication.
 * 
 * Usage: npx tsx scripts/encode-password.ts "your-password-here"
 */

function encodePassword(password: string): string {
    // URL encode the password
    return encodeURIComponent(password);
}

function showEncodingExamples() {
    console.log('\n📝 Common Special Characters Encoding:');
    console.log('   @ → %40');
    console.log('   # → %23');
    console.log('   / → %2F');
    console.log('   : → %3A');
    console.log('   ? → %3F');
    console.log('   & → %26');
    console.log('   = → %3D');
    console.log('   + → %2B');
    console.log('   % → %25');
    console.log('   space → %20');
}

function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('🔐 MongoDB Password URL Encoder\n');
        console.log('Usage: npx tsx scripts/encode-password.ts "your-password-here"\n');
        console.log('Example:');
        console.log('  npx tsx scripts/encode-password.ts "my@pass#word"\n');
        showEncodingExamples();
        console.log('\n⚠️  Note: This script will display your encoded password.');
        console.log('   Make sure no one is watching your screen!\n');
        process.exit(0);
    }

    const password = args[0];
    
    if (!password) {
        console.error('❌ Error: No password provided');
        process.exit(1);
    }

    console.log('🔐 Encoding MongoDB Password\n');
    console.log('='.repeat(50));
    
    // Check for special characters
    const specialChars = /[@#/:?=&+% ]/;
    const hasSpecialChars = specialChars.test(password);
    
    console.log(`\nOriginal password: ${password}`);
    console.log(`Length: ${password.length} characters`);
    console.log(`Contains special characters: ${hasSpecialChars ? '✅ Yes' : '❌ No'}`);
    
    if (hasSpecialChars) {
        console.log('\n⚠️  Special characters detected! Encoding required.\n');
        
        // Show which characters need encoding
        const charsToEncode: string[] = [];
        for (const char of password) {
            if (specialChars.test(char) && !charsToEncode.includes(char)) {
                charsToEncode.push(char);
            }
        }
        
        if (charsToEncode.length > 0) {
            console.log('Characters that will be encoded:');
            charsToEncode.forEach(char => {
                const encoded = encodeURIComponent(char);
                console.log(`   "${char}" → "${encoded}"`);
            });
            console.log();
        }
    } else {
        console.log('\n✅ No special characters found. Encoding may not be necessary,');
        console.log('   but it\'s safe to use the encoded version anyway.\n');
    }
    
    const encodedPassword = encodePassword(password);
    
    console.log('='.repeat(50));
    console.log('\n✅ Encoded password:');
    console.log(`   ${encodedPassword}\n`);
    
    console.log('📋 Use this in your MONGODB_URI:');
    console.log(`   mongodb+srv://USERNAME:${encodedPassword}@cluster.mongodb.net/DATABASE?retryWrites=true&w=majority\n`);
    
    // Show comparison
    if (password !== encodedPassword) {
        console.log('📊 Comparison:');
        console.log(`   Original:  ${password}`);
        console.log(`   Encoded:   ${encodedPassword}`);
        console.log(`   Changed:   ✅ Yes (${encodedPassword.length - password.length} characters added)\n`);
    } else {
        console.log('📊 Comparison:');
        console.log(`   Original:  ${password}`);
        console.log(`   Encoded:   ${encodedPassword}`);
        console.log(`   Changed:   ❌ No (password didn't need encoding)\n`);
    }
    
    console.log('⚠️  Remember to update your .env file with the encoded password!');
    console.log('   MONGODB_URI=mongodb+srv://USERNAME:' + encodedPassword + '@cluster.mongodb.net/DATABASE?retryWrites=true&w=majority\n');
}

main();

