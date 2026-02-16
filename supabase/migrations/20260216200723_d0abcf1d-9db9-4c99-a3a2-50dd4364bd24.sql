
-- Platform-wide hierarchical categories
CREATE TABLE public.platform_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES public.platform_categories(id) ON DELETE CASCADE,
  icon text,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast hierarchy lookups
CREATE INDEX idx_platform_categories_parent ON public.platform_categories(parent_id);
CREATE INDEX idx_platform_categories_slug ON public.platform_categories(slug);

-- Enable RLS
ALTER TABLE public.platform_categories ENABLE ROW LEVEL SECURITY;

-- Everyone can read active categories
CREATE POLICY "Public can view active categories"
  ON public.platform_categories FOR SELECT
  USING (is_active = true);

-- Admins can manage all categories
CREATE POLICY "Admins can manage categories"
  ON public.platform_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Junction table: products <-> platform_categories (many-to-many)
CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.platform_categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, category_id)
);

CREATE INDEX idx_product_categories_product ON public.product_categories(product_id);
CREATE INDEX idx_product_categories_category ON public.product_categories(category_id);

ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Public can view product-category mappings
CREATE POLICY "Public can view product categories"
  ON public.product_categories FOR SELECT
  USING (true);

-- Business owners can manage their product categories
CREATE POLICY "Business owners can manage product categories"
  ON public.product_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM products p
      JOIN businesses b ON b.id = p.business_id
      WHERE p.id = product_categories.product_id AND b.owner_id = auth.uid()
    )
  );

-- Add tags column to products
ALTER TABLE public.products ADD COLUMN tags text[] DEFAULT '{}';

-- Seed: Main categories
INSERT INTO public.platform_categories (name, slug, parent_id, icon, sort_order) VALUES
  ('Moda & Aksesorë', 'moda-aksesore', NULL, 'shirt', 1),
  ('Produkte për Fëmijë & Bebë', 'femije-bebe', NULL, 'baby', 2),
  ('Shtëpi & Dekor', 'shtepi-dekor', NULL, 'home', 3),
  ('Bukuri & Kujdes Personal', 'bukuri-kujdes', NULL, 'sparkles', 4),
  ('Elektronikë', 'elektronike', NULL, 'cpu', 5),
  ('Ushqim & Pije', 'ushqim-pije', NULL, 'utensils-crossed', 6),
  ('Dhurata & Personalizime', 'dhurata-personalizime', NULL, 'gift', 7),
  ('Handmade & Artizanat', 'handmade-artizanat', NULL, 'palette', 8),
  ('Sport & Fitness', 'sport-fitness', NULL, 'dumbbell', 9),
  ('Produkte për Kafshë', 'produkte-kafshe', NULL, 'paw-print', 10),
  ('Auto & Moto', 'auto-moto', NULL, 'car', 11),
  ('Libra & Edukim', 'libra-edukim', NULL, 'book-open', 12),
  ('Ndërtim & Vegla', 'ndertim-vegla', NULL, 'wrench', 13),
  ('Shërbime & Produkte Digjitale', 'sherbime-digjitale', NULL, 'monitor', 14),
  ('Oferta & Clearance', 'oferta-clearance', NULL, 'percent', 15);

-- Seed: Subcategories
-- Moda & Aksesorë
INSERT INTO public.platform_categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, p.id, NULL, s.sort_order
FROM (VALUES
  ('Rroba për Femra', 'rroba-femra', 1),
  ('Rroba për Meshkuj', 'rroba-meshkuj', 2),
  ('Rroba për Fëmijë', 'rroba-femije', 3),
  ('Këpucë', 'kepuce', 4),
  ('Çanta', 'canta', 5),
  ('Aksesorë', 'aksesore-moda', 6),
  ('Veshje Tradicionale', 'veshje-tradicionale', 7)
) AS s(name, slug, sort_order)
CROSS JOIN (SELECT id FROM public.platform_categories WHERE slug = 'moda-aksesore') p;

-- Produkte për Fëmijë & Bebë
INSERT INTO public.platform_categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, p.id, NULL, s.sort_order
FROM (VALUES
  ('Rroba për Bebë', 'rroba-bebe', 1),
  ('Lodërra', 'loderra-femije', 2),
  ('Karroca', 'karroca', 3),
  ('Aksesorë për Bebë', 'aksesore-bebe', 4),
  ('Dekor për Dhoma Fëmijësh', 'dekor-dhoma-femijesh', 5)
) AS s(name, slug, sort_order)
CROSS JOIN (SELECT id FROM public.platform_categories WHERE slug = 'femije-bebe') p;

-- Shtëpi & Dekor
INSERT INTO public.platform_categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, p.id, NULL, s.sort_order
FROM (VALUES
  ('Mobilje', 'mobilje', 1),
  ('Dekor Murale', 'dekor-murale', 2),
  ('Ndriçim', 'ndricim', 3),
  ('Tekstile për Shtëpi', 'tekstile-shtepi', 4),
  ('Kuzhinë & Enë', 'kuzhine-ene', 5),
  ('Produkte Artizanale', 'produkte-artizanale', 6)
) AS s(name, slug, sort_order)
CROSS JOIN (SELECT id FROM public.platform_categories WHERE slug = 'shtepi-dekor') p;

-- Bukuri & Kujdes Personal
INSERT INTO public.platform_categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, p.id, NULL, s.sort_order
FROM (VALUES
  ('Kozmetikë', 'kozmetike', 1),
  ('Makeup', 'makeup', 2),
  ('Kujdes për Lëkurë', 'kujdes-lekure', 3),
  ('Kujdes për Flokë', 'kujdes-floke', 4),
  ('Parfume', 'parfume', 5),
  ('Produkte Natyrale', 'produkte-natyrale', 6)
) AS s(name, slug, sort_order)
CROSS JOIN (SELECT id FROM public.platform_categories WHERE slug = 'bukuri-kujdes') p;

-- Elektronikë
INSERT INTO public.platform_categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, p.id, NULL, s.sort_order
FROM (VALUES
  ('Telefona', 'telefona', 1),
  ('Aksesorë Telefoni', 'aksesore-telefoni', 2),
  ('Laptop & PC', 'laptop-pc', 3),
  ('Pajisje Gaming', 'pajisje-gaming', 4),
  ('TV & Audio', 'tv-audio', 5),
  ('Smart Devices', 'smart-devices', 6)
) AS s(name, slug, sort_order)
CROSS JOIN (SELECT id FROM public.platform_categories WHERE slug = 'elektronike') p;

-- Ushqim & Pije
INSERT INTO public.platform_categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, p.id, NULL, s.sort_order
FROM (VALUES
  ('Embëlsira', 'embelsira', 1),
  ('Produkte Shtëpiake', 'produkte-shtepiake', 2),
  ('Ushqime Bio', 'ushqime-bio', 3),
  ('Pije', 'pije', 4),
  ('Catering', 'catering', 5)
) AS s(name, slug, sort_order)
CROSS JOIN (SELECT id FROM public.platform_categories WHERE slug = 'ushqim-pije') p;

-- Dhurata & Personalizime
INSERT INTO public.platform_categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, p.id, NULL, s.sort_order
FROM (VALUES
  ('Dhurata për Ditëlindje', 'dhurata-ditelindje', 1),
  ('Dhurata për Dasmë', 'dhurata-dasme', 2),
  ('Produkte të Personalizuara', 'produkte-personalizuara', 3),
  ('Kuti Dhuratash', 'kuti-dhuratash', 4),
  ('Printime me Emër', 'printime-emer', 5)
) AS s(name, slug, sort_order)
CROSS JOIN (SELECT id FROM public.platform_categories WHERE slug = 'dhurata-personalizime') p;

-- Handmade & Artizanat
INSERT INTO public.platform_categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, p.id, NULL, s.sort_order
FROM (VALUES
  ('Punime me Dorë', 'punime-dore', 1),
  ('Qëndisje', 'qendisje', 2),
  ('Produkte Druri', 'produkte-druri', 3),
  ('Piktura', 'piktura', 4),
  ('Punime me Metal', 'punime-metal', 5)
) AS s(name, slug, sort_order)
CROSS JOIN (SELECT id FROM public.platform_categories WHERE slug = 'handmade-artizanat') p;

-- Sport & Fitness
INSERT INTO public.platform_categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, p.id, NULL, s.sort_order
FROM (VALUES
  ('Veshje Sportive', 'veshje-sportive', 1),
  ('Pajisje Fitnesi', 'pajisje-fitnesi', 2),
  ('Aksesorë Sportivë', 'aksesore-sportive', 3),
  ('Biçikleta', 'bicikleta', 4)
) AS s(name, slug, sort_order)
CROSS JOIN (SELECT id FROM public.platform_categories WHERE slug = 'sport-fitness') p;

-- Produkte për Kafshë
INSERT INTO public.platform_categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, p.id, NULL, s.sort_order
FROM (VALUES
  ('Ushqim për Kafshë', 'ushqim-kafshe', 1),
  ('Aksesorë', 'aksesore-kafshe', 2),
  ('Lodërra', 'loderra-kafshe', 3),
  ('Shtëpiza', 'shtepiza-kafshe', 4)
) AS s(name, slug, sort_order)
CROSS JOIN (SELECT id FROM public.platform_categories WHERE slug = 'produkte-kafshe') p;

-- Auto & Moto
INSERT INTO public.platform_categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, p.id, NULL, s.sort_order
FROM (VALUES
  ('Aksesorë Auto', 'aksesore-auto', 1),
  ('Pajisje', 'pajisje-auto', 2),
  ('Produkte Mirëmbajtjeje', 'produkte-mirembajtje', 3)
) AS s(name, slug, sort_order)
CROSS JOIN (SELECT id FROM public.platform_categories WHERE slug = 'auto-moto') p;

-- Libra & Edukim
INSERT INTO public.platform_categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, p.id, NULL, s.sort_order
FROM (VALUES
  ('Libra për Fëmijë', 'libra-femije', 1),
  ('Libra Edukativ', 'libra-edukativ', 2),
  ('Materiale Shkollore', 'materiale-shkollore', 3)
) AS s(name, slug, sort_order)
CROSS JOIN (SELECT id FROM public.platform_categories WHERE slug = 'libra-edukim') p;

-- Ndërtim & Vegla
INSERT INTO public.platform_categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, p.id, NULL, s.sort_order
FROM (VALUES
  ('Vegla Pune', 'vegla-pune', 1),
  ('Pajisje Elektrike', 'pajisje-elektrike', 2),
  ('Materiale Ndërtimi', 'materiale-ndertimi', 3)
) AS s(name, slug, sort_order)
CROSS JOIN (SELECT id FROM public.platform_categories WHERE slug = 'ndertim-vegla') p;

-- Shërbime & Produkte Digjitale
INSERT INTO public.platform_categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, p.id, NULL, s.sort_order
FROM (VALUES
  ('Dizajn Grafik', 'dizajn-grafik', 1),
  ('Printime', 'printime', 2),
  ('Kurse Online', 'kurse-online', 3),
  ('Template', 'template', 4),
  ('Produkte Digjitale', 'produkte-digjitale', 5)
) AS s(name, slug, sort_order)
CROSS JOIN (SELECT id FROM public.platform_categories WHERE slug = 'sherbime-digjitale') p;

-- Oferta & Clearance
INSERT INTO public.platform_categories (name, slug, parent_id, icon, sort_order)
SELECT name, slug, p.id, NULL, s.sort_order
FROM (VALUES
  ('Zbritje', 'zbritje', 1),
  ('Produkte në Ofertë', 'produkte-oferte', 2)
) AS s(name, slug, sort_order)
CROSS JOIN (SELECT id FROM public.platform_categories WHERE slug = 'oferta-clearance') p;
