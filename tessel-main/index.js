var tessel = require('tessel'),
	camera = require('camera-vc0706').use(tessel.port['B']),
	appLed = tessel.led[3],
	cameraLed = tessel.led[1];

var https = require('https');

	enableConfigButton = function(){
		// Allow clicking pictures with the Config button in the tessel
		tessel.button.on('release', function(time){
			shoot();
		});
	},
	shoot = function(){
		cameraLed.high();
		camera.takePicture(function(err, image){
			cameraLed.low();
			if(err){
				console.log('takepicture: error in taking picture!', err);
				return;
			}
			var imageName = 'picture-' + Date.now() + '.jpg';
			process.sendfile(imageName, image);
			sendToAercloud(imageName);
		});
	};

function sendToAercloud(imageName)	{
	var req = https.request ({
		port: 443,
		method: 'POST',
		hostname: 'api.aercloud.aeris.com',
		path: '/v1/16089/scls/camera-vc0706/containers/LorenzoContainer/contenctInstances?apiKey='+ '76a29806-eb01-11e5-9830-2ff7af10cf1d',
		headers: {
			host: 'api.aercloud.aeris.com',
			'Accept': 'application/json, text/plain, */*',
				'Content-Type': 'application/json',
				'User-Agent': 'tessel'
		}
	}, function(res) { 
	    console.log('statusCode: ', res.statusCode);
	}); console.log('{"nameOfImg": ' + imageName + '}'); 
	req.write('{"nameOfImg": ' + imageName + '}');
	req.end();
	req.on('error', function(e) { 
	    console.error("error posting data to your container",e); 
	});
};

camera.on('ready', function(){
	appLed.high();
	enableConfigButton();
});

camera.on('error', function(err){
	console.log('Error:', err);
});