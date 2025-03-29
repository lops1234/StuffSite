// import React, { useState, useEffect, useCallback } from "react";
// import { useDispatch, useSelector } from "react-redux";
import { Routes, Route, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

// import * as AuthService from "./services/auth.service";
// import IUser from './types/user.type';

import Login from "./components/Login";
import Register from "./components/Register";
import Home from "./components/Home";
import Profile from "./components/Profile";
import Invaders from "./components/Invaders.tsx";
// import BoardUser from "./components/BoardUser";
// import BoardModerator from "./components/BoardModerator";
// import BoardAdmin from "./components/BoardAdmin";

// import { logout } from "./actions/auth";
// import AuthVerify from "./common/AuthVerify";

// import EventBus from "./common/EventBus";

const App: React.FC = () => {
    // const [showModeratorBoard, setShowModeratorBoard] = useState<boolean>(false);
    // const [showAdminBoard, setShowAdminBoard] = useState<boolean>(false);
    //
    // const { user: currentUser } = useSelector((state) => state.auth);
    // const dispatch = useDispatch();

    // const [currentUser, setCurrentUser] = useState<IUser | undefined>(undefined);

    // useEffect(() => {
    //     const user = AuthService.getCurrentUser();
    //
    //     if (user) {
    //         setCurrentUser(user);
    //         setShowModeratorBoard(user.roles.includes("ROLE_MODERATOR"));
    //         setShowAdminBoard(user.roles.includes("ROLE_ADMIN"));
    //     }
    //
    //     EventBus.on("logout", logOut);
    //
    //     return () => {
    //         EventBus.remove("logout", logOut);
    //     };
    // }, []);

    // const logOut = () => {
    //     AuthService.logout();
    //     setShowModeratorBoard(false);
    //     setShowAdminBoard(false);
    //     setCurrentUser(undefined);
    // };


    // const logOut = useCallback(() => {
    //     // dispatch(logout());
    // }, [dispatch]);

    // useEffect(() => {
    //     if (currentUser) {
    //         setShowModeratorBoard(currentUser.roles.includes("ROLE_MODERATOR"));
    //         setShowAdminBoard(currentUser.roles.includes("ROLE_ADMIN"));
    //     } else {
    //         setShowModeratorBoard(false);
    //         setShowAdminBoard(false);
    //     }
    //
    //     EventBus.on("logout", () => {
    //         logOut();
    //     });
    //
    //     return () => {
    //         EventBus.remove("logout");
    //     };
    // }, [currentUser, logOut]);

    return (
        <div>
            <nav className="navbar navbar-expand navbar-dark bg-dark">
                <Link to={"/"} className="navbar-brand">
                    bezKoder
                </Link>
                <div className="navbar-nav mr-auto">
                    <li className="nav-item">
                        <Link to={"/home"} className="nav-link">
                            Home
                        </Link>
                    </li>

                    {/*{showModeratorBoard && (*/}
                    {/*    <li className="nav-item">*/}
                    {/*        <Link to={"/mod"} className="nav-link">*/}
                    {/*            Moderator Board*/}
                    {/*        </Link>*/}
                    {/*    </li>*/}
                    {/*)}*/}

                    {/*{showAdminBoard && (*/}
                    {/*    <li className="nav-item">*/}
                    {/*        <Link to={"/admin"} className="nav-link">*/}
                    {/*            Admin Board*/}
                    {/*        </Link>*/}
                    {/*    </li>*/}
                    {/*)}*/}

                    {/*{currentUser && (*/}
                    {/*    <li className="nav-item">*/}
                    {/*        <Link to={"/user"} className="nav-link">*/}
                    {/*            User*/}
                    {/*        </Link>*/}
                    {/*    </li>*/}
                    {/*)}*/}
                </div>

                {/*{currentUser ? (*/}
                {/*    <div className="navbar-nav ml-auto">*/}
                {/*        <li className="nav-item">*/}
                {/*            <Link to={"/profile"} className="nav-link">*/}
                {/*                {currentUser.username}*/}
                {/*            </Link>*/}
                {/*        </li>*/}
                {/*        <li className="nav-item">*/}
                {/*            <a href="/login" className="nav-link" onClick={logOut}>*/}
                {/*                LogOut*/}
                {/*            </a>*/}
                {/*        </li>*/}
                {/*    </div>*/}
                {/*) : (*/}
                <div className="navbar-nav ml-auto">
                    <li className="nav-item">
                        <Link to={"/login"} className="nav-link">
                            Login
                        </Link>
                    </li>

                    <li className="nav-item">
                        <Link to={"/register"} className="nav-link">
                            Sign Up
                        </Link>
                    </li>
                </div>
                {/*)}*/}
                <div className="navbar-nav mr-auto">
                    <li className="nav-item">
                        <Link to={"/invaders"} className="nav-link">
                            Invaders
                        </Link>
                    </li>
                </div>
            </nav>

            <div className="container mt-3">
                <Routes>
                    <Route path="/" element={<Home/>}/>
                    <Route path="/home" element={<Home/>}/>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path={"/invaders"} element={<Invaders />} />
                    {/*<Route path="/user" element={<BoardUser />} />*/}
                    {/*<Route path="/mod" element={<BoardModerator />} />*/}
                    {/*<Route path="/admin" element={<BoardAdmin />} />*/}
                </Routes>
            </div>

            {/*<AuthVerify logOut={logOut}/>*/}
        </div>
    );
};

export default App;