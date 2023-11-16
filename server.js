const mysql = require('mysql2');
const fs = require('fs');
const inquirer = require('inquirer');

const connection = mysql.createConnection({
    user: 'root',
    password: 'pass',
    database: 'tracker',
    multipleStatements: true
});

connection.connect((err) => {
    if (err) throw err;

    connection.query('USE tracker', (err) => {
        if (err) throw err;
        runSchema();
    });
});

function executeQuery(query) {
    if (!query || query.trim() === '') {
        return;
    }

    if (query.toLowerCase().includes('create table')) {
        connection.query(query, (err, result) => {
            if (err) {
                console.error('Error executing SQL statement:', err);
            }
        });
    } else {
        connection.query(query, (err, result) => {
            if (err) {
                console.error('Error executing SQL statement:', err);
            } else {
                console.log('SQL statement executed successfully:', query);
            }
        });
    }
}

function runSchema() {
    const schema = fs.readFileSync('./db/schema.sql', 'utf8');
    const statements = schema.split(';');

    statements.forEach((statement) => {
        executeQuery(statement);
    });

    startApp();
}

function startApp() {
    inquirer
        .prompt({
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                'View all departments',
                'View all roles',
                'View all employees',
                'Add a department',
                'Add a role',
                'Add an employee',
                'Update an employee role',
                'Exit'
            ]
        })
        .then(answer => {
            switch (answer.action) {
                case 'View all departments':
                    viewDepartments();
                    break;

                case 'View all roles':
                    viewRoles();
                    break;

                case 'View all employees':
                    viewEmployees();
                    break;

                case 'Add a department':
                    addDepartment();
                    break;

                case 'Add a role':
                    addRole();
                    break;

                case 'Add an employee':
                    addEmployee();
                    break;

                case 'Update an employee role':
                    updateEmployeeRole();
                    break;

                case 'Exit':
                    connection.end();
                    console.log('Goodbye!');
                    break;

                default:
                    console.log('Invalid action');
                    break;
            }
        });
}


function viewDepartments() {
    connection.query('SELECT * FROM department', (err, results) => {
        if (err) throw err;

        console.table(results);
        startApp();
    });
}

function viewRoles() {
    connection.query('SELECT role.*, department.name AS department_name FROM role JOIN department ON role.department_id = department.id', (err, results) => {
        if (err) throw err;

        console.table(results);

        startApp();
    });
}

function viewEmployees() {
    const query = `
    SELECT 
      employee.id, 
      employee.first_name, 
      employee.last_name, 
      role.title, 
      department.name AS department_name, 
      role.salary, 
      CONCAT(manager.first_name, ' ', manager.last_name) AS manager_name
    FROM employee
    LEFT JOIN role ON employee.role_id = role.id
    LEFT JOIN department ON role.department_id = department.id
    LEFT JOIN employee AS manager ON employee.manager_id = manager.id
  `;

    connection.query(query, (err, results) => {
        if (err) throw err;

        console.table(results);

        startApp();
    });
}

function addDepartment() {
    inquirer
        .prompt({
            type: 'input',
            name: 'departmentName',
            message: 'Enter the name of the department:'
        })
        .then(answer => {
            connection.query('INSERT INTO department SET ?', { name: answer.departmentName }, (err, result) => {
                if (err) throw err;
                console.log('Department added successfully!');
                startApp();
            });
        });
}

function addRole() {
    inquirer
        .prompt([
            {
                type: 'input',
                name: 'title',
                message: 'Enter the title of the new role:'
            },
            {
                type: 'input',
                name: 'salary',
                message: 'Enter the salary for the new role:'
            },
            {
                type: 'input',
                name: 'departmentId',
                message: 'Enter the department ID for the new role:'
            }
        ])
        .then(answers => {
            connection.query(
                'INSERT INTO role (title, salary, department_id) VALUES (?, ?, ?)',
                [answers.title, answers.salary, answers.departmentId],
                (err, result) => {
                    if (err) throw err;
                    console.log('Role added successfully!');
                    startApp();
                }
            );
        });
}

function addEmployee() {
    inquirer
        .prompt([
            {
                type: 'input',
                name: 'firstName',
                message: 'Enter the first name of the new employee:'
            },
            {
                type: 'input',
                name: 'lastName',
                message: 'Enter the last name of the new employee:'
            },
            {
                type: 'input',
                name: 'roleId',
                message: 'Enter the role ID for the new employee:'
            },
            {
                type: 'input',
                name: 'managerId',
                message: 'Enter the manager ID for the new employee (leave blank if none):'
            }
        ])
        .then(answers => {
            connection.query(
                'INSERT INTO employee (first_name, last_name, role_id, manager_id) VALUES (?, ?, ?, ?)',
                [answers.firstName, answers.lastName, answers.roleId, answers.managerId || null],
                (err, result) => {
                    if (err) throw err;
                    console.log('Employee added successfully!');
                    startApp();
                }
            );
        });
}

function updateEmployeeRole() {
    inquirer
        .prompt([
            {
                type: 'input',
                name: 'employeeId',
                message: 'Enter the ID of the employee you want to update:'
            },
            {
                type: 'input',
                name: 'newRoleId',
                message: 'Enter the new role ID for the employee:'
            }
        ])
        .then(answers => {
            connection.query(
                'UPDATE employee SET role_id = ? WHERE id = ?',
                [answers.newRoleId, answers.employeeId],
                (err, result) => {
                    if (err) throw err;
                    console.log('Employee role updated successfully!');
                    startApp();
                }
            );
        });
}