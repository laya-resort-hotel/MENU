export const firebaseConfig = {
  apiKey: "PASTE_HERE",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every(v => typeof v === "string" && v.trim() !== "");
}
