const api = require('@beauraines/rtm-api');
const fs = require('fs');
const os = require('os');
const path = require('path');


const CLIENT = {
      apiKey: "cbc76268b901ccb8d9fc5f3aebc4ee1f",
      apiSecret: "131beea786379309",
      perms: "delete"
    }

const main = async () => {
    const client = new api(
        CLIENT.apiKey,
        CLIENT.apiSecret,
        CLIENT.perms
    )    ;


    const args = process.argv.slice(2).length > 0 ? process.argv.slice(2) : []
    if (args.length == 0) {
        console.error("You must include a frob");
        process.exit(1);
    }

    const frob = args[0];
    
    client.auth.getAuthToken(frob,function(err,user){
            if ( err ) {
                console.error('Could not Log In (' + err.msg + ')');
                process.exit(1);
            }
        console.log('Logged in As: ' + user.username);
        console.log(userToConfig(user));

        const filePath = path.normalize(os.homedir() + '/' + '.rtm.json');
        fs.writeFileSync(filePath,JSON.stringify(userToConfig(user)),{ encoding: 'utf8' });
    })
    
}

main()


const userToConfig = (user) => {
    const config ={};
    config.user = {
        id: user._id,
        username: user._username,
        fullname: user._fullname,
        authToken: user._authToken,
        client: CLIENT,
        timeline: user._timeline
    }
    return config;
}