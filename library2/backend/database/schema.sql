-- ============================================================
--  Library Management System — MySQL Schema
-- ============================================================

CREATE DATABASE IF NOT EXISTS library;
USE library;

-- ------------------------------------------------------------
-- 1. LIBRARY
-- ------------------------------------------------------------
CREATE TABLE Library (
  Lib_ID      INT AUTO_INCREMENT PRIMARY KEY,
  Name        VARCHAR(150) NOT NULL,
  Address     VARCHAR(255),
  Phone       VARCHAR(20),
  Email       VARCHAR(100)
);

-- ------------------------------------------------------------
-- 2. PUBLISHER
-- ------------------------------------------------------------
CREATE TABLE Publisher (
  Id           INT AUTO_INCREMENT PRIMARY KEY,
  Publish_Name VARCHAR(150) NOT NULL,
  Contact      VARCHAR(100)
);

-- ------------------------------------------------------------
-- 3. AUTHOR
-- ------------------------------------------------------------
CREATE TABLE Author (
  Author_Id   INT AUTO_INCREMENT PRIMARY KEY,
  Author_Name VARCHAR(150) NOT NULL
);

-- ------------------------------------------------------------
-- 4. COLLECTION  (weak entity — belongs to Library)
-- ------------------------------------------------------------
CREATE TABLE Collection (
  Collection_Id    INT AUTO_INCREMENT PRIMARY KEY,
  Collection_Genre VARCHAR(80),
  Description      TEXT,
  Edition          VARCHAR(30),
  Lib_ID           INT NOT NULL,
  FOREIGN KEY (Lib_ID) REFERENCES Library(Lib_ID) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 5. BOOK
-- ------------------------------------------------------------
CREATE TABLE Book (
  Book_Id       INT AUTO_INCREMENT PRIMARY KEY,
  Name          VARCHAR(200) NOT NULL,
  Book_Des      TEXT,
  Genre         ENUM('Fiction','Nonfiction','Sci_fi','Novel','Reference_book','Textbook') NOT NULL,
  Book_Author   INT,
  Publisher_Id  INT,
  Collection_Id INT,
  Number_Of_Copies INT NOT NULL DEFAULT 1,
  Available     BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (Book_Author)   REFERENCES Author(Author_Id)     ON DELETE SET NULL,
  FOREIGN KEY (Publisher_Id)  REFERENCES Publisher(Id)          ON DELETE SET NULL,
  FOREIGN KEY (Collection_Id) REFERENCES Collection(Collection_Id) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- 6. EMPLOYEE  (Is-A: Clerk | Librarian | Admin)
-- ------------------------------------------------------------
CREATE TABLE Employee (
  Employee_ID   INT AUTO_INCREMENT PRIMARY KEY,
  Employee_Name VARCHAR(150) NOT NULL,
  Date_of_Join  DATE NOT NULL,
  Experience    INT DEFAULT 0,           -- years
  Role          ENUM('Clerk','Librarian','Admin') NOT NULL,
  Password_Hash VARCHAR(255) NOT NULL,
  Lib_ID        INT NOT NULL,
  FOREIGN KEY (Lib_ID) REFERENCES Library(Lib_ID) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- 7. MEMBER  (Is-A: Student | Teacher | NT_Staff)
-- ------------------------------------------------------------
CREATE TABLE Member (
  Member_Id   INT AUTO_INCREMENT PRIMARY KEY,
  Mem_Name    VARCHAR(150) NOT NULL,
  Member_Type ENUM('Student','Teacher','NT_Staff') NOT NULL,
  Contact     VARCHAR(20),
  Email       VARCHAR(150) UNIQUE,
  Password_Hash VARCHAR(255) NOT NULL
);

-- ------------------------------------------------------------
-- 7A. ISSUE REQUEST  (member requests, librarian/admin process)
-- ------------------------------------------------------------
CREATE TABLE Issue_Request (
  Request_Id     INT AUTO_INCREMENT PRIMARY KEY,
  Member_Id      INT NOT NULL,
  Book_Id        INT NOT NULL,
  Request_Date   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Status         ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  Processed_By   INT DEFAULT NULL,
  Processed_At   DATETIME DEFAULT NULL,
  Due_Date       DATE DEFAULT NULL,
  Note           VARCHAR(255) DEFAULT NULL,
  FOREIGN KEY (Member_Id)    REFERENCES Member(Member_Id)     ON DELETE CASCADE,
  FOREIGN KEY (Book_Id)      REFERENCES Book(Book_Id)         ON DELETE CASCADE,
  FOREIGN KEY (Processed_By) REFERENCES Employee(Employee_ID) ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- 8. ISSUE
-- ------------------------------------------------------------
CREATE TABLE Issue (
  Issue_Id    INT AUTO_INCREMENT PRIMARY KEY,
  Book_Id     INT NOT NULL,
  Member_Id   INT NOT NULL,
  Employee_ID INT NOT NULL,              -- issued by
  Issue_Date  DATE NOT NULL DEFAULT (CURRENT_DATE),
  Due_Date    DATE NOT NULL,
  Return_Date DATE DEFAULT NULL,         -- NULL = not returned yet
  FOREIGN KEY (Book_Id)     REFERENCES Book(Book_Id)         ON DELETE RESTRICT,
  FOREIGN KEY (Member_Id)   REFERENCES Member(Member_Id)     ON DELETE RESTRICT,
  FOREIGN KEY (Employee_ID) REFERENCES Employee(Employee_ID) ON DELETE RESTRICT
);

-- ------------------------------------------------------------
-- 9. FINE
-- ------------------------------------------------------------
CREATE TABLE Fine (
  Fine_Id   INT AUTO_INCREMENT PRIMARY KEY,
  Issue_Id  INT NOT NULL,
  Member_Id INT NOT NULL,
  Amount    DECIMAL(8,2) NOT NULL DEFAULT 0.00,
  Reason    VARCHAR(255),
  Paid      BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (Issue_Id)  REFERENCES Issue(Issue_Id)   ON DELETE CASCADE,
  FOREIGN KEY (Member_Id) REFERENCES Member(Member_Id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- INDEXES for frequent lookups
-- ------------------------------------------------------------
CREATE INDEX idx_book_genre       ON Book(Genre);
CREATE INDEX idx_book_available   ON Book(Available);
CREATE INDEX idx_issue_member     ON Issue(Member_Id);
CREATE INDEX idx_issue_due        ON Issue(Due_Date);
CREATE INDEX idx_fine_paid        ON Fine(Paid);
CREATE INDEX idx_request_status   ON Issue_Request(Status);
CREATE INDEX idx_request_member   ON Issue_Request(Member_Id);

-- ------------------------------------------------------------
-- STORED PROCEDURES
-- ------------------------------------------------------------
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
