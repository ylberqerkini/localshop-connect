import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderNotificationRequest {
  business_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  city: string;
  subtotal: number;
  delivery_fee: number;
  total: number;
  items: { product_name: string; quantity: number; unit_price: number; total: number }[];
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: OrderNotificationRequest = await req.json();

    // Fetch business details using service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: business, error: bizErr } = await supabase
      .from("businesses")
      .select("name, email, email_notifications")
      .eq("id", payload.business_id)
      .single();

    if (bizErr || !business) {
      console.error("Business not found:", bizErr);
      return new Response(JSON.stringify({ error: "Business not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check if notifications are enabled
    if (!business.email_notifications || !business.email) {
      return new Response(
        JSON.stringify({ message: "Notifications disabled or no email configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build items table
    const itemsHtml = payload.items
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${item.product_name}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${item.unit_price.toLocaleString()} ALL</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${item.total.toLocaleString()} ALL</td>
          </tr>`
      )
      .join("");

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#333">
        <div style="background:#2538d4;color:white;padding:20px;border-radius:8px 8px 0 0">
          <h1 style="margin:0;font-size:20px">🛒 Porosi e re!</h1>
          <p style="margin:4px 0 0;opacity:0.9">${business.name}</p>
        </div>
        <div style="padding:20px;border:1px solid #eee;border-top:0;border-radius:0 0 8px 8px">
          <p style="margin:0 0 4px"><strong>Nr. Porosisë:</strong> ${payload.order_number}</p>
          <p style="margin:0 0 4px"><strong>Klienti:</strong> ${payload.customer_name}</p>
          <p style="margin:0 0 4px"><strong>Telefoni:</strong> ${payload.customer_phone}</p>
          <p style="margin:0 0 16px"><strong>Qyteti:</strong> ${payload.city}</p>
          ${payload.notes ? `<p style="margin:0 0 16px;padding:10px;background:#f9f9f9;border-radius:4px"><strong>Shënime:</strong> ${payload.notes}</p>` : ""}
          
          <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
            <thead>
              <tr style="background:#f5f5f5">
                <th style="padding:8px;text-align:left">Produkti</th>
                <th style="padding:8px;text-align:center">Sasia</th>
                <th style="padding:8px;text-align:right">Çmimi</th>
                <th style="padding:8px;text-align:right">Totali</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          
          <div style="border-top:2px solid #eee;padding-top:12px;text-align:right">
            <p style="margin:0 0 4px"><strong>Nëntotali:</strong> ${payload.subtotal.toLocaleString()} ALL</p>
            <p style="margin:0 0 4px"><strong>Transporti:</strong> ${payload.delivery_fee.toLocaleString()} ALL</p>
            <p style="margin:0;font-size:18px;color:#2538d4"><strong>Totali: ${payload.total.toLocaleString()} ALL</strong></p>
          </div>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: "eblej <onboarding@resend.dev>",
      to: [business.email],
      subject: `Porosi e re #${payload.order_number} - ${payload.customer_name}`,
      html: emailHtml,
    });

    console.log("Order notification email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
