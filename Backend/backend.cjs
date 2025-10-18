const express = require('express')
const cors = require('cors')
// const bodyParser = require('body-parser')
const app = express()
const MongoClient = require('mongodb').MongoClient

const db_url="" // You can enter a mongodb url here, preferably by using dotenv
// app.use(bodyParser.json())
app.use(express.text())
// app.use(bodyParser.urlencoded({extended: true}))
app.use(cors())

client= new MongoClient(db_url)

async function dbConnect(){
    try{
        await client.connect()
        var dbo = client.db('flappio')

        var leaderboard = dbo.collection("leaderboard")
    
        scores_get = async function ()  {
            console.log("Retrieving Leaderboard")
            return await (await leaderboard.find(
                {},
                {sort: {score: -1}, projection: {_id: 0, IP: 1, score: 1}} // retireves only scores
            )).toArray()
        } 
        
        scores_getOne = function (IP) {
            console.log("Retrieving Item")
            let lead = leaderboard.find(
                { IP: IP },
                {} // dd
            )
            console.log(lead)
            return lead
        }

        scores_update = async function (IP, score) {
            let record = await (scores_getOne(IP).toArray());
            console.log("HERE BE THE RECORD", record)
            if (record.length) {
                console.log("HERE BE THE OLD SCORE", record[0].score)
                if (score < record[0].score) {
                    console.log("THYNE SCORES ARE THUSLY BELOW")
                    return;
                }
            }
            console.log("Changing score")
            await leaderboard.updateOne(
                {IP: IP},
                {$set: {
                    score: score
                }},
                {upsert: true}
            )
        }

        console.log("Database is connected!")

        
        app.get('/leaderboard', (req, res) => {
            console.log("Got request to leaderboard")
            console.log(req.headers['origin'], req.headers)
            let ip = req.headers['origin']
        
            scores_get().then((val) => {
                console.log(val)
                res.status(200).send(JSON.stringify(val))
            })
        })
        
        app.post('/leaderboard', (req, res) => {
            // console.log("Got request to leaderboard")
            // console.log(req.headers['origin'], req.headers)
            let ip = req.headers['origin']
            console.log("REQ BODY:", req.body, req.headers)
        
            console.log(req)
        
            scores_update(ip, Number(req.body)).then(() =>
                res.status(200).send(`Did request for ${ip}`)
            )
        })
        
        app.get('/', (req, res) => {
            console.log("Got request to ROOT:", req)
            res.send("Recieved request")
        })
        
        app.listen(3001, '0.0.0.0', () => {
            console.log("The Server is Up!")
        })
    }
    catch(e){
        console.log("Error connecting to database: ",e)
    }
}

dbConnect()
