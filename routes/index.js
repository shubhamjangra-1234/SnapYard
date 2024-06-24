var express = require("express");
var app = express();
var router = express.Router();
const userModel = require("./users");
const postModel = require("./posts");
const passport = require("passport");

const upload = require('./multer');
const localStrategy = require("passport-local");

passport.use(new localStrategy(userModel.authenticate()));


router.get("/", function (req, res) {
  console.log(req.flash('error'));
  res.render("login",{error: req.flash('error')});
});
router.get('/signup', function(req, res, next) {
  res.render("signup");
});
router.get("/profile", isLoggedIn,async function (req, res,next) {
  const user =
   await userModel
   .findOne({username:req.session.passport.user})
   .populate("posts");
  res.render("profile",{user});
});
router.get("/show/posts", isLoggedIn,async function (req, res,next) {
  const user =
   await userModel
   .findOne({username:req.session.passport.user})
   .populate("posts");
  res.render("show",{user});
});
router.get("/feed", isLoggedIn,async function (req, res,next) {
  const user = await userModel.findOne({username:req.session.passport.user})
   var posts = await postModel.find().populate("user");
  res.render("feed",{user,posts});
});
router.get("/add", isLoggedIn,async function (req, res,next) {
  const user = await userModel.findOne({username:req.session.passport.user});
  res.render("add",{user});
});
router.post("/newPost", isLoggedIn,upload.single("image"),async function (req, res,next) {
  const user = await userModel.findOne({username:req.session.passport.user});
  const post = await postModel.create({
    user: user._id,
    caption:req.body.caption,
    description:req.body.description,
    image:req.file.filename,
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile")
});
//register route
router.post("/register", function (req, res) {
  var userData = new userModel({
    email: req.body.email,
    fullName: req.body.fullName,
    username: req.body.username,
    password:req.body.password,
  });

  userModel
    .register(userData, req.body.password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
        res.redirect("/feed");
      });
    });
});
//code for login
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/feed",
    failureRedirect: "/login",
    failureFlash: true,
  }),
  function (req, res) {}
);
// code for logout

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) return next(err);
    res.redirect("/");
  });
});

//code for isLoggedIn Middleware

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}
router.post('/fileUpload',isLoggedIn,upload.single('image'),async function (req,res,next) {
  if(!req.file){
    return res.status(400).send ('no files were uploaded.');
  }
  const user = await userModel.findOne({username:req.session.passport.user});
   user.profileImage = req.file.filename;
 await user.save();
 res.redirect("/feed");
})
router.get("/:username", function (req, res) {
  res.send(`${req.params.username} page is not built yet`);
});
module.exports = router;
