import 'package:sqflite/sqflite.dart';
import '../database_helper.dart';

class ReportDao {
  final dbHelper = DatabaseHelper.instance;

  // إضافة بلاغ جديد (يُحفظ محلياً أولاً)
  Future<int> insertReport(Map<String, dynamic> report) async {
    final db = await dbHelper.database;
    report['is_synced'] = 0; // 0 تعني ينتظر الإنترنت
    return await db.insert(
      'Reports',
      report,
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // جلب البلاغات العالقة لرفعها للسحابة
  Future<List>> getUnsyncedReports() async {
    final db = await dbHelper.database;
    return await db.query(
      'Reports',
      where: 'is_synced = ?',
      whereArgs: [0],
    );
  }

  // تحديث حالة البلاغ بعد نجاح الرفع
  Future<int> markReportAsSynced(String id) async {
    final db = await dbHelper.database;
    return await db.update(
      'Reports',
      {'is_synced': 1},
      where: 'id = ?',
      whereArgs: [id],
    );
  }
}