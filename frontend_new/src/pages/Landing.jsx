import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, HelpCircle, Users, Mail, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/ui/AppLogo';

export default function Landing() {
  const [isAboutOpen, setIsAboutOpen] = React.useState(false);
  const [isContactOpen, setIsContactOpen] = React.useState(false);

  return (
    <div className="min-h-screen min-h-dvh bg-background flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-[50%] h-[50%] bg-primary/20 rounded-full mix-blend-screen filter blur-[120px]" />
        <div className="absolute -bottom-20 -right-20 w-[50%] h-[50%] bg-purple-500/20 rounded-full mix-blend-screen filter blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.12] mix-blend-overlay" />
      </div>

      {/* Navigation */}
      <header className="relative z-10 w-full border-b border-white/10 bg-background/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <AppLogo to="/" size="sm" />
          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-white transition-colors hidden sm:block">
              Sign In
            </Link>
            <Button asChild size="sm" className="rounded-full shadow-lg shadow-primary/20 text-sm">
              <Link to="/register">
                <span className="hidden sm:inline">Get Started</span>
                <span className="sm:hidden">Sign Up</span>
              </Link>
            </Button>
            <Link to="/login" className="sm:hidden text-sm font-medium text-muted-foreground hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 py-12 sm:py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto space-y-6 sm:space-y-8"
        >
          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs sm:text-sm font-medium text-primary backdrop-blur-sm">
            <span className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
            Student Community Platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white tracking-tight leading-[1.1]">
            A community where students{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
              help & learn together
            </span>
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Welcome to <strong className="text-white">Help Your Buddy</strong>. Whether you're stuck on a problem or want to share your knowledge, this is the place to connect with your peers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <Button asChild size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base rounded-full shadow-xl shadow-primary/20 w-full sm:w-auto">
              <Link to="/register">
                Join the Community <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base rounded-full border-white/20 bg-white/5 hover:bg-white/10 text-white w-full sm:w-auto backdrop-blur-sm">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </motion.div>

        {/* Feature Cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full max-w-5xl mx-auto mt-16 sm:mt-24 lg:mt-32 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 text-left px-0"
        >
          <div className="rounded-2xl sm:rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-md hover:bg-white/10 transition-colors">
            <div className="mb-4 sm:mb-6 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-primary/20 text-primary">
              <HelpCircle className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Ask for Help</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Stuck on an assignment or a project? Post your challenge and let your peers offer guidance and solutions in real time.
            </p>
          </div>

          <div className="rounded-2xl sm:rounded-[2rem] border border-white/10 bg-white/5 p-6 sm:p-8 backdrop-blur-md hover:bg-white/10 transition-colors">
            <div className="mb-4 sm:mb-6 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-purple-500/20 text-purple-400">
              <Users className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 sm:mb-3">Help Others</h3>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Share your expertise, connect with peers, and earn your reputation by helping those who need it most.
            </p>
          </div>
        </motion.div>
      </main>

      {/* Footer / Bottom Navbar */}
      <footer className="relative z-10 border-t border-white/10 bg-background/50 backdrop-blur-md mt-20 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Help Your Buddy. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsAboutOpen(true)}
              className="hover:text-white transition-colors font-medium cursor-pointer"
            >
              About Us
            </button>
            <button 
              onClick={() => setIsContactOpen(true)}
              className="hover:text-white transition-colors font-medium cursor-pointer"
            >
              Contact
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AnimatePresence>
        {isAboutOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAboutOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0e0c15]/90 border border-white/15 rounded-3xl p-8 max-w-md w-full relative shadow-2xl backdrop-blur-xl"
            >
              <button 
                onClick={() => setIsAboutOpen(false)}
                className="absolute top-5 right-5 text-muted-foreground hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex flex-col items-center text-center space-y-4">
                <img 
                  src="/Ravi%20Raj.jpeg" 
                  alt="Ravi Raj" 
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-primary/30 shadow-xl shadow-primary/20"
                />
                <div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-white font-display">About the Creator</h3>
                  <p className="text-xs sm:text-sm text-primary/80 font-medium mt-1">Ravi Raj</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  I built <strong className="text-white">Help Your Buddy</strong> to provide a collaborative space for students to share knowledge, solve challenges, and learn together.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isContactOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsContactOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0e0c15]/90 border border-white/15 rounded-3xl p-8 max-w-md w-full relative shadow-2xl backdrop-blur-xl"
            >
              <button 
                onClick={() => setIsContactOpen(false)}
                className="absolute top-5 right-5 text-muted-foreground hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                  <Mail className="h-6 w-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-white font-display">Contact</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Have questions, suggestions, or want to contribute? Reach out directly via email.
                </p>
                <a 
                  href="mailto:raviraj06112005@gmail.com" 
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium text-base transition-colors group mt-2"
                >
                  raviraj06112005@gmail.com
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
