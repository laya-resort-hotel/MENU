export const firebaseConfig = {
  apiKey: "AIzaSyAr0zHOGYT9mMV0_loNPrafbKsqDKmJ_Hs",
  authDomain: "menu-5541a.firebaseapp.com",
  projectId: "menu-5541a",
  storageBucket: "menu-5541a.firebasestorage.app",
  messagingSenderId: "153306806680",
  appId: "1:153306806680:web:77e94ddc513cc7a6df93ed",
  measurementId: "G-R2NN1YGP3H"
};

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig)
    .filter(v => typeof v === "string")
    .some(v => v.trim() !== "")
    && [
      firebaseConfig.apiKey,
      firebaseConfig.authDomain,
      firebaseConfig.projectId,
      firebaseConfig.storageBucket,
      firebaseConfig.messagingSenderId,
      firebaseConfig.appId
    ].every(v => typeof v === "string" && v.trim() !== "");
}
