import { MongoClient } from 'mongodb';
import { NextResponse } from 'next/server';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const uri = process.env.MONGODB_URI;

let cachedClient = null;

async function connectToDatabase() {
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  if (cachedClient) {
    return cachedClient;
  }

  const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  cachedClient = await client.connect();
  return cachedClient;
}

const validateSignup = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('confirm-password').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  }),
];

export async function POST(request) {
  const data = await request.json();
  const req = { body: data };

  await Promise.all(validateSignup.map(validation => validation.run(req)));

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return NextResponse.json({ errors: errors.array() }, { status: 400 });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('credintial');
    const collection = db.collection('secure');

    const existingUser = await collection.findOne({ email: data.email });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);

    const user = await collection.insertOne({
      email: data.email,
      password: hashedPassword,
    });

    const tokenData = { id: user.insertedId };
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return NextResponse.json({ error: 'JWT_SECRET environment variable is missing' }, { status: 500 });
    }

    const authtoken = jwt.sign(tokenData, jwtSecret, { expiresIn: '1h' });

    return NextResponse.json({ message: 'Document inserted', authtoken, ok: true }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Unable to insert document', details: e.message }, { status: 500 });
  }
}