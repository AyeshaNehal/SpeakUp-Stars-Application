import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  Sparkles,
  Mic,
  Award,
  Trophy,
  User,
  ShieldCheck,
  Star,
  Flame,
  Volume2,
  Gamepad2,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const mainNav = [
    {
      to: '/',
      label: 'Home',
      icon: Home,
      color: 'bg-sunny-100 text-amber-700 group-hover:bg-sunny',
      activeBg: 'bg-sunny-100 text-amber-900 border-sunny-300 font-bold',
    },
    {
      to: '/wheel',
      label: 'Topic Wheel',
      icon: Sparkles,
      color: 'bg-sky-100 text-sky-700 group-hover:bg-sky-200',
      activeBg: 'bg-sky-100 text-sky-900 border-sky-300 font-bold',
    },
    {
      to: '/games',
      label: 'Mini-Games',
      icon: Gamepad2,
      color: 'bg-orange-100 text-orange-700 group-hover:bg-orange-200',
      activeBg: 'bg-orange-100 text-orange-900 border-orange-300 font-bold',
    },
    {
      to: '/record',
      label: 'Speak & Practice',
      icon: Mic,
      color: 'bg-coral-100 text-coral-700 group-hover:bg-coral-200',
      activeBg: 'bg-coral-100 text-coral-900 border-coral-300 font-bold',
    },
    {
      to: '/results',
      label: 'Star Feedback',
      icon: Award,
      color: 'bg-purple-100 text-purple-700 group-hover:bg-purple-200',
      activeBg: 'bg-purple-100 text-purple-900 border-purple-300 font-bold',
    },
    {
      to: '/rewards',
      label: 'My Rewards',
      icon: Trophy,
      color: 'bg-mint-100 text-mint-700 group-hover:bg-mint-200',
      activeBg: 'bg-mint-100 text-mint-900 border-mint-300 font-bold',
    },
    {
      to: '/profile',
      label: 'My Profile',
      icon: User,
      color: 'bg-indigo-100 text-indigo-700 group-hover:bg-indigo-200',
      activeBg: 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold',
    },
  ];

  return (
    <aside
      className="
        hidden md:flex flex-col w-64 lg:w-72 xl:w-80
        h-screen sticky top-0
        bg-white border-r-3 border-slate-100
        p-4 lg:p-6 justify-between select-none
        shadow-sm z-30
      "
      aria-label="Desktop Sidebar Navigation"
    >
      {/* Brand Header */}
      <div className="space-y-6">
        <NavLink
          to="/"
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sunny-400 rounded-2xl p-1"
        >
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="w-12 h-12 lg:w-14 lg:h-14 rounded-2xl bg-gradient-to-tr from-sunny to-amber-300 flex items-center justify-center shadow-md shadow-sunny-500/20 text-2xl border-2 border-white"
          >
            ⭐
          </motion.div>
          <div>
            <span className="font-heading font-black text-xl lg:text-2xl tracking-tight text-slate-800 flex items-center gap-1">
              SpeakUp <span className="text-amber-500">Stars</span>
            </span>
            <p className="text-xs font-semibold text-slate-400">Kids Voice Adventure</p>
          </div>
        </NavLink>

        {/* Kid Mini Status Card */}
        <div className="bg-gradient-to-br from-sunny-50 via-sky-50 to-mint-50 rounded-3xl p-3.5 border-2 border-slate-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🦁</span>
              <div>
                <p className="font-heading font-bold text-slate-800 text-sm">Leo</p>
                <p className="text-xs font-semibold text-slate-500">Age 7 • Explorer</p>
              </div>
            </div>
            <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-full shadow-xs border border-slate-100">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              <span className="font-heading font-bold text-xs text-orange-600">4d</span>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-200/60 text-xs font-bold text-slate-600">
            <span className="flex items-center gap-1 text-amber-600">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
              124 Stars
            </span>
            <span className="text-sky-600 bg-sky-100/80 px-2 py-0.5 rounded-md text-[11px]">
              Level 3 🌟
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1.5" aria-label="Main Menu">
          {mainNav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `
                  group flex items-center gap-3.5 px-3.5 py-3 rounded-2xl
                  text-slate-700 font-heading text-base font-semibold
                  transition-all duration-150 border-2 border-transparent
                  focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sunny-400
                  ${isActive ? item.activeBg : 'hover:bg-slate-50 hover:text-slate-900'}
                `}
              >
                {({ isActive }) => (
                  <motion.div
                    whileHover={{ x: 4 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className="flex items-center gap-3.5 w-full"
                  >
                    <div
                      className={`
                        w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                        ${isActive ? 'bg-white shadow-xs' : item.color}
                      `}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-current" />
                    )}
                  </motion.div>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Area: Parent Dashboard & Sound toggle */}
      <div className="pt-4 border-t-2 border-slate-100 space-y-2">
        <NavLink
          to="/parent"
          className={({ isActive }) => `
            flex items-center justify-between px-3.5 py-3 rounded-2xl
            font-heading text-sm font-bold transition-all
            border-2
            focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-400
            ${
              isActive
                ? 'bg-purple-100 text-purple-900 border-purple-300'
                : 'bg-slate-50 text-slate-700 border-slate-200/80 hover:bg-purple-50 hover:border-purple-200'
            }
          `}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-200 text-purple-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <span>Parent Dashboard</span>
          </div>
          <span className="text-[11px] bg-white px-2 py-0.5 rounded-full text-slate-500 border border-slate-200">
            PIN 🔒
          </span>
        </NavLink>

        <div className="flex items-center justify-between px-2 pt-1 text-xs text-slate-400 font-semibold">
          <span className="flex items-center gap-1.5 text-slate-500">
            <Volume2 className="w-3.5 h-3.5 text-mint-500" />
            Sound FX On
          </span>
          <span className="text-[11px] text-slate-400">v0.1 PWA</span>
        </div>
      </div>
    </aside>
  );
};
