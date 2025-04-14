const { MongoClient } = require('mongodb');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;
console.log('Testing MongoDB connection...');

async function testConnection() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('Successfully connected to MongoDB!');
        
        // List databases to verify access
        const dbs = await client.db().admin().listDatabases();
        console.log('\nAvailable databases:');
        dbs.databases.forEach(db => console.log(` - ${db.name}`));
        
    } catch (err) {
        console.error('Connection error:', err);
    } finally {
        await client.close();
    }
}

testConnection();
