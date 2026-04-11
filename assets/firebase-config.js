export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every(v => typeof v === "string" && v.trim() !== "");
}
