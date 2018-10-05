var express = require("express");
var app = express();
// var cookieParser = require("cookie-parser");
var PORT = 8080; // default port 8080
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
var cookieSession = require('cookie-session')

app.use(cookieSession({
  name: 'session',
  keys: ['a cat jumped the fence'],
  // Cookie Options
 // maxAge: 5 * 1000 // 24 hours
}));
app.use(bodyParser.urlencoded({extended: true}));
// app.use(cookieParser());

app.set("view engine", "ejs");

var urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID"
  },
  "9sm5xK": {
    shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    userID: "user2RandomID"
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "test1@g.com",
    password: bcrypt.hashSync("test1", 10)
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "test2@g.com",
    password: bcrypt.hashSync("test2", 10)
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

function urlsForUser(id){
  var urlsForUser = {};
  for(var url in urlDatabase ){
    if(urlDatabase[url].userID === id){
      urlsForUser[urlDatabase[url].shortURL] = {
        shortURL: urlDatabase[url].shortURL,
        longURL: urlDatabase[url].longURL
      }
    }
  }

  return urlsForUser;
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
    urls: urlsForUser(req.session.user_id),
    user: users[req.session.user_id]
  };

  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.session.user_id]
  }

  if(req.session.user_id){
    res.render("urls_new", templateVars);
  }else {
    res.redirect('/login');
  }
})

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
})

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    // username: req.cookies["username"]
    user: users[req.session.user_id]
  };


  let userURL = urlsForUser(req.session.user_id);

  if(!req.session.user_id){
    res.send("You are not logged in, please log in first!");
  }else if(!userURL[req.params.id]){
    res.send("That link does not beong to you, please try again!")
  } else{
    res.render("urls_show", templateVars);
  }

});

app.get("/register", (req, res) => {
  res.render("register");
});

app.get("/login", (req, res) => {
  res.render("login");
})

app.post("/urls", (req, res) => {
  var shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    shortURL: shortURL,
    longURL: req.body.longURL,
    userID: req.session.user_id
  }
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
    let hashedPass = bcrypt.hashSync(password, 10);
    users[userID] = {
      id: userID,
      email: req.body.email,
      password: hashedPass
    };
    req.session.user_id = userID;
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
      if(bcrypt.compareSync(password, users[user].password)){
        correctCred = true;
        req.session.user_id = users[user].id;
        res.redirect('/urls');
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


});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});




