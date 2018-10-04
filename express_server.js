var express = require("express");
var app = express();
var cookieParser = require("cookie-parser");
var PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
}

function generateRandomString(){
  var alphanumeric = 'abcdefghijklmnopqrstuvwxyz0123456789';
  var alphanumericArray = alphanumeric.split('');
  var result = '';

  for(let i = 0; i < 6; i++){
    var randomIndex =Math.floor(Math.random() * (alphanumericArray.length));
    result += alphanumericArray[randomIndex];
  }

  return result;
}


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    // username: req.cookies["username"]
    user: users[req.cookies["user_id"]]
  }
  res.render("urls_new", templateVars);
})

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
})

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    // username: req.cookies["username"]
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
})

app.post("/urls", (req, res) => {
  var shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect('/urls/' + shortURL);

});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');

});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect('/urls');
});

app.post("/register", (req, res) => {
  var userID = generateRandomString();
  var email = req.body.email;
  var password = req.body.password;
  var error = false;

  if(!email || !password){
    res.status(400);
    res.send("Sorry, empty email or password field, go back and try again!");
    error = true;
  }

  for(var user in users){
    if(users[user].email == email){
      error = true;
      res.status(400);
      res.send("Sorry that email is already in use, please go back and try again!");
    }
  }

  if(error === false){
     users[userID] = {
      id: userID,
      email: req.body.email,
      password: req.body.password
    };
    res.cookie("user_id",userID);
    res.redirect("/urls");
  }
});

app.post("/login", (req, res) => {
  var emailFound = false;
  var correctCred = false;
  var email = req.body.email;
  var password = req.body.password;

  for(var user in users){
    if(users[user].email === email){
      emailFound = true;
      if(users[user].password === password){
        correctCred = true;
      }
    }
  }

  if(emailFound === false){
    res.status(403);
    res.send("Wrong email, please go back and try again!");
  }
  else if(correctCred === false){
    res.status(403);
    res.send("Wrong password, please go back and try again!");
  }
  else if(correctCred === true){
     res.cookie("user_id",users[user].id);
     res.redirect('/');
  }

  console.log(users);

});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});




