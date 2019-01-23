
var Fabric_Client = require('fabric-client');
var Fabric_CA_Client = require('fabric-ca-client');
var path = require('path');
var util = require('util');
var os = require('os');
var fabric_client = new Fabric_Client();
var channel = fabric_client.newChannel('mychannel');
var peer = fabric_client.newPeer('grpc://localhost:7051');
channel.addPeer(peer);
var order = fabric_client.newOrderer('grpc://localhost:7050')
channel.addOrderer(order);
var fabric_ca_client = null;
var admin_user = null;
var member_user = null;
var store_path = path.join(__dirname, './../hfc-key-store');
console.log(__dirname)
console.log(' Store path:'+store_path);
var tx_id = null;


class FabricCore {
    //this function is used for registering the admin for the sdk
    RegisterAdmin (){
        return new Promise(function(resolve,reject){
            Fabric_Client.newDefaultKeyValueStore({ path: store_path
            }).then((state_store) => {
                // assign the store to the fabric client
                fabric_client.setStateStore(state_store);
                var crypto_suite = Fabric_Client.newCryptoSuite();
                // use the same location for the state store (where the users' certificate are kept)
                // and the crypto store (where the users' keys are kept)
                var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
                crypto_suite.setCryptoKeyStore(crypto_store);
                fabric_client.setCryptoSuite(crypto_suite);
                var	tlsOptions = {
                    trustedRoots: [],
                    verify: false
                };
                // be sure to change the http to https when the CA is running TLS enabled
                fabric_ca_client = new Fabric_CA_Client('http://localhost:7054', tlsOptions , 'ca.example.com', crypto_suite);
            
                // first check to see if the admin is already enrolled
                return fabric_client.getUserContext('admin', true);
            }).then((user_from_store) => {
                if (user_from_store && user_from_store.isEnrolled()) {
                    console.log('Successfully loaded admin from persistence');
                    admin_user = user_from_store;
                    return null;
                } else {
                    // need to enroll it with CA server
                    return fabric_ca_client.enroll({
                      enrollmentID: 'admin',
                      enrollmentSecret: 'adminpw'
                    }).then((enrollment) => {
                      console.log('Successfully enrolled admin user "admin"');
                      return fabric_client.createUser(
                          {username: 'admin',
                              mspid: 'Org1MSP',
                              cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
                          });
                    }).then((user) => {
                      admin_user = user;
                      return fabric_client.setUserContext(admin_user);
                    }).catch((err) => {
                      console.error('Failed to enroll and persist admin. Error: ' + err.stack ? err.stack : err);
                      throw new Error('Failed to enroll admin'+err);
                    });
                }
            }).then(() => {
                resolve('Assigned the admin user to the fabric client ::' + admin_user.toString())
                //console.log('Assigned the admin user to the fabric client ::' + admin_user.toString());
            }).catch((err) => {
                console.error('Failed to enroll admin: ' + err);
                
                reject(err)
                
            });
        })
        
    }

    TestPromise(){
        console.log("promise");
        return new Promise(function(resolve, reject) {
            // Do async job
            let a=1;   
            if (a) {
                       reject("true");
                   } else {
                       resolve("false");
            }
               
        })
    }
}


module.exports = FabricCore;
