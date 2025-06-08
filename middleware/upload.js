const multer = require('multer');
const path = require('path');
const fs = require('fs');

// יצירת תיקיית uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created uploads directory: ${uploadDir}`);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // יצירת שם קובץ ייחודי
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        const basename = path.basename(file.originalname, ext);
        
        // ניקוי שם הקובץ מתווים לא חוקיים
        const cleanBasename = basename.replace(/[^a-zA-Z0-9\u0590-\u05FF\s-_]/g, '');
        
        cb(null, `${cleanBasename}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    console.log('File upload attempt:', {
        fieldname: file.fieldname,
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
    });

    const allowedMimes = [
        'image/jpeg', 
        'image/jpg', 
        'image/png', 
        'image/gif', 
        'image/webp'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        const error = new Error(`סוג קובץ לא נתמך: ${file.mimetype}. אנא העלה תמונה בפורמט JPEG, JPG, PNG, GIF או WebP`);
        error.code = 'INVALID_FILE_TYPE';
        cb(error, false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1,
        fields: 10
    }
});

const handleUploadError = (error, req, res, next) => {
    console.error('Upload error:', error);

    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({ 
                    message: 'הקובץ גדול מדי. הגודל המקסימלי הוא 5MB',
                    code: 'FILE_TOO_LARGE'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({ 
                    message: 'יותר מדי קבצים. ניתן להעלות קובץ אחד בכל פעם',
                    code: 'TOO_MANY_FILES'
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({ 
                    message: 'שדה קובץ לא צפוי. השתמש בשדה "image"',
                    code: 'UNEXPECTED_FILE'
                });
            case 'LIMIT_PART_COUNT':
                return res.status(400).json({ 
                    message: 'יותר מדי שדות בטופס',
                    code: 'TOO_MANY_PARTS'
                });
            default:
                return res.status(400).json({ 
                    message: `שגיאת העלאה: ${error.message}`,
                    code: error.code
                });
        }
    } else if (error && error.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ 
            message: error.message,
            code: 'INVALID_FILE_TYPE'
        });
    } else if (error) {
        return res.status(400).json({ 
            message: error.message || 'שגיאה בהעלאת הקובץ',
            code: 'UPLOAD_ERROR'
        });
    }
    
    next();
};

// פונקציה לבדיקת תקינות תיקיית uploads
const checkUploadsDirectory = () => {
    try {
        const stats = fs.statSync(uploadDir);
        const isWritable = fs.constants.W_OK;
        fs.accessSync(uploadDir, isWritable);
        
        console.log('Uploads directory check:', {
            path: uploadDir,
            exists: stats.isDirectory(),
            writable: true
        });
        
        return true;
    } catch (error) {
        console.error('Uploads directory error:', error.message);
        return false;
    }
};

// בדיקה ראשונית
checkUploadsDirectory();

module.exports = {
    upload,
    handleUploadError,
    uploadDir,
    checkUploadsDirectory
};