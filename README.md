# Drug Pricing Web App (GitHub Pages + Google Sheet DB)

โปรเจกต์นี้ประกอบด้วย:
- Google Sheet = Database (Schema ใหม่)
- Google Apps Script = REST API
- React (Vite + TS + Ant Design) = Web UI
- Deploy บน GitHub Pages ผ่าน GitHub Actions

---

## 0) เตรียมไฟล์ Import
ใช้ไฟล์ `import_items.csv` เพื่อนำเข้าข้อมูลตั้งต้นเข้า Google Sheet (schema ใหม่)

---

## 1) Setup Google Sheet (Schema ใหม่)
1. สร้าง Google Spreadsheet ใหม่ 1 ไฟล์
2. สร้าง Sheet 2 อัน:
   - `items`
   - `config`
3. ใน sheet `items`:
   - Paste headers ให้ตรงตาม `GOOGLE_SHEET_SCHEMA.md`
   - ตั้งคอลัมน์ `item_code` ให้เป็น **Plain text**
4. Import `import_items.csv` ลงใน sheet `items`
5. ใน sheet `config` สร้างข้อมูล (2 คอลัมน์ key | value) อย่างน้อย:
   - `skg_discount_pct` | `20`
   - `min_margin_pct_warning` | `0`
   - `default_ipd_factor` | `1.6`
   - `default_foreigner_uplift_pct` | `30`

> ✅ หมายเหตุ: ถ้าคุณลืมสร้าง sheet/headers/config — Apps Script จะตรวจและสร้างให้เองเมื่อถูกเรียกครั้งแรก (ต้องตั้ง SHEET_ID ให้ถูก)

---

## 2) Setup Apps Script API (สำคัญมาก)
### 2.1 สร้าง Apps Script
1. เปิด Google Sheet ที่สร้างไว้
2. Extensions → Apps Script
3. สร้างไฟล์ `Code.gs` และวางโค้ดจาก `apps-script/Code.gs`

### 2.2 ตั้ง Script Properties
Apps Script → Project Settings → Script properties:
- `SHEET_ID` = Spreadsheet ID (ดูจาก URL: `/d/<SHEET_ID>/edit`)
- `API_KEY` = ตั้งเป็น key ยาว ๆ (เก็บไว้ใช้ในเว็บ)

### 2.3 Deploy เป็น Web App
1. Deploy → New deployment → Web app
2. ตั้งค่า:
   - Execute as: **Me**
   - Who has access: **Anyone** (หรือ Anyone with link)
3. Deploy แล้ว Copy URL (เช่น `https://script.google.com/macros/s/XXXXX/exec`)

### 2.4 ทดสอบ API (ง่ายสุด)
เปิด URL:
`<WEB_APP_URL>?action=config&apiKey=<API_KEY>`
ควรได้ JSON config กลับมา

---

## 3) Setup React Web (Local)
### 3.1 ตั้งค่า env
1. ไปที่โฟลเดอร์ `web`
2. `cp .env.example .env.local`
3. แก้ค่า:
- `VITE_API_URL` = Web app URL
- `VITE_API_KEY` = API_KEY
- `VITE_BASE_PATH` = `/repo-name/` (ถ้าจะ deploy pages)

### 3.2 Run
```bash
cd web
npm install
npm run dev
```

---

## 4) Deploy ไป GitHub Pages (Step-by-step)
### 4.1 สร้าง GitHub repo
1. สร้าง repo ใหม่ (เช่น `drug-pricing-webapp`)
2. push โค้ดทั้งหมดขึ้น branch `main`

### 4.2 เปิด GitHub Pages ผ่าน Actions
1. ไปที่ GitHub → Repo → Settings → Pages
2. Source = **GitHub Actions**

### 4.3 ตั้ง Secrets (จำเป็น)
Repo → Settings → Secrets and variables → Actions → New repository secret:
- `VITE_API_URL` = Web app URL (Apps Script)
- `VITE_API_KEY` = API_KEY

### 4.4 Deploy
- push เข้า `main` → GitHub Actions จะ build และ deploy อัตโนมัติ
- URL จะเป็น:
  `https://<username>.github.io/<repo-name>/`

---

## 5) Features ที่เพิ่มแล้วในเวอร์ชันนี้
### 5.1 Add Item Modal มี Default Factors
- `ipd_factor` (IPD/OPD)
- `foreigner_uplift_pct` (% เพิ่ม foreigner)

### 5.2 Pricing Panel มี Factors Drawer
- ปรับ `ipd_factor` และ `foreigner_uplift_pct` ต่อ item ได้
- กด “บันทึกราคา” แล้วระบบจะบันทึก:
  - ราคาที่คำนวณได้
  - พร้อม factor (ipd_factor / foreigner_uplift_pct) ลง Google Sheet

---

## 6) หมายเหตุด้านความปลอดภัย
- หากต้องการ restrict ผู้ใช้จริงจัง (login) จะต้องเพิ่มระบบ auth (Google Identity / OAuth)
- เวอร์ชันนี้ใช้ API_KEY แบบง่าย เหมาะกับ internal use

## 7) Audit Trail (Updated By)
- ในหน้าเว็บมีช่อง `Updated By` (ชื่อผู้ใช้งาน)
- ต้องกรอกก่อน: เพิ่มรายการ / บันทึกราคา
- ค่านี้จะถูกส่งไป API และบันทึกลงคอลัมน์ `updated_by` พร้อม `updated_at`


## UI Updates (v4)
- Add Item Modal มีช่อง Updated By ในหน้ากรอกข้อมูล
- Dropdown (searchable) สำหรับ DosageForm / Major Class / Sub Class ใช้ค่าที่มีอยู่ในระบบ
- Search จะ filter อัตโนมัติเมื่อพิมพ์ (ไม่ต้องกดปุ่มค้นหา)
