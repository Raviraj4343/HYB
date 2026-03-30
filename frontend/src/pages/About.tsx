import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useSmartBackNavigation from '@/hooks/useSmartBackNavigation';

const About = () => {
  const goBack = useSmartBackNavigation('/');

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-4xl mx-auto rounded-3xl bg-card border border-border p-8 shadow-lg">
        <div className="mb-6">
          <Button type="button" variant="ghost" size="sm" className="rounded-full px-3" onClick={goBack}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="shrink-0">
            <img src="/Ravi%20Raj.jpeg" alt="Ravi Raj" className="w-44 h-44 object-cover rounded-2xl shadow-md" />
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-display font-bold mb-2">About Ravi Raj</h1>
            <p className="text-muted-foreground mb-4">
              Hi — I'm Ravi Raj, the creator of HYB (Help Your Buddy). This project was built to help students
              collaborate and support each other with academic and campus life challenges.
            </p>

            <p className="text-muted-foreground mb-4">
              If you'd like to get in touch, visit the <Link to="/contact" className="text-primary underline">Contact</Link> page.
            </p>

            <div className="text-sm text-muted-foreground">Built with ❤️ for students.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
