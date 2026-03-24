const bcrypt = require('bcryptjs');
const EmployeeModel = require('../models/employeeModel');

const getAll = async (req, res, next) => {
  try {
    const [rows] = await EmployeeModel.getAll();
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const [rows] = await EmployeeModel.getById(req.params.id);
    if (!rows.length) return res.status(404).json({ message: 'Employee not found' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const { Employee_Name, Date_of_Join, Experience, Role, Lib_ID, password } = req.body;
    if (!Employee_Name || !Date_of_Join || !Role || !Lib_ID || !password) {
      return res.status(400).json({
        message: 'Employee_Name, Date_of_Join, Role, Lib_ID and password are required',
      });
    }

    const Password_Hash = await bcrypt.hash(password, 10);

    const [result] = await EmployeeModel.create({
      Employee_Name,
      Date_of_Join,
      Experience: Experience || 0,
      Role,
      Lib_ID,
      Password_Hash,
    });

    res.status(201).json({ message: 'Employee added', Employee_ID: result.insertId });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const { Employee_Name, Date_of_Join, Experience, Role, Lib_ID, password } = req.body;
    if (!Employee_Name || !Date_of_Join || !Role || !Lib_ID) {
      return res.status(400).json({
        message: 'Employee_Name, Date_of_Join, Role and Lib_ID are required',
      });
    }

    const payload = {
      Employee_Name,
      Date_of_Join,
      Experience: Experience || 0,
      Role,
      Lib_ID,
    };

    if (password) {
      payload.Password_Hash = await bcrypt.hash(password, 10);
    }

    await EmployeeModel.update(req.params.id, payload);
    res.json({ message: 'Employee updated' });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account' });
    }
    await EmployeeModel.remove(req.params.id);
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAll, getById, create, update, remove };
