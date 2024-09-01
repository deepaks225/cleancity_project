function restrictTo(role = []) {
    return function (req, res, next) {
        console.log(req.user)
        if (!req.user) return res.redirect('/signin');
        if (!role.includes(req.user.role)) return res.status(403).send("Unauthorized");

        return next();
    }
}

module.exports = {
    restrictTo,
}
