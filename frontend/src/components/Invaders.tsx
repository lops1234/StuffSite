import React from "react";
import InvadersGame from "../game/invaders/InvadersGame.tsx";

const Invaders: React.FC = () => {
    return (
        <div className="container">
            <InvadersGame />
        </div>
    );
};

export default Invaders;