/*
* Software Name : abcdesktop.io
* Version: 0.2
* SPDX-FileCopyrightText: Copyright (c) 2020-2021 Orange
* SPDX-License-Identifier: GPL-2.0-only
*
* This software is distributed under the GNU General Public License v2.0 only
* see the "license.txt" file for more details.
*
* Author: abcdesktop.io team
* Software description: cloud native desktop service
*/
 
const https = require('https');
const http = require('http');
const uuid = require('uuid/v1');
const PORT = 8004;
 
/**
 * @function lync_createApp
 * @param  {string}   host     Lync server hostname
 * @param  {string}   token    User token
 * @param  {string}   path     Application resource path
 * @param  {callback} callback 
 * @return {void}
 * @desc Register your application with UCWA 2.0
 */
var lync_createApp = function (host,token,path,callback_send, callback_close ) {
        var options = {
                hostname: host,
                path: path,
                method: 'POST',
                headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                }
        };
        try{
                var myuuid = uuid();
                var postData = '{\'UserAgent\':\'UCWA Test\',\'EndpointId\':\''+myuuid+'\',\'Culture\':\'en-US\'}';
                var req = https.request(options,(res) => {
                        console.log(`STATUS: ${res.statusCode}`);
                        res.setEncoding('utf8');
                        res.on('data', (d) => {
                                console.log(d)
                                var url = d.toString('utf8');
                                var ret = JSON.stringify({"code":res.statusCode, "data":url});
                                callback_send(ret);
                        });
			res.on('end', () => {
                                console.log('lync_createApp: end event no more data in response.');
                        });
                        res.on('close', () => {
                                console.log('lync_createApp: close event no more data in response.');
				callback_close();
                        });
                })
                req.write(postData);
                req.end();
        }catch(e){
                console.log('Error lync_createApp : '+ e);
        }
 
}
 
/**
 * @function getMyPresence
 * @param  {string}   host     Lync server hostname
 * @param  {string}   token    User token
 * @param  {string}   path     Application resource path
 * @param  {Function} callback 
 * @return {void}
 * @desc Get current user's presence
 */
var getMyPresence = function (host,token,path,callback_send, callback_close) {
        console.log('getPresence');
        var options = {
                host: host,
                path: path+'/me/presence',
                headers: {
                        'Authorization': token
                }
        }
        try{
                var req = https.get(options, function(res) {
                        console.log('statusCode:', res.statusCode);
                        res.on('data', (d) => {
                                if (res.statusCode === 200) {
                                        var ret = JSON.stringify({"code":res.statusCode, "data":JSON.parse(d.toString('utf8'))});                               
                                }else{
                                        var ret = JSON.stringify({"code":res.statusCode, "data":d.toString('utf8')});
                                }
                                callback_send(ret);
                        });
			res.on('end', () => {
                                console.log('getMyPresence: end event no more data in response.');
                        });
			res.on('close', () => {
                                console.log('getMyPresence: no more data in response.');
				callback_close();
                        });
                });
                req.on('error', (e) => {
                        console.error(e);
                });
                req.end();
        }catch(e){
                console.log('Error getMyPresence : '+ e);
        }
}
 
/**
 * @function getPresence
 * @param  {string}   host     Lync server hostname
 * @param  {string}   token    User token
 * @param  {string}   path     Target user's presence path
 * @param  {Function} callback 
 * @return {void}
 * @desc Get target presence
 */
var getPresence = function (host,token, path,callback_send, callback_close) {
        console.log('getPresence');
        console.log(path);
        var options = {
                host: host,
                path: path,
                headers: {
                        'Authorization': token
                }
        }
        try{
                var req = https.get(options, function(res) {
                        console.log('statusCode:', res.statusCode);
                        res.on('data', (d) => {
                                if (res.statusCode === 200) {
                                        var ret = JSON.stringify({code:res.statusCode, data:JSON.parse(d.toString('utf8'))});                           
                                }else{
                                        var ret = JSON.stringify({code:res.statusCode, data:d.toString('utf8')});
                                }
                                callback_send(ret);
                        });
			res.on('end', () => {
                                console.log('getPresence: end event no more data in response.');
				// callback_close();
                        });
			res.on('close', () => {
                                console.log('getPresence: close event no more data in response.');
				callback_close();
                        });
                });
                req.on('error', (e) => {
                        console.error(e);
                });
                req.end();
        }catch(e){
                console.log('Error getPresence : '+ e);
        }
}
 
/**
 * @function makeMeAvailable
 * @param  {string}   host     Lync server hostname
 * @param  {string}   token    User token
 * @param  {string}   path     MakeMeAvailable path
 * @param  {Function} callback 
 * @return {void}            
 * @desc Makes the user available for incoming communications.
 */
var makeMeAvailable = function(host,token,path,callback_send, callback_close) {
        var options = {
                hostname: host,
                path: path,
                method: 'POST',
                headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token
                }
        };
        console.log(options);
        try{
                var postData = '{"SupportedModalities": ["Messaging"]}';
                var req = https.request(options,(res) => {
                	console.log(`STATUS: ${res.statusCode}`);
                	res.setEncoding('utf8');
                	res.on('data',(d) => {});
                	res.on('end', () => {
                        	var ret = JSON.stringify({"code":res.statusCode});                      
                        	callback_send(ret);
                        	console.log('makeMeAvailable : event end no more data in response.');
                	});
			res.on('close', () => {
                                console.log('makeMeAvailable: event close no more data in response.');
				callback_close();
                        });
        	});
                req.write(postData);
                req.end();
        }catch(e){
                console.log('Error makeMeAvailable : '+ e);
        }
}
 
/**
 * @function setPresence 
 * @param {string}   host     Lync server hostname
 * @param {string}   token    User token
 * @param {string}   path     Application resource path
 * @param {string}   state    State string to set
 * @param {Function} callback 
 * @desc Set new presence to current user
 */
var setPresence = function (host,token,path,state,callback_send, callback_close) {
                var options = {
                        hostname: host,
                        path: path+'/me/presence',
                        method: 'POST',
                        headers: {
                                'Content-Type': 'application/json',
                                'Authorization': token
                        }
                };
                var postData = '{"availability":"'+state+'"}';
                try{
                        var req = https.request(options,(res) => {
                                console.log(`STATUS: ${res.statusCode}`);
                                res.setEncoding('utf8');
                                res.on('data',(d) => {});
                                res.on('end', () => {
                                        var ret = JSON.stringify({"code": res.statusCode});
                                        callback_send(ret);
                                        console.log('setPresence: no more data in response.');
                                });
				res.on('close', () => {
                                	console.log('setPresence: event close no more data in response.');
                                	callback_close();
                        	});
                        });
                        req.write(postData);
                        req.end();
                }catch(e){
                        console.log('Error setPresence : '+ e);
                }
}
 
/**
 * @function getContacts
 * @param  {string}   host     Lync server hostname
 * @param  {string}   token    User token
 * @param  {string}   path     Application contacts path
 * @param  {Function} callback 
 * @return {void}            
 * @desc Get contact list of current user
 */
var getContacts = function(host,token,path,callback_send, callback_close) {
        console.log('getContacts');
        var options = {
                host: host,
                path: path,
                headers: {
                        'Authorization': token
                }
        }
        try{
                var req = https.get(options, function(res) {
                        console.log('statusCode:', res.statusCode);
                        var rawData = '';
                        res.setEncoding('utf8');
                        res.on('data', (d) => {
                                rawData += d;
                        });
                        res.on('end', () => {
                                var parsedData = JSON.parse(rawData);
                                var ret = JSON.stringify({code:res.statusCode, data:parsedData});                               
                                callback_send(ret);
				console.log('getContacts: no more data in response.');
                        });
			res.on('close', () => {
                                console.log('getContacts: event close no more data in response.');
                                callback_close();
                        });
                });
                req.on('error', (e) => {
                        console.error(e);
                });
                req.end();
        }catch(e){
                console.log('Error getContacts : '+ e);
        }
}
 
/**
 * @function getUserByMail
 * @param  {string}   mail     Target mail address
 * @param  {Function} callback 
 * @return {void}         
 * @desc Get user information by mail.
 */
var getUserByMail = function(mail,callback_send, callback_close) {


 	var path = "/api/v4/users?service=ldap-rest&fields%5B%5D=mail&fields%5B%5D=givenName&fields%5B%5D=sn&fields%5B%5D=displayName&uid=&displayName=&cn=&mail=" + mail + "&telephoneNumber=&mobile=&preferredLanguage=&givenName=&sn=&postalAddress=&roomNumber=&employeeType=&description=";

        var options = {
                host: "ldap-rest.rd.francetelecom.fr",
                path: path
        };

/*
        var options = {
                host: "ldap-rest.rd.francetelecom.fr",
                path: "/api/v3/users?mail="+mail
        }
*/

        try{
                var req = https.get(options, function(res) {
                        var rawData = '';
                        res.setEncoding('utf8');
                        res.on('data', (d) => {
                                rawData += d;
                        });
                        res.on('end', () => {
                                var parsedData = JSON.parse(rawData);
                                var ret = JSON.stringify({code:res.statusCode, data:parsedData});                               
                                callback_send(ret);
				console.log('getUserByMail: no more data in response.');
                        });
			res.on('close', () => {
                                console.log('getUserByMail: event close no more data in response.');
                                callback_close();
                        });
                });
                req.on('error', (e) => {
                        console.error(e);
                });
                req.end();
        }catch(e){
                console.log('Error getContacts : '+ e);
        }
}
/**
 * @function searchContactByName
 * @param  {string}   name     Target name
 * @param  {Function} callback 
 * @return {void}            
 * @desc Search contact in Active Directory by Name
 */
var searchContactByName = function(name,callback_send, callback_close) {
        console.log('searchContactByName');
	// not implemented
	callback_close();
};


/**
 * @function inviteIM description]
 * @param  {string}   host     Lync server hostname
 * @param  {string}   token    User token
 * @param  {string}   path     StartMessaging path
 * @param  {string}   contact  Contact SIP address
 * @param  {string}   IMuid    Messaging unique ID
 * @param  {string}   cuid     Conversation unique ID
 * @param  {Function} callback 
 * @return {void}            
 * @desc Send messaging invitation to contact.
 */
var inviteIM = function(host,token,path,contact,IMuid,cuid,callback_send, callback_close) {
                var options = {
                        hostname: host,
                        path: path,
                        method: 'POST',
                        headers: {
                                'Content-Type': 'application/json',
                                'Authorization': token
                        }
                };
                var postData = '{"to":"'+contact+'","operationId":"'+IMuid+'","threadId":"'+cuid+'"}';
                try{
                        var req = https.request(options,(res) => {
                                console.log(`STATUS: ${res.statusCode}`);
                                res.setEncoding('utf8');
                                res.on('data', (d) => {
                                        console.log(d);
                                });
                                res.on('end', () => {
                                        console.log('inviteIM end event No more data in response.');
                                });
				res.on('close', () => {
                                        console.log('inviteIM close event  No more data in response.');
                                        callback_close();
                                });
                        })
                        req.write(postData);
                        req.end();
                }catch(e){
                        console.log('Error setPresence : '+ e);
                }
}
 
/**
 * @function sendIM
 * @param  {string}   host     Lync server hostname
 * @param  {string}   token    User token
 * @param  {string}   path     Messaging path
 * @param  {string}   message  Message value
 * @param  {Function} callback 
 * @return {void}            
 * @desc Send message to contact.
 */
var sendIM = function(host,token,path,message,callback_send, callback_close) {
                var myuuid = uuid();
                var options = {
                        hostname: host,
                        path: path+'?OperationContext'+myuuid,
                        method: 'POST',
                        headers: {
                                'Content-Type': 'text/plain',
                                'Authorization': token
                        }
                };
                var postData = message;
                console.log(postData);
                try{
                        var req = https.request(options,(res) => {
                                console.log(`STATUS: ${res.statusCode}`);
                                res.setEncoding('utf8');
                                res.on('data', (d) => {
                                });
                                res.on('end', () => {
                                        var ret = JSON.stringify({"code": res.statusCode});
                                        callback_send(ret);
                                        console.log('sendIM : No more data in response.');
                                });
				res.on('close', () => {
                                        console.log('sendIM close event  No more data in response.');
                                        callback_close();
                                });
                        });
                        req.write(postData);
                        req.end();
                }catch(e){
                        console.log('Error setPresence : '+ e);
                }
}
 
/**
 * @function acceptMessagingInvitation
 * @param  {string}   host     Lync server hostname
 * @param  {string}   token    User token
 * @param  {string}   path     Messaging invitation path
 * @param  {Function} callback 
 * @return {void}            
 * @desc Accept incoming messaging invitation
 */
var acceptMessagingInvitation = function(host,token,path,callback_send, callback_close) {
                var options = {
                        hostname: host,
                        path: path,
                        method: 'POST',
                        headers: {
                                'Authorization': token
                        }
                };
                try{
                        var req = https.request(options,(res) => {
                                console.log(`STATUS: ${res.statusCode}`);
                                res.setEncoding('utf8');
                                res.on('data', (d) => {
                                });
                                res.on('end', () => {
                                        var ret = JSON.stringify({"code": res.statusCode});
                                        callback_send(ret);
                                        console.log('acceptMessagingInvitation No more data in response.');
                                });
				res.on('close', () => {
                                        console.log('acceptMessagingInvitation close event  No more data in response.');
                                        callback_close();
                                });
                        });
                        req.end();
                }catch(e){
                        console.log('Error setPresence : '+ e);
                }
}
 
/**
 * @function suscribeLyncPresence
 * @param  {string}   host     Lync server hostname
 * @param  {string}   token    User token
 * @param  {string}   path     Suscribe presence path
 * @param  {array}   sips      SIP array of contact to suscribe
 * @param  {Function} callback 
 * @return {void}            
 * @desc Suscribe to presence of contact list.
 */
var suscribeLyncPresence = function(host,token,path,sips,callback_send, callback_close) {
                var options = {
                        hostname: host,
                        path: path,
                        method: 'POST',
                        headers: {
                                'Content-Type': 'application/json',
                                'Authorization': token
                        }
                };
                var postData = '{"duration":"30","uris":'+sips+'}';
                try{
                        var req = https.request(options,(res) => {
                                console.log(`STATUS: ${res.statusCode}`);
                                res.setEncoding('utf8');
                                res.on('data', (d) => {
                                        if (res.statusCode === 201) {
                                                var ret = JSON.stringify({"code":res.statusCode, "data":JSON.parse(d.toString('utf8'))});                               
                                        }else{
                                                var ret = JSON.stringify({"code":res.statusCode, "data":d.toString('utf8')});
                                        }
                                        callback_send(ret);
                                });
                                res.on('end', () => {
                                        console.log('suscribeLyncPresence end event No more data in response.');
                                });
				res.on('close', () => {
                                        console.log('suscribeLyncPresence close event No more data in response.');
                                        callback_close();
                                });
                        });
                        req.write(postData);
                        req.end();
                }catch(e){
                        console.log('Error suscribePresence : '+ e);
                }
}
/**
 * @function getLyncEvents
 * @param  {string}   host     Lync server hostname
 * @param  {string}   token    User token
 * @param  {string}   path     Event path
 * @param  {Function} callback 
 * @return {void}            
 * @desc Send pending-GET request to the Event Channel.
 */
var getLyncEvents = function(host,token,path,callback_send, callback_close) {
        console.log('getEvents');
        var options = {
                host: host,
                path: path,
                headers: {
                        'Authorization': token
                }
        };
        try{
                var req = https.get(options, function(res) {
                        console.log('statusCode:', res.statusCode);
                        var rawData = '';
                        res.setEncoding('utf8');
                        res.on('data', (d) => {
                                rawData += d;
                        });
                        res.on('end', () => {
                                var parsedData = JSON.parse(rawData);
                                var ret = JSON.stringify({code:res.statusCode, data:parsedData});                               
                                callback_send(ret);
				console.log('getLyncEvents envent end No more data in response.');
                        });
			res.on('close', () => {
				console.log('getLyncEvents event close No more data in response.');
                                callback_close();
			});
                });
                req.on('error', (e) => {
                        console.error(e);
                });
                req.end();
        }catch(e){
                console.log('Error getEvents : '+ e);
        }
}
 
/**
 * @function getParticipants
 * @param  {string}   host     Lync server hostname
 * @param  {string}   token    User token
 * @param  {string}   path     Conversation path
 * @param  {Function} callback 
 * @return {void}            
 * @desc Get participant list of a conversation.
 */
var getParticipants = function(host,token,path,callback_send, callback_close) {
        console.log('getParticipants');
        var options = {
                host: host,
                path: path+"/participants",
                headers: {
                        'Authorization': token
                }
        }
        try{
                var req = https.get(options, function(res) {
                        console.log('statusCode:', res.statusCode);
                        var rawData = '';
                        res.setEncoding('utf8');
                        res.on('data', (d) => {
                                rawData += d;
                        });
                        res.on('end', () => {
                                var parsedData = JSON.parse(rawData);
                                var ret = JSON.stringify({code:res.statusCode, data:parsedData});                               
                                callback_send(ret);
				console.log('getParticipants No more data in response.');
                        });
			res.on('close', () => {
                                console.log('getParticipants event close No more data in response.');
                                callback_close();
                        });
                });
                req.on('error', (e) => {
                        console.error(e);
                });
                req.end();
        }catch(e){
                console.log('Error getEvents : '+ e);
        }
}

var WebSocketServer = require('ws').Server;
var wss = new WebSocketServer({
    port: PORT
});

wss.on('connection', function(ws, req) {
    console.log('connection');
    ws.on('message', function(message) {
            console.log('message received');

	    var json = { 'method': null };

	    try {
            	json = JSON.parse(message);
		console.log( json );
 	    }
	    catch(e){
		console.log( messsage );
                console.log('json format error : '+ e);
		return;
            }

	    function callback_close() {
		 try {
			if (ws.readyState === 1)
		 		ws.close();
		 }
		 catch(err) {
                        console.log( err );
                 }
	    }

	    function callback_send(data) {
                try {
                        if (ws.readyState === 1) 
				ws.send(data);
                }
		catch(err) {
			console.log( err );
		}
	    }



            // Lync
            if (json.method == 'getPresence') {
                getPresence(json.host, json.token, json.path, callback_send, callback_close );
            }
 
            if (json.method == 'getMyPresence') {
                getMyPresence(json.host, json.token, json.path, callback_send, callback_close );
            }
 
            if (json.method == 'setPresence') {
                setPresence(json.host, json.token, json.path, json.state, callback_send, callback_close );
            }
 
            if (json.method == 'suscribeLyncPresence') {
                suscribeLyncPresence(json.host, json.token, json.path, json.sips, callback_send, callback_close );
            }
 
            if (json.method == 'inviteIM') {
                inviteIM(json.host, json.token, json.path, json.to, json.uid, json.cuid, callback_send, callback_close );
            }
 
            if (json.method == 'sendIM') {
                sendIM(json.host, json.token, json.path, json.message, callback_send, callback_close );
            }
 
            if (json.method == 'acceptMessagingInvitation') {
                acceptMessagingInvitation(json.host, json.token, json.path, callback_send, callback_close );
            }
 
            if (json.method == 'lync_createApp') {
                lync_createApp(json.host, json.token, json.path, callback_send, callback_close );
            }
 
            if (json.method == 'makeMeAvailable') {
                makeMeAvailable(json.host, json.token, json.path, callback_send, callback_close );
            }
 
            if (json.method == 'getContacts') {
                getContacts(json.host, json.token, json.path, callback_send, callback_close );
            }
 
            if (json.method == 'getUserByMail') {
                getUserByMail(json.mail, callback_send, callback_close );
            }
 
            if (json.method == 'searchContactByName') {
                searchContactByName(json.name, callback_send, callback_close );
            }
 
            if (json.method == 'getUserPicture') {
                getUserPicture(json.host, json.path, callback_send, callback_close );
            }
 
            if (json.method == 'getEvents') {
                getLyncEvents(json.host, json.token, json.path, callback_send, callback_close ); 
            }
 
            if (json.method == 'getParticipants') {
                getParticipants(json.host, json.token, json.path, callback_send, callback_close ); 
            }
            // End Lync
        });
    });
