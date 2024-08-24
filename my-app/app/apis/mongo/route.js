const { MongoClient } = require('mongodb');
import { NextResponse } from 'next/server';

let cachedClient = null;

async function connectToDatabase() {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
        throw new Error('MONGODB_URI is not set');
    }

    if (cachedClient) {
        return cachedClient;
    }

    const client = new MongoClient(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000,
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true
    });

    cachedClient = await client.connect();
    return cachedClient;
}

export async function GET(request) {
    
    try {
        const client = await connectToDatabase();
        
        const databasesList = await listDatabases(client);
        return NextResponse.json(databasesList);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Unable to connect to the database', details: e.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const client = await connectToDatabase();
        const db = client.db('stock');
        const collection = db.collection('inventory');

        const data = await request.json(); // Parse incoming JSON data
        const result = await collection.insertOne(data);
        return NextResponse.json({ message: 'Document inserted', result }, { status: 201 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Unable to insert document', details: e.message }, { status: 500 });
    }
}

async function listDatabases(client) {
    const db = client.db('stock');
    const collection = db.collection('inventory');
    const result = await collection.find().toArray(); // Convert the cursor to an array

    return result;
}