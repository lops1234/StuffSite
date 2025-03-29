let gameRoom;
let deadPlayerCh;
let myClientId;
let myChannel;
let gameOn = false;
let players = {};
let totalPlayers = 0;
let latestShipPosition;
let bulletThatShotMe;
let bulletThatShotSomeone;
let bulletOutOfBounds = "";
let amIalive = false;
let game;

const BASE_SERVER_URL = "http://localhost:5000";
const myNickname = localStorage.getItem("nickname");

const realtime = Ably.Realtime({
    authUrl: BASE_SERVER_URL + "/auth",
});

realtime.connection.once("connected", () => {
    myClientId = realtime.auth.clientId;
    gameRoom = realtime.channels.get("game-room");
    deadPlayerCh = realtime.channels.get("dead-player");
    myChannel = realtime.channels.get("clientChannel-" + myClientId);
    gameRoom.presence.enter(myNickname);
    game = new Phaser.Game(config);
});

create() {
    this.avatars = {};
    this.visibleBullets = {};
    this.ship = {};
    this.cursorKeys = this.input.keyboard.createCursorKeys();

    this.anims.create({
        key: "explode",
        frames: this.anims.generateFrameNumbers("explosion"),
        frameRate: 20,
        repeat: 0,
        hideOnComplete: true,
    });

    gameRoom.subscribe("game-state", (msg) => {
        if (msg.data.gameOn) {
            gameOn = true;
            if (msg.data.shipBody["0"]) {
                latestShipPosition = msg.data.shipBody["0"];
            }
            if (msg.data.bulletOrBlank != "") {
                let bulletId = msg.data.bulletOrBlank.id;
                this.visibleBullets[bulletId] = {
                    id: bulletId,
                    y: msg.data.bulletOrBlank.y,
                    toLaunch: true,
                    bulletSprite: "",
                };
            }
            if (msg.data.killerBulletId) {
                bulletThatShotSomeone = msg.data.killerBulletId;
            }
        }
        players = msg.data.players;
        totalPlayers = msg.data.playerCount;
    });

    gameRoom.subscribe("game-over", (msg) => {
        gameOn = false;
        localStorage.setItem("totalPlayers", msg.data.totalPlayers);
        localStorage.setItem("winner", msg.data.winner);
        localStorage.setItem("firstRunnerUp", msg.data.firstRunnerUp);
        localStorage.setItem("secondRunnerUp", msg.data.secondRunnerUp);
        gameRoom.unsubscribe();
        deadPlayerCh.unsubscribe();
        myChannel.unsubscribe();
        if (msg.data.winner == "Nobody") {
            window.location.replace(BASE_SERVER_URL + "/gameover");
        } else {
            window.location.replace(BASE_SERVER_URL + "/winner");
        }
    });
}

update() {
    if (gameOn) {
        if (this.ship.x) {
            this.ship.x = latestShipPosition;
        } else {
            this.ship = this.physics.add
                .sprite(latestShipPosition, config.height - 32, "ship")
                .setOrigin(0.5, 0.5);
            this.ship.x = latestShipPosition;
        }
        for (let item in this.visibleBullets) {
            if (this.visibleBullets[item].toLaunch) {
                this.visibleBullets[item].toLaunch = false;
                this.createBullet(this.visibleBullets[item]);
            } else {
                this.visibleBullets[item].bulletSprite.y -= 20;
                if (
                    this.visibleBullets[item].bulletSprite.y < 0 ||
                    this.visibleBullets[item].id == bulletThatShotSomeone
                ) {
                    this.visibleBullets[item].bulletSprite.destroy();
                    delete this.visibleBullets[item];
                }
            }
        }
    }

    for (let item in this.avatars) {
        if (!players[item]) {
            this.avatars[item].destroy();
            delete this.avatars[item];
        }
    }

    for (let item in players) {
        let avatarId = players[item].id;
        if (this.avatars[avatarId] && players[item].isAlive) {
            this.avatars[avatarId].x = players[item].x;
            this.avatars[avatarId].y = players[item].y;
            if (avatarId == myClientId) {
                document.getElementById("score").innerHTML =
                    "Score: " + players[item].score;
            }
        } else if (!this.avatars[avatarId] && players[item].isAlive) {
            if (players[item].id != myClientId) {
                let avatarName =
                    "avatar" +
                    players[item].invaderAvatarType +
                    players[item].invaderAvatarColor;
                this.avatars[avatarId] = this.physics.add
                    .sprite(players[item].x, players[item].y, avatarName)
                    .setOrigin(0.5, 0.5);
                this.avatars[avatarId].setCollideWorldBounds(true);
                document.getElementById("join-leave-updates").innerHTML =
                    players[avatarId].nickname + " joined";
                setTimeout(() => {
                    document.getElementById("join-leave-updates").innerHTML = "";
                }, 2000);
            } else if (players[item].id == myClientId) {
                let avatarName = "avatar" + players[item].invaderAvatarType;
                this.avatars[avatarId] = this.physics.add
                    .sprite(players[item].x, players[item].y, avatarName)
                    .setOrigin(0.5, 0.5);
                this.avatars[avatarId].setCollideWorldBounds(true);
                amIalive = true;
            }
        } else if (this.avatars[avatarId] && !players[item].isAlive) {
            this.explodeAndKill(avatarId);
        }
    }
    this.publishMyInput();
}

explodeAndKill(deadPlayerId) {
    this.avatars[deadPlayerId].disableBody(true, true);
    let explosion = new Explosion(
        this,
        this.avatars[deadPlayerId].x,
        this.avatars[deadPlayerId].y
    );
    delete this.avatars[deadPlayerId];
    document.getElementById("join-leave-updates").innerHTML =
        players[deadPlayerId].nickname + " died";
    setTimeout(() => {
        document.getElementById("join-leave-updates").innerHTML = "";
    }, 2000);
}

publishMyInput() {
    if (Phaser.Input.Keyboard.JustDown(this.cursorKeys.left) && amIalive) {
        myChannel.publish("pos", {
            keyPressed: "left",
        });
    } else if (
        Phaser.Input.Keyboard.JustDown(this.cursorKeys.right) &&
        amIalive
    ) {
        myChannel.publish("pos", {
            keyPressed: "right",
        });
    }
}

createBullet(bulletObject) {
    let bulletId = bulletObject.id;
    this.visibleBullets[bulletId].bulletSprite = this.physics.add
        .sprite(this.ship.x - 8, bulletObject.y, "bullet")
        .setOrigin(0.5, 0.5);

    //add an overlap callback if the current player is still alive
    if (amIalive) {
        if (
            this.physics.add.overlap(
                this.visibleBullets[bulletId].bulletSprite,
                this.avatars[myClientId],
                this.publishMyDeathNews,
                null,
                this
            )
        ) {
            bulletThatShotMe = bulletId;
        }
    }
}