const express = require("express")
const bodyParser = require("body-parser")
var mongoose = require("mongoose")
const ejs=require('ejs');
const app = express();
var fs = require('fs');
var path = require('path');
require('dotenv/config');
//var popup=require('popups');
const stripe = require('stripe')('sk_test_51M7IoOSGHNdj06JRPfm98NsGBTnxO8XjdLIdx5wYeixCf73Y8peGwzfXVDHBbQWbF7c6DZM3Cq56Mj1H83Sy8DTp00EAf646Et')
let alert = require('alert'); 
app.set('view engine','ejs');
app.engine('html',require('ejs').renderFile)
app.use(express.static('./views'));
app.set('views',"./views");
app.use(bodyParser.json())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({
    extended:true
}))

mongoose.connect('mongodb://localhost:27017/bus',{
    useNewUrlParser: true,
    useUnifiedTopology: true
});
app.use(bodyParser.urlencoded({ extended: false }))

var db = mongoose.connection;
db.on('error',()=>console.log("Error in Connecting to Database"));
db.once('open',()=>console.log("Connected to Database"))

app.get("/",(req,res)=>{
    
    return res.redirect('index.html');
});

//signup


app.get("/sign_up",function(req,res){
    res.redirect("register.html");
})

 var email;
 var name;
app.post("/sign_up",(req,res)=>{
     name = req.body.name;
     var phone= req.body.phone;
    email = req.body.email;
   
    var password = req.body.password;
    var conpassword=req.body.conpassword;
    var data = {
        "name": name,
        "phone":phone,
        "email" : email,
        "password" : password,
        "code":1
    }

    db.collection('users').insertOne(data,(err,collection)=>{
        if(err){
            throw err;
        }
        if(password==conpassword){
        console.log("Record Inserted Successfully");
        }
        else{
        alert("Password and the conform password are wrong");
        }
    });

    return res.redirect('welcome.html')

})
//login
const usersSchema={
    name:String,
    phone:String,
    email:String,
    password:String,
    code:Number
}
const User= mongoose.model('User',usersSchema);
app.get("/loginDetails", function (req, res) {
    res.redirect("login.html");
});
 var email;
 var password;
app.post("/loginDetails", function(req, res) {
    email=req.body.email;
     password=req.body.password;
     checkpass(req,res,email,password)
})
app.get('/login',checkpass);
function checkpass(req,res,email,password){
    mongoose.model('User').findOne({email:email,password:password}).then(users=>{
        console.log(users);
		if(users!= null){
            console.log(users.password);
            console.log("Done Login");
            mongoose.model('User').updateOne({email:email},{$set:{code:1}}).then(users=>{  
                console.log("Record Inserted Successfully");
})              

                res.redirect('index.html')
				
			}      
        else{
			console.log("failed");
            res.redirect('login.html')
		}
	});
};

//profile
app.get('/',(req,res)=>{
    res.render('profile');
})

app.get("/profile",(req,res)=>{
    User.find({email:email,code:1}).then(users=>{
        console.log(email);
       res.render('profile',{
        usersList:users}
       
       )

    })
})

//searching
const busesSchema={
    busid:String,
    busname:String,
    boarding:String,
    dropping:String,
    start:String,
    reach:String,
    bustype:String,
    availableseats:String,
    seatid:String,
    bplaces:String,
    dplaces:String
}
const Bus = mongoose.model('Bus',busesSchema);
app.get('/check',function(req,res){
    res.redirect("index.html");
});
var from,to;
var time,date;
app.post("/check",function(req,res){
    from=req.body.selectpicker;
    to  =req.body.selectpicker1;
    time=req.body.selectpicker2;
    date=req.body.date;
    checkdetail(req,res,from,to,time)
  
})
var bid;
var available;
app.get('/index',checkdetail);
function checkdetail(req,res,from,to,time){
    db.collection('users').findOne({email:email,code:1}).then(users=>{
        if(users!=null){
    Bus.findOne({boarding:from,dropping:to,start:time}).then(buses=>{
        console.log(buses);
        //for(var i=0;i<buses.bplaces;i++){
          //  console.log(buses.bplaces[i]);
        //}
        console.log(buses.bplaces);
        if(buses!= null){
            bid=buses.busid;
            available=buses.availableseats;
            console.log(bid);
            console.log(available);
            console.log(buses.start);
            console.log('buses available');
            res.redirect('book');
        }
        else{
          alert('No bus available');
           console.log('no buses');
           res.redirect('index.html');
        }
    });
}
else{
    res.redirect('login.html')
}
})
};
const detailsSchema={
    seatid:[String],
    busid:String,
    email:String,
    amount:Number,
    ticketscount:Number,
    traveldate:Date
}

const Detail = mongoose.model('Detail',detailsSchema);
//booking
app.get('/book',(req,res)=>{
      Detail.find({busid:bid}).then(details=>{
        res.render('book',{
            detailsList:details
        })
      })
})
//feedback
app.get("/feedback",function(req,res){
    res.redirect('index.html');
})
app.post("/feedback",function(req,res){
    var name=req.body.name;
    var phone=req.body.phone;
    var comment=req.body.comment;
    var data={
        "name":name,
        "email":email,
        "contact":phone,
        "comment":comment
    }
    db.collection('feedbacks').insertOne(data,(err,collection)=>{
        if(err){
            throw err;
        }
        console.log("Record inserted successfully");
    })
    return res.redirect('index.html');
})

//booking
const checksSchema={
    busid:String,
    seatid:String,
}
const Check = mongoose.model('Check',checksSchema);
app.get('/book',function(req,res){
    Check.find({busid:bid}).then(checks=>{
        if(checks!=null){
            console.log("hello");
            console.log(checks.seatid);
        }

    })
    res.redirect("book.html");
})
var totalbook=[];
var amount=600;
var totalamount=0;
var c=0;
var bookid=[];
app.post("/book1",(req,res)=>{
    
    var id=req.body.id;
    bookid.push(id);
    totalbook.push(id);
    for(var i=0;i<bookid.length;i++){
        c=c+1;
    }
     totalamount = amount * c; 
     console.log(id);
    var data={
        "seatid":id,
        "busid":bid,
        "email":email,
        "amount":totalamount,
        "ticketscount":c,
        "traveldate":date,

    }
    console.log('welcome');
    db.collection('details').insertOne(data,(err,collection)=>{
        if(err){
            throw err;
        }
        else{
        console.log("record inserted successfully")     
        }
    });
return res.redirect('checkout');
})

//dispaly


app.get('/checkout',function(req,res){
    Detail.find({busid:bid,email:email}).then(details=>{
        console.log("quunnb");
        for(var i=0;i<details.seatid;i++){
        console.log(details.seatid[i]);
        }
            res.render('checkout',{detailsList:details,
            })
    })
})
app.post('/display1',function(req,res){
    var name=req.body.name;
    var phone=req.body.phone;
    var gender=req.body.selectpicker3;
    var age=req.body.phone
    var bookingdate=new Date()
    var boarding=req.body.selectpicker4;
    var drop=req.body.selectpicker5;
    var payment=req.body.selectpicker6;
    console.log('welcome');
    var data={
        "seatid":bookid,
        "busid":bid,
        "email":email,
        "amount":totalamount,
        "ticketscount":c,
        "traveldate":date,
         "name":name,
         "phone":phone,
         "gender":gender,
         "age":age,
         "bookingdate":bookingdate,
         "boardingpoint":boarding,
         "dropping":drop,
         "paymentmode":payment,
         "start":time
    }
    db.collection('checkings').insertOne(data,(err,collection)=>{
        if(err){
            throw err;
        }
        else{
        console.log("record inserted successfully")     
        }
    });
    return res.render('payment.html');
})
app.post("/charge", (req, res) => {
    try {
      stripe.customers
        .create({          
          email: req.body.email,
          source: req.body.stripeToken
        })
        .then(customer =>{
          return stripe.charges.create({
            amount: req.body.amount * 100,
            currency: "usd",
            customer: customer.id
          })
        })
        .then( victory(req,res))        
        .catch(err => console.log(err));
    } catch (err) {
      res.send(err);
}
});
const checkingsSchema={ 
    seatid:[String],
    busid:String,
    email:String,
    amount:Number,
    ticketscount:Number,
    traveldate:Date,
    name:String,
    phone:String,
    gender:String,
    age:String,
    bookingdate:Date,
    boardingpoint:String,
    dropping:String,
    paymentmode:String,
    start:String,
}
const Checking = mongoose.model('Checking',checkingsSchema);
app.get('/success',function(req,res){
    Checking.find({email:email}).then(checkings=>{
       // console.log("quunnb");
        for(var i=0;i<details.seatid;i++){
        console.log(details.seatid[i]);
        }
            res.render('success',{checkingsList:checkings,
            })
    })
})

app.get('/',(req,res)=>{
    res.render('success');
})
var availableseats;
app.get('/payment',victory)
function victory(req,res)
{
    availableseats=available-c;
    console.log(c);
    console.log(availableseats);
    Bus.updateMany({busid:bid},{$set:{availableseats:availableseats}}).then(buses=>{  
        console.log("record updated successfully");
       
    })
   Checking.find({email:email}).then(checkings=>{
        res.render('success',{checkingsList:checkings,
        })
})
}
//update profile
app.get('/',(req,res)=>{
    res.render('update.html');
})
app.post("/update_pro",(req,res)=>{
    var name=req.body.name;
    var number = req.body.number;
    var newpass = req.body.new_pass;
    var password=req.body.confirm_pass;
    if(newpass == password){
    db.collection('users').updateOne({email:email},{$set:{name:name,phone:number,password:password}}).then(users=>{
        console.log("Record updated Successfully");
    });
    User.find({email:email,code:1}).then(users=>{
        console.log(email);
       res.render('profile',{
        usersList:users}
       
       )

    })
}
})

//logout
app.post('/logo',(req,res)=>{
    logopage(req,res)
})
app.get('/logout',logopage)
function logopage(req,res){
    mongoose.model('User').updateOne({email:email},{$set:{code:0}}).then(users=>{
        console.log(email);
        console.log('hello')
    })
    res.redirect('index.html');
}

var port = process.env.PORT || 5091;
app.listen(port, function () {
    console.log("Server Has Started!");
});