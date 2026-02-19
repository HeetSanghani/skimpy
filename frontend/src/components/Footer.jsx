import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTwitter, faFacebook, faInstagram, faDiscord, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import { faEnvelope, faPhone } from '@fortawesome/free-solid-svg-icons';

function Footer() {
  return (
    <footer className="bg-[#0a0a0a] text-gray-300 border-t border-gray-800 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-900/20 rounded-full blur-[128px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-pink-900/20 rounded-full blur-[128px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10 grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Brand Column */}
        <div className="md:col-span-1 space-y-4">
          <Link to="/" className="text-3xl font-black tracking-tighter block">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300">
              SKIMPY
            </span>
          </Link>
          <p className="text-sm text-gray-400 leading-relaxed">
            The next-generation marketplace for the bold and the curious. Thrifted treasures meet futuristic craft.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3 className="font-sora font-bold text-white mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">Explore</h3>
          <ul className="space-y-3 text-sm">
            <li><Link to="/products" className="hover:text-indigo-400 transition-all duration-200 hover:translate-x-1 inline-block">All Products</Link></li>
            <li><Link to="/about" className="hover:text-indigo-400 transition-all duration-200 hover:translate-x-1 inline-block">About Us</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h3 className="font-sora font-bold text-white mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">Support</h3>
          <ul className="space-y-3 text-sm">
            <li><Link to="/contact" className="hover:text-pink-400 transition-all duration-200 hover:translate-x-1 inline-block">Contact Us</Link></li>
          </ul>
        </div>

        {/* Contact & Social */}
        <div>
          <h3 className="font-sora font-bold text-white mb-6 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">Connect</h3>

          {/* Contact Info */}
          <ul className="space-y-3 text-sm mb-6">
            <li>
              <a
                href="mailto:skimpy2022@gmail.com"
                className="flex items-center gap-2 text-gray-400 hover:text-indigo-400 transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faEnvelope} className="text-indigo-500 shrink-0" />
                skimpy2022@gmail.com
              </a>
            </li>
            <li>
              <a
                href="tel:+919824052103"
                className="flex items-center gap-2 text-gray-400 hover:text-indigo-400 transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faPhone} className="text-indigo-500 shrink-0" />
                +91 98240 52103
              </a>
            </li>
          </ul>

          {/* Social Icons */}
          <div className="flex space-x-3">
            {[faTwitter, faFacebook, faInstagram, faDiscord].map((icon, i) => (
              <a
                key={i}
                href="#"
                className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-indigo-500 hover:bg-indigo-600/20 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-300 hover:scale-110 hover:-translate-y-1"
              >
                <FontAwesomeIcon icon={icon} />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom Bar: copyright + developer credit ── */}
      <div className="relative z-10 border-t border-gray-800/60">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          {/* Copyright */}
          <p>© {new Date().getFullYear()} Skimpy Inc. All rights reserved.</p>

          {/* Developer credit — styled like the reference image */}
          <div className="flex items-center gap-3 flex-wrap justify-center">
            <span>
              Developed by{' '}
              <a
                href="https://www.instagram.com/_heet_patel_3108/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors duration-200"
              >
                Heet Sanghani
              </a>
            </span>

            <span className="text-gray-700">|</span>

            <span className="flex items-center gap-2">
              <span className="text-gray-500">Connect:</span>
              <a
                href="https://www.instagram.com/_heet_patel_3108/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faInstagram} />
                Instagram
              </a>
              <span className="text-gray-700">•</span>
              <a
                href="https://www.linkedin.com/in/heet-sanghani-80817a314"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-violet-400 hover:text-violet-300 font-medium transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faLinkedin} />
                LinkedIn
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
