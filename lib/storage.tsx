import { db } from '../firebase/config';
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import L from 'leaflet'

export interface TaskResult {
  taskId: number
  polygons?: string // For polygon type
  popups?: string // Changed to string for popup type
  type: 'polygon' | 'popup'
}

interface Session {
  id: string
  createdAt: string
  results: TaskResult[]
}

// Helper function to convert polygons to string
function polygonsToString(polygons: L.LatLngExpression[][]): string {
  return JSON.stringify(polygons);
}

// Helper function to convert string back to polygons
function stringToPolygons(str: string): L.LatLngExpression[][] {
  return JSON.parse(str);
}

// Helper function to convert popups to string
function popupsToString(popups: Array<{ position: L.LatLngExpression, content: string }>): string {
  return JSON.stringify(popups.map(popup => ({
    position: [popup.position.lat, popup.position.lng],
    content: popup.content
  })));
}

// Helper function to convert string back to popups
function stringToPopups(str: string): Array<{ position: L.LatLngExpression, content: string }> {
  return JSON.parse(str).map((popup: any) => ({
    position: L.latLng(popup.position[0], popup.position[1]),
    content: popup.content
  }));
}

export async function saveTaskResult(
  sessionId: string,
  taskId: number,
  data: L.LatLngExpression[][] | Array<{ position: L.LatLngExpression, content: string }>,
  type: 'polygon' | 'popup'
) {
  const sessionsRef = collection(db, 'sessions');
  const q = query(sessionsRef, where('id', '==', sessionId));
  const querySnapshot = await getDocs(q);

  const result: TaskResult = {
    taskId,
    type,
    ...(type === 'polygon' 
      ? { polygons: polygonsToString(data as L.LatLngExpression[][]) } 
      : { popups: popupsToString(data as Array<{ position: L.LatLngExpression, content: string }>) })
  };

  if (querySnapshot.empty) {
    // Create new session
    await addDoc(sessionsRef, {
      id: sessionId,
      createdAt: new Date().toISOString(),
      results: [result]
    });
  } else {
    // Update existing session
    const sessionDoc = querySnapshot.docs[0];
    const currentResults = sessionDoc.data().results || [];
    const updatedResults = currentResults.filter((r: TaskResult) => r.taskId !== taskId);
    updatedResults.push(result);

    await updateDoc(sessionDoc.ref, { results: updatedResults });
  }
}

export async function getTaskResults(sessionId: string, taskId: number): Promise<TaskResult | null> {
  const sessionsRef = collection(db, 'sessions');
  const q = query(sessionsRef, where('id', '==', sessionId));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const sessionDoc = querySnapshot.docs[0];
    const results = sessionDoc.data().results || [];
    const result = results.find((r: TaskResult) => r.taskId === taskId);
    if (result) {
      if (result.type === 'polygon' && typeof result.polygons === 'string') {
        result.polygons = stringToPolygons(result.polygons);
      } else if (result.type === 'popup' && typeof result.popups === 'string') {
        result.popups = stringToPopups(result.popups);
      }
    }
    return result || null;
  }

  return null;
}

export async function getAllSessions(): Promise<Session[]> {
  const sessionsRef = collection(db, 'sessions');
  const querySnapshot = await getDocs(sessionsRef);
  return querySnapshot.docs.map(doc => {
    const data = doc.data() as Session;
    data.results = data.results.map(result => {
      if (result.type === 'polygon' && typeof result.polygons === 'string') {
        return {
          ...result,
          polygons: stringToPolygons(result.polygons)
        };
      } else if (result.type === 'popup' && typeof result.popups === 'string') {
        return {
          ...result,
          popups: stringToPopups(result.popups)
        };
      }
      return result;
    });
    return {
      ...data,
      createdAt: data.createdAt || new Date().toISOString()
    };
  });
}

export async function deleteSession(sessionId: string) {
  const sessionsRef = collection(db, 'sessions');
  const q = query(sessionsRef, where('id', '==', sessionId));
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const sessionDoc = querySnapshot.docs[0];
    await deleteDoc(sessionDoc.ref);
  }
}
