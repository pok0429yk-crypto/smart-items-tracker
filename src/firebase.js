import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDyhd3AGt6c-I3IsZLynZ6n71ym8Ob3y_Y",
  authDomain: "smart-item-tracker-d4a3a.firebaseapp.com",
  projectId: "smart-item-tracker-d4a3a",
  storageBucket: "smart-item-tracker-d4a3a.appspot.com",
  messagingSenderId: "96186402960",
  appId: "1:96186402960:web:e17e6eb738ad9398323015"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);