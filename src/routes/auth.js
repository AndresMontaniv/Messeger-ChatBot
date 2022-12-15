const { Router, response } = require('express');
const passport = require('passport');
const { isLoggedIn, isNotLoggedIn } = require('../helpers/auth');
const User = require('../models/user');
const router = Router();

router.get('/signin', isNotLoggedIn, (req, res) => {
    res.render('auth/signin');
});

router.post('/signin', isNotLoggedIn, async (req, res, next) => {
    passport.authenticate('local.login', {
        successRedirect: '/clients/dashboard',
        failureRedirect: '/signin',
        failureFlash: true,
    })(req, res, next);
});

router.post('/signin2', isNotLoggedIn, (req, res) => {
    console.log(req.body);
    res.render('auth/signin');
});

router.get('/signup', isNotLoggedIn, (req, res) => {
    res.render('auth/signup');
});

router.post('/signup', isNotLoggedIn, async (req, res) => {
    let errors = [];
    console.log(req.body);
    const { name, email, password } = req.body;

    if (name.length <= 0) {
        errors.push({ text: 'Name Field is Empty' });
    }
    if (email.length <= 0) {
        errors.push({ text: 'Email Field is Empty' });
    }
    if (password.length < 4) {
        errors.push({ text: 'Passwords must be at least 4 characters.' });
    }

    if (errors.length > 0) {
        return res.render('auth/signup', {
            errors,
            name,
            email,
        });
    }
    // Look for email coincidence
    const userFound = await User.findOne({ email });
    if (userFound) {
        errors.push({ text: 'The Email is already in use.' });
        return res.render('auth/signup', {
            errors,
            name,
            email,
        });
    }

    // Saving a New User
    const newUser = new User({ name, email, password });
    newUser.password = await newUser.encryptPassword(password);
    await newUser.save();
    req.flash('success', 'User Created');
    res.redirect('/signin');
});

router.get('/home', isLoggedIn, (req, res) => {
    res.render('home');
});

router.get('/signout', isLoggedIn, (req, res) => {
    req.logOut();
    res.redirect('/');
});


module.exports = router;