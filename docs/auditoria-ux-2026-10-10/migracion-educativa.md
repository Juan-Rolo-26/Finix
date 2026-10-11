# Migración de la plataforma educativa

El esquema y los módulos educativos ya estaban en los cambios locales del titular. Faltaba la migración, por lo que publicarlos sin ella produciría errores de tablas inexistentes.

La diferencia se generó entre el schema publicado en adad44de y el schema actual, sin consultar ni modificar una base. La revisión comprobó: dos enums, siete tablas educativas, sus índices y diez relaciones. Solo se agregan constraints a tablas nuevas; User solo es referenciada, no se modifica. No contiene DROP, DELETE, TRUNCATE ni cambios de columnas existentes. No transforma usuarios, portfolios ni transacciones.

SQL y SHA256 se registran en el directorio de migraciones y reviewed-migrations.json. En el VPS se debe comprobar estado antes, guardar el respaldo verificado y aplicar con migrate deploy; nunca db push. La base no se restaura automáticamente sobre nuevas escrituras ante rollback de código.
