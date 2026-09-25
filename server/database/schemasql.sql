IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'ChessDB')
BEGIN
    CREATE DATABASE ChessDB;
END
GO
USE ChessDB;
GO

-- 1. Bảng lưu tài khoản người chơi
CREATE TABLE Users (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) NOT NULL UNIQUE,
    Password NVARCHAR(255) NOT NULL,
    Elo INT DEFAULT 1200,
    Wins INT DEFAULT 0,
    Losses INT DEFAULT 0,
    Draws INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO

-- 2. Bảng lưu lịch sử các ván đấu
CREATE TABLE Games (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    UserId INT FOREIGN KEY REFERENCES Users(Id),
    OpponentName NVARCHAR(100),
    OpponentElo INT,
    Score FLOAT NOT NULL,
    Delta INT DEFAULT 0,
    NewElo INT NOT NULL,
    GameMode NVARCHAR(20),
    Moves NVARCHAR(MAX),
    CreatedAt DATETIME DEFAULT GETDATE()
);
GO