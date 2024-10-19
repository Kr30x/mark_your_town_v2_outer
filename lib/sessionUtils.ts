import { db } from '../firebase/config';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';

export async function getOrCreateSessionId(): Promise<string> {
  let sessionId = localStorage.getItem('sessionId');
  
  if (!sessionId) {
    sessionId = generateUniqueId();
    localStorage.setItem('sessionId', sessionId);
    
    // Create a new session in Firebase
    const sessionsRef = collection(db, 'sessions');
    await addDoc(sessionsRef, {
      id: sessionId,
      createdAt: new Date().toISOString(),
      results: []
    });
  }
  
  return sessionId;
}

function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
