// src/app/api/versions/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Pool } from 'pg';

// Initialize Pool - Ensure DATABASE_URL is in your .env file
const dbPool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// 1. Strict Validation Schema (Prevents malicious OOM attacks)
const SnapshotSchema = z.object({
  documentId: z.string().uuid(),
  snapshotName: z.string().min(1).max(100),
  stateVector: z.string(), // Base64 encoded binary
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { documentId, snapshotName, stateVector } = SnapshotSchema.parse(body);
    const userId = '123e4567-e89b-12d3-a456-426614174000'; 
    const binaryData = Buffer.from(stateVector, 'base64');

    // Force public schema
    await dbPool.query(
      `INSERT INTO public.document_versions (document_id, created_by, state_vector, snapshot_name) 
       VALUES ($1, $2, $3, $4)`,
      [documentId, userId, binaryData, snapshotName]
    );

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Snapshot POST Error:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 400 });
  }
}


// export async function GET(req: Request) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const documentId = searchParams.get('documentId');

//     // Debugging line - check your terminal logs to see what's happening
//     console.log('Querying versions for:', documentId);

//     // Force public schema
//     const result = await dbPool.query(
//       `SELECT id, snapshot_name, created_at 
//        FROM public.document_versions 
//        WHERE document_id = $1 
//        ORDER BY created_at DESC`,
//       [documentId]
//     );

//     return NextResponse.json(result.rows);
//   } catch (error) {
//     console.error('Snapshot GET Error details:', error);
//     return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
//   }
// }

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const documentId = searchParams.get('documentId');

    // Add 'encode(state_vector, 'base64')' to the SQL query
    const result = await dbPool.query(
      `SELECT id, snapshot_name, created_at, encode(state_vector, 'base64') as state_vector 
       FROM public.document_versions 
       WHERE document_id = $1 
       ORDER BY created_at DESC`,
      [documentId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Snapshot GET Error details:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}