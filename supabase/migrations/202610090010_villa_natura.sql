begin;
update public.nativa_products set tag=replace(replace(tag,'Verdeva','Villa Natura'),'Nativa','Villa Natura'),description=replace(replace(description,'Verdeva','Villa Natura'),'Nativa','Villa Natura'),highlights=replace(replace(highlights,'Verdeva','Villa Natura'),'Nativa','Villa Natura'),usage=replace(replace(usage,'Verdeva','Villa Natura'),'Nativa','Villa Natura');
update public.nativa_banners set description=replace(replace(description,'Verdeva','Villa Natura'),'Nativa','Villa Natura'),tag=replace(replace(tag,'Verdeva','Villa Natura'),'Nativa','Villa Natura');
commit;
