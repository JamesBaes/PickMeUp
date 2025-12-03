'use client';
import Link from 'next/link'
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import React from 'react'


const links1 = [
  {
    name: 'menu',
    path: '/'
  },
  {
    name: 'select location',
    path: '/select-location'
  },
  {
    name: 'cart',
    path: '/cart'
  },
]

const links2 = [
  {
    name: 'login',
    path: '/login'
  },
  {
    name: 'sign up',
    path: '/sign-up'
  },
]

// Desktop NavBar (No Account)
const NavBar = () => {  
  const pathname = usePathname();
  return (
    <nav className="flex justify-between w-full px-20 py-4 border-b border-gray-100 bg-gray-50 shadow-lg ">
      <Link
        href={"/"}
        className="flex gap-4 items-center"
      >
        <Image
          src="/gladiator-logo.png"
          alt="Gladiator Logo"
          title="Gladiator Logo"
          width='48'
          height='48'
        />
        <h1 className="font-heading font-extrabold text-accent text-4xl">
          Gladiator
        </h1>
      </Link>
      <div className="flex gap-16">
        {links1.map((link, index) => {
          return (
            <Link
              href={link.path}
              key={index}
              className={`${
                link.path === pathname && "text-accent"
              } text-xl content-center capitalize font-heading font-semibold hover:text-accent transition-all`
              }
            >
              {link.name}
            </Link>
          )
        })}
      </div>
      <div className="flex gap-16">
        {links2.map((link, index) => {
          return (
            <Link
              href={link.path}
              key={index}
              className={`${
                link.path === pathname && "text-accent"
              } content-center text-xl capitalize font-heading font-semibold hover:text-accent transition-all`
              }
            >
              {link.name}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default NavBar