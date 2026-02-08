-- Create enum for order status
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

-- Create businesses table
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    name TEXT NOT NULL,
    subdomain TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    description TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    delivery_price DECIMAL(10,2) DEFAULT 0,
    cash_on_delivery BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create product categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create customers table (no login required for customers)
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create orders table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    order_number TEXT NOT NULL,
    status public.order_status DEFAULT 'pending' NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    delivery_fee DECIMAL(10,2) DEFAULT 0,
    total DECIMAL(10,2) NOT NULL,
    notes TEXT,
    city TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create order items table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS on all tables
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Businesses policies - owners can manage their own businesses
CREATE POLICY "Business owners can view their businesses"
ON public.businesses FOR SELECT
TO authenticated
USING (auth.uid() = owner_id);

CREATE POLICY "Business owners can create businesses"
ON public.businesses FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Business owners can update their businesses"
ON public.businesses FOR UPDATE
TO authenticated
USING (auth.uid() = owner_id);

-- Categories policies
CREATE POLICY "Business owners can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.businesses 
        WHERE businesses.id = categories.business_id 
        AND businesses.owner_id = auth.uid()
    )
);

-- Products policies - owners can manage, public can view active products
CREATE POLICY "Business owners can manage products"
ON public.products FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.businesses 
        WHERE businesses.id = products.business_id 
        AND businesses.owner_id = auth.uid()
    )
);

CREATE POLICY "Public can view active products"
ON public.products FOR SELECT
TO anon
USING (is_active = true);

-- Customers policies
CREATE POLICY "Business owners can view their customers"
ON public.customers FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.businesses 
        WHERE businesses.id = customers.business_id 
        AND businesses.owner_id = auth.uid()
    )
);

CREATE POLICY "Anyone can create customers"
ON public.customers FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Orders policies
CREATE POLICY "Business owners can manage orders"
ON public.orders FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.businesses 
        WHERE businesses.id = orders.business_id 
        AND businesses.owner_id = auth.uid()
    )
);

CREATE POLICY "Anyone can create orders"
ON public.orders FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Order items policies
CREATE POLICY "Business owners can view order items"
ON public.order_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.orders o
        JOIN public.businesses b ON b.id = o.business_id
        WHERE o.id = order_items.order_id 
        AND b.owner_id = auth.uid()
    )
);

CREATE POLICY "Anyone can create order items"
ON public.order_items FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Public access to businesses for subdomain lookup
CREATE POLICY "Public can view active businesses"
ON public.businesses FOR SELECT
TO anon
USING (is_active = true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();