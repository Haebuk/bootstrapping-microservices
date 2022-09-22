const express = require('express');
const mongodb = require('mongodb');
const bodyParser = require('body-parser');
const amqp = require('amqplib');

if (!process.env.DBHOST) {
    throw new Error("Please specify the database host using environment variable DBHOST");
}

if (!process.env.DBNAME) {
    throw new Error("Please specify the database name using environment variable DBNAME");
}

if (!process.env.RABBIT) {
    throw new Error("Please specify the RabbitMQ host using environment variable RABBIT");
}

const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;
const RABBIT = process.env.RABBIT;

function connectDb() {
    return mongodb.MongoClient.connect(DBHOST)
        .then(client => {
            return client.db(DBNAME);
        });
}

function connectRabbit() {
    console.log(`Connecting to RabbitMQ at ${RABBIT}`);

    return amqp.connect(RABBIT)
        .then(messagingConnection => {
            console.log("Connected to RabbitMQ");
            return messagingConnection.createChannel();
        });
}

function setupHandlers(app, db, messageChannel) {
    const videoCollection = db.collection("videos");

    function consumeViewedMessage(msg) {
        console.log("Received a 'viewed' message");

        const parsedMsg = JSON.parse(msg.content.toString());

        return videoCollection.insertOne({ videoPath: parsedMsg.videoPath })
            .then(() => {
                console.log("Acknowledging message was handled");
                messageChannel.ack(msg);
            });
    }

    return messageChannel.assertQueue("viewed", {})
        .then(() => {
            console.log("Asserted that the 'viewed' queue exists");
            return messageChannel.consume("viewed", consumeViewedMessage);
        })
}


function startHttpServer(db) {
    return new Promise(resolve => {
        const app = express();
        app.use(bodyParser.json());
        setupHandlers(app, db, messageChannel);

        const port = process.env.PORT && parseInt(process.env.PORT) || 3000;
        app.listen(port, () => {
            resolve();
        });
    });
}

function main() {
    console.log("Hello World!");

    return connectDb()
        .then(db => {
            return connectRabbit()
                .then(messageChannel => {
                    return startHttpServer(db, messageChannel);
                });
        });
}

main()
    .then(() => console.log("Microservice online."))
    .catch(err => {
        console.error("Microservice failed to start.");
        console.error(err && err.stack || err);
    });