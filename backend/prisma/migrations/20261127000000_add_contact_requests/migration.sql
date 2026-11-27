CREATE TABLE `YEUCAULIENHE` (
    `maYeuCau` INTEGER NOT NULL AUTO_INCREMENT,
    `maTinDang` INTEGER NOT NULL,
    `maNguoiGui` INTEGER NOT NULL,
    `tenLienHe` VARCHAR(100) NOT NULL,
    `soDienThoaiLienHe` VARCHAR(15) NOT NULL,
    `loiNhan` VARCHAR(500) NULL,
    `trangThai` ENUM('CHO_LIEN_HE', 'DA_LIEN_HE') NOT NULL DEFAULT 'CHO_LIEN_HE',
    `ngayGui` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `ngayLienHe` DATETIME(0) NULL,
    `danhDauDangCho` TINYINT GENERATED ALWAYS AS (CASE WHEN `trangThai` = 'CHO_LIEN_HE' THEN 1 ELSE NULL END) STORED,
    PRIMARY KEY (`maYeuCau`),
    UNIQUE INDEX `uq_lienhe_tin_nguoi_dangcho` (`maTinDang`, `maNguoiGui`, `danhDauDangCho`),
    INDEX `YEUCAULIENHE_maTinDang_trangThai_ngayGui_idx` (`maTinDang`, `trangThai`, `ngayGui`),
    INDEX `YEUCAULIENHE_maNguoiGui_idx` (`maNguoiGui`),
    CONSTRAINT `YEUCAULIENHE_maTinDang_fkey` FOREIGN KEY (`maTinDang`) REFERENCES `TINDANG` (`maTinDang`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `YEUCAULIENHE_maNguoiGui_fkey` FOREIGN KEY (`maNguoiGui`) REFERENCES `NGUOIDUNG` (`maNguoiDung`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
