-- Run this in Supabase Dashboard → SQL Editor if the products table is empty.
-- Safe to run multiple times (ON CONFLICT DO NOTHING).

INSERT INTO public.products (name, description, image_url, price, category, occasion, stock_quantity) VALUES
('Artisan Coffee Bundle', 'Three single-origin beans from small farms in Ethiopia, Colombia, Guatemala.', 'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=800', 42.00, 'Food & Drink', 'any', 50),
('Cashmere Throw Blanket', 'Ultra-soft 100% Mongolian cashmere in warm sand tone.', 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800', 185.00, 'Home', 'housewarming', 18),
('Leather Journal', 'Handbound vegetable-tanned leather, 200 cotton pages.', 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800', 58.00, 'Stationery', 'any', 34),
('Scented Soy Candle Set', 'Fig, cedarwood, and bergamot — 3 candles, 40h each.', 'https://images.unsplash.com/photo-1602178141046-0c3e8b4f1e56?w=800', 48.00, 'Home', 'any', 62),
('Wireless Earbuds Pro', 'Active noise cancelling, 30h battery, USB-C.', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800', 129.00, 'Tech', 'birthday', 27),
('Fountain Pen Classic', 'Brass body, medium nib, includes two ink cartridges.', 'https://images.unsplash.com/photo-1583485088034-697b5bc36b92?w=800', 76.00, 'Stationery', 'work_anniversary', 15),
('Craft Chocolate Box', '12 single-origin bars from award-winning makers.', 'https://images.unsplash.com/photo-1511381939415-e44015466834?w=800', 54.00, 'Food & Drink', 'any', 40),
('Wool Slippers', 'Merino wool, leather sole. Sizes S–XL.', 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=800', 64.00, 'Fashion', 'winter', 38),
('Botanical Print Set', 'Three framed archival prints, 30x40cm.', 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=800', 92.00, 'Home', 'housewarming', 22),
('Premium Tea Collection', '30 sachets across green, black, oolong, herbal.', 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=800', 36.00, 'Food & Drink', 'any', 71),
('Silk Scarf', 'Hand-rolled silk twill, 90cm square.', 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800', 98.00, 'Fashion', 'birthday', 19),
('Desk Planter Trio', 'Three minimalist ceramic planters with succulents.', 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=800', 44.00, 'Home', 'work_anniversary', 33),
('Aromatherapy Diffuser', 'Walnut finish, 500ml, timer + mood light.', 'https://images.unsplash.com/photo-1636644691550-9f8f9b9b8f1d?w=800', 68.00, 'Wellness', 'any', 26),
('Gourmet Olive Oil Set', 'Two cold-pressed oils + aged balsamic from Tuscany.', 'https://images.unsplash.com/photo-1620705625656-b9e42e0d15b9?w=800', 58.00, 'Food & Drink', 'housewarming', 29),
('Linen Pyjama Set', 'Stonewashed French linen, unisex cut.', 'https://images.unsplash.com/photo-1602830207088-0df7c38e1fa8?w=800', 124.00, 'Fashion', 'any', 14),
('Bluetooth Speaker', 'Portable, waterproof, 12h playback.', 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800', 89.00, 'Tech', 'birthday', 42),
('Spa Gift Box', 'Bath salts, facial mask, body oil, soy candle.', 'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800', 72.00, 'Wellness', 'any', 38),
('Classic Novels Set', 'Clothbound editions — 5 literary classics.', 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800', 110.00, 'Books', 'any', 20),
('Smart Mug', 'Temperature-controlled mug with app control.', 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800', 99.00, 'Tech', 'work_anniversary', 17),
('Handmade Ceramic Vase', 'One-of-a-kind stoneware, 25cm, matte cream.', 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=800', 82.00, 'Home', 'housewarming', 11),
('Truffle Salt & Pepper', 'Black truffle sea salt and wild pepper blend.', 'https://images.unsplash.com/photo-1599591059924-1d5e2bbd1e52?w=800', 34.00, 'Food & Drink', 'any', 55),
('Merino Wool Socks (3-pack)', 'Moisture-wicking, cushioned, lifetime guarantee.', 'https://images.unsplash.com/photo-1586350977771-2a1de0da75e8?w=800', 42.00, 'Fashion', 'any', 68),
('Instant Film Camera', 'Retro design, 10 sheets included.', 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800', 128.00, 'Tech', 'birthday', 23),
('Meditation App + Journal', '12-month premium access + guided journal.', 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=800', 88.00, 'Wellness', 'any', 999)
ON CONFLICT DO NOTHING;
