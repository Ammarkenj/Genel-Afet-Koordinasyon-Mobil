import 'package:sqflite/sqflite.dart';
import '../database_helper.dart';

class UserDao {
  final dbHelper = DatabaseHelper.instance;

  // حفظ بيانات المستخدم محلياً بعد تسجيل الدخول الأول
  Future<int> insertUser(Map<String, dynamic> user) async {
    final db = await dbHelper.database;
    return await db.insert(
      'Users',
      user,
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // جلب بيانات المستخدم الحالي
  Future?> getCurrentUser() async {
    final db = await dbHelper.database;
    final List> users = await db.query('Users', limit: 1);
    if (users.isNotEmpty) {
      return users.first;
    }
    return null;
  }

  // تحديث بيانات المستخدم (مثل تغيير رقم الهاتف)
  Future<int> updateUser(Map<String, dynamic> user) async {
    final db = await dbHelper.database;
    return await db.update(
      'Users',
      user,
      where: 'id = ?',
      whereArgs: [user['id']],
    );
  }
}