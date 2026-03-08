import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import {
  Briefcase, MapPin, Clock, Send, CheckCircle2, Rocket,
  Users, Heart, TrendingUp, ArrowRight, Loader2, Upload
} from 'lucide-react';

const openPositions = [
  {
    id: 'frontend-dev',
    title: 'Frontend Developer',
    department: 'Inxhinieri',
    location: 'Prishtinë / Remote',
    type: 'Full-time',
    description: 'Ndërto përvoja moderne web me React, TypeScript dhe Tailwind CSS për platformën tonë e-commerce.',
  },
  {
    id: 'backend-dev',
    title: 'Backend Developer',
    department: 'Inxhinieri',
    location: 'Prishtinë / Remote',
    type: 'Full-time',
    description: 'Zhvillo API-të, databazat dhe logjikën e serverit me Supabase, PostgreSQL dhe Edge Functions.',
  },
  {
    id: 'ui-designer',
    title: 'UI/UX Designer',
    department: 'Dizajn',
    location: 'Prishtinë / Remote',
    type: 'Full-time',
    description: 'Dizajno ndërfaqe intuitive dhe të bukura për mijëra biznese dhe blerës në platformë.',
  },
  {
    id: 'marketing',
    title: 'Digital Marketing Specialist',
    department: 'Marketing',
    location: 'Prishtinë',
    type: 'Full-time',
    description: 'Menaxho fushatat digjitale, SEO, social media dhe strategjinë e rritjes së platformës.',
  },
  {
    id: 'support',
    title: 'Customer Support',
    department: 'Mbështetje',
    location: 'Prishtinë / Remote',
    type: 'Part-time',
    description: 'Ndihmo bizneset dhe blerësit me pyetje, probleme teknike dhe onboarding.',
  },
];

const perks = [
  { icon: Rocket, title: 'Rritje e shpejtë', description: 'Startup në rritje ku puna jote ka ndikim direkt' },
  { icon: Users, title: 'Ekip i shkëlqyer', description: 'Puno me njerëz të talentuar dhe të motivuar' },
  { icon: Heart, title: 'Fleksibilitet', description: 'Punë remote ose hibride, orare fleksibël' },
  { icon: TrendingUp, title: 'Zhvillim profesional', description: 'Buxhet për trajnime, konferenca dhe mësim' },
];

export default function Careers() {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    position: '',
    experience: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.phone || !form.position) {
      toast({ title: 'Gabim', description: 'Plotëso të gjitha fushat e detyrueshme', variant: 'destructive' });
      return;
    }
    setSubmitting(true);

    // Simulate submission (could be connected to a DB table later)
    await new Promise(r => setTimeout(r, 1500));

    setSubmitted(true);
    setSubmitting(false);
    toast({ title: 'Sukses!', description: 'Aplikimi u dërgua me sukses. Do t\'ju kontaktojmë së shpejti!' });
  };

  const update = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 lg:pt-40 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-subtle" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Briefcase className="w-4 h-4" />
            Mundësi punësimi
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground leading-tight mb-6">
            Bashkohu me ekipin e{' '}
            <span className="text-gradient-primary">eblej.com</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Po ndërtojmë platformën më të madhe të e-commerce në rajon. Kërko pozicionin tënd dhe apliko sot.
          </p>
          <Button variant="hero" size="xl" className="group" asChild>
            <a href="#positions">
              Shiko pozicionet
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </a>
          </Button>
        </div>
      </section>

      {/* Perks */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-12">Pse eblej.com?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {perks.map((perk) => (
              <Card key={perk.title} className="border-0 shadow-soft text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <perk.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{perk.title}</h3>
                  <p className="text-sm text-muted-foreground">{perk.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section id="positions" className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Pozicionet e hapura</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
            Zgjedh pozicionin që përshtatet me aftësitë tuaja dhe apliko direkt
          </p>
          <div className="grid gap-4 max-w-3xl mx-auto">
            {openPositions.map((pos) => (
              <Card key={pos.id} className="border-0 shadow-soft hover:shadow-md transition-shadow">
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{pos.title}</h3>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {pos.department}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{pos.description}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {pos.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {pos.type}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="shrink-0" asChild>
                      <a href="#apply" onClick={() => update('position', pos.id)}>
                        Apliko
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section id="apply" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">Apliko tani</h2>
            <p className="text-muted-foreground text-center mb-10">
              Plotëso formën dhe do të kontaktohesh brenda 3-5 ditëve pune
            </p>

            {submitted ? (
              <Card className="border-0 shadow-soft">
                <CardContent className="p-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Aplikimi u dërgua!</h3>
                  <p className="text-muted-foreground mb-6">
                    Faleminderit për interesimin! Ekipi ynë do ta shqyrtojë aplikimin tënd dhe do të kontaktojë së shpejti.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => { setSubmitted(false); setForm({ fullName: '', email: '', phone: '', position: '', experience: '', message: '' }); }}>
                      Apliko përsëri
                    </Button>
                    <Button asChild>
                      <Link to="/">Kthehu në faqen kryesore</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-soft">
                <CardContent className="p-6 sm:p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Emri i plotë *</Label>
                        <Input
                          id="fullName"
                          placeholder="Emri Mbiemri"
                          value={form.fullName}
                          onChange={(e) => update('fullName', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="emri@email.com"
                          value={form.email}
                          onChange={(e) => update('email', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Telefoni *</Label>
                        <Input
                          id="phone"
                          placeholder="+383 XXX XXX XXX"
                          value={form.phone}
                          onChange={(e) => update('phone', e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="position">Pozicioni *</Label>
                        <Select value={form.position} onValueChange={(v) => update('position', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Zgjedh pozicionin" />
                          </SelectTrigger>
                          <SelectContent>
                            {openPositions.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                            ))}
                            <SelectItem value="other">Tjetër</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience">Përvoja e punës</Label>
                      <Select value={form.experience} onValueChange={(v) => update('experience', v)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Zgjedh përvojën" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0-1">0-1 vite</SelectItem>
                          <SelectItem value="1-3">1-3 vite</SelectItem>
                          <SelectItem value="3-5">3-5 vite</SelectItem>
                          <SelectItem value="5+">5+ vite</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mesazhi / Motivimi</Label>
                      <Textarea
                        id="message"
                        placeholder="Tregoni pak për veten tuaj, përvojën dhe pse dëshironi të bashkoheni me eblej.com..."
                        rows={5}
                        value={form.message}
                        onChange={(e) => update('message', e.target.value)}
                      />
                    </div>

                    <Button type="submit" variant="hero" size="lg" className="w-full gap-2" disabled={submitting}>
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                      {submitting ? 'Duke dërguar...' : 'Dërgo aplikimin'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
