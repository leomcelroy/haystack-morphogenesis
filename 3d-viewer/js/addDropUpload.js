
let createLayers = () => {};

function readFile(file) {
  var reader = new FileReader();
  reader.readAsText(file);

  reader.onloadend = event => {
    let text = reader.result;
    const paths = text !== "" ? JSON.parse(text) : [];
    createLayers(paths);
  };
}

function upload(files) {
  let file = files[0];
  let fileName = file.name.split(".");
  let name = fileName[0];
  const extension = fileName[fileName.length - 1];

  if (extension === "json") {
    readFile(file);
  } else {
    throw Error("Unknown extension:", extension);
  }

};

function pauseEvent(e) {
  if(e.stopPropagation) e.stopPropagation();
  if(e.preventDefault) e.preventDefault();
  e.cancelBubble=true;
  e.returnValue=false;
  return false;
}

export function addDropUpload(func) {
  createLayers = func;
  window.addEventListener("drop", function(evt) {    
    let dt = evt.dataTransfer;
    let files = dt.files;
    upload(files);

    pauseEvent(evt);
  });

  window.addEventListener("dragover", pauseEvent);
}