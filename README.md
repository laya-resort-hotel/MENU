# The Taste Digital Menu Suite — Firebase Real-time Version

เวอร์ชันนี้เป็นเว็บแอป **พร้อมอัปขึ้น GitHub Pages ได้เลย** และเชื่อม **Firebase จริง**
โดยมี 4 หน้า:
- `guest.html` ลูกค้าดูเมนู 3 ภาษา
- `staff.html` พนักงานสมัคร/ล็อกอินด้วยรหัสพนักงานและส่ง order
- `board.html` Hostess / Cashier รับ order real-time
- `admin.html` Seed เมนู, แก้เมนู, จัดการ user profile

## ก่อนอัป GitHub
ไฟล์ `assets/firebase-config.js` ถูกใส่ค่า Firebase ให้แล้วจากโปรเจกต์ `menu-5541a`
จึงสามารถอัปขึ้น GitHub Pages ได้เลย

ค่าที่ถูกใส่ไว้:
```js
export const firebaseConfig = {
  apiKey: "AIzaSyAr0zHOGYT9mMV0_loNPrafbKsqDKmJ_Hs",
  authDomain: "menu-5541a.firebaseapp.com",
  projectId: "menu-5541a",
  storageBucket: "menu-5541a.firebasestorage.app",
  messagingSenderId: "153306806680",
  appId: "1:153306806680:web:77e94ddc513cc7a6df93ed",
  measurementId: "G-R2NN1YGP3H"
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
4. เปิด `admin.html` แล้วกดแท็บ **Register**
5. สมัครด้วย **Employee ID + Password**
6. ถ้ายังไม่มี admin ในระบบ หน้าเว็บจะขึ้นปุ่ม **Make This Account Admin**
7. กดปุ่มนั้นเพื่อ bootstrap admin คนแรก
8. กดปุ่ม **Seed Firestore Menu** เพื่อใส่เมนูเริ่มต้นลง Firestore

## การสร้าง user ใช้งานจริง
ระบบนี้ใช้ 2 ส่วน:
- Firebase Authentication = บัญชีล็อกอิน (ระบบสร้าง email ภายในให้อัตโนมัติจาก Employee ID)
- Firestore `users` collection = role / profile

### ขั้นตอน
1. ให้พนักงานเข้า `staff.html`, `board.html` หรือ `admin.html`
2. กดแท็บ **Register**
3. ใส่ Employee ID, Display Name และ Password
4. ระบบจะสร้างบัญชี Firebase Auth ให้โดยอัตโนมัติในรูปแบบ `employeeid@employee.menu-5541a.local`
5. พร้อมสร้าง `users/{uid}` role เริ่มต้นเป็น `staff`
6. ถ้าต้องการสิทธิ์มากกว่า staff ให้ admin เข้า `admin.html` แล้วแก้ role ภายหลัง

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


## สิ่งที่ต้องทำเพิ่มใน Firebase Console
1. เปิด **Authentication > Sign-in method > Email/Password**
2. สร้าง **Firestore Database** แบบ Native mode
3. นำไฟล์ `firebase/firestore.rules` ไปวางใน Firestore Rules แล้วกด Publish
4. เปิด `admin.html` แล้วสมัครบัญชีแรกด้วย Employee ID จากหน้า Register จากนั้นกด Make This Account Admin
