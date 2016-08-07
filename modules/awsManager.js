/** @module AWS Manger Module*/
var aws = require('aws-bluebird')
	, db = require('../lib/db.js')
	, config = require('../config.js')
	, delay = 12500
	, region = config.aws.regionUS1


aws.config.update({
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
    region: region[0]
});

var ec2 = new aws.EC2();

var createParams = {
    ImageId: region[1],
    InstanceType: 't2.micro',
    MinCount: 1,
    MaxCount: 1,
    KeyName: region[2]
};


/**
 * Describe all instance (all state)
 * @method describeAllInstance
 * @param {} callback
 * @return 
 */
function describeAllInstance(callback) {
    ec2.describeInstances().then(function(data) {
        return data.Reservations;
    }).map(function(reservation) {
        return reservation.Instances;
    }).map(function(instance) {
        console.log('\t' + instance[0].InstanceId + '\t' + instance[0].PublicIpAddress + '\t' + instance[0].State.Name);
    });
};


/**
 * Describe with a specif id
 * @method describeOneInstance
 * @param {} InstanceId
 * @param {} callback
 * @return 
 */
function describeOneInstance(InstanceId, callback) {

    ec2.describeInstances({
        InstanceIds: [InstanceId]
    }).then(function(data) {
        return data.Reservations;
    }).map(function(reservation) {
        return reservation.Instances;
    }).map(function(instance) {
        console.log('\t' + instance[0].InstanceId + '\t' + instance[0].PublicIpAddress + '\t' + instance[0].State.Name);

        if (!(instance[0].State.Name == "terminated" || instance[0].State.Name == "shutting-down" || instance[0].State.Name == "undefined")) {

            onInstanceCreated(instance[0], callback)
        } else {
            console.log(instance[0].InstanceId + " doesn't seem to start correctly, terminating it:");
            terminateInstanceById(instance[0].InstanceId, callback);
        };
    });
};

/**
 * Method called once an instance is created
 * @method onInstanceCreated
 * @param {} instance
 * @param {} callback
 * @return 
 */
function onInstanceCreated(instance, callback) {
    var ip = instance.PublicIpAddress;
    var id = instance.InstanceId;
    //kill all instance if no IP withing the delay
    if (ip == null) {
        console.log("Got not ip within the time terminating the instance " + id);
        terminateInstanceById(id, callback);
    } else {
        db.findAwsInstanceByIp(ip, (function(err, doc) {
            if (err) console.log(err);
            if (doc.length == 0) {
                console.log(ip + " is not blacklisted");
                var timestamp = Date.now();
                var instanceJSON = {
                    '_id': id,
                    'ip': ip,
                    'timestamp': timestamp,
                    'region': region[0]
                };

                db.saveInstanceInfo(instanceJSON, function(err) {
                    if (err) {
                        console.log("Error while saving instance with id " + id + " -- " + err);

                    } else

                        console.log("Processing with " + ip);
                    ec2.waitFor('instanceStatusOk', params = {}, function(err, data) {
                        if (err) {
                            console.error(err);
                            terminateInstanceById(id, create);
                        } else callback(ip);
                    });


                });

            }

            if (doc.length > 0) {
                console.log(ip + " was found in the blacklist, killing the instance");
                terminateInstance(id);
                createInstance();
            };


        }));
    }
};

/**
 * Create one instance
 * @method createOneInstance
 * @param {} callback
 * @return 
 */
function createOneInstance(callback) {
    ec2.runInstances(createParams).then(function(data) {
        return data.Instances;
    }).map(function(instance) {
        //return instance;
        console.log('New instance created with id:\t' + instance.InstanceId + '\n');

        setTimeout(function() {
            describeOneInstance(instance.InstanceId, callback);
        }, delay);
    });
};



/**
 * TerminateInstance for a given id
 * @method terminateInstanceById
 * @param {} InstanceId
 * @param {} callback
 * @return 
 */
function terminateInstanceById(InstanceId, callback) {
    ec2.terminateInstances({
        InstanceIds: [InstanceId]
    }).then(function(data) {
        return data.TerminatingInstances;
    }).map(function(terminatingInstance) {
        console.log('TERM:\t' + terminatingInstance.InstanceId);
        callback(null);
    });
};


/**
 * Terminate all instances
 * @method terminateAllInstances
 * @param {} callback
 * @return 
 */
function terminateAllInstances(callback) {
    var instanceCount = 0;
    var TERMInstanceCount = 0;
    ec2.describeInstances().then(function(data) {
        return data.Reservations;
    }).map(function(reservation) {
        instanceCount++;
        return reservation.Instances;
    }).map(function(instance) {
        ec2.terminateInstances({
            InstanceIds: [instance[0].InstanceId]
        }).then(function(data) {
            return data.TerminatingInstances;
        }).map(function(terminatingInstance) {
            TERMInstanceCount++
            console.log('TERM:\t' + terminatingInstance.InstanceId);
            if (TERMInstanceCount == instanceCount) {
                console.log("All instance succesfuly terminated");
                return callback(null);
            }
            //toDoProper error handling..
            else console.log(TERMInstanceCount + " instances terminated on " + instanceCount + '\n');

        })
    })

};


module.exports = {
    killAll: terminateAllInstances,
    create: createOneInstance
}
