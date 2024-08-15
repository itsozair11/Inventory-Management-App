// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDzMwddefrl2utI8fmzfz5pbMNoB0_jTeM",
  authDomain: "headstarter-proj-2-pantrytrack.firebaseapp.com",
  projectId: "headstarter-proj-2-pantrytrack",
  storageBucket: "headstarter-proj-2-pantrytrack.appspot.com",
  messagingSenderId: "706173561796",
  appId: "1:706173561796:web:c459cdcb88869c216e9291",
  measurementId: "G-14ENEZN13L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);
export { firestore};
