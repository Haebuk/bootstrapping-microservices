const express = require('express');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const app = express();

if (!process.env.PORT) {
    throw new Error("Please specify the port number for the HTTP server with the environment variable PORT");
}
// if (!process.env.AWS_ACCESS_KEY_ID) {
//     throw new Error("AWS ACCESS KEY ID needed");
// }
// if (!process.env.AWS_SECRET_ACCESS_KEY) {
//     throw new Error("AWS SECRET ACCESS KEY needed");
// }


const PORT = process.env.PORT;
const client = new S3Client({
    region: 'ap-northeast-2',
    // accesskeyId: process.env.AWS_ACCESS_KEY_ID,
    // secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

app.get("/video", (req, res) => {

    const videoPath = req.query.path;
    console.log(`Streaming video from path ${videoPath}.`);

    const command = new GetObjectCommand({
        Bucket: "bootstrapping-microservices-example",
        Key: "videos/SampleVideo_1280x720_1mb.mp4"
    })

    resp = client.send(command, function (err, properties) {
        if (err) {
            console.error(`Error occurred getting properties for video ${params.Bucket}/${params.Key}.`);
            console.error(err && err.stack || err);
            res.sendStatus(500);
            return;
        }

        res.writeHead(200, {
            "Content-Length": properties.contentLength,
            "Content-Type": "video/mp4"
        })
    })
    console.log(resp)
    res.pipe(resp)
});

app.listen(PORT, () => {
    console.log("Microservice online")
})