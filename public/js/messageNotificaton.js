const socket = io.connect();

socket.on("claimNotification", ({ userName }) => {
  Swal.fire({
    position: "top-end",
    icon: "success",
    title: `${userName} has sent you a notification`,
    showConfirmButton: false,
    timer: 1500,
  });
});
