# ÀṢỌ — African Fashion Catalogue

A React + Supabase catalogue website for an African fashion brand. Visitors can browse published designs without signing in. Customers can register and sign in. Only the account explicitly promoted to `owner` can access the admin dashboard and manage catalogue content.

## Features

- Responsive African-inspired storefront
- Public catalogue, category filters, search and product detail pages
- Public collection listing and detail pages
- Supabase email/password authentication
- Owner-only dashboard, product and collection management
- Product image gallery uploads to Supabase Storage
- Draft, published and archived product states
- Row Level Security on profiles, categories, collections, products, product images and storage
- WhatsApp or email enquiry CTA (configure WhatsApp number in `.env`)

## 1. Create a Supabase project

Create a project at https://supabase.com and open its SQL Editor.

Run `supabase/schema.sql`.

The SQL creates:
- profiles, categories, collections, products and product_images tables
- profile creation trigger
- owner role protection trigger
- RLS policies
- public `fashion-products` storage bucket and owner-only upload/update/delete policies
- starter categories

## 2. Create the owner account

1. Start the app and register your own account using `/register`.
2. In Supabase Dashboard, open **Authentication → Users** and copy that user's UUID.
3. In SQL Editor, run:

```sql
update public.profiles
set role = 'owner'
where id = 'YOUR_AUTH_USER_UUID';
```

Do this only for the trusted owner account. The frontend does not provide a way to promote users. The database trigger prevents a normal signed-in user from changing their own role.

## 3. Configure the frontend

```bash
cp .env.example .env
```

Fill in the Supabase Project URL and the publishable/anon key from **Project Settings → API**.

Optional WhatsApp number must be international digits only, without `+`, spaces or punctuation:

```env
VITE_WHATSAPP_NUMBER=2348012345678
```

Never put the Supabase `service_role` key in a `VITE_` variable or browser code.

## 4. Install and run

Requires Node.js 18+.

```bash
npm install
npm run dev
```

For production build:

```bash
npm run build
npm run preview
```

## 5. Publish products

Sign in with the owner account and open `/admin`.

- Create collections under **Collections**, with a URL slug, optional description, and optional cover image. Select a JPEG, PNG, or WebP image up to 5MB to preview and upload it to the existing `fashion-products` storage bucket.
- Use **Edit image** on a collection cover, or **Edit** on a product image, to rotate and crop it before saving. Editing previously uploaded external images requires their host to allow cross-origin access. Edited images are saved as JPEGs.
- Active collections appear at `/collections`; featured collections are marked on that page.
- Inactive collections are hidden from public collection pages. Existing published designs remain visible in the general catalogue.
- Add a design
- Enter name, price, category, optional collection and details
- Upload one or more JPG, PNG or WebP images (up to 5MB each)
- Choose Draft or Published
- Published designs become visible in the public catalogue
- Deleting a collection removes the collection assignment from its designs; it does not delete the designs.

## Security notes

- RLS is the actual security boundary. React route protection is only a user experience layer.
- Public users can select only published products and active categories/collections.
- Only an authenticated profile with `role = 'owner'` can write catalogue rows or upload/delete images.
- The profile role cannot be changed through the client due to the database trigger.
- Keep Supabase Auth email confirmation enabled for production.
- Configure allowed redirect URLs in Supabase Auth settings for your deployed domain.
- Set appropriate rate limits and email templates in Supabase.
- The public image bucket is intentional because product photos are public catalogue content.
- The `service_role` key bypasses RLS and must remain server-side only.

## Production hardening still recommended

This starter is a complete catalogue foundation, not a substitute for a security review. Before a high-traffic launch, add automated tests, monitoring, image moderation, upload retry/cleanup jobs, pagination, SEO metadata per product, a custom domain, backups, and a review of Supabase Auth and database policies. If the business later needs online checkout, implement payment processing with a trusted server-side function and verified payment webhooks.
