ALTER TABLE `YEUCAUXACTHUCTINDANG`
    DROP CONSTRAINT `ck_xacthuc_quyetdinh`,
    ADD CONSTRAINT `ck_xacthuc_quyetdinh` CHECK (
        (`trangThai` = 'CHO_XU_LY' AND `maNguoiXuLy` IS NULL AND `ngayXuLy` IS NULL AND `lyDoXuLy` IS NULL)
        OR (
            `maNguoiXuLy` IS NOT NULL AND `ngayXuLy` IS NOT NULL
            AND (
                `trangThai` = 'DA_XAC_THUC'
                OR (`trangThai` = 'TU_CHOI' AND `lyDoXuLy` IS NOT NULL AND CHAR_LENGTH(TRIM(`lyDoXuLy`)) > 0)
            )
        )
    );