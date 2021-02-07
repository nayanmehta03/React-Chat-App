import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/storage";

var firebaseConfig = {
  apiKey: "AIzaSyAZwoCvvrTR7BI-lHziHwrhnQxpUNBrUJI",
  authDomain: "react-chat-app-nyx.firebaseapp.com",
  databaseURL: "https://react-chat-app-nyx.firebaseio.com",
  projectId: "react-chat-app-nyx",
  storageBucket: "react-chat-app-nyx.appspot.com",
  messagingSenderId: "162192184646",
  appId: "1:162192184646:web:cdff44c5f51242106d0147",
  measurementId: "G-MPFWVY37R6",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
export default firebase;
