var SerialPort = require("serialport");
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var portName = process.argv[2],
portConfig = {
	baudRate: 9600,
	parser: SerialPort.parsers.readline("\n")
};



var sp;

var MongoClient;

// Connection URL
var url;

var deviceID = 9;

var current;
		
var time = '99:99:99';

var time_ms = 999999999; 

var average = -999.99;

var temperature = new Array([4]);

// Update Status of Temperatures 
// 0: Pending 1: Updated
var update = [0, 0, 0, 0];

// Temperatures
var temperature = new Array([4]);

// Coordinates
var X = [5, 5, -5, -5];
var Y = [5, -5, 5, -5];

//var doc;

MongoClient = require('mongodb').MongoClient
				, assert = require('assert');

url = 'mongodb://localhost:27017/dbTest';				
				
sp = new SerialPort.SerialPort(portName, portConfig);

app.get('/', function(req, res){
  res.sendfile('index.html');
});

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('disconnect', function(){
  });
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
    sp.write(msg + "\n");
  });
  
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

sp.on("open", function () {
	console.log('open');
	
	sp.on('data', function(data) {
	
		var msg0 = '';
		var msg1 = '';
		var msg2 = '';
		var msg3 = '';
		var msgA = '';
		
		// Handle received Data
		console.log('data received: ' + data);
	
		// Parse data
		deviceID = parseInt(data.substring(1, 2));
		
		var temp_temperature = parseFloat(data.substring(4, (data.length - 1)));
		// Ignore the invalid ones
		if( (temp_temperature > (-100.00)) && (temp_temperature < 100.00))
		{
			temperature[deviceID] = temp_temperature;
	
			update[deviceID] = 1;
		}
	
		if( ( update[0] == 1 ) && ( update[1] == 1) && ( update[2] == 1) && ( update[3] == 1) )
		{
			current = new Date();
			time = current.toLocaleTimeString();
			newTime = current.toString();
			time_ms = Date.parse(newTime);
			
			average = (temperature[0] + temperature[1] + temperature[2] + temperature[3]) / 4;
			average = parseFloat(average.toFixed(2));
		
			update[0] = 0;
			update[1] = 0;
			update[2] = 0;
			update[3] = 0;

			//msg0 = 'ZERO::';
			//msg1 = 'ONE::';
			//msg2 = 'TWO::';
			//msg3 = 'THREE::';
			//msgA = 'AVERAGE::';
			
			// DB operations
			// Use connect method to connect to the Server
			MongoClient.connect(url, function(err, db) {
				assert.equal(null, err);
			
				console.log("Connected correctly to server");	
			
				// Get the documents collection
				var collection = db.collection('test');

				// Create tables
				var message_0 = {Device_ID: 0, Temperature: temperature[0], Time: time, Time_ms: time_ms, X : X[0], Y : Y[0]};
				var message_1 = {Device_ID: 1, Temperature: temperature[1], Time: time, Time_ms: time_ms, X : X[1], Y : Y[1]};
				var message_2 = {Device_ID: 2, Temperature: temperature[2], Time: time, Time_ms: time_ms, X : X[2], Y : Y[2]};
				var message_3 = {Device_ID: 3, Temperature: temperature[3], Time: time, Time_ms: time_ms, X : X[3], Y : Y[3]};
				// Average
				var message_A = {Device_ID: 9, Temperature: average, Time: time, Time_ms: time_ms};
			
				collection.insert([message_0, message_1, message_2, message_3, message_A], function (err, result) 
				{
					if (err) 
					{
						console.log(err);
					} 
					else 
					{
						console.log('Inserted %d documents into the "test" collection. The documents inserted with "_id" are:', result.length, result);

					}
					
					//db.close();
				});
				
				
				var cursor =collection.find( );
				
				cursor.sort({Time_ms: -1});
				
				cursor.limit(35);
								
				cursor.each(function(err, doc) 
				{
				    if (err) 
					{
						console.log(err);
					} 
					if (doc != null) 
					{
						console.log('Fetched:', doc);
						var temp = doc.Temperature;
						var id = doc.Device_ID;
						var time = doc.Time;
						var judge = doc.Time_ms;
						var x = doc.X;
						var y = doc.Y;
						
						//console.log('Fetched:', judge);
						
						if(id == 0)
						{
							msg0 = msg0 + '[' + time + ']' + '(' + temp + ')';
							io.emit("data from sensor 0", msg0);
						}
						else if(id == 1)
						{
							msg1 = msg1 + '[' + time + ']' + '(' + temp + ')';
							io.emit("data from sensor 1", msg1);
						}
						else if(id == 2)
						{
							msg2 = msg2 + '[' + time + ']' + '(' + temp + ')';
							io.emit("data from sensor 2", msg2);
						}
						else if(id == 3)
						{
							msg3 = msg3 + '[' + time + ']' + '(' + temp + ')';
							io.emit("data from sensor 3", msg3);
						}
						else if(id == 9)
						{
							msgA = msgA + '[' + time + ']' + '(' + temp + ')';
							io.emit("average temperature", msgA);
						}
				    }
				
				});
				
				
				//console.log('======hahahahahahhah==========', msg0);				
				//msg0 = 'changed'; 
				//msg1 = '1';
				//msg2 = '2';
				//msg3 = '3';
				//msgA = 'A';
	
	
				
				//db.close();
			
				// Transmit the parsed data to the html
				//io.emit("chat message", '(' + temperature[0] + ')' + '(' + temperature[1] + ')' + '(' + temperature[2] + ')' + '(' + temperature[3] + ')' + '[' + average + ']' + '{' + time + '}');
				//io.emit("chat message", doc);	
			});
		}
	});
});


