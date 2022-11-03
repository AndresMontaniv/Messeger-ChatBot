const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user');

//login
passport.use('local.login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true,
}, async (req, email, password, done) => {
    const user = await User.findOne({ email });
    if (user) {
        const match = await user.matchPassword(password);
        if (match) {
            done(null, user, req.flash('success', 'Welcome ' + user.name));
        } else {
            done(null, false, req.flash('message', 'Incorrect Password'));
        }
    } else {
        return done(null, false, req.flash('message', 'The account does not exits'));
    }
}));




passport.serializeUser((usr, done) => {
    done(null, usr.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
        done(err, user);
    });
});
