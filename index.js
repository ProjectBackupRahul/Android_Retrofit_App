//  importing the node module .

var mongodb = require ('mongodb');
var ObjectId = mongodb.ObjectID;
var crypto = require ('crypto');

var express = require ('express');
var bodyParser = require ('body-parser');

/// PASSWORD UTILS 
//CREATE FUNCTION TO RANDOM SALT 

  var genRandomString = function(length){
         return crypto.randomBytes(Math.ceil(length/2)).toString('hex')
         .slice(0,length);

  };
   var sha512 = function (password,salt){
      var hash = crypto.createHmac('sha512', salt);
      hash.update(password);
      var value = hash.digest('hex');

      return{
             salt:salt,
             passwordHash:value
      };

   };
    function saltHaspassword (userPassword){
         var salt = genRandomString (16); // Creating 16 Random Character 
         var passwordData = sha512(userPassword,salt)
         return passwordData;

    }
    function checkHashPAssword (userPassword,salt){
          var passwordData = sha512(userPassword,salt); 
          return passwordData;
    }

     //  Creating Express Services 

      var app = express();
      app.use(bodyParser.json());
      app.use(bodyParser.urlencoded({extended:true}));

      // Creating the mongo client 

       var MongoClient = mongodb.MongoClient;

       //  Connection url 

        var url = 'mongodb://localhost:27017' //  27017 is the default port 

        MongoClient.connect(url,{useNewUrlParser:true}, function(err,client){
      if (err)
         console.log ('Unable connect mongoDB server.Error',err)
            else{

                 // Register 

                 app.post('/register',(request,response,next)=>{
                     var post_data = request.body;
                     var plaint_password = post_data.password;
                     var hash_data = saltHaspassword(plaint_password);

                     var password = hash_data.passwordHash;  //Save Password Hash
                     var salt = hash_data.salt;         // Save Salt

                     var name = post_data.name;
                     var email = post_data.email;

                     var inserJson  = {
                         'email' : email,
                         'password' : password,
                         'salt':salt,
                         ' name' : name
                     };
                      var db = client.db ('edmtdevnodejs')

                       // Check exists email 

                       db.collection('user')
                       .find ({'email':email}).count(function(err,number){

                          if (number != 0){

                             response.json('Email Already Exisits');
                              console.log ('Email Already Exists ');
                          }
                             else{
                                         //  Inserting Data 
                                          db.collection ('user')
                                          .insertOne(inserJson,function(error,res){

                                            response.json('Registration Success ');
                                            console.log ('Registration Success');
                                          }) 
                             }
                       })
                 })

                  //  Login

                  app.post('/login',(request,response,next)=>{
                    var post_data = request.body;

                    var email = post_data.email;
                    var userPassword = post_data.password 

                     var db = client.db ('edmtdevnodejs')

                      // Check exists email 

                      db.collection('user')
                      .find ({'email':email}).count(function(err,number){

                         if (number == 0){

                            response.json('Email Not Exisits');
                             console.log ('Email Not Exists ');

                         }
                            else{
                                        //  Inserting Data 

                                         db.collection ('user')
                                        .findOne({'email':email},function(err,user){
                                           var salt = user.salt// Get salt from the user 
                                           var hashed_password = checkHashPAssword(userPassword,salt).passwordHash // Hash Passsword with Salt 
                                           var encrypted_password = user.password ; // get Passsword from the user   

                                           if (hashed_password == encrypted_password){
                                            response.json('Login Success');
                                            console.log ('Login Success');
                                           }
                                            else{
                                                response.json('Wrong Password or Mail ID');
                                                console.log ('Wrong Password or Mail ID');         
                                            }
                                   })
                            }
                      })
                })
             // Start Server 
                app.listen(9090,()=>{
                       console.log ('Connected to MongoDB Server , WebService running on Port 9090');
                })
            }
        });
