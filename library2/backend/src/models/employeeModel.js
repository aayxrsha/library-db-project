const pool = require('../config/db');

const EmployeeModel = {
  getAll: () =>
    pool.query(`
      SELECT Employee_ID, Employee_Name, Date_of_Join, Experience, Role, Lib_ID
      FROM Employee
      ORDER BY Employee_ID
    `),

  getById: (id) =>
    pool.query(
      `SELECT Employee_ID, Employee_Name, Date_of_Join, Experience, Role, Lib_ID
       FROM Employee
       WHERE Employee_ID = ?`,
      [id]
    ),

  create: (data) =>
    pool.query(
      `INSERT INTO Employee (Employee_Name, Date_of_Join, Experience, Role, Password_Hash, Lib_ID)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        data.Employee_Name,
        data.Date_of_Join,
        data.Experience,
        data.Role,
        data.Password_Hash,
        data.Lib_ID,
      ]
    ),

  update: (id, data) =>
    data.Password_Hash
      ? pool.query(
          `UPDATE Employee
           SET Employee_Name=?, Date_of_Join=?, Experience=?, Role=?, Lib_ID=?, Password_Hash=?
           WHERE Employee_ID=?`,
          [
            data.Employee_Name,
            data.Date_of_Join,
            data.Experience,
            data.Role,
            data.Lib_ID,
            data.Password_Hash,
            id,
          ]
        )
      : pool.query(
          `UPDATE Employee
           SET Employee_Name=?, Date_of_Join=?, Experience=?, Role=?, Lib_ID=?
           WHERE Employee_ID=?`,
          [
            data.Employee_Name,
            data.Date_of_Join,
            data.Experience,
            data.Role,
            data.Lib_ID,
            id,
          ]
        ),

  remove: (id) =>
    pool.query(`DELETE FROM Employee WHERE Employee_ID = ?`, [id]),
};

module.exports = EmployeeModel;
