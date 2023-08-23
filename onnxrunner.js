const ort = require('onnxruntime-node');
const fs = require('fs');

//Constants
const PREPROCESSED_DATA_DIMS = [1,3,224,224];
const START_SEQUENCE_DIMS = [1,1];
const MAX_LENGTH = 300;

//Load preprocessed data from file
const input = fs.readFileSync("C:/tmp/9b3391c5-bf93-492c-830b-cf091ddd1680-4b965c13-1c19-4e5b-92d8-7c69e5d90fda.csv", "utf-8")
const array = new Float32Array(input.split(','));
const input_data = new ort.Tensor("float32", array, PREPROCESSED_DATA_DIMS);

//Also load vocab from file
const vocab = fs.readFileSync('./assets/onnx/vocab.txt', {encoding: 'utf-8'}).split('\r\n')

const softmax = (logits) => {
    //SOFTMAX RESULTS
    const softmax = [];
    let currentIndex = 0
    let currentValue = logits[0];
    for(let i = 1; i < logits.length; i += 1) {
    if(i % 6144 == 0) {
        softmax.push(currentIndex % 6144);
        currentIndex = i;
        currentValue = logits[i];
    } else if(currentValue < logits[i]) {
        currentIndex = i;
        currentValue = logits[i];
    }
    }
    softmax.push(currentIndex % 6144);
    return softmax;
}

const runDecoder = (decoderSession, inputFeed) => {
    decoderSession.run(inputFeed).then(results => {
        const newResults = [2n,...softmax(results.logits.data).map(v => BigInt(v))];
        const nextToken = newResults[newResults.length-1];

        if(nextToken !== 3n && newResults.length < MAX_LENGTH) {
            const newIds = new BigInt64Array(newResults);
            const newInput = {
                input_ids: new ort.Tensor("int64", newIds, [1,newResults.length]),
                encoder_hidden_states: inputFeed.encoder_hidden_states
            }
            runDecoder(decoderSession, newInput);
        } else {
            const output = newResults.filter(idx => idx > 14).map(idx => vocab[idx]).join('');
            console.log("Final output:", output);
        }
    })
}

//Load Encoder Model
ort.InferenceSession.create('./assets/onnx/encoder_model.onnx').then(session => {
    const feeds = { pixel_values: input_data}

    //Run Encoder Model
    session.run(feeds).then(results => {

        //Load Decoder Model
        ort.InferenceSession.create('./assets/onnx/decoder_model.onnx').then(decoderSession => {
            const inputIds = new ort.Tensor("int64", new BigInt64Array([2n]), START_SEQUENCE_DIMS);
            const nextInput = {input_ids:inputIds, encoder_hidden_states: results.last_hidden_state};
            runDecoder(decoderSession, nextInput);
        });
    });
});
