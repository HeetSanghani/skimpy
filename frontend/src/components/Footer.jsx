import React from 'react';
import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="bg-gray-800 text-gray-200">
      <div className="w-full px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h3 className="font-bold mb-2">About Us</h3>
          <p> info about company.</p>
        </div>
        <div>
          <h3 className="font-bold mb-2">Quick Links</h3>
          <ul>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/contact">Contact</Link></li>
      
          </ul>
        </div>
        <div>
          <h3 className="font-bold mb-2">Follow Us</h3>
          <div className="flex space-x-4">
            {/* social icons */}
            <a href="#">FB</a>
            <a href="#">Twitter</a>
            <a href="#">Instagram</a>
          </div>
        </div>
      </div>
      <div className="bg-gray-900 text-center text-sm p-4">
        © {new Date().getFullYear()} MyShop. All rights reserved.
      </div>
    </footer>
  );
}

export default Footer;
