const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
var isValid = require("date-fns/isValid");
const isMatch = require("date-fns/isMatch");
const format = require("date-fns/format");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};
const hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};
const hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};
app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    status = '${status}'
    AND priority = '${priority}';`;
          data = await database.all(getTodosQuery);
          response.send(
            data.map((each) => convertDbObjectToResponseObject(each))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryAndStatus(request.query):
      if (
        category === "HOME" ||
        category === "WORK" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    status = '${status}'
    AND category = '${category}';`;
          data = await database.all(getTodosQuery);
          response.send(
            data.map((each) => convertDbObjectToResponseObject(each))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndPriority(request.query):
      if (
        category === "TO DO" ||
        category === "IN PROGRESS" ||
        category === "DONE"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    priority= '${priority}'
    AND category = '${category}';`;
          data = await database.all(getTodosQuery);
          response.send(
            data.map((each) => convertDbObjectToResponseObject(each))
          );
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasPriorityProperty(request.query):
      if (
        priority === "HOME" ||
        priority === "WORK" ||
        priority === "LEARNING"
      ) {
        getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    priority = '${priority}';`;
        data = await database.all(getTodosQuery);
        response.send(
          data.map((each) => convertDbObjectToResponseObject(each))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    status = '${status}';`;
        data = await database.all(getTodosQuery);
        response.send(
          data.map((each) => convertDbObjectToResponseObject(each))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasSearchProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
      data = await database.all(getTodosQuery);
      response.send(data.map((each) => convertDbObjectToResponseObject(each)));
      break;
    case hasCategoryProperty(request.query):
      if (
        category === "TO DO" ||
        category === "IN PROGRESS" ||
        category === "DONE"
      ) {
        getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    category = '${category}';`;
        data = await database.all(getTodosQuery);
        response.send(
          data.map((each) => convertDbObjectToResponseObject(each))
        );
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo;`;
      data = await database.all(getTodosQuery);
      response.send(data.map((each) => convertDbObjectToResponseObject(each)));
  }
});
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
      WHERE id=${todoId};`;
  const todosArray = await database.get(getTodoQuery);
  response.send(convertDbObjectToResponseObject(todosArray));
});
app.get("/agenda/", async (request, response) => {
  const { date } = request.params;
  if (isMatch(date, "yyyy-mm-dd")) {
    const newDate = format(new Date(date), "yyyy-mm-dd");
    const requestQuery = `
    SELECT
      *
    FROM
      todo
      WHERE due_date=${newDate};`;
    const todosArray = await database.all(requestQuery);
    response.send(
      todoArray.map((each) => convertDbObjectToResponseObject(each))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "TO DO" ||
        category === "IN PROGRESS" ||
        category === "DONE"
      ) {
        if (isMatch(date, "yyyy-mm-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-mm-dd");
          const postQuery = `
   INSERT INTO todo (id,todo,priority,status,category,due_date)
   VALUES (${id},'${todo}','${priority}','${status}','${category}','${dueDate}');`;
          await database.run(postQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updatecolumn = "";
  const requestBody = request.body;

  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
      WHERE id=${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);
  const {
    todo = previousTodo.todo,
    status = previousTodo.status,
    priority = previousTodo.priority,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;
  let updateTodoQuery;
  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        const updateTodoQuery = `
  UPDATE
    todo
  SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}',
    category='${category}',
    due_date='${dueDate}'
  WHERE
    id = ${todoId};`;

        await database.run(updateTodoQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        const updateTodoQuery = `
  UPDATE
    todo
  SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}',
    category='${category}',
    due_date=${dueDate}
  WHERE
    id = ${todoId};`;

        await database.run(updateTodoQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.todo !== undefined:
      const updateTodoQuery = `
  UPDATE
    todo
  SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}',
    category='${category}',
    due_date=${dueDate}
  WHERE
    id = ${todoId};`;

      await database.run(updateTodoQuery);
      response.send("Todo Updated");

      break;
    case requestBody.category !== undefined:
      if (
        category === "TO DO" ||
        category === "IN PROGRESS" ||
        category === "DONE"
      ) {
        const updateTodoQuery = `
  UPDATE
    todo
  SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}',
    category='${category}',
    due_date=${dueDate}
  WHERE
    id = ${todoId};`;

        await database.run(updateTodoQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.dueDate !== undefined:
      if (ismatch(dueDate, "yyyy-mm-dd")) {
        const newDueDate = format(new Date(dueDate), "yyy-mm-dd");
        const updateTodoQuery = `
  UPDATE
    todo
  SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}',
    category='${category}',
    due_date=${newDueDate}
  WHERE
    id = ${todoId};`;

        await database.run(updateTodoQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});
module.exports = app;
