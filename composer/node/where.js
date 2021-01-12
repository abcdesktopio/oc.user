

/**
 * Parse the stdout into readable object.
 * @param {String} output
 *
 *  libreoffice: /usr/bin/libreoffice4.3 /usr/bin/libreoffice /etc/libreoffice /usr/lib/libreoffice /usr/bin/X11/libreoffice4.3 /usr/bin/X11/libreoffice /usr/share/libreoffice /usr/share/man/man1/libreoffice.1.gz
 */
function parseWhereIsOutput( output ) {
    if ( !output ) {
        return output;
    }
    var res = output.split(' ');
    if (res.length >= 2)
    	return res[1];
    return false;
}


function _whereis(args, callback) {

	var ChildProcess = require('child_process');
	if (Array.isArray(args)) {
		args = args.join(' ');
	}

	ChildProcess.exec( 'whereis -b ' + args, function( err, stdout, stderr) {

            if (err || stderr) {
                return callback( err || stderr.toString() );
            }
            else {
                var output = stdout.toString();
		var cmd = parseWhereIsOutput(output);
		if (cmd)
                	callback(null, cmd);
		else
			callback('command not found', null);
            }
        });
}


var w = _whereis( 'libreoffice', function(err, stdout) { console.log( err, stdout);  } );


