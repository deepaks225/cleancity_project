require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 3000;
const cookieParser = require("cookie-parser");
const { checkForAuthentication } = require("./checkAuth.js");
const userRoute = require("./routes/user.js");
const adminRoute = require("./routes/admin.js");
const { restrictTo } = require("./restrictTo.js");
const user = require("./models/user.js");
const { collectorModel } = require("./models/collector.js");
const collectorRoute = require("./routes/collectorRoute.js");
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
console.log('Views directory contents:');
console.log(fs.readdirSync(path.join(__dirname, 'views')));

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
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});