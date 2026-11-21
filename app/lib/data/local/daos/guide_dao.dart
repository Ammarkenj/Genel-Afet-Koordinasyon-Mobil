import 'package:sqflite/sqflite.dart';
import '../database_helper.dart';

class GuideDao {
  final dbHelper = DatabaseHelper.instance;

  // إدخال أدلة الطوارئ دفعة واحدة
  Future<void> insertGuides(List> guides) async {
    final db = await dbHelper.database;
    Batch batch = db.batch();
    for (var guide in guides) {
      batch.insert('EmergencyGuides', guide, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  // جلب كل الأدلة ليعرضها الفرونت إند في واجهة التعليمات
  Future<List>> getAllGuides() async {
    final db = await dbHelper.database;
    return await db.query('EmergencyGuides');
  }
}