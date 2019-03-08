const express = require("express");
const AmazonCognitoIdentity = require("amazon-cognito-identity-js");
const CognitoUserPool = AmazonCognitoIdentity.CognitoUserPool;
const AWS = require("aws-sdk");
const request = require("request");
const jwkToPem = require("jwk-to-pem");
const jwt = require("jsonwebtoken");
global.fetch = require("node-fetch");
const bodyParser = require("body-parser");
var jsonParser = bodyParser.json();
var cognitoUser;

var CognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider({
  apiVersion: "2016-04-18",
  region: "us-east-2"
});

const poolData = {
  UserPoolId: "us-east-2_N8ISmOsPL",
  ClientId: "65gpq60qfsn28a6gqs8n82b1um"
};

var app = express();
app.use(express.static(__dirname + "/public"));

//=============================================================================
app.post("/Register", jsonParser, (req, res) => {
  {
    var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
    var attributeList = [];

    var dataEmail = {
      Name: "email",
      Value: req.body.Email
    };

    var dataPhoneNumber = {
      Name: "phone_number",
      Value: req.body.PhoneNumber
    };

    var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(
      dataEmail
    );
    var attributePhoneNumber = new AmazonCognitoIdentity.CognitoUserAttribute(
      dataPhoneNumber
    );

    attributeList.push(attributeEmail);
    attributeList.push(attributePhoneNumber);

    userPool.signUp(
      req.body.Id,
      req.body.password,
      attributeList,
      null,
      function(err, result) {
        if (err) {
          res.status(400).send(err.message || JSON.stringify(err));

          return;
        }
        cognitoUser = result.user;

        res.status(200).send("User Registration on Cognito is Successfull");
      }
    );
  }
});

//=============================================================================

app.post("/Confirm", jsonParser, (req, res) => {
  cognitoUser.confirmRegistration(req.body.code, true, function(err, result) {
    if (err) {
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    }

    res.status(200).send("User Confirmation on Cognito is Successfull");
  });
});

//============================================================================

app.post("/Resend", jsonParser, (req, res) => {
  cognitoUser.resendConfirmationCode(function(err, result) {
    if (err) {
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    }

    res
      .status(200)
      .send("Resend of confirmation code from Cognito is Successfull");
  });
});

//============================================================================
app.post("/EastablishSession", jsonParser, (req, res) => {
  var authenticationData = {
    Username: req.body.username, // your username here
    Password: req.body.password // your password here
  };
  authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(
    authenticationData
  );

  var poolData = {
    UserPoolId: "us-east-2_N8ISmOsPL", // your user pool id here
    ClientId: "65gpq60qfsn28a6gqs8n82b1um" // your app client id here
  };
  var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
  var userData = {
    Username: req.body.username, // your username here
    Pool: userPool
  };

  cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);
  cognitoUser.authenticateUser(authenticationDetails, {
    onSuccess: function(result) {
      var accessToken = result.getAccessToken().getJwtToken();
      var idToken = result.idToken.jwtToken;
      console.log(
        "User successfully logged in, please see the access toke below"
      );
      console.log(`Access Token is ${accessToken}`);
      //console.log(`Id Token is ${idToken}`);
      res.status(200).send("User is successfully logged in");
      return;
    },

    onFailure: function(err) {
      //alert(err);
      console.log("Error occurred");
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    }
    //mfaRequired: function(codeDeliveryDetails) {
    //  var verificationCode = prompt("Please input verification code", "");
    //  cognitoUser.sendMFACode(verificationCode, this);
    //  }
  });
});
//=============================================================================
app.post("/AdminDeleteUser", jsonParser, (req, res) => {
  //console.log(`Ther entered user name is ${req.body.username}`);
  var params = {
    UserPoolId: "us-east-2_N8ISmOsPL" /* required */,
    Username: req.body.username /* required */
  };
  CognitoIdentityServiceProvider.adminDeleteUser(params, function(err, data) {
    if (err) console.log(err, err.stack);
    else {
      console.log("User successfully deleted");
      res.status(200).send("User is successfully deleted");
      return;
    }
  });
});

// ============================================================================
app.post("/getUserAttributes", jsonParser, (req, res) => {
  cognitoUser.getUserAttributes(function(err, result) {
    var attributeList = [];
    var attribute = {
      Name: "Name",
      Value: "Value"
    };
    if (err) {
      //  alert(err.message || JSON.stringify(err));
      console.log(JSON.stringify(err));
      return;
    }
    console.log("success");
    for (i = 0; i < result.length; i++) {
      attribute = {
        Name: result[i].getName(),
        Value: result[i].getValue()
      };
      attributeList.push(attribute);
      console.log(
        "attribute " +
          result[i].getName() +
          " has value " +
          result[i].getValue()
      );
    }
    res.status(200).send(attributeList);
  });
});
// ============================================================================
app.post("/getAttributeVerificationCode", jsonParser, (req, res) => {
  cognitoUser.getAttributeVerificationCode("email", {
    onSuccess: function(result) {
      console.log("call result: " + result);
      res.status(200).send(JSON.stringify(result));
    },
    onFailure: function(err) {
      //  alert(err.message || JSON.stringify(err));
      console.log(JSON.stringify(err));
      res.status(400).send(err.message || JSON.stringify(err));
    }
    /*inputVerificationCode: function() {
      var verificationCode = "Enter the verification code sent in Email";
      cognitoUser.verifyAttribute("email", verificationCode, this);
    }*/
  });
});
//=============================================================================
app.post("/SubmitAttributeVerificationCode", jsonParser, (req, res) => {
  //inputVerificationCode : function() {
  var verificationCode = req.body.verificationCode;
  console.log(verificationCode);
  cognitoUser.verifyAttribute("email", verificationCode, {
    onSuccess: function(result) {
      console.log("call result: " + result);
      res.status(200).send(JSON.stringify(result));
    },
    onFailure: function(err) {
      //  alert(err.message || JSON.stringify(err));
      console.log(JSON.stringify(err));
      res.status(400).send(err.message || JSON.stringify(err));
    }
  });
});
//=============================================================================

app.post("/DeleteUserAttribute", jsonParser, (req, res) => {
  var attributeList = [];
  attributeList.push(req.body.Name);

  cognitoUser.deleteAttributes(attributeList, function(err, result) {
    if (err) {
      console.log(JSON.stringify(err));
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    }
    console.log("call result: " + result);
    res.status(200).send(JSON.stringify(result));
    return;
  });
});

//=============================================================================
app.post("/UpdateUserAttribute", jsonParser, (req, res) => {
  var attributeList = [];
  var attribute = {
    Name: req.body.Name,
    Value: req.body.Value
  };
  var attribute = new AmazonCognitoIdentity.CognitoUserAttribute(attribute);
  attributeList.push(attribute);

  cognitoUser.updateAttributes(attributeList, function(err, result) {
    if (err) {
      console.log(JSON.stringify(err));
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    }
    console.log("Attribute updated");
    res.status(200).send(JSON.stringify(result));
    return;
  });
});

//=============================================================================
app.post("/EnableMFA", jsonParser, (req, res) => {
  cognitoUser.enableMFA(function(err, result) {
    if (err) {
      console.log(JSON.stringify(err));
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    }
    console.log("call result: " + result);
    res.status(200).send(JSON.stringify(result));
    return;
  });
});
//==============================================================================
app.post("/DisableMFA", jsonParser, (req, res) => {
  cognitoUser.disableMFA(function(err, result) {
    if (err) {
      console.log(JSON.stringify(err));
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    }
    console.log("call result: " + result);
    res.status(200).send(JSON.stringify(result));
    return;
  });
});
//==============================================================================
app.post("/ChangePassword", jsonParser, (req, res) => {
  cognitoUser.changePassword(
    req.body.OldPassword,
    req.body.NewPassword,
    function(err, result) {
      if (err) {
        //alert(err.message || JSON.stringify(err));
        res.status(400).send(err.message || JSON.stringify(err));
        return;
      }
      console.log("call result: " + result);
      res.status(200).send(JSON.stringify(result));
      return;
    }
  );
});
//==============================================================================
app.post("/ForgotPassword", jsonParser, (req, res) => {
  cognitoUser.forgotPassword({
    onSuccess: function(data) {
      // successfully initiated reset password request
      console.log("CodeDeliveryData from forgotPassword: " + data);
      res.status(200).send(JSON.stringify(data));
    },
    onFailure: function(err) {
      //  alert(err.message || JSON.stringify(err));
      console.log(err);
      res.status(400).send(err.message || JSON.stringify(err));
    }
    //Optional automatic callback
    /*  inputVerificationCode: function(data) {
            console.log('Code sent to: ' + data);
            var verificationCode = prompt('Please input verification code ' ,'');
            var newPassword = prompt('Enter new password ' ,'');
            cognitoUser.confirmPassword(verificationCode, newPassword, {
                onSuccess() {
                    console.log('Password confirmed!');
                },
                onFailure(err) {
                    console.log('Password not confirmed!');
                }
            });
        } */
  });
});
//==============================================================================
app.post("/SubmitCodeForForgotPassword", jsonParser, (req, res) => {
  var newPassword = req.body.newPassword;
  var verificationCode = req.body.verificationCode;
  cognitoUser.confirmPassword(verificationCode, newPassword, {
    onSuccess() {
      console.log("Password confirmed!");
      res.status(200).send("Password Change is successfull");
      return;
    },
    onFailure(err) {
      console.log("Password not confirmed!");
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    }
  });
});
//==============================================================================
app.post("/DeleteUser", jsonParser, (req, res) => {
  cognitoUser.deleteUser(function(err, result) {
    if (err) {
      console.log("Password not confirmed!");
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    }
    console.log("call result: " + result);
    res.status(200).send("User is successfully deleted");
    return;
  });
});
//==============================================================================
app.post("/SignOut", jsonParser, (req, res) => {
  cognitoUser.signOut();
  console.log("Signed Out");
});
//==============================================================================

app.post("/SignOutWithAccessToken", jsonParser, (req, res) => {
  var params = {
    AccessToken: req.body.AccessToken /* required */
  };
  CognitoIdentityServiceProvider.globalSignOut(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      console.log("Some error in signing out");
    }
    // an error occurred
    else {
      console.log(data); // successful response
      console.log("Successfully signed out");
      return;
    }
  });
});

//============================================================================
app.post("/globalSignOut", jsonParser, (req, res) => {
  cognitoUser.globalSignOut(function(err, data) {
    if (err) {
      console.log(err, err.stack);
      console.log("Some error in signing out");
    }
    // an error occurred
    else {
      console.log(data); // successful response
      console.log("Successfully signed out");
      return;
    }
  });
});
//=============================================================================
app.post("/WithReachNative", jsonParser, (req, res) => {
  var poolData = {
    UserPoolId: "us-east-2_N8ISmOsPL", // Your user pool id here
    ClientId: "65gpq60qfsn28a6gqs8n82b1um" // Your client id here
  };
  var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

  userPool.storage.sync(function(err, result) {
    if (err) {
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    } else if (result === "SUCCESS") {
      var cognitoUser = userPool.getCurrentUser();
      res.status(200).send("Success");
      // Continue with steps in Use case 16
    }
  });
});
//=============================================================================

//=============================================================================

app.post("/getUserAttributesWithAccess", jsonParser, (req, res) => {
  var params = {
    AccessToken: req.body.AccessToken /* required */
  };
  CognitoIdentityServiceProvider.getUser(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      res.status(400).send(err.message || JSON.stringify(err));
    }
    // an error occurred
    else console.log(data); // successful response
    res.status(200).send(JSON.stringify(data));
  });
});

//=============================================================================
app.post("/ListDevices", jsonParser, (req, res) => {
  let paginationToken = null;
  cognitoUser.listDevices(5, paginationToken, {
    onSuccess: function(result) {
      console.log("call result: " + result);
      res.status(200).send(JSON.stringify(result));
      return;
    },
    onFailure: function(err) {
      //  alert(err.message);
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    }
  });
});
//=============================================================================

app.post("/GetCurrentDevice", jsonParser, (req, res) => {
  cognitoUser.getDevice({
    onSuccess: function(result) {
      console.log("call result: " + result);
      res.status(200).send(JSON.stringify(result));
      return;
    },
    onFailure: function(err) {
      //  alert(err.message || JSON.stringify(err));
      console.log(err);
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    }
  });
});

//=============================================================================
app.post("/RememberDevice", jsonParser, (req, res) => {
  cognitoUser.setDeviceStatusRemembered({
    onSuccess: function(result) {
      console.log("call result: " + result);
      res.status(200).send(JSON.stringify(result));
      return;
    },
    onFailure: function(err) {
      console.log(err);
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    }
  });
});

//=============================================================================
app.post("/DoNotRememberDevice", jsonParser, (req, res) => {
  cognitoUser.setDeviceStatusNotRemembered({
    onSuccess: function(result) {
      console.log("call result: " + result);
      res.status(200).send(JSON.stringify(result));
      return;
    },
    onFailure: function(err) {
      //alert(err.message || JSON.stringify(err));
      console.log(err);
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    }
  });
});
//=============================================================================
app.post("/ForgetCurrentDevice", jsonParser, (req, res) => {
  cognitoUser.forgetDevice({
    onSuccess: function(result) {
      console.log("call result: " + result);
      res.status(200).send(JSON.stringify(result));
      return;
    },
    onFailure: function(err) {
      //alert(err.message || JSON.stringify(err));
      console.log(err);
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    }
  });
});
//=============================================================================

//=============================================================================

app.post("/GetCurrentUser", jsonParser, (req, res) => {
  var data = {
    UserPoolId: "us-east-2_N8ISmOsPL",
    ClientId: "65gpq60qfsn28a6gqs8n82b1um"
  };
  var userPool = new AmazonCognitoIdentity.CognitoUserPool(data);
  var cognitoUser = userPool.getCurrentUser();

  if (cognitoUser != null) {
    cognitoUser.getSession(function(err, session) {
      if (err) {
        //alert(err);
        console.log("error ocurred");
        res.status(400).send(err.message || JSON.stringify(err));
        return;
      }

      console.log("No errors");
      console.log("session validity: " + session.isValid());
    });
  }
  cognitoUser.getUserAttributes(function(err, attributes) {
    if (err) {
      // Handle error
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    } else {
      res.status(200).send(JSON.stringify(attributes));
      return;
      // Do something with attributes
    }
  });
});
//============================================================================

//============================================================================
app.post("/adminGetUser", jsonParser, (req, res) => {
  var params = {
    UserPoolId: "us-east-2_N8ISmOsPL" /* required */,
    Username: req.body.username /* required */
  };
  CognitoIdentityServiceProvider.adminGetUser(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    }
    // an error occurred
    else {
      console.log(data); // successful response
      res.status(200).send(JSON.stringify(data));
      return;
    }
  });
});

//============================================================================
app.post("/getMFAOptions", jsonParser, (req, res) => {
  cognitoUser.getMFAOptions(function(err, mfaOptions) {
    if (err) {
      console.log(JSON.stringify(err));
      res.status(400).send(err.message || JSON.stringify(err));
      return;
    }
    console.log("MFA options for user " + mfaOptions);
    res.status(200).send(JSON.stringify(mfaOptions));
    return;
  });
});

//============================================================================

//=============================================================================

app.post("/getLocalAttributes", jsonParser, (req, res) => {
  var params = {
    AccessToken: req.body.AccessToken /* required */
  };
  cognitoUser.getUserAttributes(params, function(err, result) {
    if (err) {
      //alert(err.message || JSON.stringify(err));
      console.log("error occurred");
      return;
    }
    for (i = 0; i < result.length; i++) {
      console.log(
        "attribute " +
          result[i].getName() +
          " has value " +
          result[i].getValue()
      );
    }
  });
});
//============================================================================

//=============================================================================
app.listen("3000", () => {
  console.log("Server is up on port 3000");
});
