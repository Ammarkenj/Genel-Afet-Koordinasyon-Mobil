import 'package:sqflite/sqflite.dart';
import '../database_helper.dart';

class ShelterDao {
  final dbHelper = DatabaseHelper.instance;

  // إدخال قائمة من الملاجئ دفعة واحدة (عند المزامنة مع السيرفر)
  Future<void> insertShelters(List> shelters) async {
    final db = await dbHelper.database;
    Batch batch = db.batch();
    for (var shelter in shelters) {
      batch.insert('Shelters', shelter, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    await batch.commit(noResult: true);
  }

  // جلب كل الملاجئ ليعرضها الفرونت إند على الخريطة المحلية
  Future<List>> getAllShelters() async {
    final db = await dbHelper.database;
    return await db.query('Shelters');
  }
}