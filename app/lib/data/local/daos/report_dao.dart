import 'package:sqflite/sqflite.dart';

import '../database_helper.dart';

class ReportDao {
  ReportDao({DatabaseHelper? dbHelper})
    : _dbHelper = dbHelper ?? DatabaseHelper.instance;

  final DatabaseHelper _dbHelper;

  Future<int> insertReport(Map<String, Object?> report) async {
    final db = await _dbHelper.database;
    return db.insert(
      'Reports',
      report,
      conflictAlgorithm: ConflictAlgorithm.abort,
    );
  }

  Future<List<Map<String, Object?>>> getReports() async {
    final db = await _dbHelper.database;
    return db.rawQuery(
      'SELECT rowid AS local_id, * FROM Reports ORDER BY rowid',
    );
  }

  Future<List<Map<String, Object?>>> getUnsyncedReports() async {
    final db = await _dbHelper.database;
    return db.rawQuery(
      'SELECT rowid AS local_id, * FROM Reports WHERE is_synced = 0 ORDER BY rowid',
    );
  }

  Future<int> updateReport(
    String clientReportId,
    Map<String, Object?> values,
  ) async {
    final db = await _dbHelper.database;
    return db.update(
      'Reports',
      values,
      where: 'client_report_id = ?',
      whereArgs: [clientReportId],
    );
  }

  Future<int> markReportAsSynced(
    String clientReportId, {
    required String serverReportId,
    required int syncedDetailsRevision,
  }) {
    return updateReport(clientReportId, {
      'is_synced': 1,
      'delivery_state': 'sent',
      'delivery_failure': null,
      'server_report_id': serverReportId,
      'synced_details_revision': syncedDetailsRevision,
    });
  }

  Future<int> markReportAsQueued(String clientReportId) {
    return updateReport(clientReportId, {
      'is_synced': 0,
      'delivery_state': 'queued',
    });
  }

  Future<int> deleteQueuedReport(String clientReportId) async {
    final db = await _dbHelper.database;
    return db.delete(
      'Reports',
      where: 'client_report_id = ? AND is_synced = 0',
      whereArgs: [clientReportId],
    );
  }
}
