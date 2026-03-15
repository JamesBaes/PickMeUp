Database Reference — Project teluwmhtaiysxcpdxjwg
This document lists all current tables in the public schema (fetched automatically). It includes columns, primary keys, foreign keys, RLS status, comments, and short notes for your coding agent.

Schemas

public — application tables
Extensions (selected)

pgcrypto — cryptographic functions
pg_stat_statements — track planning and execution statistics
uuid-ossp — generate UUIDs
vector, postgis, pg_trgm, pg_repack, pgaudit, pgjwt, pgsodium, and others installed
Table reference (public schema)
public.menu_items
Short description: Menu items (catalog).
RLS enabled: yes
Rows: 52

Columns:

item_id — integer — identity BY DEFAULT — primary key
name — text — not null
price — double precision — nullable
description — text — nullable
category — text — nullable
calories — text — nullable
allergy_information — text — nullable
image_url — text — nullable
Primary key:

item_id
Foreign keys:

public.cart_items.menu_item_id → public.menu_items.item_id (cart_items_menu_item_id_fkey)
Notes:

Used by cart_items and menu_items_restaurant_locations.
public.restaurant_locations
Short description: Each location for Gladiator Burger.
RLS enabled: yes
Rows: 6

Columns:

restaurant_id — bigint — identity BY DEFAULT — primary key
location_name — text — nullable — unique
Primary key:

restaurant_id
Foreign keys referencing this table:

public.menu_items_restaurant_locations.restaurant_id → public.restaurant_locations.restaurant_id
public.staff_table.restaurant_id → public.restaurant_locations.restaurant_id
Comment:

"Each location for Gladiator Burger"
public.orders
Short description: Customer orders.
RLS enabled: yes
Rows: 18

Columns:

id — uuid — default gen_random_uuid() — primary key
created_at — timestamptz — default now()
customer_name — text
customer_phone — text
items — jsonb
total_cents — integer
square_payment_id — text — nullable
status — text — default 'pending' — check: status ∈ ('pending','paid','preparing','ready','picked_up','cancelled')
pickup_time — timestamptz — nullable
billing_address — text — nullable — comment: The address of the card holder
billing_country — text — nullable — comment: The country of the card and card holder
customer_email — text — nullable — comment: email of the user
Primary key:

id
Notes:

items stored as JSONB (array/object of line items). Add GIN indexes if you query this field.
public.carts
Short description: Shopping carts (guest or user).
RLS enabled: no
Rows: 0

Columns:

id — uuid — default extensions.uuid_generate_v4() — primary key
user_id — uuid — nullable — FK → auth.users.id
guest_id — text — nullable
location — text
created_at — timestamptz — default now()
updated_at — timestamptz — default now()
Primary key:

id
Foreign keys:

public.carts.user_id → auth.users.id (carts_user_id_fkey)
public.cart_items.cart_id → public.carts.id (cart_items_cart_id_fkey)
Notes:

RLS is disabled — consider enabling and adding per-user policies if exposed via client API.
public.cart_items
Short description: Items inside carts.
RLS enabled: no
Rows: 0

Columns:

id — uuid — default extensions.uuid_generate_v4() — primary key
cart_id — uuid — FK → public.carts.id
menu_item_id — integer — FK → public.menu_items.item_id
quantity — integer — default 1 — check: quantity > 0
customizations — text — nullable — default '{}'::jsonb
created_at — timestamptz — default now()
updated_at — timestamptz — default now()
Primary key:

id
Foreign keys:

public.cart_items.menu_item_id → public.menu_items.item_id (cart_items_menu_item_id_fkey)
public.cart_items.cart_id → public.carts.id (cart_items_cart_id_fkey)
Notes:

customizations column default suggests jsonb while data_type is text — verify and migrate to jsonb if needed.
public.menu_items_restaurant_locations
Short description: Join table between menu items and restaurant locations (per-location item data).
RLS enabled: yes
Rows: 451

Columns:

item_id — integer — part of composite PK — FK → public.menu_items.item_id
restaurant_id — bigint — part of composite PK — FK → public.restaurant_locations.restaurant_id
name — text
price — double precision — nullable
popular — boolean — default false
description — text — nullable
category — text — comment: item category
bogo — boolean — default false — comment: buy 1, get 1 deal
image_url — text — nullable — comment: pictures from cloudinary
calories — text — nullable
allergy_information — text — nullable
Primary key:

(item_id, restaurant_id)
Foreign keys:

public.menu_items_restaurant_locations.restaurant_id → public.restaurant_locations.restaurant_id (menu_items_restaurant_locations_restaurant_id_fkey)
Comment:

"join table for restaurant location and menu item"
Notes:

Composite PK enforces uniqueness of item at a location.
public.tsettable
Short description: Test table.
RLS enabled: yes
Rows: 0

Columns:

id — bigint — identity BY DEFAULT — primary key
created_at — timestamptz — default now()
Primary key:

id
Comment:

"test"
public.favorites
Short description: Favorite items per user.
RLS enabled: yes
Rows: 0

Columns:

favorite_item_id — uuid — part of composite PK
customer_id — uuid — part of composite PK — default auth.uid() — comment: customer's individual favourite data
Primary key:

(favorite_item_id, customer_id)
Foreign keys:

public.favorites.customer_id → auth.users.id (favorites_customer_id_fkey)
Comment:

"favorite items for each user"
Notes:

Default uses auth.uid() — typical pattern for per-user data. Ensure RLS policies enforce ownership.
public.staff_table
Short description: Lists staff from different branches.
RLS enabled: yes
Rows: 1

Columns:

staff_id — bigint — identity BY DEFAULT — primary key — unique — comment: staff id
restaurant_id — bigint — FK → public.restaurant_locations.restaurant_id
hiring_date — date — default now()
first_name — text — comment: staff first name
last_name — text — comment: staff last name
email — text — nullable — comment: staffs email
phone — text — nullable — comment: staff phone
admin — boolean — default false — comment: staff level
Primary key:

staff_id
Foreign keys:

public.staff_table.restaurant_id → public.restaurant_locations.restaurant_id (staff_table_restaurant_id_fkey)
Comment:

"lists of staff from different branches"
Notes:

Consider index on restaurant_id.
public.profiles
Short description: Table to store staff side users.
RLS enabled: yes
Rows: 2

Columns:

id — uuid — default gen_random_uuid() — primary key — FK → auth.users.id
created_at — timestamptz — default now()
role — user-defined enum type "role" — values: admin, staff
name — text — nullable
Primary key:

id
Foreign keys:

public.profiles.id → auth.users.id (profiles_id_fkey)
Comment:

"Table to store staff side users."
Notes:

role enum useful for RLS and application authorization.
