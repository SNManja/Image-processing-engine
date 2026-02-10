/**
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  // Limpiamos la tabla
  await knex("presets").del();

  const rawPresets = [
    {
      name: "Obra Dinn-ish",
      pipeline: [
        { filter: "bnw" },
        { filter: "linearAdjustment", params: { scale: 1.6, offset: -0.12 } },
        { filter: "blur", params: { stride: 1, size: 1 } },
        {
          filter: "bayerDithering",
          params: { depth: 2, levels: 10, perceptual: true },
        },
        { filter: "linearAdjustment", params: { offset: 0.02, scale: 1.04 } },
      ],
      output_suffix: "_processed",
      output_extension: "auto",
      "Recommendations for this filter":
        "As any other dithering preset, config stride and size in odd numbers to adjust to image size. Bigger images wont look retro without a bigger stride.",
    },
    {
      name: "Cool green-ish look",
      pipeline: [
        { filter: "bnw", params: { offset: 0, scale: 1 } },
        { filter: "alphaBlending", params: { alpha: [0.5, 0.5, 1] } },
      ],
      statistics: { histograms: { greyscale: false } },
      output_suffix: "_processed",
      output_extension: "auto",
      tags: ["art"],
    },
    {
      name: "Old school computer",
      pipeline: [
        { filter: "bnw" },
        { filter: "blur", params: { size: 10, stride: 10 } },
        {
          filter: "FSDithering",
          params: { depth: 8, amount: 1, perceptual: true, noise: 0.2 },
        },
      ],
      output_suffix: "_processed",
      output_extension: "auto",
      "Recommendations for this filter":
        "Optimal retro look highly depends on an stride and size blur config. For bigger images more size and more stride, for tinier images less size and less stride. Works great if both params have the same values, but experiment for yourself",
    },
    {
      name: "Pencil sketch",
      pipeline: [
        { filter: "sobel", params: { greyscale: true } },
        { filter: "linearAdjustment", params: { scale: 2, offset: -0.155 } },
        { filter: "invert" },
        { filter: "blur", params: { size: 5 } },
      ],
      statistics: { histograms: { greyscale: false } },
      output_suffix: "_processed",
      output_extension: "auto",
      tags: ["art"],
    },
    {
      name: "Sobel Edge Detection (Pre-smoothed)",
      pipeline: [
        {
          filter: "blur",
          params: { size: 3, stride: 1, scale: 1, offset: 0, border: "clamp" },
        },
        {
          filter: "sobel",
          params: {
            greyscale: true,
            scharr: false,
            stride: 1,
            scale: 1,
            offset: 0,
            border: "clamp",
          },
        },
      ],
      statistics: { histograms: { greyscale: true } },
      output_suffix: "_processed",
      output_extension: "auto",
      tags: ["cv", "utility"],
    },
  ];

  const presetsToInsert = rawPresets.map((p) => ({
    name: p.name,
    description:
      p["Recommendations for this filter"] ||
      `A preset focused on ${p.tags?.join(", ") || "image processing"}.`,
    // El objeto completo va al JSONB del pipeline
    pipeline: JSON.stringify(p),
    votes: Math.floor(Math.random() * 100), // Relleno aleatorio para testing de ordenamiento
    created_at: new Date(),
  }));

  await knex("presets").insert(presetsToInsert);
}
