-- Neon：检查 API 相关表是否存在、列是否齐全（在 SQL Editor 中执行）
-- 将结果与 backend/app/models/*.py 对照。

-- 1)表是否存在
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'reconciliation_records',
    'channel_records',
    'invoice_records',
    'payment_records',
    'exception_statuses',
    'bank_payment_records'
  )
ORDER BY table_name;

-- 2) 各表列清单（与 ordinal_position 顺序一致）
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'reconciliation_records'
ORDER BY ordinal_position;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'channel_records'
ORDER BY ordinal_position;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'invoice_records'
ORDER BY ordinal_position;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'payment_records'
ORDER BY ordinal_position;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'exception_statuses'
ORDER BY ordinal_position;

SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'bank_payment_records'
ORDER BY ordinal_position;
