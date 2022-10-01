const express = require('express');
const fs = require('fs');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const AWS = require("aws-sdk")

const app = express();

if (!process.env.PORT) {
    throw new Error("Please specify the port number for the HTTP server with the environment variable PORT");
}

const PORT = process.env.PORT;
const client = new S3Client({
    region: 'ap-northeast-2',
});
const command = new GetObjectCommand({
    Bucket: "bootstrapping-microservices-example",
    Key: "videos/SampleVideo_1280x720_1mb.mp4"
})

const run = async () => {
    try {
        // Create a helper function to convert a ReadableStream to a string.
        const streamToString = (stream) =>
            new Promise((resolve, reject) => {
                const chunks = [];
                stream.on("data", (chunk) => chunks.push(chunk));
                stream.on("error", reject);
                stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
            });

        // Get the object} from the Amazon S3 bucket. It is returned as a ReadableStream.
        const data = await client.send(command);
        // Convert the ReadableStream to a string.
        const bodyContents = await streamToString(data.Body);
        // console.log(bodyContents);
        return bodyContents;
    } catch (err) {
        console.log("Error", err);
    }
};


app.get("/video", (req, res) => {

    const videoPath = req.query.path;
    console.log(`Streaming video from path ${videoPath}.`);

    var s3 = new AWS.S3({ region: 'ap-northeast-2', });
    var params = {
        Bucket: "bootstrapping-microservices-example",
        Key: "videos/SampleVideo_1280x720_1mb.mp4"
    };
    res.contentType = "video/mp4";
    res.send(s3.getObject(params).createReadStream())
});

app.listen(PORT, () => {
    console.log("Microservice online")
})