-- 若曾执行过含 recipient_phone / address / partner_id / expected_date 的旧版 004，
-- 可任选执行本脚本删除多余列，使表结构与当前 ORM 一致（有数据时请先备份）。

ALTER TABLE payment_records DROP COLUMN IF EXISTS recipient_phone;
ALTER TABLE payment_records DROP COLUMN IF EXISTS address;
ALTER TABLE payment_records DROP COLUMN IF EXISTS partner_id;
ALTER TABLE payment_records DROP COLUMN IF EXISTS expected_date;
