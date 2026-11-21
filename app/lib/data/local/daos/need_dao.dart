import 'package:sqflite/sqflite.dart';
import '../database_helper.dart';

class NeedDao {
  final dbHelper = DatabaseHelper.instance;

  // إضافة طلب احتياج جديد
  Future<int> insertNeed(Map<String, dynamic> need) async {
    final db = await dbHelper.database;
    need['is_synced'] = 0; 
    return await db.insert(
      'Needs',
      need,
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // جلب الاحتياجات التي تنتظر المزامنة
  Future<List>> getUnsyncedNeeds() async {
    final db = await dbHelper.database;
    return await db.query(
      'Needs',
      where: 'is_synced = ?',
      whereArgs: [0],
    );
  }

  // تحديث حالة الاحتياج
  Future<int> markNeedAsSynced(String id) async {
    final db = await dbHelper.database;
    return await db.update(
      'Needs',
      {'is_synced': 1},
      where: 'id = ?',
      whereArgs: [id],
    );
  }
}