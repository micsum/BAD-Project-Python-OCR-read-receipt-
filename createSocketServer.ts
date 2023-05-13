import { io } from "./server";

export function createSocketServer() {
  io.on("connection", function (socket) {
    socket.on("joinSocketRoom", function ({ roomName }) {
      socket.join(roomName);
    });
    socket.on("leaveSocketRoom", function ({ roomName }) {
      socket.leave(roomName);
    });
    socket.on("disconnect", function () {
      console.log("disconnected");
    });
  });
}
