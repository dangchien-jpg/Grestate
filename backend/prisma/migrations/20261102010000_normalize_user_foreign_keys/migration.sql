-- Rename columns without deleting existing user references.
ALTER TABLE `TINDANG`
    DROP FOREIGN KEY `TINDANG_maNguoiDang_fkey`,
    CHANGE COLUMN `maNguoiDang` `maNguoiDung` INTEGER NOT NULL,
    DROP INDEX `TINDANG_maNguoiDang_createdAt_idx`, ADD INDEX `TINDANG_maNguoiDung_createdAt_idx` (`maNguoiDung`, `createdAt`),
    ADD CONSTRAINT `TINDANG_maNguoiDung_fkey` FOREIGN KEY (`maNguoiDung`) REFERENCES `NGUOIDUNG`(`maNguoiDung`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `PHANANHTINDANG`
    DROP FOREIGN KEY `PHANANHTINDANG_maNguoiBaoCao_fkey`,
    CHANGE COLUMN `maNguoiBaoCao` `maNguoiDung` INTEGER NOT NULL,
    DROP INDEX `PHANANHTINDANG_maNguoiBaoCao_idx`, ADD INDEX `PHANANHTINDANG_maNguoiDung_idx` (`maNguoiDung`),
    ADD CONSTRAINT `PHANANHTINDANG_maNguoiDung_fkey` FOREIGN KEY (`maNguoiDung`) REFERENCES `NGUOIDUNG`(`maNguoiDung`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `THONGBAO`
    DROP FOREIGN KEY `THONGBAO_maNguoiNhan_fkey`,
    CHANGE COLUMN `maNguoiNhan` `maNguoiDung` INTEGER NOT NULL,
    DROP INDEX `THONGBAO_maNguoiNhan_daDoc_createdAt_idx`, ADD INDEX `THONGBAO_maNguoiDung_daDoc_createdAt_idx` (`maNguoiDung`, `daDoc`, `createdAt`),
    ADD CONSTRAINT `THONGBAO_maNguoiDung_fkey` FOREIGN KEY (`maNguoiDung`) REFERENCES `NGUOIDUNG`(`maNguoiDung`) ON DELETE CASCADE ON UPDATE CASCADE;