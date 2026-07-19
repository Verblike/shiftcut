const studioPreset = {
  theme: {
    extend: {
      colors: {
        studio: {
          bg: "#181512",
          surface: "#211d19",
          border: "#39312a",
          text: "#f4eee8",
          muted: "#a79b91",
          accent: "#ff7a1a",
        },
        panel: {
          bg: "#1a1714",
          // Open inspector-section body — slightly lighter than headers (bg)
          // so the recessed scrollable region reads distinct.
          "bg-inset": "#211d19",
          input: "#29231e",
          surface: "#302923",
          hover: "#40362e",
          border: "#332b25",
          "border-input": "#493d34",
          hairline: "#2a231e",
          "text-0": "#fff8f1",
          "text-1": "#f0e7de",
          "text-2": "#c9bcb0",
          "text-3": "#a49589",
          "text-4": "#75675d",
          "text-5": "#594e46",
          accent: "#ff7a1a",
          danger: "#EF4444",
          media: "#00E3FF",
          container: "#F5A623",
        },
      },
    },
  },
  plugins: [],
};

export default studioPreset;
