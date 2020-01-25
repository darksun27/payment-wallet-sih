const express = require('express');
const app = express();
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended : true}));

mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);
mongoose.connect('mongodb+srv://darksun27:sidrulzbatra1234@cluster0-vvlal.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true, keepAlive : true, }).then(
    () => {
      console.log("Database connection established!");
    },
    err => {
      console.log("Error connecting Database instance due to: ", err);
    }
  );;

// var db = mongoose.connection;

// db.once('open', ()=>{
//     console.log('Database Connected');
// })

var walletSchema = new mongoose.Schema({
    username : { type: String },
    mobile_number : { type : Number, unique : true, required : true },
    card_details : Number,
    amount : { type : Number, default : 0 }
})

var userHistory = new mongoose.Schema({
    mobile_number : Number,
    amount : Number,
    given_to : Number,
    type : {type : String, enum:['ADD', 'PAID']},
})

var UserHistory = mongoose.model('UserHistory', userHistory);
var Wallet = mongoose.model('Payment-Wallet', walletSchema);


app.post("/api/new-entry", (req, res)=>{

    let wallet_details = {
        username : req.body.username,
        mobile_number : req.body.mobile_number,
        card_details : req.body.card_details,
    }
    console.log(req.body);
    Wallet.create(wallet_details, (err, details)=>{
        if(err) {
            console.log("Error Creating Entry!")
            res.status(400);
            res.send("Error");
        }
        else {
            console.log("Successfully Created Entry id: ",details._id);
            res.status(200);
            res.send("Done");
        }
    })
})

app.get("/api/get-history", async (req, res)=> {
    await UserHistory.find({mobile_number : req.body.mobile_number}, (err, details)=> {
        if(err) {
            console.log("Error Creating History");
        }
        else {
            console.log(details);
            res.status(200);
            res.send({history : details});
        }
    });
});

app.post("/api/get-wallet-details", async (req, res)=> {
    await Wallet.find({ mobile_number : req.body.mobile_number }, (err,  details)=> {
        if(err) {
            console.log("Cannot fetch wallet details!");
        }
        else {
            console.log("Wallet details fetched!", details);
            res.send({ wallet : details[0]['amount'] });
        }
    })
})

app.post("/api/spend", async (req, res)=> {
    let wallet_id = {
        mobile_number : req.body.mobile_number
    }
    let wallet_amount = null;
    await Wallet.find(wallet_id, (err, details)=> {
        if(err) {
            console.log("cannot fetch wallet details");
        }
        else {
            wallet_amount = details[0]['amount'];
        }
    });

    if(wallet_amount < req.body.amount) {
        res.status(400);
        res.send("Amount not sufficient!");
    }
    else {
        let flag = 0;
        console.log(typeof(parseInt(req.body.amount),10));
        wallet_amount -= parseInt(req.body.amount, 10);
        console.log(wallet_amount, wallet_id);
        await Wallet.findOneAndUpdate(wallet_id, {amount : wallet_amount}, (err, details)=> {
            if(err) {
                console.log(err, "Error in transaction!");
            }
            else {
                console.log("Transaction Successfull!");
                flag = 1;
            }
        });
        if(flag == 1) {
            let history = {
                mobile_number : req.body.mobile_number,
                amount : req.body.amount,
                given_to : req.body.vendor_id,
                type : 'PAID',
            }
            await UserHistory.create(history, (err, details)=>{
                if(err) {
                    console.log("Error is creating History");
                }
                else {
                    console.log("Successfully Updated User History id: ", details._id);
                }
            })
        }
        res.status(200);
        res.send("Served");
    }
});

app.post("/api/add-amount", async (req, res)=> {
    let wallet_id = {
        mobile_number : req.body.mobile_number,
    }
    let amount_final = null;
    await Wallet.find(wallet_id, (err, details)=> {
        if(err) {
            console.log("Error Fetching Wallet!");
        }
        else {
            amount_final = details[0]['amount'];
        }
    });
    amount_final += parseInt(req.body.amount, 10);
    console.log(amount_final)
    await Wallet.findOneAndUpdate(wallet_id, {amount : amount_final}, (err, details)=>{
        if(err) {
            res.status(400);
        }
        else{
            console.log("Amount Successfully Added");
            res.status(200);
        }
    });
    
    var history = {
        mobile_number : req.body.mobile_number,
        amount : req.body.amount,
        type : 'ADD',
        given_to : req.body.mobile_number,
    }
    await UserHistory.create(history, (err, details) => {
        if(err) {
            console.log(err);
        }
        else {
            console.log("User history updated id: ",details._id);
        }
    })
    res.send("Served");
});

app.get("/", (req, res)=>{
    res.send("Hello World");
})

app.listen(process.env.PORT || 3000, ()=>{
    console.log("Server Running");
});