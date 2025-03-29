import ReactDOM from 'react-dom/client';
import {BrowserRouter} from "react-router-dom";
import {Provider} from "react-redux";

import './index.css';
import App from './App';
import reportWebVitals from "./reportWebVitals.ts";
import store from "./store.ts";
import {StrictMode} from "react";

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

root.render(
    <StrictMode>
        <Provider store={store}>
            <BrowserRouter>
                <App/>
            </BrowserRouter>
        </Provider>
    </StrictMode>
);

reportWebVitals();
