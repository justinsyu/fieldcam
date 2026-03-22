import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

declare global {
  namespace Express {
    interface Request {
      uid?: string;
    }
  }
}

export async function firebaseAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const idToken = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    req.uid = decoded.uid;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
