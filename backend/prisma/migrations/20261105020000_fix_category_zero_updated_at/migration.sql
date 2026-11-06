-- Repair zero dates that cannot be decoded by Prisma's MariaDB adapter.
UPDATE `LOAIBATDONGSAN`
SET `updatedAt` = `createdAt`
WHERE CAST(`updatedAt` AS CHAR) = '0000-00-00 00:00:00';
