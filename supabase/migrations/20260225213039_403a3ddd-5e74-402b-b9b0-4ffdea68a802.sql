SELECT setval(
  'public.services_id_seq',
  COALESCE((SELECT MAX(id) FROM public.services), 1),
  true
);