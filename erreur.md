# Se connecter au MySQL dans le conteneur
docker exec -it kes_carburant_mysql mysql -u kes_user -pkes_password


npx prisma migrate dev --name init
Loaded Prisma config from prisma.config.ts.

Prisma schema loaded from prisma/schema.prisma.
Datasource "db": MySQL database "kes_carburant" at "localhost:3306"

Error: P3014

Prisma Migrate could not create the shadow database. Please make sure the database user has permission to create databases. Read more about the shadow database (and workarounds) at https://pris.ly/d/migrate-shadow

Original error: Error code: P1010

User was denied access on the database `prisma_migrate_shadow_db_1417e50d-3e6d-4d7f-aad9-43a78ab337d2`


L'erreur P3014 indique que l'utilisateur MySQL kes_user n'a pas les droits nécessaires pour créer une base de données (la shadow database dont Prisma a besoin pour les migrations).

Solution rapide : Donner les droits à l'utilisateur
1. Se connecter en root à MySQL
bash
docker exec -it kes_carburant_mysql mysql -u root -prootpassword
2. Donner les droits à kes_user
sql
-- Donner tous les droits sur toutes les bases
GRANT ALL PRIVILEGES ON *.* TO 'kes_user'@'%' WITH GRANT OPTION;

-- Ou au minimum ces droits spécifiques
GRANT CREATE, ALTER, DROP, REFERENCES ON *.* TO 'kes_user'@'%';

-- Appliquer les changements
FLUSH PRIVILEGES;

-- Vérifier les droits
SHOW GRANTS FOR 'kes_user'@'%';
3. Quitter MySQL
sql
EXIT;
4. Réessayer la migration
bash
npx prisma migrate dev --name init



-- Version avec mot de passe déjà hashé (admin123)
INSERT INTO utilisateurs (nom, prenom, email, mot_de_passe, role_id, telephone, actif, created_at, updated_at)
VALUES (
  'ADMIN',
  'Super',
  'admin@kescarburant.com',
  '$2b$10$.vKc7eXZhEMl4ch.GFGjOu.Ho3GYb.y.E/ZXcRokwBvg2UB28ks4K',  -- hash de admin123
  1,
  '0102030405',
  1,
  NOW(),
  NOW()
);