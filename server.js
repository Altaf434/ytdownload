const express = require('express');
const path = require('path');
const app=express();
const port=3000;
const admin = require('firebase-admin');
const serviceAccount = require('./keys.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://hanessh-bc265-default-rtdb.asia-southeast1.firebasedatabase.app/"
});
const db = admin.database(); 
const { v4: uuidv4 } = require('uuid'); 
require('dotenv').config();
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'fuckmesdfdfsdf';
const SECRET_KEYtp="tppcaskdfj";
const authenticateTokentp = (req, res, next) => {
 
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
}

else if (req.query.token) {
    token = req.query.token;
}
  if (!token) {
      return res.status(403).json({ success: false, message: 'Token is required' });
  }

  
  jwt.verify(token, SECRET_KEYtp, (err, user) => {
      if (err) {
          return res.status(403).json({ success: false, message: 'Invalid or expired token' });
      }

      next();
  });
};
const authenticateToken = (req, res, next) => {
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
}

else if (req.query.token) {
    token = req.query.token;
}
  if (!token) {
      return res.status(403).json({ success: false, message: 'Token is required' });
  }

 
  jwt.verify(token, SECRET_KEY, (err, user) => {
      if (err) {
          return res.status(403).json({ success: false, message: 'Invalid or expired token' });
      }

      next();
  });
};
async function tpcheckUser(username, password) {
  const ref = db.ref('tpusers'); 
  let userFound = false;

  await ref.once('value', (snapshot) => {
      
      snapshot.forEach(childSnapshot => {
          const userData = childSnapshot.val();
          console.log(userData);
          if (userData.username === username && userData.password === password) {
              userFound = true;
          }
      });
  }, (error) => {
      console.error('Error retrieving user data:', error);
  });
  return userFound;
}
async function checkUser(username, password) {
  const ref = db.ref('accusers'); // Reference to the 'users' node in the database
  let userFound = false;
 console.log(password);
  await ref.once('value', (snapshot) => {
      
      snapshot.forEach(childSnapshot => {
          const userData = childSnapshot.val();
          console.log(userData);
          if (userData.username === username && userData.password === password) {
              userFound = true;
          }
      });
  }, (error) => {
      console.error('Error retrieving user data:', error);
  });
  return userFound;
}
 async function adddataToFirebase(comp,count,ctc,type,imgurl) {
  const companyRef = db.ref('companiesdata');
  console.log(comp);

  const companyData = {
    name:comp,
    count: count,
    ctc: ctc,
    type:type,
    imgurl:imgurl
    
  };
  console.log(companyData);

  return companyRef.push(companyData)
    .then(() => {
      console.log('Company data stored successfully!');
      return true; 
    })
    .catch((error) => {
      console.error('Error storing company data:', error);
      return false; 
    });
}
app.use(express.static(path.join(__dirname,'public')));
app.use(express.json());
app.get('/login',(req,res)=>{ res.sendFile(path.join(__dirname,'src','index.html'))});
app.get('/verify',async(req,res)=>{
    
  
    const user=req.query;
  
    const flag=await checkUser(user.username,user.password);
    if(flag)
    {

       const payload = {
        id: user.id, // Unique user ID
        username: user.username, // Username
        nonce: uuidv4() // Generate a random UUID for uniqueness
      };
    
      const options = {
        expiresIn: '1h' // Token expiration time
      };
    
      // Generate the token using the constant secret key
      const token = jwt.sign(payload, SECRET_KEY, options);
      console.log(token);
      res.json({success:true,token:token ,user:user.username});
    }
    else{
      res.json({success:false});
    }

 

});
app.post('/newverify',async(req,res)=>{
    
  
  const user=req.body;
  console.log(user);
  const ref = db.ref('accusers'); // Reference to the 'users' node in the database
  let userFound = false;

  await ref.once('value', (snapshot) => {
      
      snapshot.forEach(childSnapshot => {
          const userData = childSnapshot.val();
          console.log(userData);
          if (userData.username==user.username||userData.email==user.email) {
              userFound = true;
          }
      });
  }, (error) => {
      console.error('Error retrieving user data:', error);
  });
if(userFound)
{
    res.json({userfound:true});
}
else{
  const usersRef = db.ref('accusers'); 
  const newUserRef = usersRef.push(); 
  newUserRef.set({
    username: user.username,
    email: user.email,
    password: user.password // It's better to hash the password before storing
  }).then(() => {
    res.json({userfound:false});
    console.log('User added successfully');
  }).catch((error) => {
    console.error('Error adding user:', error);
  });
}
 
}

);

app.get('/tpverify',async(req,res)=>{
    
  
  const user=req.query;
 
  const flag=await tpcheckUser(user.username,user.password);
  if(flag)
  {
     // Optional: add expiration

     const payload = {
      id: user.id, // Unique user ID
      username: user.username, // Username
      nonce: uuidv4() // Generate a random UUID for uniqueness
    };
  
    const options = {
      expiresIn: '120s' // Token expiration time
    };
  
    // Generate the token using the constant secret key
    const token = jwt.sign(payload, SECRET_KEYtp, options);

console.log(token);
    res.json(JSON.stringify({ success: true, token:token }));
  }
  else{
    res.json(JSON.stringify({success:false}));
  }

});

app.get('/getdata',authenticateToken, async(req, res) => {
  

  const companyRef = db.ref('companiesdata');

  try {
    const snapshot = await companyRef.once('value');
    const data = snapshot.val();
   
    // Convert data to an array for easier processing
    const companies = [];
    for (let key in data) {
      companies.push({
        id: key, // Include the unique ID of the company
        ...data[key], // Spread the company data
      });
    }
 
    res.json(companies); // Send data as JSON response
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  }
});
app.get('/getbdata', authenticateToken,async(req, res) => {
  

  const companyRef = db.ref('branches');

  try {
    const snapshot = await companyRef.once('value');
    const data = snapshot.val();

    // Convert data to an array for easier processing
    const companies = [];
    for (let key in data) {
      companies.push({
        id: key, // Include the unique ID of the company
        ...data[key], // Spread the company data
      });
    }

    res.json(companies); // Send data as JSON response
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).send('Error fetching data');
  }
});
async function upadatebranch(userData)
{
  try {
    console.log(Object.entries(userData));
    for (const [branchName, count] of Object.entries(userData)) {
      const branchRef = db.ref(`branches/${branchName}/count`);
        console.log(branchName);
      // Check if the branch exists
      const snapshot = await branchRef.parent.once('value'); // Get the parent to check if branch exists
      
      if (snapshot.exists()) {
        // If the branch exists, increment the count
        await branchRef.transaction(currentCount => {
       
          console.log('Current Count:', currentCount); // Log the current count
          
          // Convert to a number and default to 0
          const currentCountAsNumber = Number(currentCount) || 0;
          console.log('Converted Count:', currentCountAsNumber); // Log the converted count
          
          return currentCountAsNumber + Number(count); 
        });
        console.log(`Incremented ${count} in branch ${branchName}.`);
      } else {
        console.log(`Branch ${branchName} does not exist. Cannot increment.`);
      }
    }
  return true;

  } catch (error) {
    console.error("Error incrementing branch counts:", error);
  }
};

app.post('/setdata',authenticateTokentp ,async(req,res)=>{
    
  console.log("hai");
  const user=req.body.body;
  console.log(user);
  
  let flag=await adddataToFirebase(user.compname,user.count,user.ctc,user.type,user.imgurl);
  console.log(flag);

  let flag1=await upadatebranch(user);
  
  if(flag&&flag1)
  {
    res.json(JSON.stringify({ success: true }));
  }
  else{
    res.json(JSON.stringify({success:false}));
  }

});

app.listen(port,()=>{console.log("server is running")});