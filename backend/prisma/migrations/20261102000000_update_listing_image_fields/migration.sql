-- Preserve existing image URLs; legacy images may not have a Cloudinary public_id.
ALTER TABLE `HINHANHTINDANG`
    CHANGE COLUMN `duongDanAnh` `hinhAnhUrl` VARCHAR(500) NOT NULL,
    ADD COLUMN `hinhAnhId` VARCHAR(255) NULL;
