-- pet "Olhudo": ciclope roxo de um olho só (sprite em app/src/lib/sprites.ts, id 'eyeball')
insert into public.shop_items (id, slot, name, description, price, rarity, sort)
values ('eyeball', 'pet', 'Olhudo', 'Um olho só, sempre com sono. Vê tudo mesmo assim.', 170, 'raro', 52)
on conflict (id) do nothing;
