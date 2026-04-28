-- MIGRATION SCRIPT: Sửa schema bảng flashcards cho phù hợp với code backend
-- Database: SQL Server (DB_Lab2)

USE DB_Lab2;
GO

-- 1. Thêm cột is_starred vào bảng flashcards (nếu chưa có)
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'flashcards' AND COLUMN_NAME = 'is_starred'
)
BEGIN
    ALTER TABLE flashcards ADD is_starred BIT DEFAULT 0;
    PRINT N'✅ Đã thêm cột is_starred vào bảng flashcards';
END
ELSE
    PRINT N'⏭️ Cột is_starred đã tồn tại';
GO

-- 2. Sửa cột difficulty từ tinyint sang VARCHAR(20)
--    Code backend sử dụng giá trị chuỗi: 'easy', 'medium', 'hard'
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'flashcards' AND COLUMN_NAME = 'difficulty' AND DATA_TYPE = 'tinyint'
)
BEGIN
    -- Xóa constraint DEFAULT cũ (nếu có) trước khi đổi kiểu
    DECLARE @ConstraintName NVARCHAR(200);
    SELECT @ConstraintName = dc.name
    FROM sys.default_constraints dc
    JOIN sys.columns c ON dc.parent_object_id = c.object_id AND dc.parent_column_id = c.column_id
    WHERE c.name = 'difficulty' AND dc.parent_object_id = OBJECT_ID('flashcards');
    
    IF @ConstraintName IS NOT NULL
    BEGIN
        EXEC('ALTER TABLE flashcards DROP CONSTRAINT ' + @ConstraintName);
        PRINT N'✅ Đã xóa constraint DEFAULT cũ của cột difficulty';
    END

    -- Đổi kiểu dữ liệu từ tinyint sang VARCHAR(20)
    ALTER TABLE flashcards ALTER COLUMN difficulty VARCHAR(20);
    PRINT N'✅ Đã đổi cột difficulty từ tinyint sang VARCHAR(20)';

    -- Chuyển đổi dữ liệu cũ (nếu có): 0->easy, 1->medium, 2->hard
    UPDATE flashcards SET difficulty = 'easy' WHERE difficulty = '0';
    UPDATE flashcards SET difficulty = 'medium' WHERE difficulty = '1' OR difficulty IS NULL;
    UPDATE flashcards SET difficulty = 'hard' WHERE difficulty = '2';
    PRINT N'✅ Đã chuyển đổi dữ liệu difficulty cũ sang dạng chuỗi';

    -- Thêm constraint DEFAULT mới
    ALTER TABLE flashcards ADD CONSTRAINT DF_flashcards_difficulty DEFAULT 'medium' FOR difficulty;
    PRINT N'✅ Đã thêm constraint DEFAULT mới cho cột difficulty';
END
ELSE
    PRINT N'⏭️ Cột difficulty đã ở dạng VARCHAR hoặc không tồn tại';
GO

-- 3. Tạo index trên cột is_starred để tối ưu query filter
IF NOT EXISTS (
    SELECT 1 FROM sys.indexes 
    WHERE name = 'IX_flashcards_is_starred' AND object_id = OBJECT_ID('flashcards')
)
BEGIN
    CREATE INDEX IX_flashcards_is_starred ON flashcards(is_starred);
    PRINT N'✅ Đã tạo index IX_flashcards_is_starred';
END
ELSE
    PRINT N'⏭️ Index IX_flashcards_is_starred đã tồn tại';
GO

-- 4. Kiểm tra kết quả
PRINT N'';
PRINT N'=== Cấu trúc bảng flashcards sau migration ===';
SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'flashcards'
ORDER BY ORDINAL_POSITION;
GO

PRINT N'🎉 Migration hoàn tất!';
