-- SQL untuk membuat user latansa dengan password latansa12
-- Password akan di-hash menggunakan bcrypt

-- Pastikan user belum ada
INSERT INTO Users (id, username, password, fullName, role, isActive, createdAt, updatedAt)
SELECT UUID(), 'latansa', '$2a$10$Xt9Qs.CgWTEQX.Qlh8KQR.iiK1gH9.WQy0PRQQEc7mBF5vAU2ZGXS', 'Latansa User', 'admin', 1, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM Users WHERE username = 'latansa');

-- Password hash di atas adalah untuk 'latansa12'