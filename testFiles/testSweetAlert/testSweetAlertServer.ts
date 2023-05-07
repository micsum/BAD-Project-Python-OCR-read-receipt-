import express, { Response, Request, NextFunction } from "express";
import path from "path";
import { print } from "listening-on";

const app = express();
app.use(express.json());
app.post("/test", async (req: Request, res: Response) => {
  console.log(req.body.success);
  let success = req.body.success;
  await new Promise((resolve) => {
    setTimeout(resolve, 5000);
  });
  if (success) {
    res.json({});
  } else {
    res.json({ error: "Not Success" });
  }
});
app.use(express.static("testFiles"));

app.use((req, res) => {
  res.status(200);
  res.sendFile(
    path.resolve("testFiles", "testSweetAlert", "testSweetAlert.html")
  );
});

app.use((req, res) => {
  res.status(404);
  res.sendFile(path.resolve("public", "error404.html")); //404 page to be constructed
});

let port = 8105;
app.listen(port, () => {
  print(port);
});
