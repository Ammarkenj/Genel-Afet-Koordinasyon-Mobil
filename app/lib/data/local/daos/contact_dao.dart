import 'package:sqflite/sqflite.dart';
import '../database_helper.dart';

class ContactDao {
  final dbHelper = DatabaseHelper.instance;

  // دالة لإضافة جهة اتصال طوارئ جديدة محلياً
  Future<int> insertContact(Map<String, dynamic> contact) async {
    final db = await dbHelper.database;
    // التأكد من عدم رفعها للسحابة فوراً إذا كان الإنترنت مقطوعاً
    contact['is_synced'] = 0; 
    
    return await db.insert(
      'EmergencyContacts',
      contact,
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // دالة لجلب جهات الاتصال الخاصة بالمستخدم لعرضها في الواجهة
  Future<List>> getContactsByUserId(String userId) async {
    final db = await dbHelper.database;
    return await db.query(
      'EmergencyContacts',
      where: 'user_id = ?',
      whereArgs: [userId],
    );
  }

  // دالة لحذف جهة اتصال
  Future<int> deleteContact(String contactId) async {
    final db = await dbHelper.database;
    return await db.delete(
      'EmergencyContacts',
      where: 'id = ?',
      whereArgs: [contactId],
    );
  }
}