import express, { Response, Request, NextFunction } from "express";
import { print } from "listening-on";
import path from "path";
import cors from "cors";
import socketIO from "socket.io";
import http from "http";

const app = express();

app.use(express.json());
app.use(express.urlencoded());

app.use(cors());

app.use((req, res) => {
  res.status(404);
  res.sendFile(path.resolve("public", "error404.html")); //404 page to be constructed
});

let port = 8105;
app.listen(port, () => {
  print(port);
});
