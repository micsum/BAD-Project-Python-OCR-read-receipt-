let image = document.getElementById("image");
let outputButton = document.getElementById("crop");
let rotateButton = document.getElementById("rotate");
let rotate = false;

const cropper = new Cropper(image, {
  aspectRatio: 0,
  viewMode: 0,
});
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function rotatePhoto() {
  cropper.rotate(5);
  await sleep(80);
  if (rotate) {
    await rotatePhoto();
  }
}

outputButton.addEventListener("click", function () {
  console.log(image.getAttribute("src"));
  let outputImage = cropper.getCroppedCanvas().toDataURL(image.src);
  document.getElementById("output").src = outputImage;
});

rotateButton.addEventListener("click", async function () {
  rotate = !rotate;
  rotateButton.innerText = rotate ? "Stop" : "Rotate";
  await rotatePhoto();
});
