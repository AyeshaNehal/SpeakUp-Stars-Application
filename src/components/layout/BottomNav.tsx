import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Mic, Trophy, User, Gamepad2 } from 'lucide-react';

interface BottomNavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  color: string;
  isCenter?: boolean;
}

export const BottomNav: React.FC = () => {
  const location = useLocation();

  const navItems: BottomNavItem[] = [
    {
      id: 'home',
      label: 'Home',
      path: '/',
      icon: <Home className="w-6 h-6" />,
      color: 'text-amber-500',
    },
    {
      id: 'games',
      label: 'Games',
      path: '/games',
      icon: <Gamepad2 className="w-6 h-6" />,
      color: 'text-orange-500',
    },
    {
      id: 'record',
      label: 'Speak!',
      path: '/record',
      icon: <Mic className="w-7 h-7 text-white" />,
      color: 'bg-coral text-white',
      isCenter: true,
    },
    {
      id: 'rewards',
      label: 'Rewards',
      path: '/rewards',
      icon: <Trophy className="w-6 h-6" />,
      color: 'text-mint-500',
    },
    {
      id: 'profile',
      label: 'Me',
      path: '/profile',
      icon: <User className="w-6 h-6" />,
      color: 'text-purple-500',
    },
  ];

  return (
    <nav
      aria-label="Mobile Navigation"
      className="
        md:hidden fixed bottom-0 left-0 right-0 z-40
        bg-white/95 backdrop-blur-md border-t-2 border-slate-200/80
        shadow-[0_-4px_20px_rgba(0,0,0,0.06)]
        pb-[calc(env(safe-area-inset-bottom,0px)+6px)] pt-1.5 px-2
      "
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          if (item.isCenter) {
            // Elevated Center "Speak!" Button with 56px+ target
            return (
              <NavLink
                key={item.id}
                to={item.path}
                aria-label="Speak and record voice"
                className="relative -top-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-coral-400 rounded-full"
              >
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92, y: 4 }}
                  className={`
                    w-16 h-16 min-h-[56px] min-w-[56px] rounded-full
                    bg-gradient-to-tr from-coral-500 to-coral
                    flex flex-col items-center justify-center
                    shadow-lg shadow-coral-500/40 border-4 border-white
                    btn-3d-coral
                    ${isActive ? 'ring-4 ring-coral-300 ring-offset-2' : ''}
                  `}
                >
                  {item.icon}
                  <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-white mt-0.5">
                    {item.label}
                  </span>
                </motion.div>
              </NavLink>
            );
          }

          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={`
                flex flex-col items-center justify-center
                min-h-[56px] min-w-[56px] px-2 py-1.5 rounded-2xl
                transition-all duration-200 select-none
                focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sunny-400
                ${isActive ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'}
              `}
            >
              <motion.div
                whileTap={{ scale: 0.88 }}
                className={`
                  relative flex flex-col items-center justify-center
                  p-1 rounded-2xl
                  ${isActive ? 'bg-slate-100' : ''}
                `}
              >
                <div className={isActive ? item.color : 'text-slate-400'}>
                  {item.icon}
                </div>
                <span className="text-xs font-heading font-semibold mt-1">
                  {item.label}
                </span>

                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="w-1.5 h-1.5 rounded-full bg-slate-800 mt-0.5"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </motion.div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
