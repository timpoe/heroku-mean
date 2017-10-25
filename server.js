var express = require("express");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var CONTACTS_COLLECTION = "contacts";

var app = express();
app.use(bodyParser.json());

// link to angular build directory
var distDir = _dirnam + "/dist/";
app.use(express.static(distDir));


// create a database variable outside of the database collection callback to reuse the connection pool in your app... hmm interesting //
var db;

// connect to the database BEFORE starting the application server - makes sense! //
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // save the god damn database object from the callback for oh I don't know REUSE!!!!! //
  db = database;
  console.log("database connection hot n ready");

  // initialize the app like a boss //
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

// contacts API routes will be below //

// generic handler used by all endpoints

function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}
  // this || means returns expression 1 if code can be converted to true, otherwise returns expression 2... thus it returns true if either operand is true....

/*  "api/contacts"
 *  GET: finds all contacts
 *  POST: creates a new contacts
 */

app.get("/api/contacts", function(req, res){
  db.collection(CONTACTS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) { //freak the fuck out //
      handleError(res, err.message, "Failed to get contacts.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/api/contacts", function(req, res) {
  var newContact = req.body;

//in case they didn't enter a new name, you can't post nothing to mongo even if it has low standards //

  if(!req.body.name) {
    handleError(res, "Invalid user input", "Must provide a name.", 400);
  }

// now to really handle writing to the mongo db //

  db.collection(CONTACTS_COLLECTION).insertOne(newContact, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to create new contact.");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});


/*  "/api/contacts/:id"
 *    GET: find contact by id
 *    PUT: update contact by id
 *    DELETE: deletes contact by id
 */

app.get("/api/contacts/:id", function(req, res) {
  db.collection(CONTACTS_COLLECTION).findOne({ _id: new ObjectID(req.params.id) }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get contact");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/api/contacts/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc._id;

  db.collection(CONTACTS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update contact");
    } else {
        updateDoc._id = req.params.id;
        res.status(200).json(updateDoc);
    }
  });
});



app.delete("/api/contacts/:id", function(req, res) {
  db.collection(CONTACTS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete contact");
    } else {
      res.status(200).json(req.params.id);
    }
  });
});
