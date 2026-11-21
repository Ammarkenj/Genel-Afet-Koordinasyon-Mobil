import 'package:sqflite/sqflite.dart';

import '../../../domain/models/models.dart';
import '../database_helper.dart';

class ShelterDao {
  ShelterDao({DatabaseHelper? dbHelper})
    : _dbHelper = dbHelper ?? DatabaseHelper.instance;

  final DatabaseHelper _dbHelper;

  Future<void> replaceAll(List<Shelter> shelters) async {
    final db = await _dbHelper.database;
    await db.transaction((transaction) async {
      await transaction.delete('Shelters');
      final batch = transaction.batch();
      for (final shelter in shelters) {
        batch.insert(
          'Shelters',
          shelter.toDatabase(),
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
      }
      await batch.commit(noResult: true);
    });
  }

  Future<List<Shelter>> getAllShelters() async {
    final db = await _dbHelper.database;
    final rows = await db.query('Shelters', orderBy: 'name COLLATE NOCASE ASC');
    return rows.map(Shelter.fromDatabase).toList(growable: false);
  }
}
