import 'package:sqflite/sqflite.dart';
import '../database_helper.dart';

class MedicalProfileDao {
  final dbHelper = DatabaseHelper.instance;

  // حفظ أو تحديث الملف الطبي
  Future<int> insertMedicalProfile(Map<String, dynamic> profile) async {
    final db = await dbHelper.database;
    return await db.insert(
      'MedicalProfiles',
      profile,
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // جلب الملف الطبي بناءً على معرّف المستخدم
  Future?> getMedicalProfile(String userId) async {
    final db = await dbHelper.database;
    final List> profiles = await db.query(
      'MedicalProfiles',
      where: 'user_id = ?',
      whereArgs: [userId],
      limit: 1,
    );
    if (profiles.isNotEmpty) return profiles.first;
    return null;
  }
}