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
      version: 2,
      onCreate: _createDB,
      onUpgrade: _upgradeDB,
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
        kind TEXT NOT NULL DEFAULT 'help',
        type TEXT,
        auto INTEGER NOT NULL DEFAULT 0,
        description TEXT,
        latitude REAL,
        longitude REAL,
        client_report_id TEXT NOT NULL UNIQUE,
        client_update_token TEXT NOT NULL,
        server_report_id TEXT,
        is_synced INTEGER NOT NULL DEFAULT 0,
        delivery_state TEXT NOT NULL DEFAULT 'queued',
        delivery_failure TEXT,
        can_undo INTEGER NOT NULL DEFAULT 1,
        details_revision INTEGER NOT NULL DEFAULT 0,
        synced_details_revision INTEGER NOT NULL DEFAULT 0,
        injured INTEGER,
        trapped INTEGER,
        people INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
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

  Future<void> _upgradeDB(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute(
        "ALTER TABLE Reports ADD COLUMN kind TEXT NOT NULL DEFAULT 'help'",
      );
      await db.execute(
        'ALTER TABLE Reports ADD COLUMN auto INTEGER NOT NULL DEFAULT 0',
      );
      await db.execute('ALTER TABLE Reports ADD COLUMN client_report_id TEXT');
      await db.execute(
        'ALTER TABLE Reports ADD COLUMN client_update_token TEXT',
      );
      await db.execute('ALTER TABLE Reports ADD COLUMN server_report_id TEXT');
      await db.execute(
        "ALTER TABLE Reports ADD COLUMN delivery_state TEXT NOT NULL DEFAULT 'queued'",
      );
      await db.execute('ALTER TABLE Reports ADD COLUMN delivery_failure TEXT');
      await db.execute(
        'ALTER TABLE Reports ADD COLUMN can_undo INTEGER NOT NULL DEFAULT 1',
      );
      await db.execute('''
        UPDATE Reports SET can_undo = 0 WHERE is_synced = 1
      ''');
      await db.execute(
        'ALTER TABLE Reports ADD COLUMN details_revision INTEGER NOT NULL DEFAULT 0',
      );
      await db.execute(
        'ALTER TABLE Reports ADD COLUMN synced_details_revision INTEGER NOT NULL DEFAULT 0',
      );
      await db.execute('ALTER TABLE Reports ADD COLUMN injured INTEGER');
      await db.execute('ALTER TABLE Reports ADD COLUMN trapped INTEGER');
      await db.execute(
        'ALTER TABLE Reports ADD COLUMN people INTEGER NOT NULL DEFAULT 1',
      );
      await db.execute('ALTER TABLE Reports ADD COLUMN occurred_at TEXT');
      await db.execute(
        "UPDATE Reports SET client_report_id = 'legacy-' || id WHERE client_report_id IS NULL",
      );
      await db.execute(
        'UPDATE Reports SET occurred_at = COALESCE(created_at, CURRENT_TIMESTAMP) WHERE occurred_at IS NULL',
      );
      await db.execute(
        'UPDATE Reports SET delivery_state = CASE WHEN is_synced = 1 THEN \'sent\' ELSE \'queued\' END',
      );
      await db.execute(
        'CREATE UNIQUE INDEX Reports_client_report_id_key ON Reports(client_report_id)',
      );
    }
  }
}
