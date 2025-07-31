import Login from "./components/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import { useState } from "react";

const App = () => {
    const [token, setToken] = useState(null);
    const [username, setUsername] = useState('');

    const handleLogin = (jwt, username) => {
        setToken(jwt);
        setUsername(username);
    };

    const handleLogout = () => {
        setToken(null);
        setUsername('');
    };

    if (!token) {
        return <Login onLogin={handleLogin} />;
    }

    return <Dashboard token={token} username={username} onLogout={handleLogout} />;
};

export default App;