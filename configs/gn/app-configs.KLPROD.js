export default {
    hostingPort: 5000,
    apiSettings: {
        enabledApi: true,
        apiUrl: "http://gn-game-api-klprod-service:5000",
        authUrl: "http://gn-auth-api-klprod-service:5000",
        client: {
            id: "game-server",
            secret: "gameserver@20luminet&",
        },
        useAuthenticate: true,
        requestTimeout: 10000,
        placeBetTimeout: 2000,
        enabledApiLogs: true,
    },
    socketOptions: {
        pingInterval: 60 * 1000,
        pingTimeout: 60 * 1000,
        transports: ["websocket"],
        allowUpgrades: false,
        perMessageDeflate: false,
    },
    enabledLogs: true,
    database: {
        url: "mongodb://lmn_backend:Q74~T0vK6%25gMO%3AII%60L%5DMxc%2CR%5E%28IhxpAt@10.146.34.26:39410,10.146.34.27:39410,10.146.34.30:39410,10.146.34.28:39410/?replicaSet=SN-Main&appName=SicBall",
        options: {
            dbName: "minigame",
            useNewUrlParser: true,
            useUnifiedTopology: true,
            auto_reconnect: true,
        },
    },
    sentry: {
        sentryUrl: "http://f457113be82441879a991096fce8c26c@sentry-scklprod-ovs.ops-klprod.gamora.prod/172",
        logIdentifier: "SicBall",
        env: "prod",
    },
    authenticateSettings: {
        url: "http://gn-auth-api-klprod-service:5000",
        id: "game-services",
        secret: "gameservices@20luminet&",
        requestTimeout: 10000,
        useAuthenticate: true,
        audiences: ["api", "admin-api"],
    },
    userServiceSettings: {
        url: "http://gn-user-service-klprod-service:5000",
    },
    adminSecretKey: "asWDEerfOIdgsdqRTFabvmgh",
    metrics: {
        enable: true,
        secretKey: "6c1f0f28-70f2-46ae-b031-22624a6cd8df",
    },
    enableMsgpackParser: true,
    gameManagementApiSettings: {
        BASE: "http://gn-game-management-service-klprod-service:5000",
    },
    disableCors: false,
};
