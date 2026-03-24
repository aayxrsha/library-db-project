USE library;

INSERT INTO Library (Name, Address, Phone, Email) VALUES
('City Central Library', '12 Main Street, Mumbai', '022-1234567', 'central@library.in');

INSERT INTO Publisher (Publish_Name, Contact) VALUES
('Penguin Books', 'penguin@pub.com'),
('Oxford Press', 'oxford@pub.com');

INSERT INTO Author (Author_Name) VALUES
('George Orwell'),
('J.K. Rowling'),
('Isaac Asimov');

INSERT INTO Collection (Collection_Genre, Description, Edition, Lib_ID) VALUES
('Science Fiction', 'Classic sci-fi novels', '3rd', 1),
('Literature', 'World literature classics', '2nd', 1);

INSERT INTO Employee (Employee_Name, Date_of_Join, Experience, Role, Password_Hash, Lib_ID) VALUES
('Amit Sharma',  '2020-06-01', 5, 'Admin',     '$2a$10$U4fl7bS6JV3qYs1h6V7OG.cvTNSsot2BsAJTm/f/aurXZxLyzU1oa', 1),
('Priya Nair',   '2021-03-15', 3, 'Librarian', '$2a$10$uvPZabKlDLo69CDAk/SOpuy7LenYMvJ9Gm5ZIpy3.NoZqrmJuio8K', 1),
('Ravi Desai',   '2022-09-01', 1, 'Clerk',     '$2a$10$g58loebfErqd3n.QjwjfZ.O0QKOT90qtmXxNs7Lxdtr4pkSAGThoW', 1);

INSERT INTO Book (Name, Book_Des, Genre, Book_Author, Publisher_Id, Collection_Id, Available) VALUES
('1984',                  'Dystopian novel',           'Fiction',       1, 1, 2, TRUE),
('Harry Potter and PS',   'Wizard boy story',          'Fiction',       2, 1, 2, TRUE),
('Foundation',            'Galactic empire saga',      'Sci_fi',        3, 2, 1, TRUE),
('Animal Farm',           'Political allegory',        'Fiction',       1, 1, 2, FALSE),
('I Robot',               'Robot ethics stories',      'Sci_fi',        3, 2, 1, TRUE);

INSERT INTO Member (Mem_Name, Member_Type, Contact, Password_Hash) VALUES
('Sneha Patil',   'Student',  '9876543210', '$2a$10$c5NQwoPzdzIKlNvql4l7weeh8/uFfTnnZVXIE2s/XRoJhVOO3oupK'),
('Dr. Mehta',     'Teacher',  '9123456789', '$2a$10$c5NQwoPzdzIKlNvql4l7weeh8/uFfTnnZVXIE2s/XRoJhVOO3oupK'),
('Kiran Kulkarni','NT_Staff', '9000011111', '$2a$10$c5NQwoPzdzIKlNvql4l7weeh8/uFfTnnZVXIE2s/XRoJhVOO3oupK');
