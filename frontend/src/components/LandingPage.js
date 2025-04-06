import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "./LandingPage.module.css";

const LandingPage = () => {
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.landingContainer}>
      <h1 className={styles.landingTitle}>Welcome to the Hectoc Portal!</h1>
      <p className={styles.landingText}>Stay electrified with the latest puzzles. Sign in to continue.</p>

      {/* Stylish Clock */}
      <div className={styles.clock}>{time}</div>

      <div className={styles.buttonContainer}>
        <Link to="/login">
          <button className={`${styles.button} ${styles.loginBtn}`}>Sign In</button>
        </Link>
        <Link to="/signup">
          <button className={`${styles.button} ${styles.signupBtn}`}>Sign Up</button>
        </Link>
      </div>
    </div>
  );
};

export default LandingPage;
