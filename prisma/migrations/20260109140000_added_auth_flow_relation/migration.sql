INSERT INTO "_AuthFlowToUser"("B", "A")
SELECT u.id, f.id
FROM "User" u
JOIN "AuthFlow" f ON f.name = 'BASIC';