import { MongoClient } from 'mongodb';

const dbName = process.env.CASH_DB_NAME;
const uri = process.env.DATABASE_URL + process.env.CASH_DB_PORT + `/${dbName}`;

const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 45000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 45000,
});

export async function connect() {
    try {
        await client.connect();
        console.log('Connected to the MongoDB CASH server');

        const database = client.db(dbName);

        return database;
    } catch (error) {
        console.error('Error connecting to the MongoDB CASH server:', error);
        throw error;
    }
}

export async function close() {
    try {
        await client.close();
        console.log('Connection to the MongoDB CASH server closed');
    } catch (error) {
        console.error('Error closing the MongoDB CASH connection:', error);
        throw error;
    }
}