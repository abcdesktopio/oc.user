"use strict";

var PORT = 8000;

var spawn 	= require('child_process').spawn;
var http 	= require('http');

/**
 * RIFF Chunk IDs in Buffers.
 *
 * @api private
 */

var RIFF = new Buffer('RIFF');
var WAVE = new Buffer('WAVE');
var fmt  = new Buffer('fmt ');
var data = new Buffer('data');

/**
 * The max size of the "data" chunk of a WAVE file. This is the max unsigned
 * 32-bit int value, minus 100 bytes (overkill, 44 would be safe) for the header.
 *
 * @api private
 */

var MAX_WAV = 4294967295 - 100;


function writeWAVHeader() {

  var endianness = 'LE';
  var format = 1; // raw PCM
  var channels = 2;
  var sampleRate = 44100;
  var bitDepth = 16;
  var bytesProcessed = 0;

  var headerLength = 44; // TODO: 44 is only for format 1 (PCM), any other
                         // format will have a variable size...
  var dataLength = MAX_WAV;
  var fileSize = dataLength + headerLength;
  var header = new Buffer(headerLength);
  var offset = 0;

  // write the "RIFF" identifier
  RIFF.copy(header, offset);
  offset += RIFF.length;

  // write the file size minus the identifier and this 32-bit int
  header['writeUInt32' + endianness](fileSize - 8, offset);
  offset += 4;

  // write the "WAVE" identifier
  WAVE.copy(header, offset);
  offset += WAVE.length;

  // write the "fmt " sub-chunk identifier
  fmt.copy(header, offset);
  offset += fmt.length;

  // write the size of the "fmt " chunk
  // XXX: value of 16 is hard-coded for raw PCM format. other formats have
  // different size.
  header['writeUInt32' + endianness](16, offset);
  offset += 4;

  // write the audio format code
  header['writeUInt16' + endianness](format, offset);
  offset += 2;

  // write the number of channels
  header['writeUInt16' + endianness](channels, offset);
  offset += 2;

  // write the sample rate
  header['writeUInt32' + endianness](sampleRate, offset);
  offset += 4;

  // write the byte rate
  var byteRate = byteRate;
  if (byteRate == null) {
    byteRate = sampleRate * channels * bitDepth / 8;
  }
  header['writeUInt32' + endianness](byteRate, offset);
  offset += 4;

  // write the block align
  var blockAlign = blockAlign;
  if (blockAlign == null) {
    blockAlign = channels * bitDepth / 8;
  }
  header['writeUInt16' + endianness](blockAlign, offset);
  offset += 2;

  // write the bits per sample
  header['writeUInt16' + endianness](bitDepth, offset);
  offset += 2;

  // write the "data" sub-chunk ID
  data.copy(header, offset);
  offset += data.length;

  // write the remaining length of the rest of the data
  header['writeUInt32' + endianness](dataLength, offset);
  offset += 4;

  // save the "header" Buffer for the end, we emit the "header" event at the end
  // with the "size" values properly filled out. if this stream is being piped to
  // a file (or anything else seekable), then this correct header should be placed
  // at the very beginning of the file.
  return header;
}




function runrecorder(request, response) {

  var ret; 
  var i= 0;

  // console.log( util.inspect(response.socket._writableState.highWaterMark));
  // console.log( util.inspect(response.connection._writableState.highWaterMark));
  // response.socket._writableState.highWaterMark = 1024;
  // response.connection._writableState.highWaterMark = 1024;
  // console.log( util.inspect(response.socket._writableState));
  // var command = 'parec --device=rtp.monitor | oggenc --raw --quiet -';
  
  var command = 'parec --device=auto_null.monitor';  
  try {

 	//var cmd = spawn('parec', ['--device=rtp.monitor'], { detached: false });
	//var cmd = spawn('parec', [ '--server=/tmp/.pulse.sock', '--device=auto_null.monitor', '--latency-msec=50'],  { detached: false } );
        // parec -v --file-format=wav --server=/tmp/.pulse.sock --device=auto_null.monitor
        var cmd = spawn('parec', [ /*'--file-format=wav', */ '--server=/tmp/.pulse.sock', '--device=auto_null.monitor'], { stdio: [ process.stdin, 'pipe', process.stderr] }  );
	  // ,  { detached: false, stdio: [ process.stdin, 'pipe', process.stderr] }  );
        if (cmd && cmd.pid ) {
	  //response.pipe( cmd.stdout );
	  // response.pipe( cmd );
	  // cmd.stdout.pipe( response );

          response.write( writeWAVHeader() );
	  cmd.stdout.pipe( response );

          request.on('error', function(err) {
            console.log('err');
            console.log( err );
            cmd.kill();
          });

          request.on("close", function() {
            // request closed unexpectedly
            console.log( 'request closed unexpectedly');
            cmd.kill();
          });

          request.on("end", function() {
            // request ended normally
            console.log( 'request ended normally');
            cmd.kill();
          });

	  //cmd.stdout.on('data' , function (d) {
	  //	  	response.write(d);
	  //	            });

	  cmd.on('exit', function (code) {
                console.log('child process exited with code ' + code);
                response.end();
          });
    
          cmd.on('exit', function (code) {
             	console.log('child process exited with code ' + code);
            	response.end();
            });

        }
    }
    catch (e) {
    		console.log (e);
    		response.end();
    }
}




http.createServer(function(request, response) {
	if (request.method === 'GET') {
		response.writeHead(200, { 	
            					"Content-Type": 'audio/wav',
						"Connection": "keep-alive",
						"Transfer-Encoding": "chunked",	
						// "Accept-Ranges": "bytes"   // for Chrome  
								});
		console.log( request.method + ' ' + request.url );
		runrecorder( request, response);    	
  	}
}).listen( PORT, function() {
  console.log('Listening for requests');
});






