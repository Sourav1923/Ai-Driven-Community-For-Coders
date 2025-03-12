import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { UserContext } from '../context/user.context';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  function submitHandler(e) {
    e.preventDefault();

    axios
      .post('/users/login', {
        email,
        password,
      })
      .then((res) => {
        console.log(res.data);

        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);

        navigate('/');
      })
      .catch((err) => {
        console.log(err.response.data);
      });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-gray-900 animate-gradient">
      <div className="bg-gray-800 p-10 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700 backdrop-blur-sm bg-opacity-50">
        <h2 className="text-3xl font-bold text-white mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Welcome Back
        </h2>
        <form onSubmit={submitHandler}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="email">
              Email
            </label>
            <input
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              id="email"
              className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter your email"
            />
          </div>
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-400 mb-2" htmlFor="password">
              Password
            </label>
            <input
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              id="password"
              className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="w-full p-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold hover:from-purple-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all transform hover:scale-105"
          >
            Login
          </button>
        </form>
        <p className="text-gray-400 mt-6 text-center">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-purple-400 hover:text-purple-300 hover:underline transition-all"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;