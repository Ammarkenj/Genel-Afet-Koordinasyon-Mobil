import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';

class DatabaseHelper {
  // تطبيق نمط Singleton لضمان وجود نسخة واحدة فقط من قاعدة البيانات
  static final DatabaseHelper instance = DatabaseHelper._init();
  static Database? _database;

  DatabaseHelper._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('disaster_app.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
    );
  }

  // إنشاء الجداول محلياً (مطابقة للكيانات السحابية)
  Future _createDB(Database db, int version) async {
    // 1. جدول المستخدمين (الأساسي)
    await db.execute('''
      CREATE TABLE Users (
        id TEXT PRIMARY KEY,
        full_name TEXT,
        national_id TEXT,
        phone_number TEXT,
        blood_type TEXT
      )
    ''');

    // 2. جدول الملفات الطبية (مرتبط بالمستخدم)
    await db.execute('''
      CREATE TABLE MedicalProfiles (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        chronic_diseases TEXT,
        allergies TEXT,
        regular_medications TEXT,
        FOREIGN KEY (user_id) REFERENCES Users (id)
      )
    ''');

    // 3. جدول جهات اتصال الطوارئ
    await db.execute('''
      CREATE TABLE EmergencyContacts (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        contact_name TEXT,
        contact_phone TEXT,
        relationship TEXT,
        FOREIGN KEY (user_id) REFERENCES Users (id)
      )
    ''');

    // 4. جدول الملاجئ (ثابت، يُجلب من السحابة مرة واحدة)
    await db.execute('''
      CREATE TABLE Shelters (
        id TEXT PRIMARY KEY,
        name TEXT,
        category TEXT,
        capacity INTEGER,
        latitude REAL,
        longitude REAL,
        features TEXT
      )
    ''');

    // 5. جدول أدلة الطوارئ (ثابت، يُجلب من السحابة)
    await db.execute('''
      CREATE TABLE EmergencyGuides (
        id TEXT PRIMARY KEY,
        title TEXT,
        category TEXT,
        content TEXT
      )
    ''');

    // 6. جدول البلاغات (ديناميكي، يحتاج مزامنة)
    await db.execute('''
      CREATE TABLE Reports (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        type TEXT,
        description TEXT,
        latitude REAL,
        longitude REAL,
        is_synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES Users (id)
      )
    ''');

    // 7. جدول الاحتياجات (Needs) - ديناميكي، يحتاج مزامنة
    await db.execute('''
      CREATE TABLE Needs (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        category TEXT,
        urgency TEXT,
        description TEXT,
        latitude REAL,
        longitude REAL,
        is_synced INTEGER DEFAULT 0,
        created_at TEXT,
        FOREIGN KEY (user_id) REFERENCES Users (id)
      )
    ''');
  }
}