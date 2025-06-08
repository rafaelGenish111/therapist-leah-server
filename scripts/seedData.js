const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Article = require('../models/Articles');
const HealthDeclaration = require('../models/HealthDeclaration');
const GalleryImage = require('../models/GalleryImage');
require('dotenv').config();

const seedData = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/leah-genish-clinic');
        console.log('✅ Connected to MongoDB');

        // Check for --clear flag
        if (process.argv.includes('--clear')) {
            console.log('🗑️  Clearing existing data...');
            await Promise.all([
                User.deleteMany({}),
                Article.deleteMany({}),
                HealthDeclaration.deleteMany({}),
                GalleryImage.deleteMany({})
            ]);
            console.log('✅ Data cleared');
            return;
        }

        // Create admin user
        const existingAdmin = await User.findOne({ username: 'admin' });
        let adminUser;
        
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin123456', 10);
            adminUser = new User({
                username: 'admin',
                password: hashedPassword,
                role: 'admin'
            });
            await adminUser.save();
            console.log('✅ Admin user created');
        } else {
            adminUser = existingAdmin;
            console.log('ℹ️  Admin user already exists');
        }

        // Create therapist user
        const existingTherapist = await User.findOne({ username: 'leah' });
        let therapistUser;
        
        if (!existingTherapist) {
            const hashedPassword = await bcrypt.hash('leah123456', 10);
            therapistUser = new User({
                username: 'leah',
                password: hashedPassword,
                role: 'therapist'
            });
            await therapistUser.save();
            console.log('✅ Therapist user created');
        } else {
            therapistUser = existingTherapist;
            console.log('ℹ️  Therapist user already exists');
        }

        // Create sample articles
        const sampleArticles = [
            {
                title: 'היתרונות של עיסוי שוודי',
                content: `עיסוי שוודי הוא אחד מסוגי העיסוי הפופולריים ביותר בעולם, והסיבה לכך ברורה - היתרונות הבריאותיים שלו רבים ומגוונים.

טכניקת העיסוי השוודי מתמקדת בתנועות ארוכות וחלקות, לחיצות עדינות ותנועות סיבוביות שמטרתן להפחית מתח, לשפר את זרימת הדם ולהביא להרפיה כללית של הגוף.

היתרונות העיקריים:
- הפחתת מתח ולחץ נפשי
- שיפור זרימת הדם
- הרפיית שרירים תפוסים
- שיפור איכות השינה
- הגברת גמישות הגוף

העיסוי מתאים לכל הגילאים ובמיוחד לאנשים הסובלים ממתח יומיומי, כאבי גב או בעיות שינה.`,
                author: adminUser._id,
                isPublished: true,
                tags: ['עיסוי שוודי', 'הרפיה', 'בריאות'],
                views: 45
            },
            {
                title: 'כיצד להכין את הגוף לעיסוי טיפולי',
                content: `הכנה נכונה לעיסוי טיפולי יכולה להגביר משמעותית את היעילות של הטיפול ולהביא לתוצאות טובות יותר.

שלבי ההכנה:

לפני הטיפול:
- שתו הרבה מים 24 שעות לפני הטיפול
- הימנעו מאלכוהול ומאכלים כבדים
- התקלחו לפני הגעה לטיפול
- הגיעו רגועים ובזמן

במהלך הטיפול:
- תקשרו עם המטפלת על רמת הלחץ
- נשמו עמוק ובאופן מודע
- הרפו והניחו למטפלת לעבוד

אחרי הטיפול:
- שתו הרבה מים
- הימנעו מפעילות אינטנסיבית
- תנו לגוף להמשיך ולהירגע

זכרו - העיסוי הוא תהליך שיתופי בינכם למטפלת, וההכנה הנכונה חיונית להצלחתו.`,
                author: therapistUser._id,
                isPublished: true,
                tags: ['הכנה לטיפול', 'עצות', 'בריאות'],
                views: 32
            },
            {
                title: 'עיסוי ספורטיבי - מה חשוב לדעת',
                content: `עיסוי ספורטיבי הוא ענף מתמחה בעיסוי המיועד לספורטאים ולאנשים פעילים גופנית. המטרה היא לשפר את הביצועים, למנוע פציעות ולהאיץ את התאוששות השרירים.

מתי מומלץ עיסוי ספורטיבי?
- לפני תחרות או אימון אינטנסיבי
- אחרי פעילות גופנית מאומצת
- במהלך תקופת אימונים קשה
- לטיפול בפציעות ספורט קלות

סוגי עיסוי ספורטיבי:
1. עיסוי לפני פעילות - להכנת השרירים
2. עיסוי אחרי פעילות - להאצת התאוששות
3. עיסוי שיקומי - לטיפול בפציעות

הטכניקות כוללות לחיצות עמוקות, מתיחות ותנועות ממוקדות על קבוצות שרירים ספציפיות.`,
                author: adminUser._id,
                isPublished: false,
                tags: ['עיסוי ספורטיבי', 'ספורט', 'שיקום'],
                views: 18
            }
        ];

        for (const articleData of sampleArticles) {
            const existingArticle = await Article.findOne({ title: articleData.title });
            if (!existingArticle) {
                const article = new Article(articleData);
                await article.save();
                console.log(`✅ Article created: ${articleData.title}`);
            }
        }

        // Create sample health declarations
        const sampleDeclarations = [
            {
                fullName: 'יוסי כהן',
                idNumber: '123456789',
                phoneNumber: '050-1234567',
                healthConditions: {
                    skinDiseases: false,
                    heartDiseases: false,
                    diabetes: false,
                    bloodPressure: true,
                    spineProblems: true,
                    fracturesOrSprains: false,
                    fluFeverInflammation: false,
                    epilepsy: false,
                    surgeries: {
                        hasSurgeries: false,
                        details: ''
                    },
                    chronicMedications: true,
                    pregnancy: false,
                    otherMedicalIssues: {
                        hasOtherIssues: false,
                        details: ''
                    }
                },
                declarationConfirmed: true,
                signature: 'יוסי כהן',
                ipAddress: '127.0.0.1'
            },
            {
                fullName: 'מרים לוי',
                idNumber: '987654321',
                phoneNumber: '052-9876543',
                healthConditions: {
                    skinDiseases: false,
                    heartDiseases: false,
                    diabetes: false,
                    bloodPressure: false,
                    spineProblems: false,
                    fracturesOrSprains: true,
                    fluFeverInflammation: false,
                    epilepsy: false,
                    surgeries: {
                        hasSurgeries: true,
                        details: 'ניתוח בברך ב-2019'
                    },
                    chronicMedications: false,
                    pregnancy: false,
                    otherMedicalIssues: {
                        hasOtherIssues: false,
                        details: ''
                    }
                },
                declarationConfirmed: true,
                signature: 'מרים לוי',
                ipAddress: '127.0.0.1'
            }
        ];

        for (const declarationData of sampleDeclarations) {
            const existingDeclaration = await HealthDeclaration.findOne({ 
                idNumber: declarationData.idNumber 
            });
            if (!existingDeclaration) {
                const declaration = new HealthDeclaration(declarationData);
                await declaration.save();
                console.log(`✅ Health declaration created: ${declarationData.fullName}`);
            }
        }

        console.log('\n🎉 Sample data seeded successfully!');
        console.log('\n👤 Login credentials:');
        console.log('Admin - username: admin, password: admin123456');
        console.log('Therapist - username: leah, password: leah123456');

    } catch (error) {
        console.error('❌ Error seeding data:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('✅ Disconnected from MongoDB');
        process.exit(0);
    }
};

seedData();