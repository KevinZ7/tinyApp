//app setup section:
var express = require("express");
var app = express();
var PORT = 8080;
const bcrypt = require('bcrypt');
const bodyParser = require("body-parser");
var cookieSession = require('cookie-session')

app.use(cookieSession({
  name: 'session',
  keys: ['a cat jumped the fence'],
}));
app.use(bodyParser.urlencoded({extended: true}));
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

//Function used to generate a random ID for URLs and Users
function generateRandomString(){
  var alphanumeric = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
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

//all get requests
app.get("/", (req, res) => {
  if(req.session.user_id){
    res.redirect('/urls');
  } else{
    res.redirect('/login');
  }
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
  var urlFound = false;

  for(let url in urlDatabase){

    console.log(`shortURL of current loop: ${urlDatabase[url].shortURL}`);
    console.log(`shortURL of user: ${req.params.shortURL}`);
    if(urlDatabase[url].shortURL === req.params.shortURL){
      urlFound = true;
    }
    console.log(`was the url Found: ${urlFound}`);
  }

  if(urlFound === true){
    let longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  }
  else{
    res.send("Sorry, that shortURL does not seem to exist, please try again!");
  }
})

app.get("/urls/:id", (req, res) => {

  let userURL = urlsForUser(req.session.user_id);

  if(!req.session.user_id){
    res.send("You are not logged in, please log in first!");
  }else if(!userURL[req.params.id]){
    res.send("That link does not beong to you, please try again!")
  } else{
    let templateVars = {
      shortURL: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user: users[req.session.user_id]
    };
    res.render("urls_show", templateVars);
  }

});

app.get("/register", (req, res) => {
    if(req.session.user_id){
    res.redirect('/urls');
  } else{
    res.render("register");
  }
});

app.get("/login", (req, res) => {
  if(req.session.user_id){
    res.redirect('/urls');
  } else{
    res.render("login");
  }
})


//all post requests
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
  const shortURL = req.params.id;
  urlDatabase[shortURL] = {
    shortURL: shortURL,
    longURL: req.body.newURL,
    userID: req.session.user_id
  };
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




