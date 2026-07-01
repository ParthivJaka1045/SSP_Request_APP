import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  normalizeRoles,
  getRolesFromUser,
  getPrimaryRole,
  resolveActiveRole,
  getUserWorkspace,
  ACTIVE_ROLE_STORAGE_KEY,
  SSP_ROLES,
} from '../lib/permissions';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

function loadActiveRole(userId) {
  try {
    const raw = sessionStorage.getItem(`${ACTIVE_ROLE_STORAGE_KEY}:${userId}`);
    return raw || null;
  } catch {
    return null;
  }
}

function saveActiveRole(userId, role) {
  sessionStorage.setItem(`${ACTIVE_ROLE_STORAGE_KEY}:${userId}`, role);
}

function normalizeUserRecord(userObj) {
  const roles = normalizeRoles(getRolesFromUser(userObj));
  const primaryRole = userObj.primaryRole && roles.includes(userObj.primaryRole)
    ? userObj.primaryRole
    : getPrimaryRole({ ...userObj, roles });
  return {
    ...userObj,
    roles,
    role: primaryRole,
    primaryRole,
  };
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [activeRole, setActiveRoleState] = useState(SSP_ROLES.member);
  const [loading, setLoading] = useState(true);

  const applyUser = useCallback((rawUser) => {
    const user = normalizeUserRecord(rawUser);
    const roles = user.roles;
    const stored = loadActiveRole(user.id);
    const active = resolveActiveRole(user, stored);
    setCurrentUser({ ...user, activeRole: active });
    setUserRoles(roles);
    setActiveRoleState(active);
    sessionStorage.setItem('ssp_user', JSON.stringify({ ...user, activeRole: active }));
    saveActiveRole(user.id, active);
    return user;
  }, []);

  useEffect(() => {
    const savedUser = sessionStorage.getItem('ssp_user');
    if (savedUser) {
      try {
        applyUser(JSON.parse(savedUser));
      } catch {
        sessionStorage.removeItem('ssp_user');
      }
    }
    setLoading(false);
  }, [applyUser]);

  const setActiveRole = useCallback(
    (role) => {
      if (!currentUser) return;
      const roles = getRolesFromUser(currentUser);
      if (!roles.includes(role)) return;
      setActiveRoleState(role);
      const next = { ...currentUser, activeRole: role };
      setCurrentUser(next);
      sessionStorage.setItem('ssp_user', JSON.stringify(next));
      saveActiveRole(currentUser.id, role);
    },
    [currentUser],
  );

  const login = async (email, password) => {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '').trim();
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', normalizedEmail), where('password', '==', normalizedPassword));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Invalid credentials');
    }

    const userData = querySnapshot.docs[0].data();
    const userObj = { id: querySnapshot.docs[0].id, ...userData };

    if (userObj.isActive === false) {
      throw new Error('User is inactive');
    }

    return applyUser(userObj);
  };

  const resetPassword = async (email, currentPassword, newPassword) => {
    if (!email || !currentPassword || !newPassword) {
      throw new Error('Please fill all fields');
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.trim().toLowerCase()), where('password', '==', currentPassword));
    const snap = await getDocs(q);
    if (snap.empty) {
      throw new Error('Invalid email or current password');
    }
    const userDoc = snap.docs[0];
    await updateDoc(doc(db, 'users', userDoc.id), { password: newPassword });
  };

  const verifyEmailForReset = async (email) => {
    if (!email?.trim()) throw new Error('Email is required.');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.trim().toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('No account found with this email.');
    const data = snap.docs[0].data();
    if (data.isActive === false) throw new Error('This account is inactive.');
    return { id: snap.docs[0].id, name: data.name, email: data.email };
  };

  const resetPasswordByEmail = async (email, newPassword) => {
    if (!email?.trim() || !newPassword) throw new Error('Please fill all fields.');
    const trimmed = newPassword.trim();
    if (trimmed.length < 6) throw new Error('Password must be at least 6 characters.');
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email.trim().toLowerCase()));
    const snap = await getDocs(q);
    if (snap.empty) throw new Error('Account not found.');
    await updateDoc(doc(db, 'users', snap.docs[0].id), {
      password: trimmed,
      passwordUpdatedAt: serverTimestamp(),
    });
  };

  const logout = () => {
    setCurrentUser(null);
    setUserRoles([]);
    setActiveRoleState(SSP_ROLES.member);
    sessionStorage.removeItem('ssp_user');
  };

  /** Role exists on account (union). */
  const hasRole = useCallback(
    (role) => Array.isArray(role)
      ? role.some((r) => userRoles.includes(r))
      : userRoles.includes(role),
    [userRoles],
  );

  const workspace = useMemo(
    () => getUserWorkspace(currentUser, activeRole),
    [currentUser, activeRole],
  );

  const value = {
    currentUser,
    userRoles,
    activeRole,
    workspace,
    hasRole,
    setActiveRole,
    login,
    resetPassword,
    verifyEmailForReset,
    resetPasswordByEmail,
    logout,
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
}
