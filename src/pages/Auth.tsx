import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Store, ArrowLeft, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('Email i pavlefshëm'),
  password: z.string().min(6, 'Fjalëkalimi duhet të ketë të paktën 6 karaktere'),
});

const signupSchema = authSchema.extend({
  businessName: z.string().min(2, 'Emri i biznesit duhet të ketë të paktën 2 karaktere'),
  subdomain: z.string()
    .min(3, 'Subdomain duhet të ketë të paktën 3 karaktere')
    .max(30, 'Subdomain nuk mund të ketë më shumë se 30 karaktere')
    .regex(/^[a-z0-9-]+$/, 'Vetëm shkronja të vogla, numra dhe viza'),
});

export default function Auth() {
  const [searchParams] = useSearchParams();
  const isSignUp = searchParams.get('mode') === 'signup';
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const validation = signupSchema.safeParse({ email, password, businessName, subdomain });
        if (!validation.success) {
          setError(validation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error: signUpError } = await signUp(email, password);
        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('Ky email është regjistruar tashmë');
          } else {
            setError(signUpError.message);
          }
          setLoading(false);
          return;
        }

        setSuccess('Kontrolloni emailin tuaj për të konfirmuar llogarinë');
      } else {
        const validation = authSchema.safeParse({ email, password });
        if (!validation.success) {
          setError(validation.error.errors[0].message);
          setLoading(false);
          return;
        }

        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          if (signInError.message.includes('Invalid login')) {
            setError('Email ose fjalëkalim i gabuar');
          } else {
            setError(signInError.message);
          }
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      setError('Ndodhi një gabim. Provoni përsëri.');
    } finally {
      setLoading(false);
    }
  };

  const generateSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .slice(0, 30);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex flex-col items-center justify-center p-4">
      <Link to="/" className="absolute top-4 left-4 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Kthehu
      </Link>

      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center">
            <Store className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-2xl">eblej.com</span>
        </div>

        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isSignUp ? 'Krijo llogarinë' : 'Hyr në llogari'}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? 'Fillo të shesësh online sot'
                : 'Menaxho biznesin tënd online'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {isSignUp && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Emri i biznesit</Label>
                    <Input
                      id="businessName"
                      placeholder="Kafeteria Joni"
                      value={businessName}
                      onChange={(e) => {
                        setBusinessName(e.target.value);
                        setSubdomain(generateSubdomain(e.target.value));
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Subdomain</Label>
                    <div className="flex items-center">
                      <Input
                        id="subdomain"
                        placeholder="kafeteria-joni"
                        value={subdomain}
                        onChange={(e) => setSubdomain(generateSubdomain(e.target.value))}
                        className="rounded-r-none"
                      />
                      <span className="bg-muted px-3 py-2 border border-l-0 rounded-r-md text-sm text-muted-foreground">
                        .eblej.com
                      </span>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@shembull.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Fjalëkalimi</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-success/10 text-success text-sm p-3 rounded-lg">
                  {success}
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSignUp ? 'Regjistrohu' : 'Hyr'}
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                {isSignUp ? (
                  <>
                    Ke llogari?{' '}
                    <Link to="/auth" className="text-primary hover:underline">
                      Hyr këtu
                    </Link>
                  </>
                ) : (
                  <>
                    Nuk ke llogari?{' '}
                    <Link to="/auth?mode=signup" className="text-primary hover:underline">
                      Regjistrohu falas
                    </Link>
                  </>
                )}
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
