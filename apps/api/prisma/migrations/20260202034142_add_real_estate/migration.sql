-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Portfolio" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "objetivo" TEXT,
    "monedaBase" TEXT NOT NULL DEFAULT 'USD',
    "nivelRiesgo" TEXT NOT NULL DEFAULT 'medio',
    "modoSocial" BOOLEAN NOT NULL DEFAULT false,
    "esPrincipal" BOOLEAN NOT NULL DEFAULT false,
    "admiteBienesRaices" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Portfolio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Portfolio" ("createdAt", "descripcion", "esPrincipal", "id", "modoSocial", "monedaBase", "nivelRiesgo", "nombre", "objetivo", "updatedAt", "userId") SELECT "createdAt", "descripcion", "esPrincipal", "id", "modoSocial", "monedaBase", "nivelRiesgo", "nombre", "objetivo", "updatedAt", "userId" FROM "Portfolio";
DROP TABLE "Portfolio";
ALTER TABLE "new_Portfolio" RENAME TO "Portfolio";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
