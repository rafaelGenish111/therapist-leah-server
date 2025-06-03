# Leah Genish Clinic - Backend API

מערכת ניהול קליניקה עבור ליאה גניש - צד השרת

## תכונות

- 🔐 אימות משתמשים (JWT)
- 📝 ניהול מאמרים עם תמונות
- 🖼️ גלריית תמונות
- 📋 הצהרות בריאות
- 👥 ניהול משתמשים ותפקידים
- 📊 סטטיסטיקות ודוחות

## דרישות מערכת

- Node.js 16.0.0 ומעלה
- MongoDB 4.4 ומעלה
- npm או yarn

## התקנה

1. **שכפול הפרויקט**
```bash
git clone <repository-url>
cd leah-genish-clinic-backend
```

2. **התקנת תלויות**
```bash
npm install
```

3. **הגדרת משתני סביבה**
```bash
cp .env.example .env
```
ערוך את קובץ `.env` בהתאם לסביבה שלך.

4. **יצירת תיקיית uploads**
```bash
mkdir uploads
```

5. **הפעלת השרת**
```bash
# סביבת פיתוח
npm run dev

# סביבת ייצור
npm start
```

## מבנה הפרויקט

```
├── config/
│   └── database.js          # הגדרות בסיס נתונים
├── middleware/
│   ├── auth.js             # middleware אימות
│   └── upload.js           # middleware העלאת קבצים
├── models/
│   ├── Articles.js         # מודל מאמרים
│   ├── GalleryImage.js     # מודל תמונות גלריה
│   ├── HealthDeclaration.js # מודל הצהרות בריאות
│   └── User.js             # מודל משתמשים
├── routes/
│   ├── articles.js         # נתיבי מאמרים
│   ├── auth.js             # נתיבי אימות
│   ├── gallery.js          # נתיבי גלריה
│   └── healthDeclarations.js # נתיבי הצהרות בריאות
├── uploads/                # תיקיית קבצים
├── index.js               # קובץ ראשי
├── package.json
└── README.md
```

## API Endpoints

### אימות (Authentication)
- `POST /api/auth/register` - רישום משתמש חדש
- `POST /api/auth/login` - התחברות
- `GET /api/auth/me` - פרטי המשתמש הנוכחי
- `PUT /api/auth/change-password` - שינוי סיסמה

### מאמרים (Articles)
- `GET /api/articles` - קבלת כל המאמרים הפורסמו
- `GET /api/articles/:id` - קבלת מאמר ספציפי
- `POST /api/articles` - יצירת מאמר חדש (מוגן)
- `PUT /api/articles/:id` - עדכון מאמר (מוגן)
- `DELETE /api/articles/:id` - מחיקת מאמר (מוגן)
- `GET /api/articles/admin/all` - כל המאמרים לאדמין (מוגן)
- `GET /api/articles/stats/summary` - סטטיסטיקות מאמרים (מוגן)

### גלריה (Gallery)
- `GET /api/gallery` - קבלת תמונות גלריה
- `GET /api/gallery/:id` - קבלת תמונה ספציפית
- `POST /api/gallery` - העלאת תמונה חדשה (מוגן)
- `PUT /api/gallery/:id` - עדכון פרטי תמונה (מוגן)
- `DELETE /api/gallery/:id` - מחיקת תמונה (מוגן)
- `GET /api/gallery/admin/all` - כל התמונות לאדמין (מוגן)
- `POST /api/gallery/bulk` - פעולות קבוצתיות (מוגן)

### הצהרות בריאות (Health Declarations)
- `POST /api/health-declarations` - שליחת הצהרה
- `GET /api/health-declarations` - קבלת כל ההצהרות (מוגן)
- `GET /api/health-declarations/:id` - קבלת הצהרה ספציפית (מוגן)
- `DELETE /api/health-declarations/:id` - מחיקת הצהרה (מוגן)
- `GET /api/health-declarations/stats/summary` - סטטיסטיקות (מוגן)

## משתני סביבה

| משתנה | תיאור | ברירת מחדל |
|-------|--------|-------------|
| `PORT` | פורט השרת | 5000 |
| `MONGODB_URI` | כתובת MongoDB | mongodb://localhost:27017/leah-genish-clinic |
| `JWT_SECRET` | מפתח JWT | חובה להגדיר! |
| `NODE_ENV` | סביבת הפעלה | development |
| `CORS_ORIGIN` | מקור CORS מותר | http://localhost:3000 |

## אבטחה

- 🔐 אימות JWT
- 🛡️ Hash סיסמאות עם bcrypt
- 🚫 הגבלת גודל קבצים
- 🔍 ולידציה של קלטים
- 🔒 הגנה על נתיבים רגישים

## פיתוח

```bash
# הפעלה עם nodemon (ריענון אוטומטי)
npm run dev

# בדיקת שגיאות
npm run lint

# הפעלת בדיקות
npm test
```

## Deploy

1. הגדר משתני סביבה בשרת
2. התקן תלויות: `npm install --production`
3. הפעל: `npm start`

## תרומה

1. צור fork של הפרויקט
2. צור branch חדש: `git checkout -b feature/amazing-feature`
3. בצע commit: `git commit -m 'Add amazing feature'`
4. דחף לbranch: `git push origin feature/amazing-feature`
5. פתח Pull Request

## רישיון

הפרויקט מופץ תחת רישיון ISC.