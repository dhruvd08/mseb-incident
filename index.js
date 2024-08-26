import express from "express";

const app = express();

const port = process.env.port || 3000;
const apiKey = process.env.GOOGLE_MAPS_APIKEY;

app.use(express.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(express.json());

app.get("/", (req, res) => {
    res.render("status.ejs", {apiKey: apiKey});
});

app.post("/report", (req, res) => {
    console.log(req.headers.authorization);
    console.log(req.body);
    res.status(200).json({"success": "Message received"});
});


app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});

