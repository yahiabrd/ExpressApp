var express = require('express');
var router = express.Router();
var user = require('../models/usersModel')
//DB
const mongoose = require('mongoose')
//
const jwt = require('jsonwebtoken');
const accessTokenSecret = 'secretKey';
var sha1 = require('sha1')

mongoose.connect('', {
    useNewUrlParser: true,
    useUnifiedTopology: true 
});
const db = mongoose.connection;
db.once('open', function() {
  console.log("connected to the database")
});

function verifyToken(req, res, next){
  if(!req.headers.authorization){
    return res.status(401).send("Unauthorized request")
  }
  let token = req.headers.authorization.split(' ')[1]
  if(token === 'null'){
    return res.status(401).send("Unauthorized request")
  }
  let payload = jwt.verify(token, accessTokenSecret)
  if(!payload) {
    return res.status(401).send("Unauthorized request")
  }
  // console.log(req.user)
  // req.email = payload.subject
  next()
}

/* GET users listing. */
router.get('/', verifyToken, function(req, res, next) {
  user.find({}, function(err, data){
    if (data) {
      res.send(data)
    }
  })
});

router.get('/get/:email', function(req, res){
  user.findOne({email:req.params.email}, function(err, obj){
    if (err) console.log(err);
    else{
      if (obj != null) {
        newObj = {
          firstName : obj.firstName,
          lastName : obj.lastName,
          email : obj.email
        }
        res.send(newObj)
        res.status(201).end()
     }else{
       res.status(404).end()
     }
    }
  })
})

router.get('/deleteAll', function(req, res){
  user.deleteMany({}).then(function(){
    res.send("Data deleted");
  }).catch(function(error){
    res.send("error")
    console.log(error);
  });
})

router.delete('/delete/:email', function(req,res){
  user.findOne({email:req.params.email}, function(err, obj){
    if(err){
      res.status(400).end();
    }else{
      if(obj != null){
        user.deleteOne({email:obj.email}).then(function(){
          res.status(201).end()
        }).catch(function(error){
          res.status(400).end();
        });
      }else{
        res.status(400).end();
      }
    }
  })
})

router.put('/update', function(req,res){
  console.log(req.body)
  user.findOne({email:req.body.email}, function(err, obj){
    if(err){
      res.status(400).end();
    }else{
      user.updateOne({email:req.body.email},{
        firstName : req.body.firstName,
        lastName : req.body.lastName
      }).then(function(){
        res.status(201).end()
      }).catch(function(error){
        res.status(400).end();
      });
    }
  })
})

router.post('/add', (req, res) => {
  newUser = new user({
    firstName:req.body.firstName,
    lastName:req.body.lastName,
    email:req.body.email,
    password:req.body.password,
  })

  user.findOne({email:newUser.email}, function(err, obj){
    if (obj == null){
      newUser.save((err)=>{
        if (err) {
          res.status(400).end(); //error
        }
        else{
          res.status(201).end()
        }
      })
    }else{
      res.status(403)
      res.send("Email already used")
    }
  })
})

router.post('/login', (req, res)=>{
  e = req.body.email
  p = req.body.password
  if(e != null && p != null){
    user.findOne({email:e}, function(err, obj){
      if(err) res.status(401).end();
      if(obj != null){
        console.log(obj)
        if(obj.password == p && obj.email == e){
          const accessToken = jwt.sign({ email: obj.email }, accessTokenSecret);
          console.log(accessToken)
          res.json({token:accessToken})
          res.status(201)
        }else{
          res.status(401).end()
        }
      }else{
        res.status(401).end()
      }
    })
  }
})


module.exports = router;
