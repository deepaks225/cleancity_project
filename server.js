require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 10000;
const cookieParser = require("cookie-parser");
const { checkForAuthentication } = require("./checkAuth.js");
const userRoute = require("./routes/user.js");
const adminRoute = require("./routes/admin.js");
const { restrictTo } = require("./restrictTo.js");
const user = require("./models/user.js");
const { collectorModel } = require("./models/collector.js");
const collectorRoute = require("./routes/collectorRoute.js");
const path = require("path");
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

app.use(express.static(path.join(__dirname, "public")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/signin", (req, res) => {
    return res.render("users/signin");
})

app.post("/signin", async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (role === "user" || role === 'admin') {
            const token = await user.matchPassword(email, password);
            if (token) {
                res.cookie("token", token);

                if (role === "user") {
                    return res.redirect("/home");
                } else if (role === "admin") {
                    return res.redirect("/admin");
                }
            }
        } else if (role === "collector") {
            const token = await collectorModel.matchPassword(email, password);
            if (token) {
                res.cookie("token", token);
                return res.redirect("/collector/task");
            }
        }
        console.log("Invalid credentials for:", email);
        return res.render("users/signin", { error: "Invalid credentials" });
    } catch (error) {
        console.error("Signin error:", error);
        return res
            .status(500)
            .render("signin", { error: "An error occurred during sign in" });
    }
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(checkForAuthentication("token"));
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public")));

app.use("/", userRoute);
app.use("/admin", restrictTo(["admin"]), adminRoute);
app.use("/collector", restrictTo(["collector", "admin"]), collectorRoute);


// Database connection
mongoose.connect('mongodb+srv://deepaksingh271201:vuH5w36Za61TZBz8@deepaks225.ef371.mongodb.net/?retryWrites=true&w=majority&appName=deepaks225')

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
