import { Link } from 'react-router-dom';
import { Users, MessageSquare, Sparkles, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const Index = () => {
  const features = [
    { icon: Users, title: 'Community Support', description: 'Connect with fellow students who can help' },
    { icon: MessageSquare, title: 'Real-time Chat', description: 'Communicate instantly with helpers' },
    { icon: Sparkles, title: 'Build Reputation', description: 'Earn recognition by helping others' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-xl border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="HYB Logo"
              className="w-9 h-9 object-contain"
            />
            <span className="text-xl font-display font-bold">HYB</span>
          </Link>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild className="btn-gradient-primary">
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 -z-10" style={{ background: 'var(--gradient-hero)', opacity: 0.05 }} />
        
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold mb-6 leading-tight">
              Help Your <span className="gradient-text">Buddy</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              A community where students help each other through shared knowledge and support. Need something? Someone's got your back.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="btn-gradient-primary gap-2 h-12 px-8">
                <Link to="/register">
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 px-8">
                <Link to="/login">Sign in</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-display font-bold mb-4">How it works</h2>
            <p className="text-muted-foreground">Simple, fast, and community-driven</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-6 rounded-2xl bg-card border border-border hover-lift"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl" style={{ background: 'var(--gradient-hero)' }}>
          <h2 className="text-3xl font-display font-bold text-white mb-4">Ready to join the community?</h2>
          <p className="text-white/80 mb-8">Start helping or getting helped today. It's free!</p>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 h-12 px-8">
            <Link to="/register">Create Account</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="HYB Logo"
              className="w-4 h-4 object-contain"
            />
            <span>HYB - Help Your Buddy</span>
          </div>

          <div className="flex items-center gap-4">
            <a href="/about" className="text-muted-foreground hover:text-foreground">About</a>
            <a href="/contact" className="text-muted-foreground hover:text-foreground">Contact</a>
            <p className="hidden sm:block">Built for students</p>
          </div>

        </div>
      </footer>
    </div>
  );
};

export default Index;
