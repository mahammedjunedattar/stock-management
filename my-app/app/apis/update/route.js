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

export async function POST(request) {
    try {
        const data = await request.json(); // Parse incoming JSON data
        const { Action, name, initialquantaty } = data;

        // Validate input data
        if (!name || !['plus', 'minus'].includes(Action) || isNaN(initialquantaty)) {
            return NextResponse.json({ error: 'Invalid input data' }, { status: 400 });
        }

        const client = await connectToDatabase();
        const db = client.db('stock');
        const collection = db.collection('inventory');

        const currentQuantity = parseInt(initialquantaty);
        const newQuantity = Action === 'plus' ? currentQuantity + 1 : currentQuantity - 1;

        const result = await collection.updateOne(
            { name: name }, // Filter to select the document to update
            { $set: { "quantity": newQuantity } }
        );

        if (result.modifiedCount === 0) {
            return NextResponse.json({ error: 'Document not found or no changes made' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Document updated', result }, { status: 200 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Unable to update document', details: e.message }, { status: 500 });
    }
}

async function listDatabases(client) {
    const db = client.db('stock');
    const collection = db.collection('inventory');
    const result = await collection.find().toArray(); // Convert the cursor to an array

    return result;
}