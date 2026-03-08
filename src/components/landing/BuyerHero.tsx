import { useState, useEffect, useCallback, memo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowRight, ShoppingBag, Star, TrendingUp, Search, Heart,
  Package, Sparkles
} from "lucide-react";
import { usePlatformCategories, buildCategoryTree } from "@/hooks/usePlatformCategories";
import { getCategoryIcon } from "@/lib/categoryIcons";
import { supabase } from "@/integrations/supabase/client";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import type { CarouselApi } from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import heroSlide1 from "@/assets/hero-slide-1.jpg";
import heroSlide2 from "@/assets/hero-slide-2.jpg";
import heroSlide3 from "@/assets/hero-slide-3.jpg";

interface ProductPreview {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  badge: string | null;
  business_subdomain: string;
}

const heroSlides = [
  {
    title: "Transport falas. Blerje globale.",
    subtitle: "Bli online nga dyqanet lokale me transport falas në shumë artikuj.",
    cta: "Bli tani",
    image: heroSlide1,
    overlay: "from-primary/80 via-primary/60 to-primary/40",
    icon: ShoppingBag,
  },
  {
    title: "Ofertat e ditës",
    subtitle: "Zbulo produkte me çmime të ulëta çdo ditë.",
    cta: "Shiko ofertat",
    image: heroSlide2,
    overlay: "from-accent/80 via-accent/60 to-accent/40",
    icon: Sparkles,
  },
  {
    title: "Teknologji e re",
    subtitle: "Laptopë, telefona, aksesorë dhe më shumë nga dyqanet lokale.",
    cta: "Eksploro",
    image: heroSlide3,
    overlay: "from-success/80 via-success/60 to-success/40",
    icon: TrendingUp,
  },
];

const ProductCardSkeleton = () => (
  <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
    <Skeleton className="aspect-square w-full" />
    <div className="p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-5 w-1/3" />
    </div>
  </div>
);

const BuyerHero = () => {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { data: categories = [] } = usePlatformCategories();
  const { roots } = buildCategoryTree(categories);
  const [featuredProducts, setFeaturedProducts] = useState<ProductPreview[]>([]);
  const [dealProducts, setDealProducts] = useState<ProductPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const [featuredRes, dealsRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, price, image_url, badge, business_id")
          .eq("is_active", true)
          .not("image_url", "is", null)
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("products")
          .select("id, name, price, image_url, badge, business_id")
          .eq("is_active", true)
          .eq("badge", "Ofertë")
          .not("image_url", "is", null)
          .limit(6),
      ]);

      const bizIds = [
        ...new Set([
          ...(featuredRes.data || []).map((p) => p.business_id),
          ...(dealsRes.data || []).map((p) => p.business_id),
        ]),
      ];

      const { data: bizData } = bizIds.length > 0
        ? await supabase.from("businesses").select("id, subdomain").in("id", bizIds)
        : { data: [] };

      const bizMap: Record<string, string> = {};
      (bizData || []).forEach((b) => (bizMap[b.id] = b.subdomain));

      const mapProduct = (p: any): ProductPreview => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image_url: p.image_url,
        badge: p.badge,
        business_subdomain: bizMap[p.business_id] || "",
      });

      setFeaturedProducts((featuredRes.data || []).map(mapProduct));
      setDealProducts((dealsRes.data || []).map(mapProduct));
      setLoading(false);
    }
    loadProducts();
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrentSlide(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    navigate(
      query.trim()
        ? `/marketplace?search=${encodeURIComponent(query.trim())}`
        : "/marketplace"
    );
  }, [query, navigate]);

  return (
    <div className="pt-16">
      {/* Category navbar */}
      <nav className="border-b border-border/50 bg-card" aria-label="Kategoritë">
        <div className="container mx-auto px-4 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-1 py-2 whitespace-nowrap">
            {roots.slice(0, 10).map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/marketplace?category=${cat.slug}`)}
                className="px-3 py-1.5 text-sm text-muted-foreground hover:text-primary hover:underline underline-offset-4 transition-colors shrink-0"
              >
                {cat.name}
              </button>
            ))}
            <button
              onClick={() => navigate("/marketplace")}
              className="px-3 py-1.5 text-sm text-primary font-medium hover:underline underline-offset-4 transition-colors shrink-0"
            >
              Të gjitha
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Carousel - Fade transition */}
      <section className="bg-card" aria-label="Oferta kryesore">
        <div className="container mx-auto px-4 py-6">
          <div className="relative rounded-2xl overflow-hidden min-h-[240px] sm:min-h-[320px]">
            {heroSlides.map((slide, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                  currentSlide === i ? "opacity-100 z-10" : "opacity-0 z-0"
                }`}
              >
                <div className="rounded-2xl p-8 sm:p-12 lg:p-16 flex flex-col justify-center min-h-[240px] sm:min-h-[320px] relative overflow-hidden">
                  <img
                    src={slide.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    loading={i === 0 ? "eager" : "lazy"}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${slide.overlay}`} />
                  <div className="absolute right-8 bottom-8 opacity-10 hidden sm:block">
                    <slide.icon className="w-32 h-32 text-white" />
                  </div>

                  <div className="relative max-w-lg">
                    <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white mb-3 leading-tight transition-all duration-500 delay-200 ${
                      currentSlide === i ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}>
                      {slide.title}
                    </h2>
                    <p className={`text-white/80 text-sm sm:text-base mb-6 max-w-md transition-all duration-500 delay-300 ${
                      currentSlide === i ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}>
                      {slide.subtitle}
                    </p>
                    <div className={`transition-all duration-500 delay-[400ms] ${
                      currentSlide === i ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
                    }`}>
                      <Button
                        onClick={() => navigate("/marketplace")}
                        className="bg-white text-foreground hover:bg-white/90 rounded-full px-6 font-semibold shadow-lg"
                      >
                        {slide.cta}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-4" role="tablist" aria-label="Slides">
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={currentSlide === i}
                  aria-label={`Slide ${i + 1}`}
                  onClick={() => api?.scrollTo(i)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    currentSlide === i
                      ? "bg-primary w-8"
                      : "bg-border hover:bg-muted-foreground/50 w-2.5"
                  }`}
                />
              ))}
            </div>
          </Carousel>
        </div>
      </section>

      {/* Search bar */}
      <section className="bg-card border-b border-border/50 py-6">
        <div className="container mx-auto px-4">
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto" role="search">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Kërko çdo gjë..."
                  className="pl-12 h-12 text-base rounded-full border-border bg-background focus-visible:ring-primary"
                  aria-label="Kërko produkte"
                />
              </div>
              <Button
                type="submit"
                className="h-12 px-8 rounded-full bg-primary hover:bg-primary/90 font-semibold"
              >
                Kërko
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Category grid */}
      <section className="py-10 bg-background" aria-label="Kategoritë">
        <div className="container mx-auto px-4">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-6">
            Eksploro sipas kategorisë
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {roots.slice(0, 8).map((cat) => {
              const Icon = getCategoryIcon(cat.icon);
              return (
                <button
                  key={cat.id}
                  onClick={() => navigate(`/marketplace?category=${cat.slug}`)}
                  className="flex flex-col items-center gap-3 group"
                  aria-label={`Kategoria ${cat.name}`}
                >
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-all duration-200 border border-border/50 group-hover:border-primary/30 group-hover:scale-105">
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>

          {roots.length > 8 && (
            <div className="mt-6 text-center">
              <Button
                variant="link"
                className="text-primary"
                onClick={() => navigate("/marketplace")}
              >
                Shiko të gjitha kategoritë <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Deals section */}
      {(loading || dealProducts.length > 0) && (
        <section className="py-10 bg-card border-y border-border/50" aria-label="Ofertat e ditës">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-accent" />
                  Ofertat e ditës
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Çmime speciale çdo ditë
                </p>
              </div>
              <Button
                variant="link"
                className="text-primary"
                onClick={() => navigate("/marketplace")}
              >
                Shiko të gjitha <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : dealProducts.map((product) => (
                    <ProductMiniCard key={product.id} product={product} />
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured / New Products */}
      <section className="py-10 bg-background" aria-label="Produktet më të reja">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Produktet më të reja
            </h2>
            <Button
              variant="link"
              className="text-primary"
              onClick={() => navigate("/marketplace")}
            >
              Shiko të gjitha <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : featuredProducts.map((product) => (
                  <ProductMiniCard key={product.id} product={product} />
                ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-8 bg-card border-t border-border/50" aria-label="Statistika">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-primary" />
              <div>
                <div className="text-lg font-bold text-foreground">500+</div>
                <div className="text-xs text-muted-foreground">Dyqane</div>
              </div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-accent" />
              <div>
                <div className="text-lg font-bold text-foreground">10,000+</div>
                <div className="text-xs text-muted-foreground">Produkte</div>
              </div>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-success" />
              <div>
                <div className="text-lg font-bold text-foreground">4.8</div>
                <div className="text-xs text-muted-foreground">Vlerësim mesatar</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const ProductMiniCard = memo(function ProductMiniCard({ product }: { product: ProductPreview }) {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <Link
      to={`/store/${product.business_subdomain}/product/${product.id}`}
      className="group bg-card rounded-xl border border-border/50 overflow-hidden hover:shadow-soft-lg hover:border-primary/20 transition-all duration-200"
    >
      <div className="aspect-square bg-muted/20 relative overflow-hidden">
        {product.image_url ? (
          <>
            {!imgLoaded && <Skeleton className="absolute inset-0" />}
            <img
              src={product.image_url}
              alt={product.name}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="h-10 w-10 text-muted-foreground/20" />
          </div>
        )}
        {product.badge && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-accent text-accent-foreground">
            {product.badge}
          </span>
        )}
        <button
          onClick={(e) => e.preventDefault()}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-card"
          aria-label="Shto në listën e dëshirave"
        >
          <Heart className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>
      <div className="p-3">
        <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
          {product.name}
        </h3>
        <p className="text-base font-bold text-foreground mt-1.5">
          €{product.price.toFixed(2)}
        </p>
      </div>
    </Link>
  );
});

export default BuyerHero;