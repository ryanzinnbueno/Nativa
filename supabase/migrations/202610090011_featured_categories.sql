begin;
alter table public.nativa_categories
  add column featured boolean not null default false,
  add column story_image text not null default '' check (char_length(story_image) <= 1500),
  add column story_title text not null default '' check (char_length(story_title) <= 60),
  add column story_description text not null default '' check (char_length(story_description) <= 160),
  add column story_tag text not null default '' check (char_length(story_tag) <= 40);
update public.nativa_categories set featured = true where name in ('Castanhas','Grãos e cereais','Chás e ervas');
commit;
