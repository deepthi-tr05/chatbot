import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User
} from "firebase/auth";
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  getDoc,
  serverTimestamp
} from "firebase/firestore";
import firebaseConfig from "@/firebase-applet-config.json";

// Detect if Firebase has been configured in the cloud
export const isFirebaseConfigured = !!(firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "");

let app;
let db: any = null;
let auth: any = null;
let googleProvider: any = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: "select_account" });
    
    // Validate connection dynamically as mandated
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (error: any) {
        if (error instanceof Error && error.message.includes("the client is offline")) {
          console.warn("Firebase client reports as offline. Syncing locally until online.");
        }
      }
    };
    testConnection();
  } catch (error) {
    console.error("Error building live Firebase SDK client instances:", error);
  }
}

export { db, auth, googleProvider };

// Standardized Firestore Error Logging and Diagnostic System
export enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuth = auth;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentAuth?.currentUser?.uid,
      email: currentAuth?.currentUser?.email,
      emailVerified: currentAuth?.currentUser?.emailVerified,
      isAnonymous: currentAuth?.currentUser?.isAnonymous,
      tenantId: currentAuth?.currentUser?.tenantId,
    },
    operationType,
    path
  };
  console.error("Firestore Policy Intervention Engine: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
