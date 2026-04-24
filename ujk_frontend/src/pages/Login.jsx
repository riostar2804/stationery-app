import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        try {
            const response = await axios.post('http://localhost:5000/api/login', {
                username: username,
                password: password
            });

            if (response.data.status === 'success') {
                localStorage.setItem('token', response.data.data.token); // Simpan session token
                localStorage.setItem('user', JSON.stringify({
                    user_id: response.data.data.user_id,
                    username: response.data.data.username
                }));
                
                navigate('/dashboard');
            }
        } catch (error) {
            if (error.response) {
                setErrorMsg(error.response.data.message);
            } else {
                setErrorMsg('Backend Failed')
            }
        }
    };

    return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Stationery Store</h2>
                    
                    {errorMsg && (
                        <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-lg">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Username</label>
                            <input 
                                type="text" 
                                className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Password</label>
                            <input 
                                type="password" 
                                className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none"
                        >
                            Login
                        </button>
                    </form>
                </div>
            </div>
        );
}