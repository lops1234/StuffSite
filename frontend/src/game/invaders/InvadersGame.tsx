import React, {useEffect, useRef} from 'react';
import Phaser from 'phaser';




import GameScene from "./scenes/GameScene.ts";



const InvadersGame: React.FC = () => {
    const gameContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const config = {
            width: 1400,
            height: 750,
            backgroundColor: "#FFFFF",
            scene: [GameScene],
            physics: {
                default: "arcade"
            },
            parent: gameContainerRef.current || undefined
        };


        //
        // const config: Phaser.Types.Core.GameConfig = {
        //     type: Phaser.AUTO,
        //     width: 800,
        //     height: 600,
        //     physics: {
        //         default: "arcade",
        //         arcade: {
        //             gravity: {x: 0, y: 200},
        //         },
        //     },
        //     scene: {
        //         preload: preload,
        //         create: create,
        //         update: update
        //     },
        //     parent: gameContainerRef.current || undefined
        // };

        const game = new Phaser.Game(config);

        // function preload(this: Phaser.Scene) {
        //     // Load assets here
        //     this.load.setBaseURL("https://labs.phaser.io");
        //     this.load.image("sky", "assets/skies/space3.png");
        //     this.load.image("plane", "assets/sprites/ww2plane.png");
        //     this.load.image("green", "assets/particles/green.png");
        //     this.load.image("astroid", "assets/games/asteroids/asteroid1.png");
        //     this.load.image("astroid2", "assets/games/asteroids/asteroid1.png");
        //     this.load.image("astroid3", "assets/games/asteroids/asteroid1.png");
        // }
        //
        // function create(this: Phaser.Scene) {
        //     // Initialize game objects here
        //     this.add.image(400, 300, "sky");
        //     this.add.image(700, 300, "astroid");
        //     this.add.image(100, 200, "astroid2");
        //     this.add.image(400, 40, "astroid3");
        //
        //     const emitter = this.add.particles(100, 300, 'flares', {
        //
        //         frame: 'red',
        //
        //         angle: { min: -30, max: 30 },
        //
        //         speed: 100
        //
        //     });
        //
        //     const plane = this.physics.add.image(400, 100, "plane");
        //     plane.setVelocity(100, 200);
        //     plane.setBounce(1, 1);
        //     plane.setCollideWorldBounds(true);
        //     emitter.startFollow(plane);
        // }
        //
        // function update(this: Phaser.Scene) {
        //     // Game loop logic here
        // }

        return () => {
            game.destroy(true);
        };
    }, []);

    return <div ref={gameContainerRef}/>;
};

export default InvadersGame;