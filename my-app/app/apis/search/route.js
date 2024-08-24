import { MongoClient } from 'mongodb';
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
        serverSelectionTimeoutMS: 30000, // Adjust timeout as needed
        tls: true, // Use TLS for secure connection
        tlsAllowInvalidCertificates: true, // Allow invalid certificates (for development only)
        tlsAllowInvalidHostnames: true // Allow invalid hostnames (for development only)
    });

    cachedClient = await client.connect();
    return cachedClient;
}

export async function GET(request) {
    const { searchParams } = request.nextUrl; // Use request.nextUrl instead of manually constructing the URL
    const q = searchParams.get('q');

    if (!q || typeof q !== 'string' || q.trim() === '') {
        return NextResponse.json({ error: 'Query parameter "q" is required and should be a non-empty string' }, { status: 400 }); // Bad Request
    }

    try {
        const client = await connectToDatabase();
        const db = client.db('stock');
        const collection = db.collection('inventory');
        const pipeline = [
            {
                $search: {
                    index: 'default', // Ensure you have an appropriate search index configured in MongoDB Atlas
                    text: {
                        query: q,
                        path: 'name' // The field to search on
                    }
                }
            },
            { $limit: 10 } // Limit the number of results
        ];
        const results = await collection.aggregate(pipeline).toArray();

        return NextResponse.json(results, { status: 200 });
    } catch (e) {
        console.error(e); // Log error details
        return NextResponse.json({ error: 'Unable to search the database', details: e.message }, { status: 500 }); // Internal Server Error
    }
}