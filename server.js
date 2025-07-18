require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const apiKeyAuth = require('./middleware/apiKeyAuth');
const da = require('./data-access');
const path = require('path');

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(bodyParser.json());

// Static files
const staticDir = path.join(__dirname, 'public');
app.use(express.static(staticDir));

// Start server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log("staticDir: " + staticDir);
});

// ✅ GET /customers/find - Filtered search (protected)
app.get("/customers/find", apiKeyAuth, async (req, res) => {
  const allowedFields = ['id', 'email', 'password'];
  
  // Ignore apikey param when validating filters
  const { apikey, ...searchParams } = req.query;
  const queryKeys = Object.keys(searchParams);

  if (queryKeys.length === 0) {
    return res.status(400).send("query string is required");
  }

  if (queryKeys.length > 1) {
    return res.status(400).send("only one name/value pair is allowed");
  }

  const field = queryKeys[0];
  const value = searchParams[field];

  if (!allowedFields.includes(field)) {
    return res.status(400).send("name must be one of the following (id, email, password)");
  }

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

// ✅ GET all customers
app.get("/customers", apiKeyAuth, async (req, res) => {
  const [cust, err] = await da.getCustomers();
  if (cust) {
    res.send(cust);
  } else {
    res.status(500).send(err);
  }
});

// ✅ GET customer by ID
app.get("/customers/:id", apiKeyAuth, async (req, res) => {
  const id = req.params.id;
  const [cust, err] = await da.getCustomerById(id);
  if (cust) {
    res.send(cust);
  } else {
    res.status(404).send(err);
  }
});

// ✅ POST new customer (with duplicate check)
app.post('/customers', apiKeyAuth, async (req, res) => {
  const newCustomer = req.body;
  if (!newCustomer || Object.keys(newCustomer).length === 0) {
    return res.status(400).send("missing request body");
  }

  const [existingMatches, lookupErr] = await da.getCustomersByFilter({
    $or: [{ id: newCustomer.id }, { email: newCustomer.email }]
  });

  if (existingMatches && existingMatches.length > 0) {
    return res.status(400).send("duplicate id or email not allowed");
  }

  const [status, id, errMessage] = await da.addCustomer(newCustomer);
  if (status === "success") {
    res.status(201).send({ ...newCustomer, _id: id });
  } else {
    res.status(400).send(errMessage);
  }
});

// ✅ PUT update customer
app.put('/customers/:id', apiKeyAuth, async (req, res) => {
  const id = req.params.id;
  const updatedCustomer = req.body;

  if (!updatedCustomer || Object.keys(updatedCustomer).length === 0) {
    return res.status(400).send("missing request body");
  }

  delete updatedCustomer._id;

  const [message, errMessage] = await da.updateCustomer(updatedCustomer);
  if (message) {
    res.send(message);
  } else {
    res.status(400).send(errMessage);
  }
});

// ✅ DELETE customer by ID
app.delete("/customers/:id", apiKeyAuth, async (req, res) => {
  const id = req.params.id;
  const [message, errMessage] = await da.deleteCustomerById(id);
  if (message) {
    res.send(message);
  } else {
    res.status(404).send(errMessage);
  }
});

// ✅ RESET customers
app.get("/reset", apiKeyAuth, async (req, res) => {
  const [result, err] = await da.resetCustomers();
  if (result) {
    res.send(result);
  } else {
    res.status(500).send(err);
  }
});
