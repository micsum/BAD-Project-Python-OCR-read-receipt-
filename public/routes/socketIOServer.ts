import { io } from "../../server";

export function createSocketServer() {
  io.on("connection", function (socket) {
    socket.on("init", (userID: string) => {
      socket.join(userID);
    });
    socket.on("disconnect", function () {
      console.log(`${socket.id} disconnected`);
    });
  });
}
