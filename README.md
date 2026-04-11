# The Taste Digital Menu Suite — Firebase Real-time Version

เวอร์ชันนี้เป็นเว็บแอป **พร้อมอัปขึ้น GitHub Pages ได้เลย** และเชื่อม **Firebase จริง**
โดยมี 4 หน้า:
- `guest.html` ลูกค้าดูเมนู 3 ภาษา
- `staff.html` พนักงานล็อกอินและส่ง order
- `board.html` Hostess / Cashier รับ order real-time
- `admin.html` Seed เมนู, แก้เมนู, จัดการ user profile

## ก่อนอัป GitHub
แก้ไฟล์ `assets/firebase-config.js`

วางค่าจาก Firebase Project ของคุณ:
```js
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "YOUR_APP_ID"
};
```

## Firebase ที่ต้องเปิด
1. **Authentication**
   - Sign-in method
   - เปิด **Email/Password**

2. **Firestore Database**
   - สร้าง Firestore แบบ Native mode

## วิธีใช้งานครั้งแรก
1. อัปไฟล์ทั้งหมดขึ้น GitHub repo
2. เปิด GitHub Pages
3. เปิด `admin.html`
4. ล็อกอินด้วย Email/Password ของบัญชีที่คุณสร้างไว้ใน Firebase Auth
5. ถ้ายังไม่มี admin ในระบบ หน้าเว็บจะขึ้นปุ่ม **Make This Account Admin**
6. กดปุ่มนั้นเพื่อ bootstrap admin คนแรก
7. กดปุ่ม **Seed Firestore Menu** เพื่อใส่เมนูเริ่มต้นลง Firestore

## การสร้าง user ใช้งานจริง
ระบบนี้ใช้ 2 ส่วน:
- Firebase Authentication = บัญชีล็อกอิน
- Firestore `users` collection = role / profile

### ขั้นตอน
1. ไปที่ Firebase Console > Authentication
2. สร้าง user แบบ Email/Password
3. เอา UID ของคนนั้นจาก Firebase Console
4. เข้า `admin.html`
5. กด **Add User Profile**
6. ใส่ UID, email, display name, role

### role ที่ใช้ได้
- `staff`
- `hostess`
- `cashier`
- `manager`
- `admin`

## คอลเลกชันที่ระบบใช้
- `menu_categories`
- `menu_items`
- `orders`
- `users`
- `app_settings`

## Firestore Rules
คัดลอกจากไฟล์ `firebase/firestore.rules` ไปวางใน Firebase Console

## หมายเหตุ
- รูปเมนูเริ่มต้นอยู่ใน `assets/menu/`
- ถ้าจะเพิ่มเมนูใหม่ สามารถใช้ `Image URL` เป็น path ใน repo หรือเป็น URL ภายนอกได้
- เวอร์ชันนี้ไม่ต้อง build และไม่ต้องใช้ VS Code
