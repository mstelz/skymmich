# Changelog

## 0.1.0 - 2025-07-03

### Added
- **Database Migration**: Implemented a full migration from JSON file-based storage to a Drizzle ORM-backed database system.
- **Dual Database Support**: Configured the application to use SQLite for local development and PostgreSQL for production environments.
- **Database Schemas**: Created dedicated Drizzle schemas (`shared/sqlite-schema.ts`, `shared/pg-schema.ts`) for SQLite and PostgreSQL.
- **Data Migration Script**: Developed and executed `scripts/migrate-json-to-db.ts` to transfer existing data from `data/storage.json` to the new database.
- **Admin Settings & Notifications**: Added database tables and corresponding data access methods for `admin_settings` and `notifications`.

### Changed
- **Storage Layer**: Refactored `server/storage.ts` to use Drizzle ORM for all data operations, replacing direct file I/O.
- **JSON Field Handling**: Implemented logic in the storage layer to correctly serialize and deserialize JSON data (e.g., `tags`, `specifications`) when interacting with SQLite.

### Removed
- Old JSON storage file (`data/storage.json`).
- Unused `server/shared-storage.ts` file.
