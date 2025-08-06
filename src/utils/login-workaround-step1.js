const api = require('@beauraines/rtm-api');

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

    client.auth.getAuthUrl(function(err,url,frob) {
        console.log('Authenticate with RTM by opening the link in your web browser');
        console.log(url);
        console.log(`Once you've authenticated, run the following commmand`);
        console.log(`node src/utils/login-workaround-step2.js  ${frob}`);
        console.log(`Warning! This wil overwrite an existing ~/.rtm.json if you have one.`)
    })

    
}

main()