let image = document.getElementById("image");
let outputButton = document.getElementById("crop");
let rotateButton = document.getElementById("rotate");
let angleSlider = document.getElementById("angleSlider");

let rotate = false;

const cropper = new Cropper(image, {
  aspectRatio: 0,
  viewMode: 1,
  autoCropArea: 0,
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

function rotateImageWithAngle(angle) {
  image.style.transform = cropper.rotate(angle);
}

function startAnimation() {
  interval = setInterval(function () {
    angle = angleSlider.value;
    rotateImageWithAngle(angle);
  }, 150);
}

function stopAnimation() {
  clearInterval(interval);
}

let angle = 0;

angleSlider.addEventListener("input", function () {
  cropper.rotate(angleSlider.value - angle);
  angle = angleSlider.value;
  //rotateImageWithAngle(angle);
  //startAnimation;
});
//angleSlider.addEventListener("mousedown", function () {
//  startAnimation();
//});
//angleSlider.addEventListener("mouseup", function () {
//  stopAnimation();
//});
