import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: "AIzaSyDU2sOsS7J_uFZyKk-A0dvwxLh5RkOmqsM",
	authDomain: "mex-os-life.firebaseapp.com",
	projectId: "mex-os-life",
	storageBucket: "mex-os-life.firebasestorage.app",
	messagingSenderId: "79943861828",
	appId: "1:79943861828:web:16adba8452c9665f59de11",
	measurementId: "G-4VVL44BBRP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
