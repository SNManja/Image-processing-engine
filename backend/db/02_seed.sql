INSERT INTO presets (name, description, pipeline, votes)
VALUES
  ('Obra Dinn', 'Dither preset', '{"pipeline":[{"filter":"bayer","params":{"level":2}}]}'::jsonb, 15),
  ('Film Grain', 'Noise + contrast', '{"pipeline":[{"filter":"noise"},{"filter":"contrast"}]}'::jsonb, 5),
  ('Soft Glow', 'Blur + contrast', '{"pipeline":[{"filter":"gaussian_blur","params":{"sigma":1.2}},{"filter":"contrast","params":{"amount":1.1}}]}'::jsonb, 2);
