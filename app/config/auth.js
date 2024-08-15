import { getAuth, GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail as firebaseSendPasswordResetEmail } from 'firebase/auth';
import { firestore } from 'app/config/firebase'; // Adjust the path to your Firebase config
import { doc, setDoc } from 'firebase/firestore';

const auth = getAuth();

// Sign in with Google
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Optionally, save user info in Firestore
    await setDoc(doc(firestore, 'users', user.uid), {
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error signing in with Google: ', error);
  }
};

// Continue as a guest
export const continueAsGuest = () => {
  console.log('Continuing as guest');
  // Implement any necessary logic for guest access
};

// Login with email and password
export const loginWithEmailAndPassword = async (email, password) => {
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    console.error('Error logging in with email and password: ', error);
  }
};

// Register a new user with email and password
export const registerWithEmailAndPassword = async (name, email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Optionally, save user info in Firestore
    await setDoc(doc(firestore, 'users', user.uid), {
      name,
      email,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error('Error registering new user: ', error);
  }
};

// Logout the current user
export const logout = async () => {
  try {
    await signOut(auth);
    console.log("User signed out successfully.");
  } catch (error) {
    console.error("Error signing out: ", error);
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (email) => {
  try {
    await firebaseSendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email: ', error);
  }
};
