import { useState } from 'react';
import api from '../api/axios';
import { useToast } from '../hooks/use-toast';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !message) {
      toast({ title: 'Email and message required', description: 'Please provide your email and a message.' });
      return;
    }

    setLoading(true);
    try {
      await api.post('/contact', { name, email, subject, message });
      toast({ title: 'Message sent', description: 'Thanks — I will get back to you soon.' });
      setName(''); setEmail(''); setSubject(''); setMessage('');
    } catch (err) {
      toast({ title: 'Failed to send', description: err?.message || 'Please try again later.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-20 px-4">
      <div className="max-w-3xl mx-auto rounded-3xl bg-card border border-border p-8 shadow-lg">
        <h1 className="text-2xl font-display font-bold mb-4">Contact</h1>
        <p className="text-muted-foreground mb-6">Send a message and I'll reply to your email. Messages are delivered to the site owner.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name (optional)</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 bg-input" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} required type="email" className="w-full rounded-lg border border-border px-3 py-2 bg-input" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full rounded-lg border border-border px-3 py-2 bg-input" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Message</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} required rows={6} className="w-full rounded-lg border border-border px-3 py-2 bg-input" />
          </div>

          <div className="flex items-center justify-end">
            <button type="submit" disabled={loading} className="btn-gradient-primary px-6 py-2 rounded-2xl">
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Contact;
