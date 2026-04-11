# The Taste Digital Menu Suite (GitHub Ready)

โปรเจกต์นี้เป็นเว็บแอปแบบ Static พร้อมอัปขึ้น GitHub Pages ได้ทันที โดยไม่ต้อง build และไม่จำเป็นต้องเปิดผ่าน VS Code

## หน้าหลักในระบบ
- `index.html` หน้า portal
- `guest.html` เมนูลูกค้า 3 ภาษา
- `staff.html` หน้าพนักงานสั่งอาหารและส่งขึ้นบอร์ด
- `board.html` บอร์ด Hostess / Cashier
- `admin.html` หน้า Admin CMS

## Demo Login
- Staff: `staff` / `staff123`
- Hostess: `hostess` / `hostess123`
- Admin: `admin` / `admin123`

## จุดสำคัญ
- ใช้ Local Demo Storage ในเบราว์เซอร์
- ใช้งานได้ทันทีหลังอัปขึ้น GitHub Pages
- ไม่ต้องติดตั้ง npm
- ไม่ต้องรัน build
- เหมาะสำหรับ demo, mockup และเสนอ flow ก่อนต่อ Firebase จริง

## วิธีอัปขึ้น GitHub แบบไม่ใช้ VS Code
1. สร้าง repository ใหม่บน GitHub
2. กด `Add file` > `Upload files`
3. อัปโหลดไฟล์ทั้งหมดจาก ZIP นี้
4. กด `Commit changes`
5. ไปที่ `Settings` > `Pages`
6. ใน `Build and deployment` เลือก
   - Source = `Deploy from a branch`
   - Branch = `main` / root
7. Save
8. รอ GitHub Pages สร้างลิงก์

## หมายเหตุสำคัญ
เวอร์ชันนี้เป็น **GitHub Pages Local Demo Mode**
- ถ้าเปิดหลายเครื่องพร้อมกัน ข้อมูลจะไม่ sync ข้ามเครื่อง
- ถ้าต้องการ real-time จริงหลายอุปกรณ์ ต้องต่อ Firebase ภายหลัง
- โครงสร้างหน้าจอและ data flow ในชุดนี้สามารถใช้ต่อ Firebase ได้เลยในรอบถัดไป

## การรีเซ็ตข้อมูลเดโม
เข้า `admin.html` แล้วกดปุ่ม `Reset Demo Data`
