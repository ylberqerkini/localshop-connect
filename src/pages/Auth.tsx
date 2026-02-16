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
import { lovable } from '@/integrations/lovable/index';

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
  const isBuyer = searchParams.get('role') === 'buyer';
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
      navigate(isBuyer ? '/account' : '/dashboard');
    }
  }, [user, navigate, isBuyer]);

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
              {isSignUp ? (isBuyer ? 'Krijo llogarinë' : 'Krijo llogarinë biznesi') : 'Hyr në llogari'}
            </CardTitle>
            <CardDescription>
              {isSignUp
                ? (isBuyer ? 'Regjistrohu për të ndjekur porosit dhe dëshirat' : 'Fillo të shesësh online sot')
                : (isBuyer ? 'Hyr për të parë porosit dhe dëshirat' : 'Menaxho biznesin tënd online')}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {isSignUp && !isBuyer && (
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

              <div className="relative w-full">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ose</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                size="lg"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  const { error } = await lovable.auth.signInWithOAuth("google", {
                    redirect_uri: window.location.origin,
                  });
                  if (error) {
                    setError(error.message || 'Gabim me Google Sign-In');
                  }
                  setLoading(false);
                }}
              >
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Vazhdo me Google
              </Button>

              <p className="text-sm text-muted-foreground text-center">
                {isSignUp ? (
                  <>
                    Ke llogari?{' '}
                    <Link to={`/auth${isBuyer ? '?role=buyer' : ''}`} className="text-primary hover:underline">
                      Hyr këtu
                    </Link>
                  </>
                ) : (
                  <>
                    Nuk ke llogari?{' '}
                    <Link to={`/auth?mode=signup${isBuyer ? '&role=buyer' : ''}`} className="text-primary hover:underline">
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
