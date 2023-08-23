const ort = require('onnxruntime-node');
const fs = require('fs');

// const filename = localTranslatePayload.entryId + "-" + localTranslatePayload.sectionId + ".csv";
// const tensorData = localTranslatePayload.tensorData.join(',');
// fs.writeFileSync("C:/tmp/" + filename, tensorData)
const input = fs.readFileSync("C:/tmp/9b3391c5-bf93-492c-830b-cf091ddd1680-4b965c13-1c19-4e5b-92d8-7c69e5d90fda.csv", "utf-8")
const array = new Float32Array(input.split(','));
// console.log(input);

//ENCODER ============================ 
// const entryId = localTranslatePayload.entryId;
// const sectionId = localTranslatePayload.sectionId;
// const section = items[entryId]['meta']['sections'].filter(section => section.id === sectionId)[0];
console.log('Attempting to perform local translation of image');
const input_data = new ort.Tensor("float32", array, [
1,
3, 
224,
224,
]);
console.log('input data is of size', input_data.dims);

ort.InferenceSession.create('./assets/onnx/encoder_model.onnx').then(session => {
    console.log(session);
    console.log("input names", session.inputNames);
    console.log("output names", session.outputNames);
    const feeds = { pixel_values: input_data}
    // console.log(feeds);
    session.run(feeds).then(results => {

        // console.log("results are", results, );

        //DECODER ============================
        ort.InferenceSession.create('./assets/onnx/decoder_model.onnx').then(decoderSession => {
            console.log(decoderSession);
            console.log("input names", decoderSession.inputNames);
            console.log("output names", decoderSession.outputNames);
            const input_array = new BigInt64Array([2n]);
    
            //Get corresponding vocab
            const vocab = fs.readFileSync('./assets/onnx/vocab.txt', {encoding: 'utf-8'}).split('\r\n')
    
            const input_ids = new ort.Tensor("int64", input_array, [
            1,
            1
            ]);
            const nextInput = {input_ids:input_ids, encoder_hidden_states: results.last_hidden_state};
            // console.log("Next input is", nextInput);
            
            //First Step
            decoderSession.run(nextInput).then(decodedResults => {
                // console.log("decoded results are", decodedResults);
                // console.log("data is ", decodedResults.logits.data);
        
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
                        console.log("new max: ", currentValue)
                    }
                    }
                    softmax.push(currentIndex % 6144);

                    //Mostly 4s, plus occasional 
                    console.log("Logits are: ", softmax);
                    return softmax;
                }
                
                // console.log(vocab);
                const firstPassResult = softmax(decodedResults.logits.data);
                console.log("Logits are ", decodedResults.logits.dims)
                console.log("First few logits: ",decodedResults.logits.data.slice(0,3));
                console.log("Final output", firstPassResult.map(idx => vocab[idx]).join(''));
                
                
                const secondDecoderRunInput = {
                    input_ids:new ort.Tensor("int64", new BigInt64Array([BigInt(2n),BigInt(2n),BigInt(854n)]), [1,3]), 
                    encoder_hidden_states: results.last_hidden_state,
                };

                //Second step
                console.log("input_id for second run is", secondDecoderRunInput.input_ids);
                decoderSession.run(secondDecoderRunInput).then(secondDecodedResults => {
                    console.log("First few logits: ",secondDecodedResults.logits.data.slice(0,3));
                    const thirdPassResult = softmax(secondDecodedResults.logits.data);
                    console.log("Final output", thirdPassResult.map(idx => vocab[idx]).join(''));
                });
            });
        });
    });
});
