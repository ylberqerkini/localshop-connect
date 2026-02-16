import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle, ShoppingCart, Store as StoreIcon } from 'lucide-react';

export default function OrderConfirmation() {
  const { subdomain, orderNumber } = useParams<{ subdomain: string; orderNumber: string }>();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center h-16 px-4 gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <StoreIcon className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6 py-12">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Porosia u dërgua me sukses!</h1>
            <p className="text-muted-foreground">
              Faleminderit për porosinë tuaj. Do të kontaktoheni së shpejti për konfirmimin.
            </p>
          </div>

          <div className="bg-muted/50 rounded-xl p-4 space-y-1">
            <p className="text-sm text-muted-foreground">Numri i porosisë</p>
            <p className="text-xl font-mono font-bold text-foreground">{orderNumber}</p>
          </div>

          <div className="space-y-3 pt-4">
            <Link to={`/store/${subdomain}`} className="block">
              <Button className="w-full gap-2" size="lg">
                <ShoppingCart className="h-5 w-5" />
                Vazhdo blerjen
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <p>Mundësuar nga <span className="font-semibold text-primary">eblej</span></p>
      </footer>
    </div>
  );
}
