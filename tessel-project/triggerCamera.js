// Any copyright is dedicated to the Public Domain.
// http://creativecommons.org/publicdomain/zero/1.0/

/*********************************************
This ambient module example console.logs
ambient light and sound levels and whenever a
specified light or sound level trigger is met.
*********************************************/

var tessel = require('tessel');
var ambientlib = require('ambient-attx4'); // Replace '../' with 'ambient-attx4' in your own code

var ambient = ambientlib.use(tessel.port['C']);
var camera = require('camera-vc0706').use(tessel.port['A']); // Replace '../' with 'camera-vc0706' in your own code

var notificationLED = tessel.led[3]; // Set up an LED to notify when we're taking a picture
var https = require('https');

var triggerLight = false;
var triggerSound = false;

var async = require('async');

ambient.on('ready', function () {
 // Get points of light and sound data.
  setInterval( function () {
    ambient.getLightLevel( function(err, ldata) {
      ambient.getSoundLevel( function(err, sdata) {
        console.log("Light level:", ldata.toFixed(8), " ", "Sound Level:", sdata.toFixed(8));

       /* if (ldata.toFixed(8) < 0.015) {
          triggerLight = true;
          ambient.setLightTrigger(0.015, function(err, triggerVal) {
            console.log("Trigger val hit" + triggerVal);
          });
        }*/
    });
  })}, 6000); // The readings will happen every 6 seconds unless the trigger is hit 

  
  ambient.setLightTrigger(0.05);

  // Set a light level trigger
  // The trigger is a float between 0 and 1
  ambient.on('light-trigger', function(data) {
    console.log("Our light trigger was hit:", data);

    // Clear the trigger so it stops firing
    ambient.clearLightTrigger();
    //After 1.5 seconds reset light trigger
    setTimeout(function () {

        ambient.setLightTrigger(0.5);

    },1500);
  });

  // Set a sound level trigger
  // The trigger is a float between 0 and 1
  ambient.setSoundTrigger(0.1);

  ambient.on('sound-trigger', function(data) {
    console.log("Something happened with sound: ", data);

    // Clear it
    ambient.clearSoundTrigger();

    //After 1.5 seconds reset sound trigger
    setTimeout(function () {

        ambient.setSoundTrigger(0.1);

    },1500);

  });
});

ambient.on('error', function (err) {
  console.log(err)
});



// camera code below

// Wait for the camera module to say it's ready
camera.on('ready', function() {
  notificationLED.high();
  // Take the picture
  camera.takePicture(function(err, image) {
    if (err) {
      console.log('error taking image', err);
    } else {
      notificationLED.low();
      // Name the image
      var name = 'picture-' + Math.floor(Date.now()*1000) + '.jpg';
      // Save the image
      console.log('Picture saving as', name, '...');
      process.sendfile(name, image);
      console.log('done.');
      sendToAercloud(name);
      // Turn the camera off to end the script
      camera.disable();
    }
  });
});


function sendToAercloud(imageName)  {
  var req = https.request ({
    port: 443,
    method: 'POST',
    hostname: 'api.aercloud.aeris.com',
    path: '/v1/16089/scls/camera-vc0706/containers/group8Container/contentInstances?apiKey='+ '76a29806-eb01-11e5-9830-2ff7af10cf1d',
    headers: {
      host: 'api.aercloud.aeris.com',
      'Accept': 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
        'User-Agent': 'tessel'
    }
  }, function(res) { 
      console.log('statusCode: ', res.statusCode);
  }); console.log('{"nameOfImg": ' +'"'+imageName +'"' +'}'); 
  req.write('{"nameOfImg": ' +'"'+imageName +'"' +'}');
  req.end();
  req.on('error', function(e) { 
      console.error("error posting data to your container",e); 
  });
};


camera.on('error', function(err) {
  console.error(err);
});
