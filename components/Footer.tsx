'use client';
import Link from 'next/link';
import Image from 'next/image';
import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full border-t border-gray-100  bg-gray-50 mt-auto">
      <div className="px-20 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* The logo section*/}
          <div className="flex flex-col gap-4">
            <div className="flex gap-4 items-center">
              <Image
                src="/gladiator-logo.png"
                alt="Gladiator Logo"
                width={40}
                height={40}
              />
              <h2 className="font-heading font-extrabold text-accent text-2xl">
                Gladiator
              </h2>
            </div>
            <p className="text-gray-600 text-sm">
            </p>
          </div>

          {/* Pages (The 3 Pages that any customer can access) */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Pages</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-600 hover:text-accent transition-all">
                  Menu
                </Link>
              </li>
              <li>
                <Link href="/select-location" className="text-gray-600 hover:text-accent transition-all">
                  Select Location
                </Link>
              </li>
              <li>
                <Link href="/cart" className="text-gray-600 hover:text-accent transition-all">
                  Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Account (Customer will have this different from guest) */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/login" className="text-gray-600 hover:text-accent transition-all">
                  Login
                </Link>
              </li>
              <li>
                <Link href="/sign-up" className="text-gray-600 hover:text-accent transition-all">
                  Sign Up
                </Link>
              </li>
            </ul>
          </div>

          {/* Useful Links Section (Links that would take the customer to the offical gladiator website) */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Useful Links</h3>
            <ul className="space-y-2 text-gray-600">
              <li>
                <a
                  href="https://www.gladiatorburger.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-accent transition-all"
                >
                  Official Website
                </a>
              </li>
              <li>
                <a
                  href="https://www.gladiatorburger.com/contact"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-accent transition-all"
                >
                  Contact Gladiator
                </a>
              </li>
              <li>
                <a
                  href="https://www.gladiatorburger.com/about-us"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-accent transition-all"
                >
                  About Gladiator
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="flex justify-center border-t border-gray-200 px-20 py-6">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <p>&copy; {new Date().getFullYear()} PickMeUp Gladiator. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
