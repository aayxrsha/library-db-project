USE library;

SET @col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='library' AND TABLE_NAME='Member' AND COLUMN_NAME='Password_Hash'
);
SET @stmt := IF(@col_exists = 0,
  'ALTER TABLE Member ADD COLUMN Password_Hash VARCHAR(255) NOT NULL DEFAULT ''$2a$10$g58loebfErqd3n.QjwjfZ.O0QKOT90qtmXxNs7Lxdtr4pkSAGThoW''',
  'SELECT 1'
);
PREPARE s1 FROM @stmt;
EXECUTE s1;
DEALLOCATE PREPARE s1;

SET @email_col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='library' AND TABLE_NAME='Member' AND COLUMN_NAME='Email'
);
SET @stmtEmail := IF(@email_col_exists = 0,
  'ALTER TABLE Member ADD COLUMN Email VARCHAR(150) NULL',
  'SELECT 1'
);
PREPARE sEmail FROM @stmtEmail;
EXECUTE sEmail;
DEALLOCATE PREPARE sEmail;

SET @email_idx_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA='library' AND TABLE_NAME='Member' AND INDEX_NAME='uq_member_email'
);
SET @stmtEmailIdx := IF(@email_idx_exists = 0,
  'CREATE UNIQUE INDEX uq_member_email ON Member(Email)',
  'SELECT 1'
);
PREPARE sEmailIdx FROM @stmtEmailIdx;
EXECUTE sEmailIdx;
DEALLOCATE PREPARE sEmailIdx;

CREATE TABLE IF NOT EXISTS Issue_Request (
  Request_Id INT AUTO_INCREMENT PRIMARY KEY,
  Member_Id INT NOT NULL,
  Book_Id INT NOT NULL,
  Request_Date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  Processed_By INT DEFAULT NULL,
  Processed_At DATETIME DEFAULT NULL,
  Due_Date DATE DEFAULT NULL,
  Note VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (Member_Id) REFERENCES Member(Member_Id) ON DELETE CASCADE,
  FOREIGN KEY (Book_Id) REFERENCES Book(Book_Id) ON DELETE CASCADE,
  FOREIGN KEY (Processed_By) REFERENCES Employee(Employee_ID) ON DELETE SET NULL
);

SET @idx1 := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA='library' AND TABLE_NAME='Issue_Request' AND INDEX_NAME='idx_request_status'
);
SET @stmt2 := IF(@idx1 = 0, 'CREATE INDEX idx_request_status ON Issue_Request(Status)', 'SELECT 1');
PREPARE s2 FROM @stmt2;
EXECUTE s2;
DEALLOCATE PREPARE s2;

SET @idx2 := (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA='library' AND TABLE_NAME='Issue_Request' AND INDEX_NAME='idx_request_member'
);
SET @stmt3 := IF(@idx2 = 0, 'CREATE INDEX idx_request_member ON Issue_Request(Member_Id)', 'SELECT 1');
PREPARE s3 FROM @stmt3;
EXECUTE s3;
DEALLOCATE PREPARE s3;

SET @copies_col_exists := (
  SELECT COUNT(*)
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA='library' AND TABLE_NAME='Book' AND COLUMN_NAME='Number_Of_Copies'
);
SET @stmt4 := IF(@copies_col_exists = 0,
  'ALTER TABLE Book ADD COLUMN Number_Of_Copies INT NOT NULL DEFAULT 1',
  'SELECT 1'
);
PREPARE s4 FROM @stmt4;
EXECUTE s4;
DEALLOCATE PREPARE s4;

UPDATE Book
SET Number_Of_Copies = CASE
  WHEN Number_Of_Copies IS NULL THEN IF(Available = TRUE, 1, 0)
  WHEN Number_Of_Copies < 0 THEN 0
  ELSE Number_Of_Copies
END;

ALTER TABLE Book
MODIFY COLUMN Number_Of_Copies INT NOT NULL DEFAULT 1;

UPDATE Book
SET Available = IF(Number_Of_Copies > 0, TRUE, FALSE);

DROP PROCEDURE IF EXISTS sp_issue_book;
DROP PROCEDURE IF EXISTS sp_return_book;

DELIMITER $$

CREATE PROCEDURE sp_issue_book(
  IN p_book_id INT,
  IN p_member_id INT,
  IN p_employee_id INT,
  IN p_due_date DATE
)
BEGIN
  DECLARE v_copies INT;
  DECLARE v_new_copies INT;
  DECLARE v_open_issues INT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT Number_Of_Copies INTO v_copies
  FROM Book
  WHERE Book_Id = p_book_id
  FOR UPDATE;

  IF v_copies IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book not found';
  END IF;

  IF v_copies <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book is not available';
  END IF;

  SELECT COUNT(*) INTO v_open_issues
  FROM Issue
  WHERE Member_Id = p_member_id
    AND Book_Id = p_book_id
    AND Return_Date IS NULL;

  IF v_open_issues > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Member already has this book issued';
  END IF;

  INSERT INTO Issue (Book_Id, Member_Id, Employee_ID, Issue_Date, Due_Date)
  VALUES (p_book_id, p_member_id, p_employee_id, CURDATE(), p_due_date);

  SET v_new_copies = v_copies - 1;

  UPDATE Book
  SET Number_Of_Copies = v_new_copies,
      Available = IF(v_new_copies > 0, TRUE, FALSE)
  WHERE Book_Id = p_book_id;

  COMMIT;

  SELECT LAST_INSERT_ID() AS Issue_Id;
END $$

CREATE PROCEDURE sp_return_book(
  IN p_issue_id INT,
  IN p_fine_per_day DECIMAL(8,2)
)
BEGIN
  DECLARE v_book_id INT;
  DECLARE v_member_id INT;
  DECLARE v_due_date DATE;
  DECLARE v_return_date DATE;
  DECLARE v_days_late INT DEFAULT 0;
  DECLARE v_amount DECIMAL(8,2) DEFAULT 0.00;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  START TRANSACTION;

  SELECT Book_Id, Member_Id, Due_Date, Return_Date
    INTO v_book_id, v_member_id, v_due_date, v_return_date
  FROM Issue
  WHERE Issue_Id = p_issue_id;

  IF v_book_id IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Issue not found';
  END IF;

  IF v_return_date IS NOT NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Book already returned';
  END IF;

  UPDATE Issue
  SET Return_Date = CURDATE()
  WHERE Issue_Id = p_issue_id;

  UPDATE Book
  SET Number_Of_Copies = Number_Of_Copies + 1,
      Available = TRUE
  WHERE Book_Id = v_book_id;

  SET v_days_late = GREATEST(DATEDIFF(CURDATE(), v_due_date), 0);

  IF v_days_late > 0 THEN
    SET v_amount = v_days_late * p_fine_per_day;
    INSERT INTO Fine (Issue_Id, Member_Id, Amount, Reason)
    VALUES (p_issue_id, v_member_id, v_amount, CONCAT('Returned ', v_days_late, ' day(s) late'));
  END IF;

  COMMIT;

  SELECT v_days_late AS DaysLate, v_amount AS FineAmount;
END $$

DELIMITER ;
