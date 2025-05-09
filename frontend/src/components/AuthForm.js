// src/components/AuthForm.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Auth.css";

const AuthForm = ({ isSignup }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      let userCredential;

      if (isSignup) {
        if (!username.trim()) {
          setError("Username is required");
          return;
        }
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      const user = userCredential.user;
      const finalUsername = isSignup ? username : email.split("@")[0];
      const token = await user.getIdToken();

      const response = await fetch(`${API}/api/auth/${isSignup ? "signup" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: finalUsername,
          username: finalUsername,
          token,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Signup/Login failed");

      localStorage.setItem("username", finalUsername);
      localStorage.setItem("uid", user.uid);
      navigate(isSignup ? "/login" : "/game");
    } catch (err) {
      console.error("❌ Auth error:", err.message);
      setError(err.message || "Authentication failed.");
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const finalUsername = user.displayName || user.email.split("@")[0];
      const token = await user.getIdToken();

      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          displayName: finalUsername,
          username: finalUsername,
          token,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Google Sign-In failed");

      localStorage.setItem("username", finalUsername);
      localStorage.setItem("uid", user.uid);
      navigate("/game");
    } catch (err) {
      console.error("❌ Google Sign-In error:", err.message);
      setError(err.message || "Google Sign-In failed");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
      <div className="p-4 shadow-lg bg-white rounded" style={{ maxWidth: "400px", width: "100%" }}>
        <h2 className="text-center text-primary mb-3">{isSignup ? "Sign Up" : "Login"}</h2>
        {error && <p className="text-danger text-center">{error}</p>}
        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div className="mb-3">
              <label className="form-label">Username:</label>
              <input
                type="text"
                className="form-control"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          )}
          <div className="mb-3">
            <label className="form-label">Email:</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password:</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100 mb-2">
            {isSignup ? "Sign Up" : "Login"}
          </button>
        </form>
        <button onClick={handleGoogleLogin} className="btn btn-danger w-100 mb-3">
          Sign in with Google
        </button>
        <p className="mt-3 text-center">
          {isSignup ? "Already a user? " : "New user? "}
          <a href={isSignup ? "/login" : "/signup"} className="text-decoration-none text-primary">
            {isSignup ? "Login" : "Sign up"}
          </a>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
