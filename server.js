require('dotenv').config();
const apiKeyAuth = require('./middleware/apiKeyAuth'); // Make sure path is correct
const express = require('express');
const bodyParser = require('body-parser');
const da = require("./data-access");
const path = require('path'); 

const app = express();
const port = process.env.PORT || 4000;

app.use(bodyParser.json());

// Set the static directory to serve files from
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log("staticDir: " + staticDir);
});

app.get("/customers/find", apiKeyAuth, async (req, res) => {
  const allowedFields = ['id', 'email', 'password'];
  const queryKeys = Object.keys(req.query);

  // 2. Require a query string
  if (queryKeys.length === 0) {
    return res.status(400).send("query string is required");
  }

  // 3. Only allow one key=value pair
  if (queryKeys.length > 1) {
    return res.status(400).send("only one name/value pair is allowed");
  }

  const field = queryKeys[0];
  const value = req.query[field];

  // 5. Validate field name
  if (!allowedFields.includes(field)) {
    return res.status(400).send("name must be one of the following (id, email, password)");
  }

  // 6. Build filter
  const filter = {};
  if (field === "id") {
    const num = Number(value);
    if (isNaN(num)) {
      return res.status(400).send("id must be a number");
    }
    filter.id = num;
  } else {
    filter[field] = value;
  }

  // ✅ 7. Use correct data-access function
  const [results, err] = await da.getCustomersByFilter(filter);

  if (results && results.length === 0) {
    return res.status(404).send("no matching customer documents found");
  }

  if (results) {
    res.send(results);
  } else {
    res.status(500).send(err);
  }
});

// ✅ GET all customers (protected)
app.get("/customers", apiKeyAuth, async (req, res) => {
  const [cust, err] = await da.getCustomers();
  if (cust) {
    res.send(cust);
  } else {
    res.status(500).send(err);
  }   
});

// ✅ GET single customer by ID (protected)
app.get("/customers/:id", apiKeyAuth, async (req, res) => {
  const id = req.params.id;
  const [cust, err] = await da.getCustomerById(id);
  if (cust) {
    res.send(cust);
  } else {
    res.status(404).send(err);
  }   
});

// ✅ RESET customers (protected)
app.get("/reset", apiKeyAuth, async (req, res) => {
  const [result, err] = await da.resetCustomers();
  if (result) {
    res.send(result);
  } else {
    res.status(500).send(err);
  }   
});

// ✅ POST new customer (protected)
app.post('/customers', apiKeyAuth, async (req, res) => {
  const newCustomer = req.body;
  if (!newCustomer || Object.keys(newCustomer).length === 0) {
    res.status(400).send("missing request body");
  } else {
    const [status, id, errMessage] = await da.addCustomer(newCustomer);
    if (status === "success") {
      res.status(201).send({ ...newCustomer, _id: id });
    } else {
      res.status(400).send(errMessage);
    }
  }
});

// ✅ PUT update customer (protected)
app.put('/customers/:id', apiKeyAuth, async (req, res) => {
  const id = req.params.id;
  const updatedCustomer = req.body;

  if (!updatedCustomer || Object.keys(updatedCustomer).length === 0) {
    res.status(400).send("missing request body");
    return;
  }

  delete updatedCustomer._id;

  const [message, errMessage] = await da.updateCustomer(updatedCustomer);
  if (message) {
    res.send(message);
  } else {
    res.status(400).send(errMessage);
  }
});

// ✅ DELETE customer by ID (protected)
app.delete("/customers/:id", apiKeyAuth, async (req, res) => {
  const id = req.params.id;
  const [message, errMessage] = await da.deleteCustomerById(id);
  if (message) {
    res.send(message);
  } else {
    res.status(404).send(errMessage);
  }
});

app.get("/customers/find", apiKeyAuth, async (req, res) => {
  const allowedFields = ['id', 'email', 'password'];
  const queryKeys = Object.keys(req.query);

  // 2. Require a query string
  if (queryKeys.length === 0) {
    return res.status(400).send("query string is required");
  }

  // 3. Only allow one key=value pair
  if (queryKeys.length > 1) {
    return res.status(400).send("only one name/value pair is allowed");
  }

  const field = queryKeys[0];
  const value = req.query[field];

  // 5. Validate field name
  if (!allowedFields.includes(field)) {
    return res.status(400).send("name must be one of the following (id, email, password)");
  }

  // 6. Build filter
  const filter = {};
  if (field === "id") {
    const num = Number(value);
    if (isNaN(num)) {
      return res.status(400).send("id must be a number");
    }
    filter.id = num;
  } else {
    filter[field] = value;
  }

  // ✅ 7. Use correct data-access function
  const [results, err] = await da.getCustomersByFilter(filter);

  if (results && results.length === 0) {
    return res.status(404).send("no matching customer documents found");
  }

  if (results) {
    res.send(results);
  } else {
    res.status(500).send(err);
  }
});
