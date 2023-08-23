const ort = require('onnxruntime-node');
const fs = require('fs');

//Constants
const PREPROCESSED_DATA_DIMS = [1,3,1024,1024];

//Input file
const filename = "b44457a5-3923-4b6c-902e-d31de6e6fe0b-058f3533-0429-46fd-97aa-fb9ccb1203e5.csv";
const input = fs.readFileSync(`C:/tmp/${filename}`, "utf-8")
const array = new Float32Array(input.split(','));
const input_data = new ort.Tensor("float32", array, PREPROCESSED_DATA_DIMS);

//Attempt text detection
console.time("detect");
ort.InferenceSession.create('./assets/onnx/comictextdetector.pt.onnx').then(session => {
    console.log("inputnames are ", session.inputNames);
    console.log("outputnames are ", session.outputNames);

    const feeds = { images: input_data }
    session.run(feeds).then(results => {
        console.log("results are ", results);
        console.timeEnd("detect"); //Takes 30 seconds! too long! 
    });
});

// Experiments on hold indef until a more performant model can be found... 
// Right now it takes about 30 seconds per image on cpu
// Could look into making another model but that'll be a huge effort compared to alternatives. 