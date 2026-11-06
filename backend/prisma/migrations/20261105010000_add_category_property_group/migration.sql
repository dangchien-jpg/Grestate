ALTER TABLE `LOAIBATDONGSAN`
    ADD COLUMN `nhomBatDongSan` ENUM('NHA', 'DAT') NULL;

UPDATE `LOAIBATDONGSAN`
SET `nhomBatDongSan` = CASE
    WHEN TRIM(`tenLoai`) IN ('Đất', 'Đất nền dự án')
        OR TRIM(REPLACE(REPLACE(`tenLoai`, CHAR(13), ''), CHAR(10), '')) = 'Đất nền dự án'
    THEN 'DAT'
    ELSE 'NHA'
END;

ALTER TABLE `LOAIBATDONGSAN`
    MODIFY COLUMN `nhomBatDongSan` ENUM('NHA', 'DAT') NOT NULL;
