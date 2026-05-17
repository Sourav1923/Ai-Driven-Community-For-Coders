import React from 'react';

/**
 * Footer component providing site navigation, contact info, and copyright.
 * Designed to be responsive and accessible.
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Knight-Shop</h3>
          <p>Your one-stop shop for high-quality products and exceptional service.</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/cart">Cart</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Terms of Service</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>Email: support@knight-shop.com</p>
          <p>Phone: +9748204141</p>
          <div className="social-links">
            {/* Placeholder for social icons */}
            <span>FB</span> | <span>TW</span> | <span>IG</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} Knight-Ai. All rights reserved.</p>
      </div>

      <style jsx>{`
        .footer {
          background-color: #1a1a1a;
          color: #ffffff;
          padding: 40px 20px 20px;
          margin-top: auto;
        }
        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 40px;
        }
        .footer-section h3, .footer-section h4 {
          margin-bottom: 20px;
          color: #646cff;
        }
        .footer-section ul {
          list-style: none;
          padding: 0;
        }
        .footer-section ul li {
          margin-bottom: 10px;
        }
        .footer-section a {
          color: #ccc;
          text-decoration: none;
          transition: color 0.3s;
        }
        .footer-section a:hover {
          color: #ffffff;
        }
        .footer-bottom {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #333;
          font-size: 0.9rem;
          color: #888;
        }
        @media (max-width: 768px) {
          .footer-container {
            text-align: center;
          }
        }
      `}</style>
    </footer>
  );
};

export default Footer;