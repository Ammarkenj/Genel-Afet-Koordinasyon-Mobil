import 'package:sqflite/sqflite.dart';

import '../../../domain/models/models.dart';
import '../database_helper.dart';

class GuideDao {
  GuideDao({DatabaseHelper? dbHelper})
    : _dbHelper = dbHelper ?? DatabaseHelper.instance;

  final DatabaseHelper _dbHelper;

  Future<void> replaceAll(List<EmergencyGuide> guides) async {
    final db = await _dbHelper.database;
    await db.transaction((transaction) async {
      await transaction.delete('EmergencyGuides');
      final batch = transaction.batch();
      for (final guide in guides) {
        batch.insert(
          'EmergencyGuides',
          guide.toDatabase(),
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
      }
      await batch.commit(noResult: true);
    });
  }

  Future<List<EmergencyGuide>> getAllGuides() async {
    final db = await _dbHelper.database;
    final rows = await db.query(
      'EmergencyGuides',
      orderBy: 'category COLLATE NOCASE ASC, title COLLATE NOCASE ASC',
    );
    return rows.map(EmergencyGuide.fromDatabase).toList(growable: false);
  }
}
