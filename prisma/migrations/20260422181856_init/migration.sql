-- CreateTable
CREATE TABLE `utilisateurs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NOT NULL,
    `prenom` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `mot_de_passe` VARCHAR(191) NOT NULL,
    `role_id` INTEGER NOT NULL,
    `telephone` VARCHAR(191) NULL,
    `actif` BOOLEAN NOT NULL DEFAULT true,
    `derniere_connexion` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_utilisateurs_email`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` ENUM('ADMIN', 'USER') NOT NULL,
    `description` VARCHAR(191) NULL,

    UNIQUE INDEX `uk_roles_nom`(`nom`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `immatriculation` VARCHAR(191) NOT NULL,
    `marque` VARCHAR(191) NOT NULL,
    `modele` VARCHAR(191) NOT NULL,
    `annee` INTEGER NOT NULL,
    `type_carburant` ENUM('ESSENCE', 'DIESEL', 'GASOIL', 'ELECTRIQUE', 'HYBRIDE') NOT NULL,
    `consommation_theorique` DOUBLE NULL,
    `capacite_reservoir` DOUBLE NULL,
    `photo_url` VARCHAR(191) NULL,
    `statut` ENUM('ACTIF', 'ARCHIVE') NOT NULL DEFAULT 'ACTIF',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `uk_vehicules_immatriculation`(`immatriculation`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicules_utilisateurs` (
    `vehicule_id` INTEGER NOT NULL,
    `utilisateur_id` INTEGER NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`vehicule_id`, `utilisateur_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lieux` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nom` VARCHAR(191) NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `adresse_complete` VARCHAR(191) NULL,
    `ville` VARCHAR(191) NULL,
    `code_postal` VARCHAR(191) NULL,
    `pays` VARCHAR(191) NULL DEFAULT 'France',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recharges` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicule_id` INTEGER NOT NULL,
    `utilisateur_id` INTEGER NOT NULL,
    `lieu_id` INTEGER NULL,
    `date_heure` DATETIME(3) NOT NULL,
    `quantite_litres` DOUBLE NOT NULL,
    `montant` DOUBLE NOT NULL,
    `prix_unitaire` DOUBLE NOT NULL,
    `km_actuel` DOUBLE NOT NULL,
    `km_precedent` DOUBLE NULL,
    `distance_parcourue` DOUBLE NULL,
    `conso_calculee` DOUBLE NULL,
    `ecart_constructeur` DOUBLE NULL,
    `cout_au_km` DOUBLE NULL,
    `plein_complet` BOOLEAN NOT NULL DEFAULT true,
    `notes` VARCHAR(191) NULL,
    `statut_sync` ENUM('SYNCHRONISE', 'EN_ATTENTE') NOT NULL DEFAULT 'SYNCHRONISE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `recharges_vehicule_id_idx`(`vehicule_id`),
    INDEX `recharges_utilisateur_id_idx`(`utilisateur_id`),
    INDEX `recharges_date_heure_idx`(`date_heure`),
    INDEX `recharges_statut_sync_idx`(`statut_sync`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `medias` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recharge_id` INTEGER NOT NULL,
    `type` ENUM('VEHICULE', 'TABLEAU_BORD', 'POMPE') NOT NULL,
    `url` VARCHAR(191) NOT NULL,
    `bucket` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `taille` INTEGER NULL,
    `mime_type` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `medias_recharge_id_idx`(`recharge_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `file_sync` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `utilisateur_id` INTEGER NOT NULL,
    `payload` JSON NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `entity_id` INTEGER NULL,
    `retry_count` INTEGER NOT NULL DEFAULT 0,
    `error` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `synchronise_le` DATETIME(3) NULL,

    INDEX `file_sync_utilisateur_id_idx`(`utilisateur_id`),
    INDEX `file_sync_synchronise_le_idx`(`synchronise_le`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `utilisateurs` ADD CONSTRAINT `utilisateurs_role_id_fkey` FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicules_utilisateurs` ADD CONSTRAINT `vehicules_utilisateurs_vehicule_id_fkey` FOREIGN KEY (`vehicule_id`) REFERENCES `vehicules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vehicules_utilisateurs` ADD CONSTRAINT `vehicules_utilisateurs_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recharges` ADD CONSTRAINT `recharges_vehicule_id_fkey` FOREIGN KEY (`vehicule_id`) REFERENCES `vehicules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recharges` ADD CONSTRAINT `recharges_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `recharges` ADD CONSTRAINT `recharges_lieu_id_fkey` FOREIGN KEY (`lieu_id`) REFERENCES `lieux`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `medias` ADD CONSTRAINT `medias_recharge_id_fkey` FOREIGN KEY (`recharge_id`) REFERENCES `recharges`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_sync` ADD CONSTRAINT `file_sync_utilisateur_id_fkey` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateurs`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
