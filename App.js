const express = require("express");
const moment = require("moment");

//const port=process.env.port;
const app = express();
const port = 3004;
app.use(express.json());
app.set("view engine", "hbs");
app.set("views", "view");
// app.setHeader('Content-Type', 'text/css');
app.use(express.static(__dirname + "/public"));
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({ secret: "your-secret-key", resave: true, saveUninitialized: true })
);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

//connection with database
const mysql = require("mysql");
const { Console } = require("console");
const con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "allocatesneat",
  port: 3306,
});
con.connect((err) => {
  if (err) throw err;
  console.log("Connection created..!!");
});
module.exports.con = con;

app.get("/", (req, res) => {
  res.render("userlogin");
});

app.get("/signin", (req, res) => {
  res.render("signin");
});

//user register
app.get("/userRegister", (req, res) => {
  const { password, created_at, name, email, phone, status, date } = req.query;
  con.connect(function (err) {
    var sql =
      "INSERT INTO users (password, created_at, name, email, phone, status, date) VALUES (?,?,?,?,?,?,?)";
    con.query(
      sql,
      [password, created_at, name, email, phone, status, date],
      function (err, results) {
        console.log(results);
        if (err) {
          throw err;
        }
        res.render("userlogin", { mesg: true });
      }
    );
  });
});

app.get("/userlogin", (req, res) => {
  res.render("userlogin");
});

var user_email = "";
var user_password = "";

// Middleware for authentication
const authenticate = (req, res, next) => {
  if (req.session.loggedin) {
    // User is authenticated
    next();
  } else {
    res.status({ success: false, message: "Unauthorized" });
  }
};

app.post("/logincheck", async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (email && password) {
    const sql = `select * from users where email='${email}' AND password ='${password}'`;
    con.query(sql, (err, result) => {
      if (result.length > 0) {
        req.session.loggedin = true;
        req.session.email = email;
        res.render("index_sneat", user_email, user_password);
      } else {
        res.render("userlogin", { success: false, mesg1: true, mesg2: false });
      }
    });
  }
});

app.get("/logoutuser", (req, res) => {
  req.session.destroy((err) => {
    res.render("userlogin", { success: true, mesg1: false, mesg2: true });
  });
});

app.get("/index_sneat", authenticate, (req, res) => {
  res.render("index_sneat", {
    success: true,
    data: req.session.user,
    user_email,
    user_password,
  });
});

app.get("/index_sneat", (req, res) => {
  console.log("Email", user_email);
  console.log("Pass", user_password);

  if (user_email != null && user_password != null) {
    // username
    let qry = "SELECT * FROM users WHERE email=?";

    // total sales
    let qry1 =
      "SELECT SUM(total) AS totalSales FROM orders where status='done'; ";

    // total items in cart
    let qry2 = "SELECT COUNT(*) AS totalCartItems FROM cart";

    // confirm orders
    let qry3 = "SELECT * FROM orders WHERE payment='paid'";

    // pending orders
    let qry4 = "SELECT * FROM orders WHERE payment='pending'";

    // total users in users
    let qry5 = "SELECT COUNT(*) AS totalUsers FROM users";

    // total products in products
    let qry6 = "SELECT COUNT(*) AS totalProducts FROM products";

    // Execute multiple queries in parallel using Promise.all
    Promise.all([
      executeQuery(qry, [user_email]),
      executeQuery(qry1),
      executeQuery(qry2),
      executeQuery(qry3),
      executeQuery(qry4),
      executeQuery(qry5),
      executeQuery(qry6),
    ])
      .then((results) => {
        // Extract results from the array
        const [
          userResult,
          totalSalesResult,
          totalCartItemsResult,
          confirmOrdersResult,
          pendingOrdersResult,
          totalUsersResult,
          totalProductsResult,
        ] = results;

        // Process the results as needed
        const data = {
          user: userResult[0],
          totalSales: totalSalesResult[0].totalSales,
          totalCartItems: totalCartItemsResult[0].totalCartItems,
          confirmOrders: confirmOrdersResult,
          pendingOrders: pendingOrdersResult,
          totalUsers: totalUsersResult[0].totalUsers,
          totalProducts: totalProductsResult[0].totalProducts,
        };
        const jsondata = JSON.parse(data);
        res.render("index_sneat", { data: jsondata });
      })
      .catch((err) => {
        console.error(err);
        res.status(500).send("Internal Server Error");
      });
  }
  //res.render("index_sneat");
});

// Function to execute a query with optional parameters
function executeQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    con.query(query, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
}

// Route for all records
app.get("/categories_allCategories", (req, res) => {
  let qry = "SELECT * FROM category;";
  con.query(qry, (err, results) => {
    if (err) throw err;
    else {
      res.render("categories_allCategories", { allRecords: results });
    }
  });
});

// Route for top 10 records
app.get("/top10char", (req, res) => {
  let qry = "SELECT * FROM category LIMIT 10;";
  con.query(qry, (err, results) => {
    if (err) throw err;
    else {
      res.render("categories_allCategories", { topRecords: results });
    }
  });
});

// Route for top 20 records
app.get("/top20char", (req, res) => {
  let qry = "SELECT * FROM category LIMIT 20;";
  con.query(qry, (err, results) => {
    if (err) throw err;
    else {
      res.render("categories_allCategories", { topRecords: results });
    }
  });
});

// Route for top 50 records
app.get("/top50char", (req, res) => {
  let qry = "SELECT * FROM category LIMIT 50;";
  con.query(qry, (err, results) => {
    if (err) throw err;
    else {
      res.render("categories_allCategories", { topRecords: results });
    }
  });
});

// Route for top 100 records
app.get("/top100char", (req, res) => {
  let qry = "SELECT * FROM category LIMIT 100;";
  con.query(qry, (err, results) => {
    if (err) throw err;
    else {
      res.render("categories_allCategories", { topRecords: results });
    }
  });
});

// Route for top 150 records
app.get("/top150char", (req, res) => {
  let qry = "SELECT * FROM category LIMIT 150;";
  con.query(qry, (err, results) => {
    if (err) throw err;
    else {
      res.render("categories_allCategories", { topRecords: results });
    }
  });
});


app.get("/search/searchTermWithWildcard", (req, res) => {
  const name =req.body.searchTermWithWildcard;
  let qry = "SELECT * FROM category WHERE name LIKE ?";
  con.query(qry,[name], (err, results) => {
    if (err) throw err;
    else {
      res.render("categories_allCategories", { data: results });
    }
  });
});



// // Middleware for handling pagination
// app.use((req, res, next) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = 10; // Number of records per page
//   const offset = (page - 1) * limit;

//   // Attach pagination data to request object
//   req.pagination = {page,limit,offset,};

//   next();
// });

// // Route to fetch and display paginated data
// app.get('/categories_allCategories', (req, res) => {
//   const { page, limit, offset } = req.pagination;

//   const sql = 'SELECT * FROM category LIMIT ? OFFSET ?';
//   connection.query(sql, [limit, offset], (err, results) => {
//     if (err) {
//       console.error('Error fetching data:', err);
//       res.status(500).send('Internal Server Error');
//       return;
//     }

//     res.render('categories_allCategories', { data: results, page });
//   });
// });


// Update the /categories route/pagination
// app.get('/categories_allCategories', (req, res) => {
//   const { page, limit, offset } = req.pagination;

//   const sql = 'SELECT * FROM category LIMIT ? OFFSET ?';
//   con.query(sql, [limit, offset], (err, results) => {
//     if (err) {
//       console.error('Error fetching data:', err);
//       res.status(500).send('Internal Server Error');
//       return;
//     }

//     res.render('categories_allCategories', { allRecords: results, page });
//   });
// });














//details
app.get("/categories_detailsCategories/:id", (req, res) => {
  res.render("categories_detailsCategories");
});
app.get("/detailsCategories/:id", (req, res) => {
  const id = parseInt(req.params.id);
  console.log(id);
  let qry = "SELECT * FROM category WHERE id = ?";

  con.query(qry, [id], (err, results) => {
    if (err) throw err;
    else {
      res.render("categories_detailsCategories", { data: results });
    }
  });
});
const storage = multer.diskStorage({
  destination: "uploads",
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage });
app.get("/categories_addCategories", (req, res) => {
  res.render("categories_addCategories");
});
app.post("/addcategory", upload.single("profileImage"), (req, res) => {
  const { name, descr, status, tag } = req.body;
  const profileImage = req.file.path; // Get the uploaded image path

  const sql =
    "INSERT INTO category (name, descr, img, status, tag) VALUES (?, ?, ?, ?, ?)";

  con.query(
    sql,
    [name, descr, profileImage, status, tag],
    function (err, results) {
      if (err) {
        console.error("Error inserting record:", err);
        res.render("categories_addCategories", { mesg: false });
      } else {
        console.log("1 record inserted");
        res.render("categories_addCategories", { mesg: true });
        console.log(results);
      }
    }
  );
});

//edit category
app.get("/editCategory/:id", (req, res) => {
  var id = req.params.id;
  console.log(id);
  let qry = "SELECT * FROM category where id= ?;";
  console.log("EditQuery-->", qry);
  con.query(qry, [id], (err, results) => {
    if (err) throw err;
    else {
      res.render("categories_editCategories", { data: results });

      console.log(results);
    }
  });
});
app.get("/updatecategory", (req, res) => {
  const { name, descr, profileImage, status, tag, id } = req.query;
  console.log("AfterUpdate-->", id);

  const updateQuery =
    "UPDATE category SET name = ?, descr = ?, img = ?, status = ?, tag = ? WHERE id = ?";
  const selectQuery = "SELECT * FROM category";

  con.query(
    updateQuery,
    [name, descr, profileImage, status, tag, id],
    (updateErr, updateResults) => {
      if (updateErr) {
        throw updateErr;
      }

      console.log("Update successful");

      con.query(selectQuery, (selectErr, selectResults) => {
        if (selectErr) {
          throw selectErr;
        }

        console.log("Select successful");

        res.render("categories_allCategories", { data: selectResults });
      });
    }
  );
});
app.get("/deleteCategory/:id", (req, res) => {
  var id = req.params.id;
  console.log("ID-->", id);
  let deleteQry = "DELETE FROM category WHERE id = ?";
  console.log("DeleteQry-->", deleteQry);
  con.query(deleteQry, [id], (err, results) => {
    if (err) throw err;
    else {
      console.log("delete");
      let selectQry = "SELECT * FROM category;";
      con.query(selectQry, (err, results) => {
        if (err) throw err;
        else {
          res.render("categories_allCategories", {
            data: results,
            mesg2: true,
          });
        }
      });
    }
  });
});

//product
app.get("/products_addProducts", (req, res) => {
  res.render("products_addProducts");
});

app.post("/addProducts", upload.single("productImage"), (req, res) => {
  const { category, productname, desciption, tag, status } = req.body;
  const productImage = req.file.path; // Get the uploaded image path

  const sql =
    "INSERT INTO products (category, productname, desciption,tag,status,img) VALUES (?,?,?,?,?,?)";

  con.query(
    sql,
    [category, productname, desciption, tag, status, productImage],
    function (err, results) {
      if (err) {
        console.error("Error inserting record:", err);
        res.render("products_addProducts", { mesg: false });
      } else {
        console.log("1 record inserted");
        res.render("products_addProducts", { mesg: true });
        console.log(results);
      }
    }
  );
});

app.get("/products_sku", (req, res) => {
  res.render("products_sku");
});

app.get("/products_allProducts", (req, res) => {
  let qry = "select * from products;";
  con.query(qry, (err, results) => {
    if (err) throw err;
    else {
      res.render("products_allProducts", { data: results });
    }
  });
});

//order
app.get("/order_addOrder", (req, res) => {
  res.render("order_addOrder");
});

//add order
app.get("/addorder", (req, res) => {
  const { orderid, productid, total, date, txnid, payment, userid, status } =
    req.body;

  const sql =
    "INSERT INTO orders (orderid,productid,total,date,txnid,payment,userid,status) VALUES (?,?,?,?,?,?,?,?)";

  con.query(
    sql,
    [orderid, productid, total, date, txnid, payment, userid, status],
    function (err, results) {
      if (err) {
        console.error("Error inserting record:", err);
      } else {
        console.log("1 record inserted");
        res.render("order_addOrder", { mesg: true });
      }
    }
  );
});

//allorder  confirmorder
app.get("/order_allOrders", (req, res) => {
  let qry = "SELECT * FROM orders;";

  con.query(qry, (err, results) => {
    if (err) throw err;
    else {
      // Format the date to display only the date part (without time)
      //const formattedDate = moment(results.date).format('YYYY-MM-DD');

      //console.log('Formatted Date:', formattedDate);
      res.render("order_allOrders", { data: results });
    }
  });
});

//confirm order
app.get("/confirmorder/:sno", (req, res) => {
  var sno = req.params.sno;
  const status1 = "Confirmed";
  const sql = "UPDATE orders SET status=? WHERE sno=?";
  con.query(sql, [status1, sno], function (err, results) {
    if (err) {
      console.error("Error updating record:", err);
    } else {
      let qry = "SELECT * FROM orders;";
      con.query(qry, (err, results) => {
        if (err) throw err;
        else {
          res.render("order_allOrders", { data: results });
        }
      });
    }
  });
});

//all order table/cancel order
app.get("/cancelorder/:sno", (req, res) => {
  var sno = req.params.sno;
  const status1 = "Cancelled";
  const sql = "UPDATE orders SET status=? WHERE sno=?";
  con.query(sql, [status1, sno], function (err, results) {
    if (err) {
      console.error("Error updating record:", err);
    } else {
      let qry = "SELECT * FROM orders;";
      con.query(qry, (err, results) => {
        if (err) throw err;
        else {
          res.render("order_allOrders", { data: results });
        }
      });
    }
  });
});

app.get("/orderdispatched/:sno", (req, res) => {
  var sno = req.params.sno;
  const status1 = "Dispatched";
  const sql = "UPDATE orders SET status=? WHERE sno=?";
  con.query(sql, [status1, sno], function (err, results) {
    if (err) {
      console.error("Error updating record:", err);
    } else {
      let qry = "SELECT * FROM orders;";
      con.query(qry, (err, results) => {
        if (err) throw err;
        else {
          res.render("order_allOrders", { data: results });
        }
      });
    }
  });
});

app.get("/orderdDeliver/:sno", (req, res) => {
  var sno = req.params.sno;
  const status1 = "Delivered";
  const sql = "UPDATE orders SET status=? WHERE sno=?";
  con.query(sql, [status1, sno], function (err, results) {
    if (err) {
      console.error("Error updating record:", err);
    } else {
      let qry = "SELECT * FROM orders;";
      con.query(qry, (err, results) => {
        if (err) throw err;
        else {
          res.render("order_allOrders", { data: results });
        }
      });
    }
  });
});

app.get("/orderpaid/:sno", (req, res) => {
  var sno = req.params.sno;
  const payment1 = "Paid";
  const sql = "UPDATE orders SET payment=? WHERE sno=?";
  con.query(sql, [payment1, sno], function (err, results) {
    if (err) {
      console.error("Error updating record:", err);
    } else {
      let qry = "SELECT * FROM orders;";
      con.query(qry, (err, results) => {
        if (err) throw err;
        else {
          res.render("order_allOrders", { data: results });
        }
      });
    }
  });
});

app.get("/order_Cancelled", (req, res) => {
  let qry = "SELECT * FROM orders where status='cancelled';";
  con.query(qry, (err, results) => {
    if (err) throw err;
    else {
      res.render("order_Cancelled", { data: results });
    }
  });
});

//Charactrestics
app.get("/products_allCharactrestics", (req, res) => {
  let qry = "select * from characterstics;";
  con.query(qry, (err, results) => {
    if (err) throw err;
    else {
      res.render("products_allCharactrestics", { data: results });
    }
  });
});

app.get("/products_addCharactrestics", (req, res) => {
  res.render("products_addCharactrestics");
});

app.get("/addCharactrestics", (req, res) => {
  const { type, materials, weight, size, waterproof, washing, uv_protection } =
    req.query;
  con.connect(function (err) {
    var sql =
      "INSERT INTO characterstics (type, materials, weight,size,waterproof,washing,uvprotection) VALUES (?,?,?,?,?,?,?)";
    con.query(
      sql,
      [type, materials, weight, size, waterproof, washing, uv_protection],
      function (err, results) {
        console.log(results);
        if (err) {
          throw err;
        }
        res.render("products_addCharactrestics", { mesg: true });
      }
    );
  });
});

//edit Charactristics
app.get("/editChar/:id", (req, res) => {
  var id = req.params.id;
  console.log(id);
  let qry = "SELECT * FROM characterstics where id= ?;";
  console.log("EditQuery-->", qry);
  con.query(qry, [id], (err, results) => {
    if (err) throw err;
    else {
      res.render("product_editCharactrestics", { data: results });
      console.log(results);
    }
  });
});

app.get("/updateChar", (req, res) => {
  const {
    type,
    materials,
    weight,
    size,
    waterproof,
    washing,
    uv_protection,
    id,
  } = req.query;

  const updateQuery1 =
    "UPDATE characterstics SET type=?,materials=?,weight=?,size=?,waterproof=?,washing=?,uvprotection=? where id = ?";

  const updateQuery =
    "UPDATE characterstics SET type = ?, materials = ?, weight = ?, size = ?, waterproof = ? washing =?, uv_protection =?  WHERE id = ?";
  const selectQuery = "SELECT * FROM characterstics";
  con.query(
    updateQuery1,
    [type, materials, weight, size, waterproof, washing, uv_protection, id],
    (updateErr, updateResults) => {
      if (updateErr) {
        throw updateErr;
      }

      con.query(selectQuery, (selectErr, selectResults) => {
        if (selectErr) {
          throw selectErr;
        }
        res.render("products_allCharactrestics", { data: selectResults });
        console.log(selectResults);
      });
    }
  );
});

app.get("/deleteChar/:id", (req, res) => {
  var id = req.params.id;
  console.log("ID-->", id);
  let deleteQry = "DELETE FROM characterstics WHERE id = ?";
  console.log("DeleteQry-->", deleteQry);
  con.query(deleteQry, [id], (err, results) => {
    if (err) throw err;
    else {
      console.log("delete");
      let selectQry = "SELECT * FROM characterstics;";
      con.query(selectQry, (err, results) => {
        if (err) throw err;
        else {
          res.render("products_allCharactrestics", {
            data: results,
            mesg2: true,
          });
        }
      });
    }
  });
});

app.get("/products_sku", (req, res) => {
  let qry = "select * from variation;";
  con.query(qry, (err, results) => {
    if (err) throw err;
    else {
      res.render("products_sku", { data: results });
      console.log(results);
    }
  });
});
//edit Charactristics
app.get("/editvariation/:id", (req, res) => {
  var id = req.params.id;
  console.log(id);
  let qry = "SELECT * FROM variation where id= ?;";
  console.log("EditQuery-->", qry);
  con.query(qry, [id], (err, results) => {
    if (err) throw err;
    else {
      res.render("product_editsku", { data: results });
      console.log(results);
    }
  });
});

app.get("/updatevariation", (req, res) => {
  const {
    type,
    materials,
    weight,
    size,
    waterproof,
    washing,
    uv_protection,
    id,
  } = req.query;

  const updateQuery1 =
    "UPDATE variation SET type=?,materials=?,weight=?,size=?,waterproof=?,washing=?,uvprotection=? where id = ?";

  const updateQuery =
    "UPDATE variation SET type = ?, materials = ?, weight = ?, size = ?, waterproof = ? washing =?, uv_protection =?  WHERE id = ?";
  const selectQuery = "SELECT * FROM variation";
  con.query(
    updateQuery1,
    [type, materials, weight, size, waterproof, washing, uv_protection, id],
    (updateErr, updateResults) => {
      if (updateErr) {
        throw updateErr;
      }

      con.query(selectQuery, (selectErr, selectResults) => {
        if (selectErr) {
          throw selectErr;
        }
        res.render("products_sku", { data: selectResults });
        console.log(selectResults);
      });
    }
  );
});

app.get("/deletevariation/:id", (req, res) => {
  var id = req.params.id;
  let deleteQry = "DELETE FROM variation WHERE id = ?";
  con.query(deleteQry, [id], (err, results) => {
    if (err) throw err;
    else {
      let selectQry = "SELECT * FROM variation;";
      con.query(selectQry, (err, results) => {
        if (err) throw err;
        else {
          res.render("products_sku", { data: results, mesg2: true });
        }
      });
    }
  });
});

//userdata
app.get("/user_allUsers", (req, res) => {
  let qry = "select * from users;";
  con.query(qry, (err, results) => {
    if (err) throw err;
    else {
      res.render("user_allUsers", { data: results });

      console.log(results);
    }
  });
});

//cart  detailscart/{{id}}
app.get("/productInCart_all", (req, res) => {
  let qry = "select * from cart;";
  con.query(qry, (err, results) => {
    if (err) throw err;
    else {
      res.render("productInCart_all", { data: results });

      console.log(results);
    }
  });
});

//pending
app.get("/addcart", (req, res) => {
  const { name, descr, profileImage, status, tag } = req.query;
  con.connect(function (err) {
    var sql =
      "INSERT INTO category (name, descr, img,status,tag) VALUES (?,?,?,?,?)";

    con.query(
      sql,
      [name, descr, profileImage, status, tag],
      function (err, results) {
        console.log(results);
        if (err) {
          throw err;
        }
        console.log("1 record inserted");
        res.render("productInCart_all", { mesg: true });
      }
    );
  });
});

//edit category
app.get("/editcart/:id", (req, res) => {
  var id = req.params.id;
  console.log(id);
  let qry = "SELECT * FROM cart where id= ?;";
  console.log("EditQuery-->", qry);
  con.query(qry, [id], (err, results) => {
    if (err) throw err;
    else {
      res.render("productInCart_edit", { data: results });

      console.log(results);
    }
  });
});

app.get("/updatecart", (req, res) => {
  const { name, color, size, userid, mrp, sp, img, id } = req.query;
  console.log("AfterUpdate-->", id);

  const updateQuery =
    "UPDATE category SET name = ?, color = ?, size = ?, userid = ?, mrp = ?, sp=? img=? WHERE id = ?";
  const selectQuery = "SELECT * FROM category";

  con.query(
    updateQuery,
    [name, color, size, userid, mrp, sp, img, id],
    (updateErr, updateResults) => {
      if (updateErr) {
        throw updateErr;
      }

      console.log("Update successful");

      con.query(selectQuery, (selectErr, selectResults) => {
        if (selectErr) {
          throw selectErr;
        }

        console.log("Select successful");

        res.render("productInCart_all", { data: selectResults });
      });
    }
  );
});

app.get("/deletecart/:id", (req, res) => {
  var id = req.params.id;
  console.log("ID-->", id);
  let deleteQry = "DELETE FROM cart WHERE id = ?";
  console.log("DeleteQry-->", deleteQry);
  con.query(deleteQry, [id], (err, results) => {
    if (err) throw err;
    else {
      console.log("delete");
      let selectQry = "SELECT * FROM cart;";
      con.query(selectQry, (err, results) => {
        if (err) throw err;
        else {
          res.render("productInCart_all", { data: results, mesg2: true });
        }
      });
    }
  });
});

app.listen(port, (err) => {
  if (err) throw err;
  else console.log("Server is running at port %d:", port);
});
