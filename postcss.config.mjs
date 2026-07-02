// AfriBayit — PostCSS Configuration
// Tailwind CSS 4 + Vitest compatibility: defer plugin resolution so tests can skip it.

import tailwindPostcss from "@tailwindcss/postcss";

const config = {
  plugins: [tailwindPostcss],
};

export default config;
