import {configureStore} from '@reduxjs/toolkit';
import rootReducer from "./store/rootReducer.ts";

const store = configureStore({
    reducer: rootReducer,
});

export default store;