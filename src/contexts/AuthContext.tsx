/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Usuario } from '../types';
import { handleFirestoreError, OperationType } from '../firebaseService';

interface AuthContextType {
  user: FirebaseUser | null;
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, nombre: string, rol?: 'Administrador' | 'Empleado') => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateUserRoleInDb: (uid: string, nuevoRol: 'Administrador' | 'Empleado') => Promise<void>;
  loginAsDemo?: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync Auth State
  useEffect(() => {
    const isDemoLoggedIn = localStorage.getItem('lavadero_demo_logged_in') === 'true';
    if (isDemoLoggedIn) {
      const mockFirebaseUser = {
        uid: 'demo-admin-uid',
        email: 'romii.macariz@gmail.com',
        displayName: 'Romi Macariz (Demo)',
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'demo-token',
        getIdTokenResult: async () => ({ token: 'demo-token', signInProvider: 'password', claims: {}, authTime: '', expirationTime: '', issuedAtTime: '' }),
        reload: async () => {},
        toJSON: () => ({}),
      } as unknown as FirebaseUser;

      const mockUsuario: Usuario = {
        uid: 'demo-admin-uid',
        email: 'romii.macariz@gmail.com',
        nombre: 'Romi Macariz (Demo)',
        rol: 'Administrador'
      };

      setUser(mockFirebaseUser);
      setUsuario(mockUsuario);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // Fetch user profile from Firestore
          const userDocRef = doc(db, 'usuarios', firebaseUser.uid);
          let userDocSnap;
          try {
            userDocSnap = await getDoc(userDocRef);
          } catch (err) {
            handleFirestoreError(err, OperationType.GET, `usuarios/${firebaseUser.uid}`);
            throw err;
          }

          if (userDocSnap.exists()) {
            setUsuario(userDocSnap.data() as Usuario);
          } else {
            // Create user document if it does not exist
            const email = firebaseUser.email || '';
            const nombre = firebaseUser.displayName || email.split('@')[0];
            
            // Check if there are any other users in the system
            let usuariosSnap;
            try {
              usuariosSnap = await getDocs(collection(db, 'usuarios'));
            } catch (err) {
              handleFirestoreError(err, OperationType.LIST, 'usuarios');
              throw err;
            }
            const isFirstUser = usuariosSnap.empty;
            const isUserEmailAdmin = email.toLowerCase() === 'romii.macariz@gmail.com';
            
            const rol = (isFirstUser || isUserEmailAdmin) ? 'Administrador' : 'Empleado';
            
            const nuevoUsuario: Usuario = {
              uid: firebaseUser.uid,
              email,
              nombre,
              rol
            };

            try {
              await setDoc(userDocRef, nuevoUsuario);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `usuarios/${firebaseUser.uid}`);
              throw err;
            }
            setUsuario(nuevoUsuario);
          }
        } catch (error) {
          console.error('Error fetching/creating user profile in Firestore:', error);
          setUsuario(null);
        }
      } else {
        setUsuario(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signup = async (email: string, password: string, nombre: string, rol?: 'Administrador' | 'Empleado') => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update display name
      await updateProfile(firebaseUser, { displayName: nombre });

      // Determine role
      const isUserEmailAdmin = email.toLowerCase() === 'romii.macariz@gmail.com';
      const resolvedRol = rol || (isUserEmailAdmin ? 'Administrador' : 'Empleado');

      const nuevoUsuario: Usuario = {
        uid: firebaseUser.uid,
        email,
        nombre,
        rol: resolvedRol
      };

      // Save to Firestore
      try {
        await setDoc(doc(db, 'usuarios', firebaseUser.uid), nuevoUsuario);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `usuarios/${firebaseUser.uid}`);
        throw err;
      }
      setUsuario(nuevoUsuario);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('lavadero_demo_logged_in');
      await signOut(auth);
      setUser(null);
      setUsuario(null);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginAsDemo = async () => {
    setLoading(true);
    try {
      const mockFirebaseUser = {
        uid: 'demo-admin-uid',
        email: 'romii.macariz@gmail.com',
        displayName: 'Romi Macariz (Demo)',
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: '',
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => 'demo-token',
        getIdTokenResult: async () => ({ token: 'demo-token', signInProvider: 'password', claims: {}, authTime: '', expirationTime: '', issuedAtTime: '' }),
        reload: async () => {},
        toJSON: () => ({}),
      } as unknown as FirebaseUser;

      const mockUsuario: Usuario = {
        uid: 'demo-admin-uid',
        email: 'romii.macariz@gmail.com',
        nombre: 'Romi Macariz (Demo)',
        rol: 'Administrador'
      };

      localStorage.setItem('lavadero_demo_logged_in', 'true');
      setUser(mockFirebaseUser);
      setUsuario(mockUsuario);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRoleInDb = async (uid: string, nuevoRol: 'Administrador' | 'Empleado') => {
    try {
      // If demo mode, don't perform remote db updates for security or permission blocks
      if (localStorage.getItem('lavadero_demo_logged_in') === 'true') {
        if (usuario && usuario.uid === uid) {
          setUsuario(prev => prev ? { ...prev, rol: nuevoRol } : null);
        }
        return;
      }
      try {
        await setDoc(doc(db, 'usuarios', uid), { rol: nuevoRol }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `usuarios/${uid}`);
        throw err;
      }
      if (usuario && usuario.uid === uid) {
        setUsuario(prev => prev ? { ...prev, rol: nuevoRol } : null);
      }
    } catch (error) {
      console.error('Error updating user role in DB:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      usuario,
      loading,
      login,
      signup,
      logout,
      loginWithGoogle,
      updateUserRoleInDb,
      loginAsDemo
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
