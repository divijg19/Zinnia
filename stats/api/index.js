// stats/src/cards/gist.ts
import { createRequire as createRequire2 } from "module";

// stats/src/common/utils.ts
import { createRequire } from "module";

// lib/themes/registry.ts
var themes = {
  default: {
    name: "default",
    colors: {
      title: { hex: "2f80ed" },
      icon: { hex: "4c71f2" },
      text: { hex: "434d58" },
      background: { hex: "fffefe" },
      border: { hex: "e4e2e2" }
    },
    streak: {
      background: "#FFFEFE",
      border: "#E4E2E2",
      stroke: "#E4E2E2",
      ring: "#FB8C00",
      fire: "#FB8C00",
      currStreakNum: "#151515",
      sideNums: "#151515",
      currStreakLabel: "#FB8C00",
      sideLabels: "#151515",
      dates: "#464646",
      excludeDaysLabel: "#464646"
    },
    trophy: {
      BACKGROUND: "#FFF",
      TITLE: "#000",
      ICON_CIRCLE: "#FFF",
      TEXT: "#666",
      LAUREL: "#009366",
      SECRET_RANK_1: "red",
      SECRET_RANK_2: "fuchsia",
      SECRET_RANK_3: "blue",
      SECRET_RANK_TEXT: "fuchsia",
      NEXT_RANK_BAR: "#0366d6",
      S_RANK_BASE: "#FAD200",
      S_RANK_SHADOW: "#C8A090",
      S_RANK_TEXT: "#886000",
      A_RANK_BASE: "#B0B0B0",
      A_RANK_SHADOW: "#9090C0",
      A_RANK_TEXT: "#505050",
      B_RANK_BASE: "#A18D66",
      B_RANK_SHADOW: "#816D96",
      B_RANK_TEXT: "#412D06",
      DEFAULT_RANK_BASE: "#777",
      DEFAULT_RANK_SHADOW: "#333",
      DEFAULT_RANK_TEXT: "#333"
    }
  },
  default_repocard: {
    name: "default_repocard",
    colors: {
      title: { hex: "2f80ed" },
      icon: { hex: "586069" },
      text: { hex: "434d58" },
      background: { hex: "fffefe" }
    }
  },
  transparent: {
    name: "transparent",
    colors: {
      title: { hex: "006AFF" },
      icon: { hex: "0579C3" },
      text: { hex: "417E87" },
      background: { hex: "ffffff00" }
    },
    streak: {
      background: "#0000",
      border: "#E4E2E2",
      stroke: "#E4E2E2",
      ring: "#006AFF",
      fire: "#006AFF",
      currStreakNum: "#0579C3",
      sideNums: "#006AFF",
      currStreakLabel: "#0579C3",
      sideLabels: "#006AFF",
      dates: "#417E87",
      excludeDaysLabel: "#417E87"
    }
  },
  light: {
    name: "light",
    colors: {
      title: { hex: "2f80ed" },
      icon: { hex: "4c71f2" },
      text: { hex: "434d58" },
      background: { hex: "ffffff" },
      border: { hex: "e4e2e2" }
    }
  },
  shadow_red: {
    name: "shadow_red",
    colors: {
      title: { hex: "9A0000" },
      icon: { hex: "4F0000" },
      text: { hex: "444" },
      background: { hex: "ffffff00" },
      border: { hex: "4F0000" }
    }
  },
  shadow_green: {
    name: "shadow_green",
    colors: {
      title: { hex: "007A00" },
      icon: { hex: "003D00" },
      text: { hex: "444" },
      background: { hex: "ffffff00" },
      border: { hex: "003D00" }
    }
  },
  shadow_blue: {
    name: "shadow_blue",
    colors: {
      title: { hex: "00779A" },
      icon: { hex: "004450" },
      text: { hex: "444" },
      background: { hex: "ffffff00" },
      border: { hex: "004490" }
    }
  },
  dark: {
    name: "dark",
    colors: {
      title: { hex: "fff" },
      icon: { hex: "79ff97" },
      text: { hex: "9f9f9f" },
      background: { hex: "151515" }
    },
    streak: {
      background: "#151515",
      border: "#E4E2E2",
      stroke: "#E4E2E2",
      ring: "#FB8C00",
      fire: "#FB8C00",
      currStreakNum: "#FEFEFE",
      sideNums: "#FEFEFE",
      currStreakLabel: "#FB8C00",
      sideLabels: "#FEFEFE",
      dates: "#9E9E9E",
      excludeDaysLabel: "#9E9E9E"
    }
  },
  radical: {
    name: "radical",
    colors: {
      title: { hex: "fe428e" },
      icon: { hex: "f8d847" },
      text: { hex: "a9fef7" },
      background: { hex: "141321" }
    },
    streak: {
      background: "#141321",
      border: "#E4E2E2",
      stroke: "#E4E2E2",
      ring: "#FE428E",
      fire: "#FE428E",
      currStreakNum: "#F8D847",
      sideNums: "#FE428E",
      currStreakLabel: "#F8D847",
      sideLabels: "#FE428E",
      dates: "#A9FEF7",
      excludeDaysLabel: "#A9FEF7"
    },
    trophy: {
      BACKGROUND: "#141321",
      ICON_CIRCLE: "#EEEEEE",
      TITLE: "#fe428e",
      TEXT: "#a9fef7",
      LAUREL: "#50fa7b",
      SECRET_RANK_1: "#ff5555",
      SECRET_RANK_2: "#ff15d9",
      SECRET_RANK_3: "#1E65F5",
      SECRET_RANK_TEXT: "#ff61c6",
      NEXT_RANK_BAR: "#fe428e",
      S_RANK_BASE: "#ffce32",
      S_RANK_SHADOW: "#ffce32",
      S_RANK_TEXT: "#CB8A30",
      A_RANK_BASE: "#8DF7B5",
      A_RANK_SHADOW: "#8DF7B5",
      A_RANK_TEXT: "#3A3A3A",
      B_RANK_BASE: "#EA3F25",
      B_RANK_SHADOW: "#EA3F25",
      B_RANK_TEXT: "#3A3A3A",
      DEFAULT_RANK_BASE: "#1E65F5",
      DEFAULT_RANK_SHADOW: "#1E65F5",
      DEFAULT_RANK_TEXT: "#3A3A3A"
    }
  },
  merko: {
    name: "merko",
    colors: {
      title: { hex: "abd200" },
      icon: { hex: "b7d364" },
      text: { hex: "68b587" },
      background: { hex: "0a0f0b" }
    },
    streak: {
      background: "#0A0F0B",
      border: "#E4E2E2",
      stroke: "#E4E2E2",
      ring: "#ABD200",
      fire: "#ABD200",
      currStreakNum: "#B7D364",
      sideNums: "#ABD200",
      currStreakLabel: "#B7D364",
      sideLabels: "#ABD200",
      dates: "#68B587",
      excludeDaysLabel: "#68B587"
    }
  },
  gruvbox: {
    name: "gruvbox",
    colors: {
      title: { hex: "fabd2f" },
      icon: { hex: "fe8019" },
      text: { hex: "8ec07c" },
      background: { hex: "282828" }
    },
    trophy: {
      BACKGROUND: "#282828",
      TITLE: "#ebdbb2",
      ICON_CIRCLE: "#ebdbb2",
      TEXT: "#98971a",
      LAUREL: "#689d6a",
      SECRET_RANK_1: "#fb4934",
      SECRET_RANK_2: "#d3869b",
      SECRET_RANK_3: "#458588",
      SECRET_RANK_TEXT: "#b16286",
      NEXT_RANK_BAR: "#fabd26",
      S_RANK_BASE: "#fabd2f",
      S_RANK_SHADOW: "#fabd2f",
      S_RANK_TEXT: "#322301",
      A_RANK_BASE: "#83a598",
      A_RANK_SHADOW: "#83a598",
      A_RANK_TEXT: "#151e1a",
      B_RANK_BASE: "#d65d0e",
      B_RANK_SHADOW: "#d65d0e",
      B_RANK_TEXT: "#301503",
      DEFAULT_RANK_BASE: "#928374",
      DEFAULT_RANK_SHADOW: "#928374",
      DEFAULT_RANK_TEXT: "#282828"
    }
  },
  gruvbox_light: {
    name: "gruvbox_light",
    colors: {
      title: { hex: "b57614" },
      icon: { hex: "af3a03" },
      text: { hex: "427b58" },
      background: { hex: "fbf1c7" }
    }
  },
  tokyonight: {
    name: "tokyonight",
    colors: {
      title: { hex: "70a5fd" },
      icon: { hex: "bf91f3" },
      text: { hex: "38bdae" },
      background: { hex: "1a1b27" }
    },
    streak: {
      background: "#1A1B27",
      border: "#E4E2E2",
      stroke: "#E4E2E2",
      ring: "#70A5FD",
      fire: "#70A5FD",
      currStreakNum: "#BF91F3",
      sideNums: "#70A5FD",
      currStreakLabel: "#BF91F3",
      sideLabels: "#70A5FD",
      dates: "#38BDAE",
      excludeDaysLabel: "#38BDAE"
    },
    trophy: {
      BACKGROUND: "#1a1b27",
      TITLE: "#70a5fd",
      ICON_CIRCLE: "#bf91f3",
      TEXT: "#38bdae",
      LAUREL: "#178600",
      SECRET_RANK_1: "#ff5555",
      SECRET_RANK_2: "#ff79c6",
      SECRET_RANK_3: "#388bfd",
      SECRET_RANK_TEXT: "#ff79c6",
      NEXT_RANK_BAR: "#00aeff",
      S_RANK_BASE: "#ffb86c",
      S_RANK_SHADOW: "#ffb86c",
      S_RANK_TEXT: "#0d1117",
      A_RANK_BASE: "#2dde98",
      A_RANK_TEXT: "#0d1117",
      A_RANK_SHADOW: "#2dde98",
      B_RANK_BASE: "#8be9fd",
      B_RANK_SHADOW: "#8be9fd",
      B_RANK_TEXT: "#0d1117",
      DEFAULT_RANK_BASE: "#5c75c3",
      DEFAULT_RANK_SHADOW: "#6272a4",
      DEFAULT_RANK_TEXT: "#0d1117"
    }
  },
  onedark: {
    name: "onedark",
    colors: {
      title: { hex: "e4bf7a" },
      icon: { hex: "8eb573" },
      text: { hex: "df6d74" },
      background: { hex: "282c34" }
    },
    trophy: {
      BACKGROUND: "#282c34",
      TITLE: "#e5c07b",
      ICON_CIRCLE: "#FFF",
      TEXT: "#e06c75",
      LAUREL: "#98c379",
      SECRET_RANK_1: "#e06c75",
      SECRET_RANK_2: "#c678dd",
      SECRET_RANK_3: "#61afef",
      SECRET_RANK_TEXT: "#c678dd",
      NEXT_RANK_BAR: "#e5c07b",
      S_RANK_BASE: "#e5c07b",
      S_RANK_SHADOW: "#e5c07b",
      S_RANK_TEXT: "#282c34",
      A_RANK_BASE: "#56b6c2",
      A_RANK_SHADOW: "#56b6c2",
      A_RANK_TEXT: "#282c34",
      B_RANK_BASE: "#c678dd",
      B_RANK_SHADOW: "#c678dd",
      B_RANK_TEXT: "#282c34",
      DEFAULT_RANK_BASE: "#abb2bf",
      DEFAULT_RANK_SHADOW: "#abb2bf",
      DEFAULT_RANK_TEXT: "#282c34"
    }
  },
  cobalt: {
    name: "cobalt",
    colors: {
      title: { hex: "e683d9" },
      icon: { hex: "0480ef" },
      text: { hex: "75eeb2" },
      background: { hex: "193549" }
    }
  },
  synthwave: {
    name: "synthwave",
    colors: {
      title: { hex: "e2e9ec" },
      icon: { hex: "ef8539" },
      text: { hex: "e5289e" },
      background: { hex: "2b213a" }
    }
  },
  highcontrast: {
    name: "highcontrast",
    colors: {
      title: { hex: "e7f216" },
      icon: { hex: "00ffff" },
      text: { hex: "fff" },
      background: { hex: "000" }
    },
    streak: {
      background: "#000000",
      border: "#BEBEBE",
      stroke: "#BEBEBE",
      ring: "#FB8C00",
      fire: "#FB8C00",
      currStreakNum: "#FFFFFF",
      sideNums: "#FFFFFF",
      currStreakLabel: "#FB8C00",
      sideLabels: "#FFFFFF",
      dates: "#C5C5C5",
      excludeDaysLabel: "#C5C5C5"
    }
  },
  dracula: {
    name: "dracula",
    colors: {
      title: { hex: "ff6e96" },
      icon: { hex: "79dafa" },
      text: { hex: "f8f8f2" },
      background: { hex: "282a36" }
    },
    trophy: {
      BACKGROUND: "#282a36",
      TITLE: "#ff79c6",
      ICON_CIRCLE: "#f8f8f2",
      TEXT: "#f8f8f2",
      LAUREL: "#50fa7b",
      SECRET_RANK_1: "#ff5555",
      SECRET_RANK_2: "#ff79c6",
      SECRET_RANK_3: "#bd93f9",
      SECRET_RANK_TEXT: "#bd93f9",
      NEXT_RANK_BAR: "#ff79c6",
      S_RANK_BASE: "#ffb86c",
      S_RANK_SHADOW: "#ffb86c",
      S_RANK_TEXT: "#6272a4",
      A_RANK_BASE: "#8be9fd",
      A_RANK_SHADOW: "#8be9fd",
      A_RANK_TEXT: "#6272a4",
      B_RANK_BASE: "#ff5555",
      B_RANK_SHADOW: "#ff5555",
      B_RANK_TEXT: "#6272a4",
      DEFAULT_RANK_BASE: "#6272a4",
      DEFAULT_RANK_SHADOW: "#6272a4",
      DEFAULT_RANK_TEXT: "#6272a4"
    }
  },
  prussian: {
    name: "prussian",
    colors: {
      title: { hex: "bddfff" },
      icon: { hex: "38a0ff" },
      text: { hex: "6e93b5" },
      background: { hex: "172f45" }
    }
  },
  monokai: {
    name: "monokai",
    colors: {
      title: { hex: "eb1f6a" },
      icon: { hex: "e28905" },
      text: { hex: "f1f1eb" },
      background: { hex: "272822" }
    },
    trophy: {
      BACKGROUND: "#272822",
      TITLE: "#f92672",
      ICON_CIRCLE: "#fff",
      TEXT: "#fff",
      LAUREL: "#a6e22e",
      SECRET_RANK_1: "#f92672",
      SECRET_RANK_2: "#ae81ff",
      SECRET_RANK_3: "#66d9ef",
      SECRET_RANK_TEXT: "#b16286",
      NEXT_RANK_BAR: "#f92672",
      S_RANK_BASE: "#e6db74",
      S_RANK_SHADOW: "#e6db74",
      S_RANK_TEXT: "#272822",
      A_RANK_BASE: "#66d9ef",
      A_RANK_SHADOW: "#66d9ef",
      A_RANK_TEXT: "#272822",
      B_RANK_BASE: "#fd971f",
      B_RANK_SHADOW: "#fd971f",
      B_RANK_TEXT: "#272822",
      DEFAULT_RANK_BASE: "#75715e",
      DEFAULT_RANK_SHADOW: "#75715e",
      DEFAULT_RANK_TEXT: "#282828"
    }
  },
  vue: {
    name: "vue",
    colors: {
      title: { hex: "41b883" },
      icon: { hex: "41b883" },
      text: { hex: "273849" },
      background: { hex: "fffefe" }
    }
  },
  "vue-dark": {
    name: "vue-dark",
    colors: {
      title: { hex: "41b883" },
      icon: { hex: "41b883" },
      text: { hex: "fffefe" },
      background: { hex: "273849" }
    }
  },
  "shades-of-purple": {
    name: "shades-of-purple",
    colors: {
      title: { hex: "fad000" },
      icon: { hex: "b362ff" },
      text: { hex: "a599e9" },
      background: { hex: "2d2b55" }
    }
  },
  nightowl: {
    name: "nightowl",
    colors: {
      title: { hex: "c792ea" },
      icon: { hex: "ffeb95" },
      text: { hex: "7fdbca" },
      background: { hex: "011627" }
    }
  },
  buefy: {
    name: "buefy",
    colors: {
      title: { hex: "7957d5" },
      icon: { hex: "ff3860" },
      text: { hex: "363636" },
      background: { hex: "ffffff" }
    }
  },
  "blue-green": {
    name: "blue-green",
    colors: {
      title: { hex: "2f97c1" },
      icon: { hex: "f5b700" },
      text: { hex: "0cf574" },
      background: { hex: "040f0f" }
    }
  },
  algolia: {
    name: "algolia",
    colors: {
      title: { hex: "00AEFF" },
      icon: { hex: "2DDE98" },
      text: { hex: "FFFFFF" },
      background: { hex: "050F2C" }
    },
    trophy: {
      BACKGROUND: "#050f2c",
      TITLE: "#00aeff",
      ICON_CIRCLE: "#f0f6fb",
      TEXT: "#7eace9",
      LAUREL: "#178600",
      SECRET_RANK_1: "#ff5555",
      SECRET_RANK_2: "#ff79c6",
      SECRET_RANK_3: "#388bfd",
      SECRET_RANK_TEXT: "#ff79c6",
      NEXT_RANK_BAR: "#00aeff",
      S_RANK_BASE: "#ffb86c",
      S_RANK_SHADOW: "#ffb86c",
      S_RANK_TEXT: "#0d1117",
      A_RANK_BASE: "#2dde98",
      A_RANK_TEXT: "#0d1117",
      A_RANK_SHADOW: "#2dde98",
      B_RANK_BASE: "#8be9fd",
      B_RANK_SHADOW: "#8be9fd",
      B_RANK_TEXT: "#0d1117",
      DEFAULT_RANK_BASE: "#5c75c3",
      DEFAULT_RANK_SHADOW: "#6272a4",
      DEFAULT_RANK_TEXT: "#0d1117"
    }
  },
  "great-gatsby": {
    name: "great-gatsby",
    colors: {
      title: { hex: "ffa726" },
      icon: { hex: "ffb74d" },
      text: { hex: "ffd95b" },
      background: { hex: "000000" }
    }
  },
  darcula: {
    name: "darcula",
    colors: {
      title: { hex: "BA5F17" },
      icon: { hex: "84628F" },
      text: { hex: "BEBEBE" },
      background: { hex: "242424" }
    }
  },
  bear: {
    name: "bear",
    colors: {
      title: { hex: "e03c8a" },
      icon: { hex: "00AEFF" },
      text: { hex: "bcb28d" },
      background: { hex: "1f2023" }
    }
  },
  "solarized-dark": {
    name: "solarized-dark",
    colors: {
      title: { hex: "268bd2" },
      icon: { hex: "b58900" },
      text: { hex: "859900" },
      background: { hex: "002b36" }
    }
  },
  "solarized-light": {
    name: "solarized-light",
    colors: {
      title: { hex: "268bd2" },
      icon: { hex: "b58900" },
      text: { hex: "859900" },
      background: { hex: "fdf6e3" }
    }
  },
  "chartreuse-dark": {
    name: "chartreuse-dark",
    colors: {
      title: { hex: "7fff00" },
      icon: { hex: "00AEFF" },
      text: { hex: "fff" },
      background: { hex: "000" }
    }
  },
  nord: {
    name: "nord",
    colors: {
      title: { hex: "81a1c1" },
      icon: { hex: "88c0d0" },
      text: { hex: "d8dee9" },
      background: { hex: "2e3440" }
    },
    trophy: {
      BACKGROUND: "#2E3440",
      TITLE: "#81A1C1",
      ICON_CIRCLE: "#D8DEE9",
      TEXT: "#ECEFF4",
      LAUREL: "#A3BE8C",
      SECRET_RANK_1: "#BF616A",
      SECRET_RANK_2: "#B48EAD",
      SECRET_RANK_3: "#81A1C1",
      SECRET_RANK_TEXT: "#B48EAD",
      NEXT_RANK_BAR: "#81A1C1",
      S_RANK_BASE: "#EBCB8B",
      S_RANK_SHADOW: "#EBCB8B",
      S_RANK_TEXT: "#3B4252",
      A_RANK_BASE: "#8FBCBB",
      A_RANK_SHADOW: "#8FBCBB",
      A_RANK_TEXT: "#3B4252",
      B_RANK_BASE: "#D08770",
      B_RANK_SHADOW: "#D08770",
      B_RANK_TEXT: "#3B4252",
      DEFAULT_RANK_BASE: "#5E81AC",
      DEFAULT_RANK_SHADOW: "#5E81AC",
      DEFAULT_RANK_TEXT: "#3B4252"
    }
  },
  gotham: {
    name: "gotham",
    colors: {
      title: { hex: "2aa889" },
      icon: { hex: "599cab" },
      text: { hex: "99d1ce" },
      background: { hex: "0c1014" }
    }
  },
  "material-palenight": {
    name: "material-palenight",
    colors: {
      title: { hex: "c792ea" },
      icon: { hex: "89ddff" },
      text: { hex: "a6accd" },
      background: { hex: "292d3e" }
    }
  },
  graywhite: {
    name: "graywhite",
    colors: {
      title: { hex: "24292e" },
      icon: { hex: "24292e" },
      text: { hex: "24292e" },
      background: { hex: "ffffff" }
    }
  },
  "vision-friendly-dark": {
    name: "vision-friendly-dark",
    colors: {
      title: { hex: "ffb000" },
      icon: { hex: "785ef0" },
      text: { hex: "ffffff" },
      background: { hex: "000000" }
    }
  },
  "ayu-mirage": {
    name: "ayu-mirage",
    colors: {
      title: { hex: "f4cd7c" },
      icon: { hex: "73d0ff" },
      text: { hex: "c7c8c2" },
      background: { hex: "1f2430" }
    }
  },
  "midnight-purple": {
    name: "midnight-purple",
    colors: {
      title: { hex: "9745f5" },
      icon: { hex: "9f4bff" },
      text: { hex: "ffffff" },
      background: { hex: "000000" }
    }
  },
  calm: {
    name: "calm",
    colors: {
      title: { hex: "e07a5f" },
      icon: { hex: "edae49" },
      text: { hex: "ebcfb2" },
      background: { hex: "373f51" }
    }
  },
  "flag-india": {
    name: "flag-india",
    colors: {
      title: { hex: "ff8f1c" },
      icon: { hex: "250E62" },
      text: { hex: "509E2F" },
      background: { hex: "ffffff" }
    }
  },
  omni: {
    name: "omni",
    colors: {
      title: { hex: "FF79C6" },
      icon: { hex: "e7de79" },
      text: { hex: "E1E1E6" },
      background: { hex: "191622" }
    }
  },
  react: {
    name: "react",
    colors: {
      title: { hex: "61dafb" },
      icon: { hex: "61dafb" },
      text: { hex: "ffffff" },
      background: { hex: "20232a" }
    }
  },
  jolly: {
    name: "jolly",
    colors: {
      title: { hex: "ff64da" },
      icon: { hex: "a960ff" },
      text: { hex: "ffffff" },
      background: { hex: "291B3E" }
    }
  },
  maroongold: {
    name: "maroongold",
    colors: {
      title: { hex: "F7EF8A" },
      icon: { hex: "F7EF8A" },
      text: { hex: "E0AA3E" },
      background: { hex: "260000" }
    }
  },
  yeblu: {
    name: "yeblu",
    colors: {
      title: { hex: "ffff00" },
      icon: { hex: "ffff00" },
      text: { hex: "ffffff" },
      background: { hex: "002046" }
    }
  },
  blueberry: {
    name: "blueberry",
    colors: {
      title: { hex: "82aaff" },
      icon: { hex: "89ddff" },
      text: { hex: "27e8a7" },
      background: { hex: "242938" }
    }
  },
  slateorange: {
    name: "slateorange",
    colors: {
      title: { hex: "faa627" },
      icon: { hex: "faa627" },
      text: { hex: "ffffff" },
      background: { hex: "36393f" }
    }
  },
  kacho_ga: {
    name: "kacho_ga",
    colors: {
      title: { hex: "bf4a3f" },
      icon: { hex: "a64833" },
      text: { hex: "d9c8a9" },
      background: { hex: "402b23" }
    }
  },
  outrun: {
    name: "outrun",
    colors: {
      title: { hex: "ffcc00" },
      icon: { hex: "ff1aff" },
      text: { hex: "8080ff" },
      background: { hex: "141439" }
    }
  },
  ocean_dark: {
    name: "ocean_dark",
    colors: {
      title: { hex: "8957B2" },
      icon: { hex: "FFFFFF" },
      text: { hex: "92D534" },
      background: { hex: "151A28" }
    }
  },
  city_lights: {
    name: "city_lights",
    colors: {
      title: { hex: "5D8CB3" },
      icon: { hex: "4798FF" },
      text: { hex: "718CA1" },
      background: { hex: "1D252C" }
    }
  },
  github_dark: {
    name: "github_dark",
    colors: {
      title: { hex: "58A6FF" },
      icon: { hex: "1F6FEB" },
      text: { hex: "C3D1D9" },
      background: { hex: "0D1117" }
    }
  },
  github_dark_dimmed: {
    name: "github_dark_dimmed",
    colors: {
      title: { hex: "539bf5" },
      icon: { hex: "539bf5" },
      text: { hex: "ADBAC7" },
      background: { hex: "24292F" },
      border: { hex: "373E47" }
    }
  },
  discord_old_blurple: {
    name: "discord_old_blurple",
    colors: {
      title: { hex: "7289DA" },
      icon: { hex: "7289DA" },
      text: { hex: "FFFFFF" },
      background: { hex: "2C2F33" }
    }
  },
  aura_dark: {
    name: "aura_dark",
    colors: {
      title: { hex: "ff7372" },
      icon: { hex: "6cffd0" },
      text: { hex: "dbdbdb" },
      background: { hex: "252334" }
    }
  },
  panda: {
    name: "panda",
    colors: {
      title: { hex: "19f9d899" },
      icon: { hex: "19f9d899" },
      text: { hex: "FF75B5" },
      background: { hex: "31353a" }
    }
  },
  noctis_minimus: {
    name: "noctis_minimus",
    colors: {
      title: { hex: "d3b692" },
      icon: { hex: "72b7c0" },
      text: { hex: "c5cdd3" },
      background: { hex: "1b2932" }
    }
  },
  cobalt2: {
    name: "cobalt2",
    colors: {
      title: { hex: "ffc600" },
      icon: { hex: "ffffff" },
      text: { hex: "0088ff" },
      background: { hex: "193549" }
    }
  },
  swift: {
    name: "swift",
    colors: {
      title: { hex: "000000" },
      icon: { hex: "f05237" },
      text: { hex: "000000" },
      background: { hex: "f7f7f7" }
    }
  },
  aura: {
    name: "aura",
    colors: {
      title: { hex: "a277ff" },
      icon: { hex: "ffca85" },
      text: { hex: "61ffca" },
      background: { hex: "15141b" }
    },
    trophy: {
      BACKGROUND: "#1E1D26",
      TITLE: "#FFFFFF",
      ICON_CIRCLE: "#FFFFFF",
      TEXT: "#dbffe6",
      LAUREL: "#a9fcca",
      SECRET_RANK_1: "#c273ff",
      SECRET_RANK_2: "#c273ff",
      SECRET_RANK_3: "#c273ff",
      SECRET_RANK_TEXT: "#bd93f9",
      NEXT_RANK_BAR: "#715df5",
      S_RANK_BASE: "#8e57ff",
      S_RANK_SHADOW: "#2361ad",
      S_RANK_TEXT: "#6272a4",
      A_RANK_BASE: "#7c71f5",
      A_RANK_SHADOW: "#3ae056",
      A_RANK_TEXT: "#6272a4",
      B_RANK_BASE: "#226a80",
      B_RANK_SHADOW: "#226a80",
      B_RANK_TEXT: "#6272a4",
      DEFAULT_RANK_BASE: "#5e8c2a",
      DEFAULT_RANK_SHADOW: "#5e8c2a",
      DEFAULT_RANK_TEXT: "#5e8c2a"
    }
  },
  apprentice: {
    name: "apprentice",
    colors: {
      title: { hex: "ffffff" },
      icon: { hex: "ffffaf" },
      text: { hex: "bcbcbc" },
      background: { hex: "262626" }
    },
    trophy: {
      BACKGROUND: "#262626",
      TITLE: "#BCBCBC",
      ICON_CIRCLE: "#BCBCBC",
      TEXT: "#5F875F",
      LAUREL: "#5F8787",
      SECRET_RANK_1: "#FF8700",
      SECRET_RANK_2: "#8787AF",
      SECRET_RANK_3: "#5F87AF",
      SECRET_RANK_TEXT: "#5F5F87",
      NEXT_RANK_BAR: "#FFFFA9",
      S_RANK_BASE: "#FFFFAF",
      S_RANK_SHADOW: "#FFFFAF",
      S_RANK_TEXT: "#87875F",
      A_RANK_BASE: "#8FAFD7",
      A_RANK_SHADOW: "#8FAFD7",
      A_RANK_TEXT: "#5F875F",
      B_RANK_BASE: "#AF5F5F",
      B_RANK_SHADOW: "#AF5F5F",
      B_RANK_TEXT: "#AF5F5F",
      DEFAULT_RANK_BASE: "#6C6C6C",
      DEFAULT_RANK_SHADOW: "#6C6C6C",
      DEFAULT_RANK_TEXT: "#1C1C1C"
    }
  },
  moltack: {
    name: "moltack",
    colors: {
      title: { hex: "86092C" },
      icon: { hex: "86092C" },
      text: { hex: "574038" },
      background: { hex: "F5E1C0" }
    }
  },
  codeSTACKr: {
    name: "codeSTACKr",
    colors: {
      title: { hex: "ff652f" },
      icon: { hex: "FFE400" },
      text: { hex: "ffffff" },
      background: { hex: "09131B" },
      border: { hex: "0c1a25" }
    }
  },
  rose_pine: {
    name: "rose_pine",
    colors: {
      title: { hex: "9ccfd8" },
      icon: { hex: "ebbcba" },
      text: { hex: "e0def4" },
      background: { hex: "191724" }
    }
  },
  catppuccin_latte: {
    name: "catppuccin_latte",
    colors: {
      title: { hex: "137980" },
      icon: { hex: "8839ef" },
      text: { hex: "4c4f69" },
      background: { hex: "eff1f5" }
    }
  },
  catppuccin_mocha: {
    name: "catppuccin_mocha",
    colors: {
      title: { hex: "94e2d5" },
      icon: { hex: "cba6f7" },
      text: { hex: "cdd6f4" },
      background: { hex: "1e1e2e" }
    }
  },
  date_night: {
    name: "date_night",
    colors: {
      title: { hex: "DA7885" },
      icon: { hex: "BB8470" },
      text: { hex: "E1B2A2" },
      background: { hex: "170F0C" },
      border: { hex: "170F0C" }
    }
  },
  one_dark_pro: {
    name: "one_dark_pro",
    colors: {
      title: { hex: "61AFEF" },
      icon: { hex: "C678DD" },
      text: { hex: "E5C06E" },
      background: { hex: "23272E" },
      border: { hex: "3B4048" }
    }
  },
  rose: {
    name: "rose",
    colors: {
      title: { hex: "8d192b" },
      icon: { hex: "B71F36" },
      text: { hex: "862931" },
      background: { hex: "e9d8d4" },
      border: { hex: "e9d8d4" }
    }
  },
  holi: {
    name: "holi",
    colors: {
      title: { hex: "5FABEE" },
      icon: { hex: "5FABEE" },
      text: { hex: "D6E7FF" },
      background: { hex: "030314" },
      border: { hex: "85A4C0" }
    }
  },
  neon: {
    name: "neon",
    colors: {
      title: { hex: "00EAD3" },
      icon: { hex: "00EAD3" },
      text: { hex: "FF449F" },
      background: { hex: "000000" },
      border: { hex: "ffffff" }
    }
  },
  blue_navy: {
    name: "blue_navy",
    colors: {
      title: { hex: "82AAFF" },
      icon: { hex: "82AAFF" },
      text: { hex: "82AAFF" },
      background: { hex: "000000" },
      border: { hex: "ffffff" }
    }
  },
  calm_pink: {
    name: "calm_pink",
    colors: {
      title: { hex: "e07a5f" },
      icon: { hex: "ebcfb2" },
      text: { hex: "edae49" },
      background: { hex: "2b2d40" },
      border: { hex: "e1bc29" }
    }
  },
  ambient_gradient: {
    name: "ambient_gradient",
    colors: {
      title: { hex: "ffffff" },
      icon: { hex: "ffffff" },
      text: { hex: "ffffff" },
      background: { hex: "35,4158d0,c850c0,ffcc70" }
    }
  },
  watchdog: {
    name: "watchdog",
    colors: {
      title: { hex: "fe428e" },
      icon: { hex: "f8d847" },
      text: { hex: "a9fef7" },
      background: { hex: "45,520806,021D4A" },
      border: { hex: "e4e2e2" }
    },
    streak: {
      background: "45,#520806,#021D4A",
      border: "#E4E2E2",
      stroke: "#E4E2E2",
      ring: "#FE428E",
      fire: "#EB8C30",
      currStreakNum: "#F8D847",
      sideNums: "#FE428E",
      currStreakLabel: "#F8D847",
      sideLabels: "#FE428E",
      dates: "#A9FEF7",
      excludeDaysLabel: "#A9FEF7"
    },
    trophy: {
      BACKGROUND: "45,#520806,#021D4A",
      TITLE: "#FE428E",
      ICON_CIRCLE: "#F8D847",
      TEXT: "#A9FEF7",
      LAUREL: "#FE428E",
      SECRET_RANK_1: "#EB8C30",
      SECRET_RANK_2: "#EB8C30",
      SECRET_RANK_3: "#EB8C30",
      SECRET_RANK_TEXT: "#EB8C30",
      NEXT_RANK_BAR: "#EB8C30",
      S_RANK_BASE: "#F8D847",
      S_RANK_SHADOW: "#F8D847",
      S_RANK_TEXT: "#3A3A3A",
      A_RANK_BASE: "#A9FEF7",
      A_RANK_SHADOW: "#A9FEF7",
      A_RANK_TEXT: "#505050",
      B_RANK_BASE: "#EB8C30",
      B_RANK_SHADOW: "#EB8C30",
      B_RANK_TEXT: "#3A3A3A",
      DEFAULT_RANK_BASE: "#777",
      DEFAULT_RANK_SHADOW: "#333",
      DEFAULT_RANK_TEXT: "#333"
    }
  },
  flat: {
    name: "flat",
    colors: {
      title: { hex: "000" },
      text: { hex: "666" },
      icon: { hex: "FFF" },
      background: { hex: "FFF" }
    },
    trophy: {
      BACKGROUND: "#FFF",
      TITLE: "#000",
      ICON_CIRCLE: "#FFF",
      TEXT: "#666",
      LAUREL: "#009366",
      SECRET_RANK_1: "red",
      SECRET_RANK_2: "fuchsia",
      SECRET_RANK_3: "blue",
      SECRET_RANK_TEXT: "fuchsia",
      NEXT_RANK_BAR: "#0366d6",
      S_RANK_BASE: "#eac200",
      S_RANK_SHADOW: "#eac200",
      S_RANK_TEXT: "#886000",
      A_RANK_BASE: "#B0B0B0",
      A_RANK_SHADOW: "#B0B0B0",
      A_RANK_TEXT: "#505050",
      B_RANK_BASE: "#A18D66",
      B_RANK_SHADOW: "#A18D66",
      B_RANK_TEXT: "#412D06",
      DEFAULT_RANK_BASE: "#777",
      DEFAULT_RANK_SHADOW: "#777",
      DEFAULT_RANK_TEXT: "#333"
    }
  },
  discord: {
    name: "discord",
    colors: {
      title: { hex: "7289DA" },
      text: { hex: "FFFFFF" },
      icon: { hex: "FFFFFF" },
      background: { hex: "23272A" }
    },
    trophy: {
      BACKGROUND: "#23272A",
      TITLE: "#7289DA",
      ICON_CIRCLE: "#FFFFFF",
      TEXT: "#FFFFFF",
      LAUREL: "#57F287",
      SECRET_RANK_1: "#ED4245",
      SECRET_RANK_2: "#57F287",
      SECRET_RANK_3: "#5865F2",
      SECRET_RANK_TEXT: "#000000",
      NEXT_RANK_BAR: "#5865F2",
      S_RANK_BASE: "#FEE75C",
      S_RANK_SHADOW: "#FEE75C",
      S_RANK_TEXT: "#000000",
      A_RANK_BASE: "#EB459E",
      A_RANK_SHADOW: "#ED4245",
      A_RANK_TEXT: "#000000",
      B_RANK_BASE: "#ED4245",
      B_RANK_SHADOW: "#ED4245",
      B_RANK_TEXT: "#000000",
      DEFAULT_RANK_BASE: "#5865F2",
      DEFAULT_RANK_SHADOW: "#5865F2",
      DEFAULT_RANK_TEXT: "#000000"
    }
  },
  chalk: {
    name: "chalk",
    colors: {
      title: { hex: "fed37e" },
      text: { hex: "d4d4d4" },
      icon: { hex: "e4e4e4" },
      background: { hex: "2d2d2d" }
    },
    trophy: {
      BACKGROUND: "#2d2d2d",
      TITLE: "#fed37e",
      ICON_CIRCLE: "#e4e4e4",
      TEXT: "#d4d4d4",
      LAUREL: "#a9d3ab",
      SECRET_RANK_1: "#f58e8e",
      SECRET_RANK_2: "#d6add5",
      SECRET_RANK_3: "#66d9ef",
      SECRET_RANK_TEXT: "#f58e8e",
      NEXT_RANK_BAR: "#7aabd4",
      S_RANK_BASE: "#fed37e",
      S_RANK_SHADOW: "#fed37e",
      S_RANK_TEXT: "#2d2d2d",
      A_RANK_BASE: "#79D4D5",
      A_RANK_SHADOW: "#79D4D5",
      A_RANK_TEXT: "#2d2d2d",
      B_RANK_BASE: "#f58e8e",
      B_RANK_SHADOW: "#f58e8e",
      B_RANK_TEXT: "#2d2d2d",
      DEFAULT_RANK_BASE: "#75715e",
      DEFAULT_RANK_SHADOW: "#75715e",
      DEFAULT_RANK_TEXT: "#2d2d2d"
    }
  },
  alduin: {
    name: "alduin",
    colors: {
      title: { hex: "dfd7af" },
      text: { hex: "dfd7af" },
      icon: { hex: "e3e3e3" },
      background: { hex: "1c1c1c" }
    },
    trophy: {
      BACKGROUND: "#1c1c1c",
      TITLE: "#dfd7af",
      ICON_CIRCLE: "#e3e3e3",
      TEXT: "#dfd7af",
      LAUREL: "#a9d3ab",
      SECRET_RANK_1: "#f58e8e",
      SECRET_RANK_2: "#d6add5",
      SECRET_RANK_3: "#66d9ef",
      SECRET_RANK_TEXT: "#f58e8e",
      NEXT_RANK_BAR: "#dfd7af",
      S_RANK_BASE: "#fed37e",
      S_RANK_SHADOW: "#fed37e",
      S_RANK_TEXT: "#2d2d2d",
      A_RANK_BASE: "#79D4D5",
      A_RANK_SHADOW: "#79D4D5",
      A_RANK_TEXT: "#2d2d2d",
      B_RANK_BASE: "#f58e8e",
      B_RANK_SHADOW: "#f58e8e",
      B_RANK_TEXT: "#2d2d2d",
      DEFAULT_RANK_BASE: "#75715e",
      DEFAULT_RANK_SHADOW: "#75715e",
      DEFAULT_RANK_TEXT: "#2d2d2d"
    }
  },
  darkhub: {
    name: "darkhub",
    colors: {
      title: { hex: "c9d1d9" },
      text: { hex: "8b949e" },
      icon: { hex: "f0f6fb" },
      background: { hex: "0d1117" }
    },
    trophy: {
      BACKGROUND: "#0d1117",
      TITLE: "#c9d1d9",
      ICON_CIRCLE: "#f0f6fb",
      TEXT: "#8b949e",
      LAUREL: "#178600",
      SECRET_RANK_1: "#ff5555",
      SECRET_RANK_2: "#ff79c6",
      SECRET_RANK_3: "#388bfd",
      SECRET_RANK_TEXT: "#ff79c6",
      NEXT_RANK_BAR: "#ff79c6",
      S_RANK_BASE: "#ffb86c",
      S_RANK_SHADOW: "#ffb86c",
      S_RANK_TEXT: "#0d1117",
      A_RANK_BASE: "#8be9fd",
      A_RANK_SHADOW: "#8be9fd",
      A_RANK_TEXT: "#0d1117",
      B_RANK_BASE: "#ff5555",
      B_RANK_SHADOW: "#ff5555",
      B_RANK_TEXT: "#0d1117",
      DEFAULT_RANK_BASE: "#6272a4",
      DEFAULT_RANK_SHADOW: "#6272a4",
      DEFAULT_RANK_TEXT: "#0d1117"
    }
  },
  juicyfresh: {
    name: "juicyfresh",
    colors: {
      title: { hex: "f7d745" },
      text: { hex: "b2d76c" },
      icon: { hex: "FFF" },
      background: { hex: "0d0c15" }
    },
    trophy: {
      BACKGROUND: "#0d0c15",
      TITLE: "#f7d745",
      ICON_CIRCLE: "#FFF",
      TEXT: "#b2d76c",
      LAUREL: "#8bb071",
      SECRET_RANK_1: "#a8d937",
      SECRET_RANK_2: "#f7e662",
      SECRET_RANK_3: "#4d9b1c",
      SECRET_RANK_TEXT: "#ff5700",
      NEXT_RANK_BAR: "#6562af",
      S_RANK_BASE: "#f7d644",
      S_RANK_SHADOW: "#f69e44",
      S_RANK_TEXT: "#ff5700",
      A_RANK_BASE: "#f69e44",
      A_RANK_SHADOW: "#f46d5a",
      A_RANK_TEXT: "#ff5700",
      B_RANK_BASE: "#f46d5a",
      B_RANK_SHADOW: "#f73155",
      B_RANK_TEXT: "#ff5700",
      DEFAULT_RANK_BASE: "#f0d7d6",
      DEFAULT_RANK_SHADOW: "#f58867",
      DEFAULT_RANK_TEXT: "#ff5700"
    }
  },
  oldie: {
    name: "oldie",
    colors: {
      title: { hex: "111" },
      text: { hex: "666" },
      icon: { hex: "FFF" },
      background: { hex: "F0F0F0" }
    },
    trophy: {
      BACKGROUND: "#F0F0F0",
      TITLE: "#111",
      ICON_CIRCLE: "#FFF",
      TEXT: "#666",
      LAUREL: "#535353",
      SECRET_RANK_1: "#738986",
      SECRET_RANK_2: "#B36154",
      SECRET_RANK_3: "#91A16A",
      SECRET_RANK_TEXT: "#4D4D4D",
      NEXT_RANK_BAR: "#8E8680",
      S_RANK_BASE: "#8E8E8E",
      S_RANK_SHADOW: "#8E8E8E",
      S_RANK_TEXT: "#4D4D4D",
      A_RANK_BASE: "#AFAFAF",
      A_RANK_SHADOW: "#AFAFAF",
      A_RANK_TEXT: "#4D4D4D",
      B_RANK_BASE: "#858585",
      B_RANK_SHADOW: "#858585",
      B_RANK_TEXT: "#4D4D4D",
      DEFAULT_RANK_BASE: "#535353",
      DEFAULT_RANK_SHADOW: "#535353",
      DEFAULT_RANK_TEXT: "#4D4D4D"
    }
  },
  buddhism: {
    name: "buddhism",
    colors: {
      title: { hex: "FFF" },
      text: { hex: "FFF" },
      icon: { hex: "FFF" },
      background: { hex: "ffc20e" }
    },
    trophy: {
      BACKGROUND: "#ffc20e",
      TITLE: "#FFF",
      ICON_CIRCLE: "#FFF",
      TEXT: "#FFF",
      LAUREL: "#27c5ff",
      SECRET_RANK_1: "#FFF",
      SECRET_RANK_2: "#f73155",
      SECRET_RANK_3: "#fff",
      SECRET_RANK_TEXT: "#f73155",
      NEXT_RANK_BAR: "#f73155",
      S_RANK_BASE: "#ff8400",
      S_RANK_SHADOW: "#ff8400",
      S_RANK_TEXT: "#ffc20e",
      A_RANK_BASE: "#fff",
      A_RANK_SHADOW: "#fff",
      A_RANK_TEXT: "#ffc20e",
      B_RANK_BASE: "#f73155",
      B_RANK_SHADOW: "#f73155",
      B_RANK_TEXT: "#ffc20e",
      DEFAULT_RANK_BASE: "#27c5ff",
      DEFAULT_RANK_SHADOW: "#27c5ff",
      DEFAULT_RANK_TEXT: "#ffc20e"
    }
  },
  onestar: {
    name: "onestar",
    colors: {
      title: { hex: "EEEEEE" },
      text: { hex: "c7c7c7" },
      icon: { hex: "EEEEEE" },
      background: { hex: "0d1117" }
    },
    trophy: {
      BACKGROUND: "#0d1117",
      ICON_CIRCLE: "#EEEEEE",
      TITLE: "#EEEEEE",
      TEXT: "#c7c7c7",
      LAUREL: "#0dbc79",
      SECRET_RANK_1: "#ff5555",
      SECRET_RANK_2: "#d861d8",
      SECRET_RANK_3: "#3b8eea",
      SECRET_RANK_TEXT: "#ff61c6",
      NEXT_RANK_BAR: "#9e9e9e",
      S_RANK_BASE: "#FFD54F",
      S_RANK_SHADOW: "#FFE082",
      S_RANK_TEXT: "#CB8A30",
      A_RANK_BASE: "#23d18b",
      A_RANK_SHADOW: "#8DF7B5",
      A_RANK_TEXT: "#3A3A3A",
      B_RANK_BASE: "#d13b3b",
      B_RANK_SHADOW: "#fa4b4b",
      B_RANK_TEXT: "#3A3A3A",
      DEFAULT_RANK_BASE: "#2472c8",
      DEFAULT_RANK_SHADOW: "#3b8eea",
      DEFAULT_RANK_TEXT: "#3A3A3A"
    }
  },
  gitdimmed: {
    name: "gitdimmed",
    colors: {
      title: { hex: "f0f6fb" },
      text: { hex: "FFF" },
      icon: { hex: "f0f6fb" },
      background: { hex: "333" }
    },
    trophy: {
      BACKGROUND: "#333",
      TITLE: "#f0f6fb",
      ICON_CIRCLE: "#f0f6fb",
      TEXT: "#FFF",
      LAUREL: "#178600",
      SECRET_RANK_1: "#ff5555",
      SECRET_RANK_2: "#ff79c6",
      SECRET_RANK_3: "#388bfd",
      SECRET_RANK_TEXT: "#ff79c6",
      NEXT_RANK_BAR: "#00aeff",
      S_RANK_BASE: "#ffb86c",
      S_RANK_SHADOW: "#ffb86c",
      S_RANK_TEXT: "#0d1117",
      A_RANK_BASE: "#2dde98",
      A_RANK_TEXT: "#0d1117",
      A_RANK_SHADOW: "#2dde98",
      B_RANK_BASE: "#8be9fd",
      B_RANK_SHADOW: "#8be9fd",
      B_RANK_TEXT: "#0d1117",
      DEFAULT_RANK_BASE: "#5c75c3",
      DEFAULT_RANK_SHADOW: "#6272a4",
      DEFAULT_RANK_TEXT: "#0d1117"
    }
  },
  matrix: {
    name: "matrix",
    colors: {
      title: { hex: "00cc00" },
      text: { hex: "00cc00" },
      icon: { hex: "002200" },
      background: { hex: "000000" }
    },
    trophy: {
      BACKGROUND: "#000000",
      TITLE: "#00cc00",
      ICON_CIRCLE: "#002200",
      TEXT: "#00cc00",
      LAUREL: "#178600",
      SECRET_RANK_1: "#ffd700",
      SECRET_RANK_2: "#ffffff",
      SECRET_RANK_3: "#ffd700",
      SECRET_RANK_TEXT: "#00ff00",
      NEXT_RANK_BAR: "#00ff00",
      S_RANK_BASE: "#ffd700",
      S_RANK_SHADOW: "#ffd700",
      S_RANK_TEXT: "#00ff00",
      A_RANK_BASE: "#c0c0c0",
      A_RANK_TEXT: "#00ff00",
      A_RANK_SHADOW: "#c0c0c0",
      B_RANK_BASE: "#b08d57",
      B_RANK_SHADOW: "#b08d57",
      B_RANK_TEXT: "#00ff00",
      DEFAULT_RANK_BASE: "#b08d57",
      DEFAULT_RANK_SHADOW: "#b08d57",
      DEFAULT_RANK_TEXT: "#00ff00"
    }
  },
  dark_dimmed: {
    name: "dark_dimmed",
    colors: {
      title: { hex: "adbac7" },
      text: { hex: "adbac7" },
      icon: { hex: "002200" },
      background: { hex: "22272e" }
    },
    trophy: {
      BACKGROUND: "#22272e",
      TITLE: "#adbac7",
      ICON_CIRCLE: "#002200",
      TEXT: "#adbac7",
      LAUREL: "#178600",
      SECRET_RANK_1: "red",
      SECRET_RANK_2: "fuchsia",
      SECRET_RANK_3: "blue",
      SECRET_RANK_TEXT: "fuchsia",
      NEXT_RANK_BAR: "#0366d6",
      S_RANK_BASE: "#FAD200",
      S_RANK_SHADOW: "#C8A090",
      S_RANK_TEXT: "#886000",
      A_RANK_BASE: "#B0B0B0",
      A_RANK_SHADOW: "#9090C0",
      A_RANK_TEXT: "#505050",
      B_RANK_BASE: "#A18D66",
      B_RANK_SHADOW: "#816D96",
      B_RANK_TEXT: "#412D06",
      DEFAULT_RANK_BASE: "#777",
      DEFAULT_RANK_SHADOW: "#333",
      DEFAULT_RANK_TEXT: "#333"
    }
  },
  dark_lover: {
    name: "dark_lover",
    colors: {
      title: { hex: "e8aa64" },
      text: { hex: "e8aa64" },
      icon: { hex: "white" },
      background: { hex: "0d0d0d" }
    },
    trophy: {
      BACKGROUND: "#0d0d0d",
      TITLE: "#e8aa64",
      ICON_CIRCLE: "white",
      TEXT: "#e8aa64",
      LAUREL: "#e86464",
      SECRET_RANK_1: "#e05555",
      SECRET_RANK_2: "#e05555",
      SECRET_RANK_3: "#e05555",
      SECRET_RANK_TEXT: "#e05555",
      NEXT_RANK_BAR: "#e05555",
      S_RANK_BASE: "#f2c635",
      S_RANK_SHADOW: "#e0d7b8",
      S_RANK_TEXT: "#b35707",
      A_RANK_BASE: "#f25755",
      A_RANK_SHADOW: "#e69493",
      A_RANK_TEXT: "#f5352f",
      B_RANK_BASE: "#63db93",
      B_RANK_SHADOW: "#8cd1a8",
      B_RANK_TEXT: "#07b84e",
      DEFAULT_RANK_BASE: "#7f6ceb",
      DEFAULT_RANK_SHADOW: "#a598ed",
      DEFAULT_RANK_TEXT: "#7f6ceb"
    }
  },
  kimbie_dark: {
    name: "kimbie_dark",
    colors: {
      title: { hex: "d3af86" },
      text: { hex: "d3af86" },
      icon: { hex: "7e602c" },
      background: { hex: "221a0f" }
    },
    trophy: {
      BACKGROUND: "#221a0f",
      TITLE: "#d3af86",
      ICON_CIRCLE: "#7e602c",
      TEXT: "#d3af86",
      LAUREL: "#889b4a",
      SECRET_RANK_1: "#f14a68",
      SECRET_RANK_2: "#f14a68",
      SECRET_RANK_3: "#dc3958",
      SECRET_RANK_TEXT: "#dc3958",
      NEXT_RANK_BAR: "#dc3958",
      S_RANK_BASE: "#fcac51",
      S_RANK_SHADOW: "#f79a32",
      S_RANK_TEXT: "#d3af86",
      A_RANK_BASE: "#a3B95a",
      A_RANK_SHADOW: "#889b4a",
      A_RANK_TEXT: "#d3af86",
      B_RANK_BASE: "#4c96a8",
      B_RANK_SHADOW: "#418292",
      B_RANK_TEXT: "#d3af86",
      DEFAULT_RANK_BASE: "#8ab1b0",
      DEFAULT_RANK_SHADOW: "#719190",
      DEFAULT_RANK_TEXT: "#d3af86"
    }
  }
};

// lib/themes/adapters/stats.ts
var DEFAULT_THEME_NAME = "default";
var fieldMap = {
  title_color: "title",
  icon_color: "icon",
  text_color: "text",
  bg_color: "background",
  border_color: "border",
  ring_color: "ring"
};
function tokenHex(colors, token) {
  const value = colors?.[token];
  if (!value) {
    return void 0;
  }
  if (typeof value === "string") {
    return value;
  }
  if ("hex" in value) {
    return value.hex;
  }
  if ("stops" in value) {
    const stops = value.stops.map((s) => s.hex).join(",");
    return value.angle !== void 0 ? `${value.angle},${stops}` : stops;
  }
  return void 0;
}
function toStatsTheme(theme, fallback) {
  const resolved = fallback ?? themes[DEFAULT_THEME_NAME] ?? { name: DEFAULT_THEME_NAME, colors: {} };
  const s = theme.colors;
  const d = resolved.colors;
  const pick = (key) => tokenHex(s, fieldMap[key]) ?? tokenHex(d, fieldMap[key]);
  return {
    title_color: pick("title_color") ?? "",
    icon_color: pick("icon_color") ?? "",
    text_color: pick("text_color") ?? "",
    bg_color: pick("bg_color") ?? "",
    border_color: pick("border_color"),
    ring_color: pick("ring_color")
  };
}

// stats/src/common/error.ts
var TRY_AGAIN_LATER = "Please try again later";
var SECONDARY_ERROR_MESSAGES = {
  MAX_RETRY: "You can deploy own instance or wait until public will be no longer limited",
  NO_TOKENS: "Please add an env variable called PAT_1 with your GitHub API token in vercel",
  USER_NOT_FOUND: "Make sure the provided username is not an organization",
  GRAPHQL_ERROR: TRY_AGAIN_LATER,
  GITHUB_REST_API_ERROR: TRY_AGAIN_LATER
};
var CustomError = class extends Error {
  type;
  secondaryMessage;
  constructor(message, type) {
    super(message);
    this.type = type;
    this.secondaryMessage = SECONDARY_ERROR_MESSAGES[type] || type;
  }
  static MAX_RETRY = "MAX_RETRY";
  static NO_TOKENS = "NO_TOKENS";
  static USER_NOT_FOUND = "USER_NOT_FOUND";
  static GRAPHQL_ERROR = "GRAPHQL_ERROR";
  static GITHUB_REST_API_ERROR = "GITHUB_REST_API_ERROR";
};

// stats/src/common/utils.ts
var require2 = createRequire(import.meta.url);
var emojiMap = null;
var ERROR_CARD_LENGTH = 576.5;
var flexLayout = ({
  items,
  gap,
  direction,
  sizes = []
}) => {
  let lastSize = 0;
  return items.filter(Boolean).map((item, i) => {
    const size = sizes[i] || 0;
    let transform = `translate(${lastSize}, 0)`;
    if (direction === "column") {
      transform = `translate(0, ${lastSize})`;
    }
    lastSize += size + gap;
    return `<g transform="${transform}">${item}</g>`;
  });
};
var createLanguageNode = (langName, langColor) => {
  return `
    <g data-testid="primary-lang">
      <circle data-testid="lang-color" cx="0" cy="-5" r="6" fill="${langColor}" />
      <text data-testid="lang-name" class="gray" x="15">${langName}</text>
    </g>
    `;
};
var iconWithLabel = (icon, label, testid, iconSize) => {
  if (typeof label === "number" && label <= 0) {
    return "";
  }
  const iconSvg = `
      <svg
        class="icon"
        y="-12"
        viewBox="0 0 16 16"
        version="1.1"
        width="${iconSize}"
        height="${iconSize}"
      >
        ${icon}
      </svg>
    `;
  const text = `<text data-testid="${testid}" class="gray">${label}</text>`;
  return flexLayout({ items: [iconSvg, text], gap: 20 }).join("");
};
var kFormatter = (num) => {
  return Math.abs(num) > 999 ? `${Math.sign(num) * parseFloat((Math.abs(num) / 1e3).toFixed(1))}k` : Math.sign(num) * Math.abs(num);
};
var isValidHexColor = (hexColor) => {
  return new RegExp(
    /^([A-Fa-f0-9]{8}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{4})$/
  ).test(hexColor);
};
var parseBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return void 0;
};
var parseArray = (str) => {
  if (!str) return [];
  return str.split(",");
};
var clampValue = (number, min, max) => {
  if (Number.isNaN(parseInt(number, 10))) {
    return min;
  }
  return Math.max(min, Math.min(number, max));
};
var isValidGradient = (colors) => {
  return colors.length > 2 && colors.slice(1).every((color) => isValidHexColor(color));
};
var fallbackColor = (color, fallbackColor2) => {
  let gradient = null;
  const colors = color ? color.split(",") : [];
  if (colors.length > 1 && isValidGradient(colors)) {
    gradient = colors;
  }
  return (gradient ? gradient : isValidHexColor(color || "") && `#${color}`) || fallbackColor2;
};
var request = (data, headers) => {
  return fetch("https://api.github.com/graphql", {
    method: "post",
    headers,
    body: JSON.stringify(data)
  }).then(
    (res) => res.json().then((responseData) => ({
      data: responseData,
      statusText: res.statusText
    }))
  );
};
var getCardColors = ({
  title_color,
  text_color,
  icon_color,
  bg_color,
  border_color,
  ring_color,
  theme,
  fallbackTheme = "default"
}) => {
  const defaultTheme = themes[fallbackTheme];
  if (!defaultTheme) {
    throw new Error(`Fallback theme '${fallbackTheme}' not found`);
  }
  const defaultThemeColors = defaultTheme.colors;
  const defaultStats = {
    title_color: defaultThemeColors.title?.hex,
    icon_color: defaultThemeColors.icon?.hex,
    text_color: defaultThemeColors.text?.hex,
    bg_color: defaultThemeColors.background ? "hex" in defaultThemeColors.background ? defaultThemeColors.background.hex : void 0 : void 0
  };
  const selectedTheme = themes[theme || ""] || defaultTheme;
  const adapted = toStatsTheme(selectedTheme, defaultTheme);
  const titleColor = fallbackColor(
    title_color || adapted.title_color,
    `#${defaultStats.title_color}`
  );
  const ringColor = fallbackColor(ring_color || adapted.ring_color, titleColor);
  const iconColor = fallbackColor(
    icon_color || adapted.icon_color,
    `#${defaultStats.icon_color}`
  );
  const textColor = fallbackColor(
    text_color || adapted.text_color,
    `#${defaultStats.text_color}`
  );
  const bgColor = fallbackColor(
    bg_color || adapted.bg_color,
    `#${defaultStats.bg_color}`
  );
  const borderColor = fallbackColor(
    border_color || adapted.border_color,
    `#${adapted.border_color}`
  );
  if (typeof titleColor !== "string" || typeof textColor !== "string" || typeof ringColor !== "string" || typeof iconColor !== "string" || typeof borderColor !== "string") {
    throw new Error(
      "Unexpected behavior, all colors except background should be string."
    );
  }
  return { titleColor, iconColor, textColor, bgColor, borderColor, ringColor };
};
var encodeHTML = (str) => {
  return str.replace(/[\u00A0-\u9999<>&](?!#)/gim, (i) => {
    return `&#${i.charCodeAt(0)};`;
  }).split("\b").join("");
};
var UPSTREAM_API_ERRORS = [
  TRY_AGAIN_LATER,
  SECONDARY_ERROR_MESSAGES.MAX_RETRY
];
var renderError = ({
  message,
  secondaryMessage = "",
  renderOptions = {}
}) => {
  const {
    title_color,
    text_color,
    bg_color,
    border_color,
    theme = "default",
    show_repo_link = true
  } = renderOptions;
  const { titleColor, textColor, bgColor, borderColor } = getCardColors({
    title_color,
    text_color,
    icon_color: "",
    bg_color,
    border_color,
    ring_color: "",
    theme
  });
  return `
    <svg width="${ERROR_CARD_LENGTH}"  height="120" viewBox="0 0 ${ERROR_CARD_LENGTH} 120" fill="${bgColor}" xmlns="http://www.w3.org/2000/svg">
    <style>
    .text { font: 600 16px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${titleColor} }
    .small { font: 600 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor} }
    .gray { fill: #858585 }
    </style>
    <rect x="0.5" y="0.5" width="${ERROR_CARD_LENGTH - 1}" height="99%" rx="4.5" fill="${bgColor}" stroke="${borderColor}"/>
    <text x="25" y="45" class="text">Something went wrong!${UPSTREAM_API_ERRORS.includes(secondaryMessage) || !show_repo_link ? "" : " file an issue at https://tiny.one/readme-stats"}</text>
    <text data-testid="message" x="25" y="55" class="text small">
      <tspan x="25" dy="18">${encodeHTML(message)}</tspan>
      <tspan x="25" dy="18" class="gray">${secondaryMessage}</tspan>
    </text>
    </svg>
  `;
};
var wrapTextMultiline = (text, width = 59, maxLines = 3) => {
  const fullWidthComma = "\uFF0C";
  const encoded = encodeHTML(text);
  const isChinese = encoded.includes(fullWidthComma);
  let wrapped = [];
  if (isChinese) {
    wrapped = encoded.split(fullWidthComma);
  } else {
    wrapped = encoded.split(/\r?\n/).flatMap((line) => wrapLine(line, width));
  }
  const lines = wrapped.map((line) => line.trim()).slice(0, maxLines);
  if (wrapped.length > maxLines) {
    lines[maxLines - 1] += "...";
  }
  return lines.filter(Boolean);
};
var noop = () => {
};
var logger = process.env.NODE_ENV === "test" ? { log: noop, error: noop } : console;
var measureText = (str, fontSize = 10) => {
  const widths = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0.2796875,
    0.2765625,
    0.3546875,
    0.5546875,
    0.5546875,
    0.8890625,
    0.665625,
    0.190625,
    0.3328125,
    0.3328125,
    0.3890625,
    0.5828125,
    0.2765625,
    0.3328125,
    0.2765625,
    0.3015625,
    0.5546875,
    0.5546875,
    0.5546875,
    0.5546875,
    0.5546875,
    0.5546875,
    0.5546875,
    0.5546875,
    0.5546875,
    0.5546875,
    0.2765625,
    0.2765625,
    0.584375,
    0.5828125,
    0.584375,
    0.5546875,
    1.0140625,
    0.665625,
    0.665625,
    0.721875,
    0.721875,
    0.665625,
    0.609375,
    0.7765625,
    0.721875,
    0.2765625,
    0.5,
    0.665625,
    0.5546875,
    0.8328125,
    0.721875,
    0.7765625,
    0.665625,
    0.7765625,
    0.721875,
    0.665625,
    0.609375,
    0.721875,
    0.665625,
    0.94375,
    0.665625,
    0.665625,
    0.609375,
    0.2765625,
    0.3546875,
    0.2765625,
    0.4765625,
    0.5546875,
    0.3328125,
    0.5546875,
    0.5546875,
    0.5,
    0.5546875,
    0.5546875,
    0.2765625,
    0.5546875,
    0.5546875,
    0.221875,
    0.240625,
    0.5,
    0.221875,
    0.8328125,
    0.5546875,
    0.5546875,
    0.5546875,
    0.5546875,
    0.3328125,
    0.5,
    0.2765625,
    0.5546875,
    0.5,
    0.721875,
    0.5,
    0.5,
    0.5,
    0.3546875,
    0.259375,
    0.353125,
    0.5890625
  ];
  const avg = 0.5279276315789471;
  return str.split("").map(
    (c) => c.charCodeAt(0) < widths.length ? widths[c.charCodeAt(0)] ?? avg : avg
  ).reduce((cur, acc) => (acc ?? 0) + (cur ?? 0), 0) * fontSize;
};
var lowercaseTrim = (name) => name.toLowerCase().trim();
var chunkArray = (arr, perChunk) => {
  return arr.reduce((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / perChunk);
    if (!resultArray[chunkIndex]) resultArray[chunkIndex] = [];
    resultArray[chunkIndex].push(item);
    return resultArray;
  }, []);
};
var wrapLine = (line, width) => {
  if (!line.trim()) return [];
  const words = line.trim().split(/\s+/).filter(Boolean);
  const wrapped = [];
  let current = "";
  for (const word of words) {
    if (!current) {
      current = word;
      continue;
    }
    if (`${current} ${word}`.length <= width) {
      current = `${current} ${word}`;
      continue;
    }
    wrapped.push(current);
    if (word.length > width) {
      for (let index = 0; index < word.length; index += width) {
        wrapped.push(word.slice(index, index + width));
      }
      current = "";
    } else {
      current = word;
    }
  }
  if (current) wrapped.push(current);
  return wrapped;
};
var parseEmojis = (str) => {
  if (!str) throw new Error("[parseEmoji]: str argument not provided");
  if (!emojiMap) {
    emojiMap = require2("emoji-name-map");
  }
  const map = emojiMap;
  return str.replace(/:\w+:/gm, (emoji) => {
    return map.get(emoji) || "";
  });
};
var formatBytes = (bytes) => {
  if (bytes < 0) throw new Error("Bytes must be a non-negative number");
  if (bytes === 0) return "0 B";
  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
  const base = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(base));
  if (i >= sizes.length)
    throw new Error("Bytes is too large to convert to a human-readable string");
  return `${(bytes / base ** i).toFixed(1)} ${sizes[i]}`;
};

// stats/src/common/Card.ts
var Card = class {
  width;
  height;
  hideBorder;
  hideTitle;
  border_radius;
  colors;
  title;
  css;
  paddingX;
  paddingY;
  titlePrefixIcon;
  animations;
  a11yTitle;
  a11yDesc;
  constructor({
    width = 100,
    height = 100,
    border_radius = 4.5,
    colors = {},
    customTitle,
    defaultTitle = "",
    titlePrefixIcon
  }) {
    this.width = width;
    this.height = height;
    this.hideBorder = false;
    this.hideTitle = false;
    this.border_radius = border_radius;
    this.colors = colors;
    this.title = customTitle === void 0 ? encodeHTML(defaultTitle) : encodeHTML(customTitle);
    this.css = "";
    this.paddingX = 25;
    this.paddingY = 35;
    this.titlePrefixIcon = titlePrefixIcon;
    this.animations = true;
    this.a11yTitle = "";
    this.a11yDesc = "";
  }
  disableAnimations() {
    this.animations = false;
  }
  setAccessibilityLabel({ title, desc }) {
    this.a11yTitle = title;
    this.a11yDesc = desc;
  }
  setCSS(value) {
    this.css = value;
  }
  setHideBorder(value) {
    this.hideBorder = value;
  }
  setHideTitle(value) {
    this.hideTitle = value;
    if (value) {
      this.height -= 30;
    }
  }
  setTitle(text) {
    this.title = text;
  }
  renderTitle() {
    const titleText = `
      <text
        x="0"
        y="0"
        class="header"
        data-testid="header"
      >${this.title}</text>
    `;
    const prefixIcon = `
      <svg
        class="icon"
        x="0"
        y="-13"
        viewBox="0 0 16 16"
        version="1.1"
        width="16"
        height="16"
      >
        ${this.titlePrefixIcon}
      </svg>
    `;
    return `
      <g
        data-testid="card-title"
        transform="translate(${this.paddingX}, ${this.paddingY})"
      >
        ${flexLayout({
      items: [...this.titlePrefixIcon ? [prefixIcon] : [], titleText],
      gap: 25
    }).join("")}
      </g>
    `;
  }
  renderGradient() {
    if (typeof this.colors.bgColor !== "object") {
      return "";
    }
    const gradients = this.colors.bgColor.slice(1);
    return typeof this.colors.bgColor === "object" ? `
        <defs>
          <linearGradient
            id="gradient"
            gradientTransform="rotate(${this.colors.bgColor[0]})"
            gradientUnits="userSpaceOnUse"
          >
            ${gradients.map((grad, index) => {
      const offset = index * 100 / (gradients.length - 1);
      return `<stop offset="${offset}%" stop-color="#${grad}" />`;
    }).join("")}
          </linearGradient>
        </defs>
        ` : "";
  }
  getAnimations = () => {
    return `
      /* Animations */
      @keyframes scaleInAnimation {
        from {
          transform: translate(-5px, 5px) scale(0);
        }
        to {
          transform: translate(-5px, 5px) scale(1);
        }
      }
      @keyframes fadeInAnimation {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `;
  };
  render(body) {
    return `
      <svg
        width="${this.width}"
        height="${this.height}"
        viewBox="0 0 ${this.width} ${this.height}"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby="descId"
      >
        <title id="titleId">${this.a11yTitle}</title>
        <desc id="descId">${this.a11yDesc}</desc>
        <style>
          .header {
            font: 600 18px 'Segoe UI', Ubuntu, Sans-Serif;
            fill: ${this.colors.titleColor};
            animation: fadeInAnimation 0.8s ease-in-out forwards;
          }
          @supports(-moz-appearance: auto) {
            /* Selector detects Firefox */
            .header { font-size: 15.5px; }
          }
          ${this.css}

          ${process.env.NODE_ENV === "test" ? "" : this.getAnimations()}
          ${this.animations === false ? `* { animation-duration: 0s !important; animation-delay: 0s !important; }` : ""}
        </style>

        ${this.renderGradient()}

        <rect
          data-testid="card-bg"
          x="0.5"
          y="0.5"
          rx="${this.border_radius}"
          height="99%"
          stroke="${this.colors.borderColor}"
          width="${this.width - 1}"
          fill="${typeof this.colors.bgColor === "object" ? "url(#gradient)" : this.colors.bgColor}"
          stroke-opacity="${this.hideBorder ? 0 : 1}"
        />

        ${this.hideTitle ? "" : this.renderTitle()}

        <g
          data-testid="main-card-body"
          transform="translate(0, ${this.hideTitle ? this.paddingX : this.paddingY + 20})"
        >
          ${body}
        </g>
      </svg>
    `;
  }
};

// stats/src/common/icons.ts
var icons = {
  star: `<path fill-rule="evenodd" d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25zm0 2.445L6.615 5.5a.75.75 0 01-.564.41l-3.097.45 2.24 2.184a.75.75 0 01.216.664l-.528 3.084 2.769-1.456a.75.75 0 01.698 0l2.77 1.456-.53-3.084a.75.75 0 01.216-.664l2.24-2.183-3.096-.45a.75.75 0 01-.564-.41L8 2.694v.001z"/>`,
  commits: `<path fill-rule="evenodd" d="M1.643 3.143L.427 1.927A.25.25 0 000 2.104V5.75c0 .138.112.25.25.25h3.646a.25.25 0 00.177-.427L2.715 4.215a6.5 6.5 0 11-1.18 4.458.75.75 0 10-1.493.154 8.001 8.001 0 101.6-5.684zM7.75 4a.75.75 0 01.75.75v2.992l2.028.812a.75.75 0 01-.557 1.392l-2.5-1A.75.75 0 017 8.25v-3.5A.75.75 0 017.75 4z"/>`,
  prs: `<path fill-rule="evenodd" d="M7.177 3.073L9.573.677A.25.25 0 0110 .854v4.792a.25.25 0 01-.427.177L7.177 3.427a.25.25 0 010-.354zM3.75 2.5a.75.75 0 100 1.5.75.75 0 000-1.5zm-2.25.75a2.25 2.25 0 113 2.122v5.256a2.251 2.251 0 11-1.5 0V5.372A2.25 2.25 0 011.5 3.25zM11 2.5h-1V4h1a1 1 0 011 1v5.628a2.251 2.251 0 101.5 0V5A2.5 2.5 0 0011 2.5zm1 10.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM3.75 12a.75.75 0 100 1.5.75.75 0 000-1.5z"/>`,
  prs_merged: `<path fill-rule="evenodd" d="M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0 0 .005V3.25Z" />`,
  prs_merged_percentage: `<path fill-rule="evenodd" d="M13.442 2.558a.625.625 0 0 1 0 .884l-10 10a.625.625 0 1 1-.884-.884l10-10a.625.625 0 0 1 .884 0zM4.5 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm7 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm0 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />`,
  issues: `<path fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z"/>`,
  icon: `<path fill-rule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/>`,
  contribs: `<path fill-rule="evenodd" d="M2 2.5A2.5 2.5 0 014.5 0h8.75a.75.75 0 01.75.75v12.5a.75.75 0 01-.75.75h-2.5a.75.75 0 110-1.5h1.75v-2h-8a1 1 0 00-.714 1.7.75.75 0 01-1.072 1.05A2.495 2.495 0 012 11.5v-9zm10.5-1V9h-8c-.356 0-.694.074-1 .208V2.5a1 1 0 011-1h8zM5 12.25v3.25a.25.25 0 00.4.2l1.45-1.087a.25.25 0 01.3 0L8.6 15.7a.25.25 0 00.4-.2v-3.25a.25.25 0 00-.25-.25h-3.5a.25.25 0 00-.25.25z"/>`,
  fork: `<path fill-rule="evenodd" d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 2.122a2.25 2.25 0 10-1.5 0v.878A2.25 2.25 0 005.75 8.5h1.5v2.128a2.251 2.251 0 101.5 0V8.5h1.5a2.25 2.25 0 002.25-2.25v-.878a2.25 2.25 0 10-1.5 0v.878a.75.75 0 01-.75.75h-4.5A.75.75 0 015 6.25v-.878zm3.75 7.378a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm3-8.75a.75.75 0 100-1.5.75.75 0 000 1.5z"></path>`,
  reviews: `<path fill-rule="evenodd" d="M8 2c1.981 0 3.671.992 4.933 2.078 1.27 1.091 2.187 2.345 2.637 3.023a1.62 1.62 0 0 1 0 1.798c-.45.678-1.367 1.932-2.637 3.023C11.67 13.008 9.981 14 8 14c-1.981 0-3.671-.992-4.933-2.078C1.797 10.83.88 9.576.43 8.898a1.62 1.62 0 0 1 0-1.798c.45-.677 1.367-1.931 2.637-3.022C4.33 2.992 6.019 2 8 2ZM1.679 7.932a.12.12 0 0 0 0 .136c.411.622 1.241 1.75 2.366 2.717C5.176 11.758 6.527 12.5 8 12.5c1.473 0 2.825-.742 3.955-1.715 1.124-.967 1.954-2.096 2.366-2.717a.12.12 0 0 0 0-.136c-.412-.621-1.242-1.75-2.366-2.717C10.824 4.242 9.473 3.5 8 3.5c-1.473 0-2.825.742-3.955 1.715-1.124.967-1.954 2.096-2.366 2.717ZM8 10a2 2 0 1 1-.001-3.999A2 2 0 0 1 8 10Z"/>`,
  discussions_started: `<path fill-rule="evenodd" d="M1.75 1h8.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 10.25 10H7.061l-2.574 2.573A1.458 1.458 0 0 1 2 11.543V10h-.25A1.75 1.75 0 0 1 0 8.25v-5.5C0 1.784.784 1 1.75 1ZM1.5 2.75v5.5c0 .138.112.25.25.25h1a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h3.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25Zm13 2a.25.25 0 0 0-.25-.25h-.5a.75.75 0 0 1 0-1.5h.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 14.25 12H14v1.543a1.458 1.458 0 0 1-2.487 1.03L9.22 12.28a.749.749 0 0 1 .326-1.275.749.749 0 0 1 .734.215l2.22 2.22v-2.19a.75.75 0 0 1 .75-.75h1a.25.25 0 0 0 .25-.25Z" />`,
  discussions_answered: `<path fill-rule="evenodd" d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />`,
  gist: `<path fill-rule="evenodd" d="M0 1.75C0 .784.784 0 1.75 0h12.5C15.216 0 16 .784 16 1.75v12.5A1.75 1.75 0 0 1 14.25 16H1.75A1.75 1.75 0 0 1 0 14.25Zm1.75-.25a.25.25 0 0 0-.25.25v12.5c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25Zm7.47 3.97a.75.75 0 0 1 1.06 0l2 2a.75.75 0 0 1 0 1.06l-2 2a.749.749 0 0 1-1.275-.326.749.749 0 0 1 .215-.734L10.69 8 9.22 6.53a.75.75 0 0 1 0-1.06ZM6.78 6.53 5.31 8l1.47 1.47a.749.749 0 0 1-.326 1.275.749.749 0 0 1-.734-.215l-2-2a.75.75 0 0 1 0-1.06l2-2a.751.751 0 0 1 1.042.018.751.751 0 0 1 .018 1.042Z" />`
};
var rankIcon = (rankIconType, rankLevel, percentile) => {
  switch (rankIconType) {
    case "github":
      return `
        <svg x="-38" y="-30" height="66" width="66" aria-hidden="true" viewBox="0 0 16 16" version="1.1" data-view-component="true" data-testid="github-rank-icon">
          <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
        </svg>
      `;
    case "percentile":
      return `
        <text x="-5" y="-12" alignment-baseline="central" dominant-baseline="central" text-anchor="middle" data-testid="percentile-top-header" class="rank-percentile-header">
          Top
        </text>
        <text x="-5" y="12" alignment-baseline="central" dominant-baseline="central" text-anchor="middle" data-testid="percentile-rank-value" class="rank-percentile-text">
          ${percentile.toFixed(1)}%
        </text>
      `;
    default:
      return `
        <text x="-5" y="3" alignment-baseline="central" dominant-baseline="central" text-anchor="middle" data-testid="level-rank-icon">
          ${rankLevel}
        </text>
      `;
  }
};

// stats/src/cards/gist.ts
var require3 = createRequire2(import.meta.url);
var languageColors = require3("../common/languageColors.json");
var ICON_SIZE = 16;
var CARD_DEFAULT_WIDTH = 400;
var HEADER_MAX_LENGTH = 35;
function renderGistCard(gistData, options = {}) {
  const { name, nameWithOwner, description, language, starsCount, forksCount } = gistData;
  const {
    title_color,
    icon_color,
    text_color,
    bg_color,
    theme,
    border_radius,
    border_color,
    show_owner = false,
    hide_border = false
  } = options;
  const { titleColor, textColor, iconColor, bgColor, borderColor } = getCardColors({
    title_color,
    icon_color,
    text_color,
    bg_color,
    border_color,
    theme
  });
  const lineWidth = 59;
  const linesLimit = 10;
  const desc = parseEmojis(description || "No description provided");
  const multiLineDescription = wrapTextMultiline(desc, lineWidth, linesLimit);
  const descriptionLines = multiLineDescription.length;
  const descriptionSvg = multiLineDescription.map((line) => `<tspan dy="1.2em" x="25">${encodeHTML(line)}</tspan>`).join("");
  const lineHeight = descriptionLines > 3 ? 12 : 10;
  const height = (descriptionLines > 1 ? 120 : 110) + descriptionLines * lineHeight;
  const totalStars = kFormatter(starsCount);
  const totalForks = kFormatter(forksCount);
  const svgStars = iconWithLabel(
    icons.star,
    totalStars,
    "starsCount",
    ICON_SIZE
  );
  const svgForks = iconWithLabel(
    icons.fork,
    totalForks,
    "forksCount",
    ICON_SIZE
  );
  const languageName = language || "Unspecified";
  const languageColor = languageColors[languageName] || "#858585";
  const svgLanguage = createLanguageNode(languageName, languageColor);
  const starAndForkCount = flexLayout({
    items: [svgLanguage, svgStars, svgForks],
    sizes: [
      measureText(languageName, 12),
      ICON_SIZE + measureText(`${totalStars}`, 12),
      ICON_SIZE + measureText(`${totalForks}`, 12)
    ],
    gap: 25
  }).join("");
  const header = show_owner ? nameWithOwner : name;
  const card = new Card({
    defaultTitle: header.length > HEADER_MAX_LENGTH ? `${header.slice(0, HEADER_MAX_LENGTH)}...` : header,
    titlePrefixIcon: icons.gist,
    width: CARD_DEFAULT_WIDTH,
    height,
    border_radius,
    colors: {
      titleColor,
      textColor,
      iconColor,
      bgColor,
      borderColor
    }
  });
  card.setCSS(`
		.description { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor} }
		.gray { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor} }
		.icon { fill: ${iconColor} }
	`);
  card.setHideBorder(hide_border);
  return card.render(`
		<text class="description" x="25" y="-5">
				${descriptionSvg}
		</text>

		<g transform="translate(30, ${height - 75})">
				${starAndForkCount}
		</g>
	`);
}

// stats/src/common/I18n.ts
var FALLBACK_LOCALE = "en";
var I18n = class {
  locale;
  translations;
  /**
   * Constructor.
   */
  constructor({ locale, translations }) {
    this.locale = locale || FALLBACK_LOCALE;
    this.translations = translations;
  }
  /**
   * Get translation.
   *
   * @param str String to translate.
   * @returns Translated string.
   */
  t(str) {
    if (!this.translations[str]) {
      throw new Error(`${str} Translation string not found`);
    }
    const translation = this.translations[str];
    if (!translation) {
      throw new Error(`${str} Translation string not found`);
    }
    if (!translation[this.locale]) {
      throw new Error(
        `'${str}' translation not found for locale '${this.locale}'`
      );
    }
    return translation[this.locale] || "";
  }
};

// stats/src/translations.ts
var statCardLocales = ({
  name,
  apostrophe
}) => {
  const encodedName = encodeHTML(name);
  return {
    "statcard.title": {
      en: `${encodedName}'${apostrophe} GitHub Stats`,
      ar: `${encodedName} \u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u062C\u064A\u062A \u0647\u0627\u0628`,
      az: `${encodedName}'${apostrophe} Hesab\u0131n\u0131n GitHub Statistikas\u0131`,
      ca: `Estad\xEDstiques de GitHub de ${encodedName}`,
      cn: `${encodedName} \u7684 GitHub \u7EDF\u8BA1\u6570\u636E`,
      "zh-tw": `${encodedName} \u7684 GitHub \u7D71\u8A08\u8CC7\u6599`,
      cs: `GitHub statistiky u\u017Eivatele ${encodedName}`,
      de: `${encodedName + apostrophe} GitHub-Statistiken`,
      sw: `GitHub Stats za ${encodedName}`,
      ur: `${encodedName} \u06A9\u06D2 \u06AF\u0679 \u06C1\u0628 \u06A9\u06D2 \u0627\u0639\u062F\u0627\u062F \u0648 \u0634\u0645\u0627\u0631`,
      bg: `GitHub \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u043D\u0430 \u043F\u043E\u0442\u0440\u0435\u0431\u0438\u0442\u0435\u043B ${encodedName}`,
      bn: `${encodedName} \u098F\u09B0 GitHub \u09AA\u09B0\u09BF\u09B8\u0982\u0996\u09CD\u09AF\u09BE\u09A8`,
      es: `Estad\xEDsticas de GitHub de ${encodedName}`,
      fa: `\u0622\u0645\u0627\u0631 \u06AF\u06CC\u062A\u200C\u0647\u0627\u0628 ${encodedName}`,
      fi: `${encodedName}:n GitHub-tilastot`,
      fr: `Statistiques GitHub de ${encodedName}`,
      hi: `${encodedName} \u0915\u0947 GitHub \u0906\u0901\u0915\u0921\u093C\u0947`,
      sa: `${encodedName} \u0907\u0924\u094D\u092F\u0938\u094D\u092F GitHub \u0938\u093E\u0902\u0916\u094D\u092F\u093F\u0915\u0940`,
      hu: `${encodedName} GitHub statisztika`,
      it: `Statistiche GitHub di ${encodedName}`,
      ja: `${encodedName}\u306E GitHub \u7D71\u8A08`,
      kr: `${encodedName}\uC758 GitHub \uD1B5\uACC4`,
      nl: `${encodedName}'${apostrophe} GitHub-statistieken`,
      "pt-pt": `Estat\xEDsticas do GitHub de ${encodedName}`,
      "pt-br": `Estat\xEDsticas do GitHub de ${encodedName}`,
      np: `${encodedName}'${apostrophe} \u0917\u093F\u091F\u0939\u092C \u0924\u0925\u094D\u092F\u093E\u0919\u094D\u0915`,
      el: `\u03A3\u03C4\u03B1\u03C4\u03B9\u03C3\u03C4\u03B9\u03BA\u03AC GitHub \u03C4\u03BF\u03C5 ${encodedName}`,
      ro: `Statisticile GitHub ale lui ${encodedName}`,
      ru: `\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 GitHub \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F ${encodedName}`,
      "uk-ua": `\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 GitHub \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0430 ${encodedName}`,
      id: `Statistik GitHub ${encodedName}`,
      ml: `${encodedName}'${apostrophe} \u0D17\u0D3F\u0D31\u0D4D\u0D31\u0D4D\u0D39\u0D2C\u0D4D \u0D38\u0D4D\u0D25\u0D3F\u0D24\u0D3F\u0D35\u0D3F\u0D35\u0D30\u0D15\u0D4D\u0D15\u0D23\u0D15\u0D4D\u0D15\u0D41\u0D15\u0D7E`,
      my: `Statistik GitHub ${encodedName}`,
      ta: `${encodedName} \u0B95\u0BBF\u0B9F\u0BCD\u0BB9\u0BAA\u0BCD \u0BAA\u0BC1\u0BB3\u0BCD\u0BB3\u0BBF\u0BB5\u0BBF\u0BB5\u0BB0\u0B99\u0BCD\u0B95\u0BB3\u0BCD`,
      sk: `GitHub \u0161tatistiky pou\u017E\xEDvate\u013Ea ${encodedName}`,
      tr: `${encodedName} Hesab\u0131n\u0131n GitHub \u0130statistikleri`,
      pl: `Statystyki GitHub u\u017Cytkownika ${encodedName}`,
      uz: `${encodedName}ning GitHub'dagi statistikasi`,
      vi: `Th\u1ED1ng K\xEA GitHub ${encodedName}`,
      se: `GitHubstatistik f\xF6r ${encodedName}`,
      he: `\u05E1\u05D8\u05D8\u05D9\u05E1\u05D8\u05D9\u05E7\u05D5\u05EA \u05D4\u05D2\u05D9\u05D8\u05D4\u05D0\u05D1 \u05E9\u05DC ${encodedName}`,
      fil: `Mga Stats ng GitHub ni ${encodedName}`,
      th: `\u0E2A\u0E16\u0E34\u0E15\u0E34 GitHub \u0E02\u0E2D\u0E07 ${encodedName}`,
      sr: `GitHub \u0441\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 \u043A\u043E\u0440\u0438\u0441\u043D\u0438\u043A\u0430 ${encodedName}`,
      "sr-latn": `GitHub statistika korisnika ${encodedName}`,
      no: `GitHub-statistikk for ${encodedName}`
    },
    "statcard.ranktitle": {
      en: `${encodedName}'${apostrophe} GitHub Rank`,
      ar: `${encodedName} \u0625\u062D\u0635\u0627\u0626\u064A\u0627\u062A \u062C\u064A\u062A \u0647\u0627\u0628`,
      az: `${encodedName}'${apostrophe} Hesab\u0131n\u0131n GitHub Statistikas\u0131`,
      ca: `Estad\xEDstiques de GitHub de ${encodedName}`,
      cn: `${encodedName} \u7684 GitHub \u7EDF\u8BA1\u6570\u636E`,
      "zh-tw": `${encodedName} \u7684 GitHub \u7D71\u8A08\u8CC7\u6599`,
      cs: `GitHub statistiky u\u017Eivatele ${encodedName}`,
      de: `${encodedName + apostrophe} GitHub-Statistiken`,
      sw: `GitHub Rank ya ${encodedName}`,
      ur: `${encodedName} \u06A9\u06CC \u06AF\u0679 \u06C1\u0628 \u0631\u06CC\u0646\u06A9`,
      bg: `GitHub \u0440\u0430\u043D\u0433 \u043D\u0430 ${encodedName}`,
      bn: `${encodedName} \u098F\u09B0 GitHub \u09AA\u09B0\u09BF\u09B8\u0982\u0996\u09CD\u09AF\u09BE\u09A8`,
      es: `Estad\xEDsticas de GitHub de ${encodedName}`,
      fa: `\u0631\u062A\u0628\u0647 \u06AF\u06CC\u062A\u200C\u0647\u0627\u0628 ${encodedName}`,
      fi: `${encodedName}:n GitHub-sijoitus`,
      fr: `Statistiques GitHub de ${encodedName}`,
      hi: `${encodedName} \u0915\u093E GitHub \u0938\u094D\u0925\u093E\u0928`,
      sa: `${encodedName} \u0907\u0924\u094D\u092F\u0938\u094D\u092F GitHub \u0938\u094D\u0925\u093E\u0928\u092E\u094D`,
      hu: `${encodedName} GitHub statisztika`,
      it: `Statistiche GitHub di ${encodedName}`,
      ja: `${encodedName} \u306E GitHub \u30E9\u30F3\u30AF`,
      kr: `${encodedName}\uC758 GitHub \uD1B5\uACC4`,
      nl: `${encodedName}'${apostrophe} GitHub-statistieken`,
      "pt-pt": `Estat\xEDsticas do GitHub de ${encodedName}`,
      "pt-br": `Estat\xEDsticas do GitHub de ${encodedName}`,
      np: `${encodedName}'${apostrophe} \u0917\u093F\u091F\u0939\u092C \u0924\u0925\u094D\u092F\u093E\u0919\u094D\u0915`,
      el: `\u03A3\u03C4\u03B1\u03C4\u03B9\u03C3\u03C4\u03B9\u03BA\u03AC GitHub \u03C4\u03BF\u03C5 ${encodedName}`,
      ro: `Rankul GitHub al lui ${encodedName}`,
      ru: `\u0420\u0435\u0439\u0442\u0438\u043D\u0433 GitHub \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F ${encodedName}`,
      "uk-ua": `\u0421\u0442\u0430\u0442\u0438\u0441\u0442\u0438\u043A\u0430 GitHub \u043A\u043E\u0440\u0438\u0441\u0442\u0443\u0432\u0430\u0447\u0430 ${encodedName}`,
      id: `Statistik GitHub ${encodedName}`,
      ml: `${encodedName}'${apostrophe} \u0D17\u0D3F\u0D31\u0D4D\u0D31\u0D4D\u0D39\u0D2C\u0D4D \u0D38\u0D4D\u0D25\u0D3F\u0D24\u0D3F\u0D35\u0D3F\u0D35\u0D30\u0D15\u0D4D\u0D15\u0D23\u0D15\u0D4D\u0D15\u0D41\u0D15\u0D7E`,
      my: `Statistik GitHub ${encodedName}`,
      ta: `${encodedName} \u0B95\u0BBF\u0B9F\u0BCD\u0BB9\u0BAA\u0BCD \u0BA4\u0BB0\u0BB5\u0BB0\u0BBF\u0B9A\u0BC8`,
      sk: `GitHub \u0161tatistiky pou\u017E\xEDvate\u013Ea ${encodedName}`,
      tr: `${encodedName} Hesab\u0131n\u0131n GitHub Y\u0131ld\u0131zlar\u0131`,
      pl: `Statystyki GitHub u\u017Cytkownika ${encodedName}`,
      uz: `${encodedName}ning GitHub'dagi statistikasi`,
      vi: `Th\u1ED1ng K\xEA GitHub ${encodedName}`,
      se: `GitHubstatistik f\xF6r ${encodedName}`,
      he: `\u05D3\u05E8\u05D2\u05EA \u05D4\u05D2\u05D9\u05D8\u05D4\u05D0\u05D1 \u05E9\u05DC ${encodedName}`,
      fil: `Ranggo ng GitHub ni ${encodedName}`,
      th: `\u0E2D\u0E31\u0E19\u0E14\u0E31\u0E1A GitHub \u0E02\u0E2D\u0E07 ${encodedName}`,
      sr: `\u0420\u0430\u043D\u043A \u043A\u043E\u0440\u0438\u0441\u043D\u0438\u043A\u0430 ${encodedName}`,
      "sr-latn": `Rank korisnika ${encodedName}`,
      no: `GitHub-statistikk for ${encodedName}`
    },
    "statcard.totalstars": {
      en: "Total Stars Earned",
      ar: "\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u0646\u062C\u0648\u0645",
      az: "\xDCmumi Ulduz",
      ca: "Total d'estrelles",
      cn: "\u83B7\u6807\u661F\u6570",
      "zh-tw": "\u5F97\u6A19\u661F\u661F\u6578\u91CF\uFF08Star\uFF09",
      cs: "Celkem hv\u011Bzd",
      de: "Insgesamt erhaltene Sterne",
      sw: "Medali(stars) ulizojishindia",
      ur: "\u06A9\u0644 \u0633\u062A\u0627\u0631\u06D2 \u062D\u0627\u0635\u0644 \u06A9\u06CC\u06D2",
      bg: "\u041F\u043E\u043B\u0443\u0447\u0435\u043D\u0438 \u0437\u0432\u0435\u0437\u0434\u0438",
      bn: "\u09B8\u09B0\u09CD\u09AC\u09AE\u09CB\u099F Star",
      es: "Estrellas totales",
      fa: "\u0645\u062C\u0645\u0648\u0639 \u0633\u062A\u0627\u0631\u0647\u200C\u0647\u0627\u06CC \u062F\u0631\u06CC\u0627\u0641\u062A\u200C\u0634\u062F\u0647",
      fi: "Ansaitut t\xE4hdet yhteens\xE4",
      fr: "Total d'\xE9toiles",
      hi: "\u0915\u0941\u0932 \u0905\u0930\u094D\u091C\u093F\u0924 \u0938\u093F\u0924\u093E\u0930\u0947",
      sa: "\u0905\u0930\u094D\u091C\u093F\u0924\u093E\u0903 \u0915\u0941\u0932-\u0924\u093E\u0930\u0915\u093E\u0903",
      hu: "Csillagok",
      it: "Stelle totali",
      ja: "\u30B9\u30BF\u30FC\u3055\u308C\u305F\u6570",
      kr: "\uBC1B\uC740 \uC2A4\uD0C0 \uC218",
      nl: "Totaal Sterren Ontvangen",
      "pt-pt": "Total de estrelas",
      "pt-br": "Total de estrelas",
      np: "\u0915\u0941\u0932 \u0924\u093E\u0930\u093E\u0939\u0930\u0942",
      el: "\u03A3\u03CD\u03BD\u03BF\u03BB\u03BF \u0391\u03C3\u03C4\u03B5\u03C1\u03B9\u03CE\u03BD",
      ro: "Total de stele c\xE2\u0219tigate",
      ru: "\u0412\u0441\u0435\u0433\u043E \u0437\u0432\u0451\u0437\u0434",
      "uk-ua": "\u0412\u0441\u044C\u043E\u0433\u043E \u0437\u0456\u0440\u043E\u043A",
      id: "Total Bintang",
      ml: "\u0D06\u0D15\u0D46 \u0D28\u0D15\u0D4D\u0D37\u0D24\u0D4D\u0D30\u0D19\u0D4D\u0D19\u0D7E",
      my: "Jumlah Bintang",
      ta: "\u0B9A\u0BAE\u0BCD\u0BAA\u0BBE\u0BA4\u0BBF\u0BA4\u0BCD\u0BA4 \u0BAE\u0BCA\u0BA4\u0BCD\u0BA4 \u0BA8\u0B9F\u0BCD\u0B9A\u0BA4\u0BCD\u0BA4\u0BBF\u0BB0\u0B99\u0BCD\u0B95\u0BB3\u0BCD",
      sk: "Hviezdy",
      tr: "Toplam Y\u0131ld\u0131z",
      pl: "Liczba otrzymanych gwiazdek",
      uz: "Yulduzchalar",
      vi: "T\u1ED5ng S\u1ED1 Sao",
      se: "Antal intj\xE4nade stj\xE4rnor",
      he: "\u05E1\u05DA \u05DB\u05DC \u05D4\u05DB\u05D5\u05DB\u05D1\u05D9\u05DD \u05E9\u05D4\u05D5\u05E9\u05D2\u05D5",
      fil: "Kabuuang Nakuhang Bituin",
      th: "\u0E14\u0E32\u0E27\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14\u0E17\u0E35\u0E48\u0E44\u0E14\u0E49\u0E23\u0E31\u0E1A",
      sr: "\u0411\u0440\u043E\u0458 \u043E\u0441\u0432\u043E\u0458\u0435\u043D\u0438\u0445 \u0437\u0432\u0435\u0437\u0434\u0438\u0446\u0430",
      "sr-latn": "Broj osvojenih zvezdica",
      no: "Totalt antall stjerner"
    },
    "statcard.commits": {
      en: "Total Commits",
      ar: "\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u0645\u0633\u0627\u0647\u0645\u0627\u062A",
      az: "\xDCmumi Commit",
      ca: "Commits totals",
      cn: "\u7D2F\u8BA1\u63D0\u4EA4\u603B\u6570",
      "zh-tw": "\u7D2F\u8A08\u63D0\u4EA4\u6578\u91CF\uFF08Commit\uFF09",
      cs: "Celkem commit\u016F",
      de: "Anzahl Commits",
      sw: "Matendo yako yote",
      ur: "\u06A9\u0644 \u06A9\u0645\u0679",
      bg: "\u041E\u0431\u0449\u043E \u0430\u043D\u0433\u0430\u0436\u0438\u043C\u0435\u043D\u0442\u0438",
      bn: "\u09B8\u09B0\u09CD\u09AC\u09AE\u09CB\u099F Commit",
      es: "Commits totales",
      fa: "\u0645\u062C\u0645\u0648\u0639 \u06A9\u0627\u0645\u06CC\u062A\u200C\u0647\u0627",
      fi: "Yhteens\xE4 committeja",
      fr: "Total des Commits",
      hi: "\u0915\u0941\u0932 commits",
      sa: "\u0915\u0941\u0932-\u0938\u092E\u093F\u0928\u094D\u091A\u092F\u0903",
      hu: "\xD6sszes commit",
      it: "Commit totali",
      ja: "\u5408\u8A08\u30B3\u30DF\u30C3\u30C8\u6570",
      kr: "\uC804\uCCB4 \uCEE4\uBC0B \uC218",
      nl: "Aantal commits",
      "pt-pt": "Total de Commits",
      "pt-br": "Total de Commits",
      np: "\u0915\u0941\u0932 Commits",
      el: "\u03A3\u03CD\u03BD\u03BF\u03BB\u03BF Commits",
      ro: "Total Commit-uri",
      ru: "\u0412\u0441\u0435\u0433\u043E \u043A\u043E\u043C\u043C\u0438\u0442\u043E\u0432",
      "uk-ua": "\u0412\u0441\u044C\u043E\u0433\u043E \u043A\u043E\u043C\u0456\u0442\u0456\u0432",
      id: "Total Komitmen",
      ml: "\u0D06\u0D15\u0D46 \u0D15\u0D2E\u0D4D\u0D2E\u0D3F\u0D31\u0D4D\u0D31\u0D41\u0D15\u0D7E",
      my: "Jumlah Komitmen",
      ta: `\u0BAE\u0BCA\u0BA4\u0BCD\u0BA4 \u0B95\u0BAE\u0BBF\u0B9F\u0BCD\u0B95\u0BB3\u0BCD`,
      sk: "V\u0161etky commity",
      tr: "Toplam Commit",
      pl: "Wszystkie commity",
      uz: "'Commit'lar",
      vi: "T\u1ED5ng S\u1ED1 Cam K\u1EBFt",
      se: "Totalt antal commits",
      he: "\u05E1\u05DA \u05DB\u05DC \u05D4\u05BEcommits",
      fil: "Kabuuang Commits",
      th: "Commit \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
      sr: "\u0423\u043A\u0443\u043F\u043D\u043E commit-\u043E\u0432\u0430",
      "sr-latn": "Ukupno commit-ova",
      no: "Totalt antall commits"
    },
    "statcard.prs": {
      en: "Total PRs",
      ar: "\u0645\u062C\u0645\u0648\u0639 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0633\u062D\u0628",
      az: "\xDCmumi PR",
      ca: "PRs totals",
      cn: "\u53D1\u8D77\u7684 PR \u603B\u6570",
      "zh-tw": "\u62C9\u53D6\u8ACB\u6C42\u6578\u91CF\uFF08PR\uFF09",
      cs: "Celkem PRs",
      de: "PRs Insgesamt",
      sw: "PRs Zote",
      ur: "\u06A9\u0644 \u067E\u06CC \u0622\u0631\u0632",
      bg: "\u0417\u0430\u044F\u0432\u043A\u0438 \u0437\u0430 \u0438\u0437\u0442\u0435\u0433\u043B\u044F\u043D\u0438\u044F",
      bn: "\u09B8\u09B0\u09CD\u09AC\u09AE\u09CB\u099F PR",
      es: "PRs totales",
      fa: "\u0645\u062C\u0645\u0648\u0639 Pull Request",
      fi: "Yhteens\xE4 PR:t",
      fr: "Total des PRs",
      hi: "\u0915\u0941\u0932 PR",
      sa: "\u0915\u0941\u0932-\u092A\u0940\u0906\u0930",
      hu: "\xD6sszes PR",
      it: "PR totali",
      ja: "\u5408\u8A08 PR",
      kr: "PR \uD69F\uC218",
      nl: "Aantal PR's",
      "pt-pt": "Total de PRs",
      "pt-br": "Total de PRs",
      np: "\u0915\u0941\u0932 PRs",
      el: "\u03A3\u03CD\u03BD\u03BF\u03BB\u03BF PRs",
      ro: "Total PR-uri",
      ru: "\u0412\u0441\u0435\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432 \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u0439",
      "uk-ua": "\u0412\u0441\u044C\u043E\u0433\u043E pull request`i\u0432",
      id: "Total Permintaan Tarik",
      ml: "\u0D06\u0D15\u0D46 \u0D2A\u0D41\u0D7E \u0D05\u0D2D\u0D4D\u0D2F\u0D7C\u0D24\u0D4D\u0D25\u0D28\u0D15\u0D7E",
      my: "Jumlah PR",
      ta: `\u0BAE\u0BCA\u0BA4\u0BCD\u0BA4 \u0B87\u0BB4\u0BC1\u0B95\u0BCD\u0B95\u0BC1\u0BAE\u0BCD \u0B95\u0BCB\u0BB0\u0BBF\u0B95\u0BCD\u0B95\u0BC8\u0B95\u0BB3\u0BCD`,
      sk: "V\u0161etky PR",
      tr: "Toplam PR",
      pl: "Wszystkie PR-y",
      uz: "'Pull Request'lar",
      vi: "T\u1ED5ng S\u1ED1 PR",
      se: "Totalt antal PR",
      he: "\u05E1\u05DA \u05DB\u05DC \u05D4\u05BEPRs",
      fil: "Kabuuang PRs",
      th: "PR \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
      sr: "\u0423\u043A\u0443\u043F\u043D\u043E PR-\u043E\u0432\u0430",
      "sr-latn": "Ukupno PR-ova",
      no: "Totalt antall PR"
    },
    "statcard.issues": {
      en: "Total Issues",
      ar: "\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u062A\u062D\u0633\u064A\u0646\u0627\u062A",
      az: "\xDCmumi Problem",
      ca: "Issues totals",
      cn: "\u63D0\u51FA\u7684 issue \u603B\u6570",
      "zh-tw": "\u63D0\u51FA\u554F\u984C\u6578\u91CF\uFF08Issue\uFF09",
      cs: "Celkem probl\xE9m\u016F",
      de: "Anzahl Issues",
      sw: "Masuala Ibuka",
      ur: "\u06A9\u0644 \u0645\u0633\u0627\u0626\u0644",
      bg: "\u0411\u0440\u043E\u0439 \u0432\u044A\u043F\u0440\u043E\u0441\u0438",
      bn: "\u09B8\u09B0\u09CD\u09AC\u09AE\u09CB\u099F Issue",
      es: "Issues totales",
      fa: "\u0645\u062C\u0645\u0648\u0639 \u0645\u0633\u0627\u0626\u0644",
      fi: "Yhteens\xE4 ongelmat",
      fr: "Nombre total d'incidents",
      hi: "\u0915\u0941\u0932 \u092E\u0941\u0926\u094D\u0926\u0947(Issues)",
      sa: "\u0915\u0941\u0932-\u0938\u092E\u0938\u094D\u092F\u093E\u0903",
      hu: "\xD6sszes hibajegy",
      it: "Segnalazioni totali",
      ja: "\u5408\u8A08 issue",
      kr: "\uC774\uC288 \uAC1C\uC218",
      nl: "Aantal kwesties",
      "pt-pt": "Total de Issues",
      "pt-br": "Total de Issues",
      np: "\u0915\u0941\u0932 \u092E\u0941\u0926\u094D\u0926\u093E\u0939\u0930\u0942",
      el: "\u03A3\u03CD\u03BD\u03BF\u03BB\u03BF \u0396\u03B7\u03C4\u03B7\u03BC\u03AC\u03C4\u03C9\u03BD",
      ro: "Total Issue-uri",
      ru: "\u0412\u0441\u0435\u0433\u043E \u0432\u043E\u043F\u0440\u043E\u0441\u043E\u0432",
      "uk-ua": "\u0412\u0441\u044C\u043E\u0433\u043E issue",
      id: "Total Masalah Dilaporkan",
      ml: "\u0D06\u0D15\u0D46 \u0D2A\u0D4D\u0D30\u0D36\u0D4D\u0D28\u0D19\u0D4D\u0D19\u0D7E",
      my: "Jumlah Isu Dilaporkan",
      ta: `\u0BAE\u0BCA\u0BA4\u0BCD\u0BA4 \u0B9A\u0BBF\u0B95\u0BCD\u0B95\u0BB2\u0BCD\u0B95\u0BB3\u0BCD`,
      sk: "V\u0161etky probl\xE9my",
      tr: "Toplam Hata",
      pl: "Wszystkie problemy",
      uz: "'Issue'lar",
      vi: "T\u1ED5ng S\u1ED1 V\u1EA5n \u0110\u1EC1",
      se: "Total antal issues",
      he: "\u05E1\u05DA \u05DB\u05DC \u05D4\u05BEissues",
      fil: "Kabuuang mga Isyu",
      th: "Issue \u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
      sr: "\u0423\u043A\u0443\u043F\u043D\u043E \u043F\u0440\u0438\u0458\u0430\u0432\u0459\u0435\u043D\u0438\u0445 \u043F\u0440\u043E\u0431\u043B\u0435\u043C\u0430",
      "sr-latn": "Ukupno prijavljenih problema",
      no: "Totalt antall issues"
    },
    "statcard.contribs": {
      en: "Contributed to (last year)",
      ar: "\u0633\u0627\u0647\u0645 \u0641\u064A (\u0627\u0644\u0639\u0627\u0645 \u0627\u0644\u0645\u0627\u0636\u064A)",
      az: "T\xF6hf\u0259 verdi (\xF6t\u0259n il)",
      ca: "Contribucions (l'any passat)",
      cn: "\u8D21\u732E\u7684\u9879\u76EE\u6570\uFF08\u53BB\u5E74\uFF09",
      "zh-tw": "\u53C3\u8207\u9805\u76EE\u6578\u91CF\uFF08\u53BB\u5E74\uFF09",
      cs: "P\u0159isp\u011Bl k (minul\xFD rok)",
      de: "Beigetragen zu (letztes Jahr)",
      sw: "Idadi ya michango (mwaka mzima)",
      ur: "\u067E\u0686\u06BE\u0644\u06D2 \u0633\u0627\u0644 \u0645\u06CC\u06BA \u062A\u0639\u0627\u0648\u0646 \u06A9\u06CC\u0627",
      bg: "\u041F\u0440\u0438\u043D\u043E\u0441\u0438 (\u0437\u0430 \u0438\u0437\u043C\u0438\u043D\u0430\u043B\u0430\u0442\u0430 \u0433\u043E\u0434\u0438\u043D\u0430)",
      bn: "\u0985\u09AC\u09A6\u09BE\u09A8 (\u0997\u09A4 \u09AC\u099B\u09B0)",
      es: "Contribuciones en (el a\xF1o pasado)",
      fa: "\u0645\u0634\u0627\u0631\u06A9\u062A \u062F\u0631 (\u0633\u0627\u0644 \u06AF\u0630\u0634\u062A\u0647)",
      fi: "Osallistunut (viime vuonna)",
      fr: "Contribu\xE9 \xE0 (l'ann\xE9e derni\xE8re)",
      hi: "(\u092A\u093F\u091B\u0932\u0947 \u0935\u0930\u094D\u0937) \u092E\u0947\u0902 \u092F\u094B\u0917\u0926\u093E\u0928 \u0926\u093F\u092F\u093E",
      sa: "(\u0917\u0924\u0947 \u0935\u0930\u094D\u0937\u0947) \u092F\u094B\u0917\u0926\u093E\u0928\u092E\u094D \u0915\u0943\u0924\u092E\u094D",
      hu: "Hozz\xE1j\xE1rul\xE1sok (tavaly)",
      it: "Ha contribuito a (l'anno scorso)",
      ja: "\u8CA2\u732E\u3057\u305F\u30EA\u30DD\u30B8\u30C8\u30EA \uFF08\u6628\u5E74\uFF09",
      kr: "(\uC791\uB144) \uAE30\uC5EC",
      nl: "Bijgedragen aan (vorig jaar)",
      "pt-pt": "Contribuiu em (ano passado)",
      "pt-br": "Contribuiu para (ano passado)",
      np: "\u0915\u0941\u0932 \u092F\u094B\u0917\u0926\u093E\u0928\u0939\u0930\u0942 (\u0917\u0924 \u0935\u0930\u094D\u0937)",
      el: "\u03A3\u03C5\u03BD\u03B5\u03B9\u03C3\u03C6\u03AD\u03C1\u03B8\u03B7\u03BA\u03B5 \u03C3\u03B5 (\u03C0\u03AD\u03C1\u03C5\u03C3\u03B9)",
      ro: "Total Contribuiri",
      ru: "\u0412\u043D\u0435\u0441\u0435\u043D\u043E \u0432\u043A\u043B\u0430\u0434\u0430 (\u0437\u0430 \u043F\u0440\u043E\u0448\u043B\u044B\u0439 \u0433\u043E\u0434)",
      "uk-ua": "\u0417\u0440\u043E\u0431\u0438\u0432 \u0432\u043D\u0435\u0441\u043E\u043A \u0443 (\u0437\u0430 \u043C\u0438\u043D\u0443\u043B\u0438\u0439 \u0440\u0456\u043A)",
      id: "Berkontribusi ke (tahun lalu)",
      ml: "(\u0D15\u0D34\u0D3F\u0D1E\u0D4D\u0D1E \u0D35\u0D7C\u0D37\u0D24\u0D4D\u0D24\u0D46)\u0D06\u0D15\u0D46 \u0D38\u0D02\u0D2D\u0D3E\u0D35\u0D28\u0D15\u0D7E ",
      my: "Menyumbang kepada (tahun lepas)",
      ta: "(\u0B95\u0B9F\u0BA8\u0BCD\u0BA4 \u0B86\u0BA3\u0BCD\u0B9F\u0BC1) \u0BAA\u0B99\u0BCD\u0B95\u0BB3\u0BBF\u0BA4\u0BCD\u0BA4\u0BA4\u0BC1",
      sk: "\xDA\u010Dasti (minul\xFD rok)",
      tr: "Katk\u0131 Verildi (ge\xE7en y\u0131l)",
      pl: "Kontrybucje (w zesz\u0142ym roku)",
      uz: "Hissa qo\u02BBshgan (o'tgan yili)",
      vi: "\u0110\xE3 \u0110\xF3ng G\xF3p (n\u0103m ngo\xE1i)",
      se: "Bidragit till (f\xF6rra \xE5ret)",
      he: "\u05EA\u05E8\u05DD \u05DC... (\u05E9\u05E0\u05D4 \u05E9\u05E2\u05D1\u05E8\u05D4)",
      fil: "Nag-ambag sa (nakaraang taon)",
      th: "\u0E21\u0E35\u0E2A\u0E48\u0E27\u0E19\u0E23\u0E48\u0E27\u0E21\u0E43\u0E19 (\u0E1B\u0E35\u0E17\u0E35\u0E48\u0E41\u0E25\u0E49\u0E27)",
      sr: "\u0414\u043E\u043F\u0440\u0438\u043D\u043E\u0441\u0438 (\u043F\u0440\u043E\u0448\u043B\u0430 \u0433\u043E\u0434\u0438\u043D\u0430)",
      "sr-latn": "Doprinosi (pro\u0161la godina)",
      no: "Bidro til (i fjor)"
    },
    "statcard.reviews": {
      en: "Total PRs Reviewed",
      ar: "\u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0633\u062D\u0628 \u0627\u0644\u062A\u064A \u062A\u0645 \u0645\u0631\u0627\u062C\u0639\u062A\u0647\u0627",
      az: "N\u0259z\u0259rd\u0259n Ke\xE7iril\u0259n \xDCmumi PR",
      ca: "Total de PRs revisats",
      cn: "\u5BA1\u67E5\u7684 PR \u603B\u6570",
      "zh-tw": "\u5BE9\u6838\u7684 PR \u7E3D\u8A08",
      cs: "Celkov\xFD po\u010Det PR",
      de: "Insgesamt \xFCberpr\xFCfte PRs",
      sw: "Idadi ya PRs zilizopitiliwa upya",
      ur: "\u06A9\u0644 \u067E\u06CC \u0622\u0631\u0632 \u06A9\u0627 \u062C\u0627\u0626\u0632\u06C1 \u0644\u06CC\u0627",
      bg: "\u0420\u0430\u0437\u0433\u043B\u0435\u0434\u0430\u043D\u0438 \u0437\u0430\u044F\u0432\u043A\u0438 \u0437\u0430 \u0438\u0437\u0442\u0435\u0433\u043B\u044F\u043D\u0435",
      bn: "\u09B8\u09B0\u09CD\u09AC\u09AE\u09CB\u099F \u09AA\u09C1\u09A8\u09B0\u09BE\u09B2\u09CB\u099A\u09A8\u09BE \u0995\u09B0\u09BE PR",
      es: "PR totales revisados",
      fa: "\u0645\u062C\u0645\u0648\u0639 \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u200C\u0647\u0627\u06CC \u0627\u062F\u063A\u0627\u0645 \u0628\u0631\u0631\u0633\u06CC\u200C\u0634\u062F\u0647",
      fi: "Yhteens\xE4 tarkastettuja PR:it\xE4",
      fr: "Nombre total de PR examin\xE9s",
      hi: "\u0915\u0941\u0932 PRs \u0915\u0940 \u0938\u092E\u0940\u0915\u094D\u0937\u093E \u0915\u0940 \u0917\u0908",
      sa: "\u0938\u092E\u0940\u0915\u094D\u0937\u093F\u0924\u093E\u0903 \u0915\u0941\u0932-\u092A\u0940\u0906\u0930",
      hu: "\xD6sszes ellen\u0151rz\xF6tt PR",
      it: "PR totali esaminati",
      ja: "\u30EC\u30D3\u30E5\u30FC\u3055\u308C\u305F PR \u306E\u7DCF\u6570",
      kr: "\uAC80\uD1A0\uB41C \uCD1D PR",
      nl: "Totaal beoordeelde PR's",
      "pt-pt": "Total de PRs revistos",
      "pt-br": "Total de PRs revisados",
      np: "\u0915\u0941\u0932 \u092A\u0940\u0906\u0930 \u0938\u092E\u0940\u0915\u094D\u0937\u093F\u0924",
      el: "\u03A3\u03CD\u03BD\u03BF\u03BB\u03BF \u0391\u03BD\u03B1\u03B8\u03B5\u03C9\u03C1\u03B7\u03BC\u03AD\u03BD\u03C9\u03BD PR",
      ro: "Total PR-uri Revizuite",
      ru: "\u0412\u0441\u0435\u0433\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432 \u043F\u0440\u043E\u0432\u0435\u0440\u0435\u043D\u043E",
      "uk-ua": "\u0412\u0441\u044C\u043E\u0433\u043E pull request`i\u0432 \u043F\u0435\u0440\u0435\u0432\u0456\u0440\u0435\u043D\u043E",
      id: "Total PR yang Direview",
      ml: "\u0D06\u0D15\u0D46 \u0D2A\u0D41\u0D7E \u0D05\u0D35\u0D32\u0D4B\u0D15\u0D28\u0D19\u0D4D\u0D19\u0D7E",
      my: "Jumlah PR Dikaji Semula",
      ta: "\u0BAE\u0BA4\u0BBF\u0BAA\u0BCD\u0BAA\u0BBE\u0BAF\u0BCD\u0BB5\u0BC1 \u0B9A\u0BC6\u0BAF\u0BCD\u0BAF\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F \u0BAE\u0BCA\u0BA4\u0BCD\u0BA4 \u0B87\u0BB4\u0BC1\u0BA4\u0BCD\u0BA4\u0BB2\u0BCD \u0B95\u0BCB\u0BB0\u0BBF\u0B95\u0BCD\u0B95\u0BC8\u0B95\u0BB3\u0BCD",
      sk: "Celkov\xFD po\u010Det PR",
      tr: "\u0130ncelenen toplam PR",
      pl: "\u0141\u0105cznie sprawdzonych PR",
      uz: "Ko\u02BBrib chiqilgan PR-lar soni",
      vi: "T\u1ED5ng S\u1ED1 PR \u0110\xE3 Xem X\xE9t",
      se: "Totalt antal granskade PR",
      he: "\u05E1\u05DA \u05DB\u05DC \u05D4\u05BEPRs \u05E9\u05E0\u05E1\u05E8\u05E7\u05D5",
      fil: "Kabuuang PR na Na-review",
      th: "\u0E23\u0E35\u0E27\u0E34\u0E27 PR \u0E41\u0E25\u0E49\u0E27\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
      sr: "\u0423\u043A\u0443\u043F\u043D\u043E \u043F\u0440\u0435\u0433\u043B\u0435\u0434\u0430\u043D\u0438\u0445 PR-\u043E\u0432\u0430",
      "sr-latn": "Ukupno pregledanih PR-ova",
      no: "Totalt antall vurderte PR"
    },
    "statcard.discussions-started": {
      en: "Total Discussions Started",
      ar: "\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u0645\u0646\u0627\u0642\u0634\u0627\u062A \u0627\u0644\u062A\u064A \u0628\u062F\u0623\u0647\u0627",
      az: "Ba\u015Flad\u0131lan \xDCmumi M\xFCzakir\u0259",
      ca: "Discussions totals iniciades",
      cn: "\u53D1\u8D77\u7684\u8BA8\u8BBA\u603B\u6570",
      "zh-tw": "\u767C\u8D77\u7684\u8A0E\u8AD6\u7E3D\u6578",
      cs: "Celkem zah\xE1jen\xFDch diskus\xED",
      de: "Gesamt gestartete Diskussionen",
      sw: "Idadi ya majadiliano yaliyoanzishwa",
      ur: "\u06A9\u0644 \u0645\u0628\u0627\u062D\u062B\u06D2 \u0634\u0631\u0648\u0639 \u06A9\u06CC\u06D2",
      bg: "\u0417\u0430\u043F\u043E\u0447\u043D\u0430\u0442\u0438 \u0434\u0438\u0441\u043A\u0443\u0441\u0438\u0438",
      bn: "\u09B8\u09B0\u09CD\u09AC\u09AE\u09CB\u099F \u0986\u09B2\u09CB\u099A\u09A8\u09BE \u09B6\u09C1\u09B0\u09C1",
      es: "Discusiones totales iniciadas",
      fa: "\u0645\u062C\u0645\u0648\u0639 \u0628\u062D\u062B\u200C\u0647\u0627\u06CC \u0622\u063A\u0627\u0632\u0634\u062F\u0647",
      fi: "Aloitetut keskustelut yhteens\xE4",
      fr: "Nombre total de discussions lanc\xE9es",
      hi: "\u0915\u0941\u0932 \u091A\u0930\u094D\u091A\u093E\u090F\u0901 \u0936\u0941\u0930\u0942 \u0939\u0941\u0908\u0902",
      sa: "\u092A\u094D\u0930\u093E\u0930\u092C\u094D\u0927\u093E\u0903 \u0915\u0941\u0932-\u091A\u0930\u094D\u091A\u093E\u0903",
      hu: "\xD6sszes megkezdett megbesz\xE9l\xE9s",
      it: "Discussioni totali avviate",
      ja: "\u958B\u59CB\u3055\u308C\u305F\u30C7\u30A3\u30B9\u30AB\u30C3\u30B7\u30E7\u30F3\u306E\u7DCF\u6570",
      kr: "\uC2DC\uC791\uB41C \uD1A0\uB860 \uCD1D \uC218",
      nl: "Totaal gestarte discussies",
      "pt-pt": "Total de Discuss\xF5es Iniciadas",
      "pt-br": "Total de Discuss\xF5es Iniciadas",
      np: "\u0915\u0941\u0932 \u091A\u0930\u094D\u091A\u093E \u0938\u0941\u0930\u0941",
      el: "\u03A3\u03CD\u03BD\u03BF\u03BB\u03BF \u03A3\u03C5\u03B6\u03B7\u03C4\u03AE\u03C3\u03B5\u03C9\u03BD \u03C0\u03BF\u03C5 \u039E\u03B5\u03BA\u03AF\u03BD\u03B7\u03C3\u03B1\u03BD",
      ro: "Total Discu\u021Bii \xCEncepute",
      ru: "\u0412\u0441\u0435\u0433\u043E \u043D\u0430\u0447\u0430\u0442\u044B\u0445 \u043E\u0431\u0441\u0443\u0436\u0434\u0435\u043D\u0438\u0439",
      "uk-ua": "\u0412\u0441\u044C\u043E\u0433\u043E \u0440\u043E\u0437\u043F\u043E\u0447\u0430\u0442\u0438\u0445 \u0434\u0438\u0441\u043A\u0443\u0441\u0456\u0439",
      id: "Total Diskusi Dimulai",
      ml: "\u0D06\u0D30\u0D02\u0D2D\u0D3F\u0D1A\u0D4D\u0D1A \u0D06\u0D32\u0D4B\u0D1A\u0D28\u0D15\u0D7E",
      my: "Jumlah Perbincangan Bermula",
      ta: "\u0BAE\u0BCA\u0BA4\u0BCD\u0BA4 \u0BB5\u0BBF\u0BB5\u0BBE\u0BA4\u0B99\u0BCD\u0B95\u0BB3\u0BCD \u0BA4\u0BCA\u0B9F\u0B99\u0BCD\u0B95\u0BBF\u0BA9",
      sk: "Celkov\xFD po\u010Det za\u010Dat\xFDch diskusi\xED",
      tr: "Ba\u015Flat\u0131lan Toplam Tart\u0131\u015Fma",
      pl: "\u0141\u0105cznie rozpocz\u0119tych dyskusji",
      uz: "Boshlangan muzokaralar soni",
      vi: "T\u1ED5ng S\u1ED1 Th\u1EA3o Lu\u1EADn B\u1EAFt \u0110\u1EA7u",
      se: "Totalt antal diskussioner startade",
      he: "\u05E1\u05DA \u05DB\u05DC \u05D4\u05D3\u05D9\u05D5\u05E0\u05D9\u05DD \u05E9\u05D4\u05D5\u05EA\u05D7\u05DC\u05D5",
      fil: "Kabuuang mga Diskusyon na Sinimulan",
      th: "\u0E40\u0E23\u0E34\u0E48\u0E21\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E2A\u0E19\u0E17\u0E19\u0E32\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
      sr: "\u0423\u043A\u0443\u043F\u043D\u043E \u043F\u043E\u043A\u0440\u0435\u043D\u0443\u0442\u0438\u0445 \u0434\u0438\u0441\u043A\u0443\u0441\u0438\u0458\u0430",
      "sr-latn": "Ukupno pokrenutih diskusija",
      no: "Totalt antall startede diskusjoner"
    },
    "statcard.discussions-answered": {
      en: "Total Discussions Answered",
      ar: "\u0645\u062C\u0645\u0648\u0639 \u0627\u0644\u0645\u0646\u0627\u0642\u0634\u0627\u062A \u0627\u0644\u0645\u064F\u062C\u0627\u0628\u0629",
      az: "Cavabland\u0131r\u0131lan \xDCmumi M\xFCzakir\u0259",
      ca: "Discussions totals respostes",
      cn: "\u56DE\u590D\u7684\u8BA8\u8BBA\u603B\u6570",
      "zh-tw": "\u56DE\u8986\u8A0E\u8AD6\u7E3D\u8A08",
      cs: "Celkem zodpov\u011Bzen\xFDch diskus\xED",
      de: "Gesamt beantwortete Diskussionen",
      sw: "Idadi ya majadiliano yaliyojibiwa",
      ur: "\u06A9\u0644 \u0645\u0628\u0627\u062D\u062B\u06D2 \u062C\u0648\u0627\u0628 \u062F\u06CC\u06D2",
      bg: "\u041E\u0442\u0433\u043E\u0432\u043E\u0440\u0435\u043D\u0438 \u0434\u0438\u0441\u043A\u0443\u0441\u0438\u0438",
      bn: "\u09B8\u09B0\u09CD\u09AC\u09AE\u09CB\u099F \u0986\u09B2\u09CB\u099A\u09A8\u09BE \u0989\u09A4\u09CD\u09A4\u09B0",
      es: "Discusiones totales respondidas",
      fa: "\u0645\u062C\u0645\u0648\u0639 \u0628\u062D\u062B\u200C\u0647\u0627\u06CC \u067E\u0627\u0633\u062E\u200C\u062F\u0627\u062F\u0647\u200C\u0634\u062F\u0647",
      fi: "Vastatut keskustelut yhteens\xE4",
      fr: "Nombre total de discussions r\xE9pondues",
      hi: "\u0915\u0941\u0932 \u091A\u0930\u094D\u091A\u093E\u0913\u0902 \u0915\u0947 \u0909\u0924\u094D\u0924\u0930",
      sa: "\u0909\u0924\u094D\u0924\u0930\u093F\u0924\u093E\u0903 \u0915\u0941\u0932-\u091A\u0930\u094D\u091A\u093E\u0903",
      hu: "\xD6sszes megv\xE1laszolt megbesz\xE9l\xE9s",
      it: "Discussioni totali risposte",
      ja: "\u56DE\u7B54\u3055\u308C\u305F\u30C7\u30A3\u30B9\u30AB\u30C3\u30B7\u30E7\u30F3\u306E\u7DCF\u6570",
      kr: "\uB2F5\uBCC0\uB41C \uD1A0\uB860 \uCD1D \uC218",
      nl: "Totaal beantwoorde discussies",
      "pt-pt": "Total de Discuss\xF5es Respondidas",
      "pt-br": "Total de Discuss\xF5es Respondidas",
      np: "\u0915\u0941\u0932 \u091A\u0930\u094D\u091A\u093E \u0909\u0924\u094D\u0924\u0930",
      el: "\u03A3\u03CD\u03BD\u03BF\u03BB\u03BF \u03A3\u03C5\u03B6\u03B7\u03C4\u03AE\u03C3\u03B5\u03C9\u03BD \u03C0\u03BF\u03C5 \u0391\u03C0\u03B1\u03BD\u03C4\u03AE\u03B8\u03B7\u03BA\u03B1\u03BD",
      ro: "Total R\u0103spunsuri La Discu\u021Bii",
      ru: "\u0412\u0441\u0435\u0433\u043E \u043E\u0442\u0432\u0435\u0447\u0435\u043D\u043D\u044B\u0445 \u043E\u0431\u0441\u0443\u0436\u0434\u0435\u043D\u0438\u0439",
      "uk-ua": "\u0412\u0441\u044C\u043E\u0433\u043E \u0432\u0456\u0434\u043F\u043E\u0432\u0456\u0434\u0435\u0439 \u043D\u0430 \u0434\u0438\u0441\u043A\u0443\u0441\u0456\u0457",
      id: "Total Diskusi Dibalas",
      ml: "\u0D09\u0D24\u0D4D\u0D24\u0D30\u0D02 \u0D28\u0D7D\u0D15\u0D3F\u0D2F \u0D06\u0D32\u0D4B\u0D1A\u0D28\u0D15\u0D7E",
      my: "Jumlah Perbincangan Dijawab",
      ta: "\u0BAA\u0BA4\u0BBF\u0BB2\u0BB3\u0BBF\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F \u0BAE\u0BCA\u0BA4\u0BCD\u0BA4 \u0BB5\u0BBF\u0BB5\u0BBE\u0BA4\u0B99\u0BCD\u0B95\u0BB3\u0BCD",
      sk: "Celkov\xFD po\u010Det zodpovedan\xFDch diskusi\xED",
      tr: "Toplam Cevaplanan Tart\u0131\u015Fma",
      pl: "\u0141\u0105cznie odpowiedzianych dyskusji",
      uz: "Javob berilgan muzokaralar soni",
      vi: "T\u1ED5ng S\u1ED1 Th\u1EA3o Lu\u1EADn \u0110\xE3 Tr\u1EA3 L\u1EDDi",
      se: "Totalt antal diskussioner besvarade",
      he: "\u05E1\u05DA \u05DB\u05DC \u05D4\u05D3\u05D9\u05D5\u05E0\u05D9\u05DD \u05E9\u05E0\u05E2\u05E0\u05D5",
      fil: "Kabuuang mga Diskusyon na Sinagot",
      th: "\u0E15\u0E2D\u0E1A\u0E01\u0E25\u0E31\u0E1A\u0E2B\u0E31\u0E27\u0E02\u0E49\u0E2D\u0E2A\u0E19\u0E17\u0E19\u0E32\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
      sr: "\u0423\u043A\u0443\u043F\u043D\u043E \u043E\u0434\u0433\u043E\u0432\u043E\u0440\u0435\u043D\u0438\u0445 \u0434\u0438\u0441\u043A\u0443\u0441\u0438\u0458\u0430",
      "sr-latn": "Ukupno odgovorenih diskusija",
      no: "Totalt antall besvarte diskusjoner"
    },
    "statcard.prs-merged": {
      en: "Total PRs Merged",
      ar: "\u0645\u062C\u0645\u0648\u0639 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0633\u062D\u0628 \u0627\u0644\u0645\u064F\u062F\u0645\u062C\u0629",
      az: "Birl\u0259\u015Fdirilmi\u015F \xDCmumi PR",
      ca: "PRs totals fusionats",
      cn: "\u5408\u5E76\u7684 PR \u603B\u6570",
      "zh-tw": "\u5408\u4F75\u7684 PR \u7E3D\u8A08",
      cs: "Celkem slou\u010Den\xFDch PR",
      de: "Insgesamt zusammengef\xFChrte PRs",
      sw: "Idadi ya PRs zilizounganishwa",
      ur: "\u06A9\u0644 \u067E\u06CC \u0622\u0631\u0632 \u0636\u0645 \u06A9\u06CC\u06D2",
      bg: "\u0421\u043B\u044F\u0442\u0438 \u0437\u0430\u044F\u0432\u043A\u0438 \u0437\u0430 \u0438\u0437\u0442\u0435\u0433\u043B\u044F\u043D\u0438\u044F",
      bn: "\u09B8\u09B0\u09CD\u09AC\u09AE\u09CB\u099F PR \u098F\u0995\u09A4\u09CD\u09B0\u09C0\u0995\u09C3\u09A4",
      es: "PR totales fusionados",
      fa: "\u0645\u062C\u0645\u0648\u0639 \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u200C\u0647\u0627\u06CC \u0627\u062F\u063A\u0627\u0645 \u0634\u062F\u0647",
      fi: "Yhteens\xE4 yhdistetyt PR:t",
      fr: "Nombre total de PR fusionn\xE9s",
      hi: "\u0915\u0941\u0932 PR \u0915\u093E \u0935\u093F\u0932\u092F",
      sa: "\u0935\u093F\u0932\u0940\u0928\u093E\u0903 \u0915\u0941\u0932-\u092A\u0940\u0906\u0930",
      hu: "\xD6sszes egyes\xEDtett PR",
      it: "PR totali uniti",
      ja: "\u30DE\u30FC\u30B8\u3055\u308C\u305F PR \u306E\u7DCF\u6570",
      kr: "\uBCD1\uD569\uB41C \uCD1D PR",
      nl: "Totaal samengevoegde PR's",
      "pt-pt": "Total de PRs Fundidos",
      "pt-br": "Total de PRs Integrados",
      np: "\u0915\u0941\u0932 \u0935\u093F\u0932\u092F\u093F\u0924 PRs",
      el: "\u03A3\u03CD\u03BD\u03BF\u03BB\u03BF \u03A3\u03C5\u03B3\u03C7\u03C9\u03BD\u03B5\u03C5\u03BC\u03AD\u03BD\u03C9\u03BD PR",
      ro: "Total PR-uri Fuzionate",
      ru: "\u0412\u0441\u0435\u0433\u043E \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u0451\u043D\u043D\u044B\u0445 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432",
      "uk-ua": "\u0412\u0441\u044C\u043E\u0433\u043E \u043E\u0431'\u0454\u0434\u043D\u0430\u043D\u0438\u0445 pull request`i\u0432",
      id: "Total PR Digabungkan",
      my: "Jumlah PR Digabungkan",
      ta: "\u0B87\u0BA3\u0BC8\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F \u0BAE\u0BCA\u0BA4\u0BCD\u0BA4 PR\u0B95\u0BB3\u0BCD",
      sk: "Celkov\xFD po\u010Det zl\xFA\u010Den\xFDch PR",
      tr: "Toplam Birle\u015Ftirilmi\u015F PR",
      pl: "\u0141\u0105cznie po\u0142\u0105czonych PR",
      uz: "Birlangan PR-lar soni",
      vi: "T\u1ED5ng S\u1ED1 PR \u0110\xE3 H\u1EE3p Nh\u1EA5t",
      se: "Totalt antal sammanfogade PR",
      he: "\u05E1\u05DA \u05DB\u05DC \u05D4\u05BEPRs \u05E9\u05E9\u05D5\u05DC\u05D1\u05D5",
      fil: "Kabuuang mga PR na Pinagsama",
      th: "PR \u0E17\u0E35\u0E48\u0E16\u0E39\u0E01 Merged \u0E41\u0E25\u0E49\u0E27\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
      sr: "\u0423\u043A\u0443\u043F\u043D\u043E \u0441\u043F\u043E\u0458\u0435\u043D\u0438\u0445 PR-\u043E\u0432\u0430",
      "sr-latn": "Ukupno spojenih PR-ova",
      no: "Totalt antall sammensl\xE5tte PR"
    },
    "statcard.prs-merged-percentage": {
      en: "Merged PRs Percentage",
      ar: "\u0646\u0633\u0628\u0629 \u0637\u0644\u0628\u0627\u062A \u0627\u0644\u0633\u062D\u0628 \u0627\u0644\u0645\u064F\u062F\u0645\u062C\u0629",
      az: "Birl\u0259\u015Fdirilmi\u015F PR-lar\u0131n Faizi",
      ca: "Percentatge de PRs fusionats",
      cn: "\u88AB\u5408\u5E76\u7684 PR \u5360\u6BD4",
      "zh-tw": "\u5408\u4F75\u7684 PR \u767E\u5206\u6BD4",
      cs: "Slou\u010Den\xE9 PRs v procentech",
      de: "Zusammengef\xFChrte PRs in Prozent",
      sw: "Asilimia ya PRs zilizounganishwa",
      ur: "\u0636\u0645 \u06A9\u06CC\u06D2 \u06AF\u0626\u06D2 \u067E\u06CC \u0622\u0631\u0632 \u06A9\u06CC \u0634\u0631\u062D",
      bg: "\u041F\u0440\u043E\u0446\u0435\u043D\u0442 \u0441\u043B\u044F\u0442\u0438 \u0437\u0430\u044F\u0432\u043A\u0438 \u0437\u0430 \u0438\u0437\u0442\u0435\u0433\u043B\u044F\u043D\u0438\u044F",
      bn: "PR \u098F\u0995\u09A4\u09CD\u09B0\u09C0\u0995\u09B0\u09A3\u09C7\u09B0 \u09B6\u09A4\u09BE\u0982\u09B6",
      es: "Porcentaje de PR fusionados",
      fa: "\u062F\u0631\u0635\u062F \u062F\u0631\u062E\u0648\u0627\u0633\u062A\u200C\u0647\u0627\u06CC \u0627\u062F\u063A\u0627\u0645\u200C\u0634\u062F\u0647",
      fi: "Yhdistettyjen PR:ien prosentti",
      fr: "Pourcentage de PR fusionn\xE9s",
      hi: "\u092E\u0930\u094D\u091C \u0915\u093F\u090F \u0917\u090F PRs \u092A\u094D\u0930\u0924\u093F\u0936\u0924",
      sa: "\u0935\u093F\u0932\u0940\u0928-\u092A\u0940\u0906\u0930 \u092A\u094D\u0930\u0924\u093F\u0936\u0924\u092E\u094D",
      hu: "Egyes\xEDtett PR-k sz\xE1zal\xE9ka",
      it: "Percentuale di PR uniti",
      ja: "\u30DE\u30FC\u30B8\u3055\u308C\u305F PR \u306E\u5272\u5408",
      kr: "\uBCD1\uD569\uB41C PR\uC758 \uBE44\uC728",
      nl: "Percentage samengevoegde PR's",
      "pt-pt": "Percentagem de PRs Fundidos",
      "pt-br": "Porcentagem de PRs Integrados",
      np: "PR \u092E\u0930\u094D\u091C \u0917\u0930\u093F\u090F\u0915\u094B \u092A\u094D\u0930\u0924\u093F\u0936\u0924",
      el: "\u03A0\u03BF\u03C3\u03BF\u03C3\u03C4\u03CC \u03A3\u03C5\u03B3\u03C7\u03C9\u03BD\u03B5\u03C5\u03BC\u03AD\u03BD\u03C9\u03BD PR",
      ro: "Procentaj PR-uri Fuzionate",
      ru: "\u041F\u0440\u043E\u0446\u0435\u043D\u0442 \u043E\u0431\u044A\u0435\u0434\u0438\u043D\u0451\u043D\u043D\u044B\u0445 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432",
      "uk-ua": "\u0412\u0456\u0434\u0441\u043E\u0442\u043E\u043A \u043E\u0431'\u0454\u0434\u043D\u0430\u043D\u0438\u0445 pull request`i\u0432",
      id: "Persentase PR Digabungkan",
      my: "Peratus PR Digabungkan",
      ta: "\u0B87\u0BA3\u0BC8\u0B95\u0BCD\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F PR\u0B95\u0BB3\u0BCD \u0B9A\u0BA4\u0BB5\u0BC0\u0BA4\u0BAE\u0BCD",
      sk: "Percento zl\xFA\u010Den\xFDch PR",
      tr: "Birle\u015Ftirilmi\u015F PR Y\xFCzdesi",
      pl: "Procent po\u0142\u0105czonych PR",
      uz: "Birlangan PR-lar foizi",
      vi: "T\u1EF7 L\u1EC7 PR \u0110\xE3 H\u1EE3p Nh\u1EA5t",
      se: "Procent av sammanfogade PR",
      he: "\u05D0\u05D7\u05D5\u05D6 \u05D4\u05BEPRs \u05E9\u05E9\u05D5\u05DC\u05D1\u05D5",
      fil: "Porsyento ng mga PR na Pinagsama",
      th: "\u0E40\u0E1B\u0E2D\u0E23\u0E4C\u0E40\u0E0B\u0E47\u0E19\u0E15\u0E4C PR \u0E17\u0E35\u0E48\u0E16\u0E39\u0E01 Merged \u0E41\u0E25\u0E49\u0E27\u0E17\u0E31\u0E49\u0E07\u0E2B\u0E21\u0E14",
      sr: "\u041F\u0440\u043E\u0446\u0435\u043D\u0430\u0442 \u0441\u043F\u043E\u0458\u0435\u043D\u0438\u0445 PR-\u043E\u0432\u0430",
      "sr-latn": "Procenat spojenih PR-ova",
      no: "Prosentandel sammensl\xE5tte PR"
    },
    "statcard.lastyear": {
      en: "last year",
      ar: "\u0627\u0644\u0639\u0627\u0645 \u0627\u0644\u0645\u0627\u0636\u064A",
      az: "\xD6t\u0259n il",
      ca: "L'any passat",
      cn: "\u53BB\u5E74",
      "zh-tw": "\u53BB\u5E74",
      cs: "Minul\xFD rok",
      de: "Letztes Jahr",
      sw: "Mwaka uliopita",
      ur: "\u067E\u0686\u06BE\u0644\u0627 \u0938\u093E\u0932",
      bg: "\u043C\u0438\u043D\u0430\u043B\u0430\u0442\u0430 \u0433\u043E\u0434.",
      bn: "\u0997\u09A4 \u09AC\u099B\u09B0",
      es: "El a\xF1o pasado",
      fa: "\u0633\u0627\u0644 \u06AF\u0630\u0634\u062A\u0647",
      fi: "Viime vuosi",
      fr: "L'ann\xE9e derni\xE8re",
      hi: "\u092A\u093F\u091B\u0932\u0947 \u0938\u093E\u0932",
      sa: "\u0917\u0924\u0935\u0930\u094D\u0937\u0947",
      hu: "Tavaly",
      it: "L'anno scorso",
      ja: "\u6628\u5E74",
      kr: "\uC791\uB144",
      nl: "Vorig jaar",
      "pt-pt": "Ano passado",
      "pt-br": "Ano passado",
      np: "\u0917\u0924 \u0935\u0930\u094D\u0937",
      el: "\u03A0\u03AD\u03C1\u03C5\u03C3\u03B9",
      ro: "Anul trecut",
      ru: "\u0417\u0430 \u043F\u0440\u043E\u0448\u043B\u044B\u0439 \u0433\u043E\u0434",
      "uk-ua": "\u0417\u0430 \u043C\u0438\u043D\u0443\u043B\u0438\u0439 \u0440\u0456\u043A",
      id: "Tahun lalu",
      ml: "\u0D15\u0D34\u0D3F\u0D1E\u0D4D\u0D1E \u0D35\u0D7C\u0D37\u0D02",
      my: "Tahun lepas",
      ta: `\u0B95\u0B9F\u0BA8\u0BCD\u0BA4 \u0B86\u0BA3\u0BCD\u0B9F\u0BC1`,
      sk: "Minul\xFD rok",
      tr: "Ge\xE7en y\u0131l",
      pl: "W zesz\u0142ym roku",
      uz: "O'tgan yil",
      vi: "N\u0103m ngo\xE1i",
      se: "F\xF6rra \xE5ret",
      he: "\u05E9\u05E0\u05D4 \u05E9\u05E2\u05D1\u05E8\u05D4",
      fil: "Nakaraang Taon",
      th: "\u0E1B\u0E35\u0E17\u0E35\u0E48\u0E41\u0E25\u0E49\u0E27",
      sr: "\u041F\u0440\u043E\u0448\u043B\u0430 \u0433\u043E\u0434.",
      "sr-latn": "Pro\u0161la god.",
      no: "I fjor"
    }
  };
};
var repoCardLocales = {
  "repocard.template": {
    en: "Template",
    ar: "\u0642\u0627\u0644\u0628",
    az: "\u015Eablon",
    bg: "\u0428\u0430\u0431\u043B\u043E\u043D",
    bn: "\u099F\u09C7\u09AE\u09AA\u09CD\u09B2\u09C7\u099F",
    ca: "Plantilla",
    cn: "\u6A21\u677F",
    "zh-tw": "\u6A21\u677F",
    cs: "\u0160ablona",
    de: "Vorlage",
    sw: "Kigezo",
    ur: "\u0633\u0627\u0646\u0686\u06C1",
    es: "Plantilla",
    fa: "\u0627\u0644\u06AF\u0648",
    fi: "Malli",
    fr: "Mod\xE8le",
    hi: "\u0916\u093E\u0915\u093E",
    sa: "\u092A\u094D\u0930\u093E\u0930\u0942\u092A\u092E\u094D",
    hu: "Sablon",
    it: "Template",
    ja: "\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8",
    kr: "\uD15C\uD50C\uB9BF",
    nl: "Sjabloon",
    "pt-pt": "Modelo",
    "pt-br": "Modelo",
    np: "\u091F\u0947\u092E\u094D\u092A\u0932\u0947\u091F",
    el: "\u03A0\u03C1\u03CC\u03C4\u03C5\u03C0\u03BF",
    ro: "\u0218ablon",
    ru: "\u0428\u0430\u0431\u043B\u043E\u043D",
    "uk-ua": "\u0428\u0430\u0431\u043B\u043E\u043D",
    id: "Pola",
    ml: "\u0D1F\u0D46\u0D02\u0D2A\u0D4D\u0D32\u0D47\u0D31\u0D4D\u0D31\u0D4D",
    my: "Templat",
    ta: `\u0B9F\u0BC6\u0BAE\u0BCD\u0BAA\u0BCD\u0BB3\u0BC7\u0B9F\u0BCD`,
    sk: "\u0160abl\xF3na",
    tr: "\u015Eablon",
    pl: "Szablony",
    uz: "Shablon",
    vi: "M\u1EABu",
    se: "Mall",
    he: "\u05EA\u05D1\u05E0\u05D9\u05EA",
    fil: "Suleras",
    th: "\u0E40\u0E17\u0E21\u0E40\u0E1E\u0E25\u0E15",
    sr: "\u0428\u0430\u0431\u043B\u043E\u043D",
    "sr-latn": "\u0160ablon",
    no: "Mal"
  },
  "repocard.archived": {
    en: "Archived",
    ar: "\u0645\u064F\u0624\u0631\u0634\u0641",
    az: "Arxiv",
    bg: "\u0410\u0440\u0445\u0438\u0432\u0438\u0440\u0430\u043D\u0438",
    bn: "\u0986\u09B0\u09CD\u0995\u09BE\u0987\u09AD\u09A1",
    ca: "Arxivats",
    cn: "\u5DF2\u5F52\u6863",
    "zh-tw": "\u5DF2\u5C01\u5B58",
    cs: "Archivov\xE1no",
    de: "Archiviert",
    sw: "Hifadhiwa kwenye kumbukumbu",
    ur: "\u0645\u062D\u0641\u0648\u0638 \u0634\u062F\u06C1",
    es: "Archivados",
    fa: "\u0628\u0627\u06CC\u06AF\u0627\u0646\u06CC\u200C\u0634\u062F\u0647",
    fi: "Arkistoitu",
    fr: "Archiv\xE9",
    hi: "\u0938\u0902\u0917\u094D\u0930\u0939\u0940\u0924",
    sa: "\u0938\u0902\u0917\u0943\u0939\u0940\u0924\u092E\u094D",
    hu: "Archiv\xE1lt",
    it: "Archiviata",
    ja: "\u30A2\u30FC\u30AB\u30A4\u30D6\u6E08\u307F",
    kr: "\uBCF4\uAD00\uB428",
    nl: "Gearchiveerd",
    "pt-pt": "Arquivados",
    "pt-br": "Arquivados",
    np: "\u0905\u092D\u093F\u0932\u0947\u0916 \u0930\u093E\u0916\u093F\u092F\u094B",
    el: "\u0391\u03C1\u03C7\u03B5\u03B9\u03BF\u03B8\u03B5\u03C4\u03B7\u03BC\u03AD\u03BD\u03B1",
    ro: "Arhivat",
    ru: "\u0410\u0440\u0445\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u043D",
    "uk-ua": "\u0410\u0440\u0445\u0438\u0432\u043E\u0432\u0430\u043D\u0438\u0439",
    id: "Arsip",
    ml: "\u0D36\u0D47\u0D16\u0D30\u0D3F\u0D1A\u0D4D\u0D1A\u0D24\u0D4D",
    my: "Arkib",
    ta: `\u0B95\u0BBE\u0BAA\u0BCD\u0BAA\u0B95\u0BAA\u0BCD\u0BAA\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BAA\u0BCD\u0BAA\u0B9F\u0BCD\u0B9F\u0BA4\u0BC1`,
    sk: "Archivovan\xE9",
    tr: "Ar\u015Fiv",
    pl: "Zarchiwizowano",
    uz: "Arxivlangan",
    vi: "\u0110\xE3 L\u01B0u Tr\u1EEF",
    se: "Arkiverade",
    he: "\u05D2\u05E0\u05D5\u05D6",
    fil: "Naka-arkibo",
    th: "\u0E40\u0E01\u0E47\u0E1A\u0E16\u0E32\u0E27\u0E23",
    sr: "\u0410\u0440\u0445\u0438\u0432\u0438\u0440\u0430\u043D\u043E",
    "sr-latn": "Arhivirano",
    no: "Arkivert"
  }
};
var langCardLocales = {
  "langcard.title": {
    en: "Most Used Languages",
    ar: "\u0623\u0643\u062B\u0631 \u0627\u0644\u0644\u063A\u0627\u062A \u0627\u0633\u062A\u062E\u062F\u0627\u0645\u064B\u0627",
    az: "\u018Fn \xC7ox \u0130stifad\u0259 Olunan Dill\u0259r",
    ca: "Llenguatges m\xE9s utilitzats",
    cn: "\u6700\u5E38\u7528\u7684\u8BED\u8A00",
    "zh-tw": "\u6700\u5E38\u7528\u7684\u8A9E\u8A00",
    cs: "Nejpou\u017E\xEDvan\u011Bj\u0161\xED jazyky",
    de: "Meist verwendete Sprachen",
    bg: "\u041D\u0430\u0439-\u0438\u0437\u043F\u043E\u043B\u0437\u0432\u0430\u043D\u0438 \u0435\u0437\u0438\u0446\u0438",
    bn: "\u09B8\u09B0\u09CD\u09AC\u09BE\u09A7\u09BF\u0995 \u09AC\u09CD\u09AF\u09AC\u09B9\u09C3\u09A4 \u09AD\u09BE\u09B7\u09BE \u09B8\u09AE\u09C2\u09B9",
    sw: "Lugha zilizotumika zaidi",
    ur: "\u0633\u0628 \u0633\u06D2 \u0632\u06CC\u0627\u062F\u06C1 \u0627\u0633\u062A\u0639\u0645\u0627\u0644 \u0634\u062F\u06C1 \u0632\u0628\u0627\u0646\u06CC\u06BA",
    es: "Lenguajes m\xE1s usados",
    fa: "\u0632\u0628\u0627\u0646\u200C\u0647\u0627\u06CC \u067E\u0631\u06A9\u0627\u0631\u0628\u0631\u062F",
    fi: "K\xE4ytetyimm\xE4t kielet",
    fr: "Langages les plus utilis\xE9s",
    hi: "\u0938\u0930\u094D\u0935\u093E\u0927\u093F\u0915 \u092A\u094D\u0930\u092F\u0941\u0915\u094D\u0924 \u092D\u093E\u0937\u093E",
    sa: "\u0938\u0930\u094D\u0935\u093E\u0927\u093F\u0915-\u092A\u094D\u0930\u092F\u0941\u0915\u094D\u0924\u093E\u0903 \u092D\u093E\u0937\u093E\u0903",
    hu: "Leggyakrabban haszn\xE1lt nyelvek",
    it: "Linguaggi pi\xF9 utilizzati",
    ja: "\u6700\u3082\u3088\u304F\u4F7F\u3063\u3066\u3044\u308B\u8A00\u8A9E",
    kr: "\uAC00\uC7A5 \uB9CE\uC774 \uC0AC\uC6A9\uB41C \uC5B8\uC5B4",
    nl: "Meest gebruikte talen",
    "pt-pt": "Linguagens mais usadas",
    "pt-br": "Linguagens mais usadas",
    np: "\u0905\u0927\u093F\u0915 \u092A\u094D\u0930\u092F\u094B\u0917 \u0917\u0930\u093F\u090F\u0915\u094B \u092D\u093E\u0937\u093E\u0939\u0930\u0942",
    el: "\u039F\u03B9 \u03C0\u03B5\u03C1\u03B9\u03C3\u03C3\u03CC\u03C4\u03B5\u03C1\u03BF \u03C7\u03C1\u03B7\u03C3\u03B9\u03BC\u03BF\u03C0\u03BF\u03B9\u03BF\u03CD\u03BC\u03B5\u03BD\u03B5\u03C2 \u03B3\u03BB\u03CE\u03C3\u03C3\u03B5\u03C2",
    ro: "Cele Mai Folosite Limbaje",
    ru: "\u041D\u0430\u0438\u0431\u043E\u043B\u0435\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C\u044B\u0435 \u044F\u0437\u044B\u043A\u0438",
    "uk-ua": "\u041D\u0430\u0439\u0447\u0430\u0441\u0442\u0456\u0448\u0435 \u0432\u0438\u043A\u043E\u0440\u0438\u0441\u0442\u043E\u0432\u0443\u0432\u0430\u043D\u0456 \u043C\u043E\u0432\u0438",
    id: "Bahasa Yang Paling Banyak Digunakan",
    ml: "\u0D15\u0D42\u0D1F\u0D41\u0D24\u0D7D \u0D09\u0D2A\u0D2F\u0D4B\u0D17\u0D3F\u0D1A\u0D4D\u0D1A \u0D2D\u0D3E\u0D37\u0D15\u0D7E",
    my: "Bahasa Paling Digunakan",
    ta: `\u0B85\u0BA4\u0BBF\u0B95\u0BAE\u0BCD \u0BAA\u0BAF\u0BA9\u0BCD\u0BAA\u0B9F\u0BC1\u0BA4\u0BCD\u0BA4\u0BAA\u0BCD\u0BAA\u0B9F\u0BC1\u0BAE\u0BCD \u0BAE\u0BCA\u0BB4\u0BBF\u0B95\u0BB3\u0BCD`,
    sk: "Najviac pou\u017E\xEDvan\xE9 jazyky",
    tr: "En \xC7ok Kullan\u0131lan Diller",
    pl: "Najcz\u0119\u015Bciej u\u017Cywane j\u0119zyki",
    uz: "Eng ko\u02BBp ishlatiladigan tillar",
    vi: "Ng\xF4n Ng\u1EEF Th\u01B0\u1EDDng S\u1EED D\u1EE5ng",
    se: "Mest anv\xE4nda spr\xE5ken",
    he: "\u05D4\u05E9\u05E4\u05D5\u05EA \u05D4\u05DB\u05D9 \u05DE\u05E9\u05D5\u05DE\u05E9\u05D5\u05EA",
    fil: "Mga Pinakamadalas na Ginagamit na Wika",
    th: "\u0E20\u0E32\u0E29\u0E32\u0E17\u0E35\u0E48\u0E43\u0E0A\u0E49\u0E1A\u0E48\u0E2D\u0E22\u0E17\u0E35\u0E48\u0E2A\u0E38\u0E14",
    sr: "\u041D\u0430\u0458\u043A\u043E\u0440\u0438\u0448\u045B\u0435\u043D\u0438\u0458\u0438 \u0458\u0435\u0437\u0438\u0446\u0438",
    "sr-latn": "Najkori\u0161\u0107eniji jezici",
    no: "Mest brukte spr\xE5k"
  },
  "langcard.nodata": {
    en: "No languages data.",
    ar: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0628\u064A\u0627\u0646\u0627\u062A \u0644\u0644\u063A\u0627\u062A.",
    az: "Dil m\u0259lumat\u0131 yoxdur.",
    ca: "Sense dades d'idiomes",
    cn: "\u6CA1\u6709\u8BED\u8A00\u6570\u636E\u3002",
    "zh-tw": "\u6C92\u6709\u8A9E\u8A00\u8CC7\u6599\u3002",
    cs: "\u017D\xE1dn\xE9 jazykov\xE9 \xFAdaje.",
    de: "Keine Sprachdaten.",
    bg: "\u041D\u044F\u043C\u0430 \u0434\u0430\u043D\u043D\u0438 \u0437\u0430 \u0435\u0437\u0438\u0446\u0438",
    bn: "\u0995\u09CB\u09A8 \u09AD\u09BE\u09B7\u09BE\u09B0 \u09A1\u09C7\u099F\u09BE \u09A8\u09C7\u0987\u0964",
    sw: "Hakuna kumbukumbu ya lugha zozote",
    ur: "\u06A9\u0648\u0626\u06CC \u0632\u0628\u0627\u0646 \u06A9\u0627 \u0688\u06CC\u0679\u0627 \u0646\u06C1\u06CC\u06BA\u06D4",
    es: "Sin datos de idiomas.",
    fa: "\u062F\u0627\u062F\u0647\u200C\u0627\u06CC \u0628\u0631\u0627\u06CC \u0632\u0628\u0627\u0646\u200C\u0647\u0627 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.",
    fi: "Ei kielitietoja.",
    fr: "Aucune donn\xE9e sur les langues.",
    hi: "\u0915\u094B\u0908 \u092D\u093E\u0937\u093E \u0921\u0947\u091F\u093E \u0928\u0939\u0940\u0902",
    sa: "\u092D\u093E\u0937\u093E-\u0935\u093F\u0935\u0930\u0923\u0902 \u0928\u093E\u0938\u094D\u0924\u093F\u0964",
    hu: "Nincsenek nyelvi adatok.",
    it: "Nessun dato sulle lingue.",
    ja: "\u8A00\u8A9E\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093\u3002",
    kr: "\uC5B8\uC5B4 \uB370\uC774\uD130\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.",
    nl: "Ingen sprogdata.",
    "pt-pt": "Sem dados de linguagens.",
    "pt-br": "Sem dados de linguagens.",
    np: "\u0915\u0941\u0928\u0948 \u092D\u093E\u0937\u093E \u0921\u093E\u091F\u093E \u091B\u0948\u0928\u0964",
    el: "\u0394\u03B5\u03BD \u03C5\u03C0\u03AC\u03C1\u03C7\u03BF\u03C5\u03BD \u03B4\u03B5\u03B4\u03BF\u03BC\u03AD\u03BD\u03B1 \u03B3\u03BB\u03C9\u03C3\u03C3\u03CE\u03BD.",
    ro: "Lipsesc date despre limb\u0103.",
    ru: "\u041D\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0445 \u043E \u044F\u0437\u044B\u043A\u0430\u0445.",
    "uk-ua": "\u041D\u0435\u043C\u0430\u0454 \u0434\u0430\u043D\u0438\u0445 \u043F\u0440\u043E \u043C\u043E\u0432\u0438.",
    id: "Tidak ada data bahasa.",
    ml: "\u0D2D\u0D3E\u0D37\u0D3E \u0D21\u0D3E\u0D31\u0D4D\u0D31\u0D2F\u0D3F\u0D32\u0D4D\u0D32.",
    my: "Tiada data bahasa.",
    ta: `\u0BAE\u0BCA\u0BB4\u0BBF \u0BA4\u0BB0\u0BB5\u0BC1 \u0B87\u0BB2\u0BCD\u0BB2\u0BC8.`,
    sk: "\u017Diadne \xFAdaje o jazykoch.",
    tr: "Dil verisi yok.",
    pl: "Brak danych dotycz\u0105cych j\u0119zyk\xF3w.",
    uz: "Til haqida ma'lumot yo'q.",
    vi: "Kh\xF4ng c\xF3 d\u1EEF li\u1EC7u ng\xF4n ng\u1EEF.",
    se: "Inga spr\xE5kdata.",
    he: "\u05D0\u05D9\u05DF \u05E0\u05EA\u05D5\u05E0\u05D9 \u05E9\u05E4\u05D5\u05EA",
    fil: "Walang datos ng lenggwahe.",
    th: "\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25\u0E20\u0E32\u0E29\u0E32",
    sr: "\u041D\u0435\u043C\u0430 \u043F\u043E\u0434\u0430\u0442\u0430\u043A\u0430 \u043E \u0458\u0435\u0437\u0438\u0446\u0438\u043C\u0430.",
    "sr-latn": "Nema podataka o jezicima.",
    no: "Ingen spr\xE5kdata."
  }
};
var availableLocales = Object.keys(
  repoCardLocales["repocard.archived"] || {}
);

// stats/src/cards/repo.ts
var ICON_SIZE2 = 16;
var DESCRIPTION_LINE_WIDTH = 59;
var DESCRIPTION_MAX_LINES = 3;
var getBadgeSVG = (label, textColor) => `
	<g data-testid="badge" class="badge" transform="translate(320, -18)">
		<rect stroke="${textColor}" stroke-width="1" width="70" height="20" x="-12" y="-14" ry="10" rx="10"></rect>
		<text
			x="23" y="-5"
			alignment-baseline="central"
			dominant-baseline="central"
			text-anchor="middle"
			fill="${textColor}"
		>
			${label}
		</text>
	</g>
`;
function renderRepoCard(repo, options = {}) {
  const {
    name,
    nameWithOwner,
    description,
    primaryLanguage,
    isArchived,
    isTemplate,
    starCount,
    forkCount
  } = repo;
  const {
    hide_border = false,
    title_color,
    icon_color,
    text_color,
    bg_color,
    show_owner = false,
    theme = "default_repocard",
    border_radius,
    border_color,
    locale,
    description_lines_count
  } = options;
  const lineHeight = 10;
  const header = show_owner ? nameWithOwner : name;
  const langName = primaryLanguage?.name || "Unspecified";
  const langColor = primaryLanguage?.color || "#333";
  const descriptionMaxLines = description_lines_count ? clampValue(description_lines_count, 1, DESCRIPTION_MAX_LINES) : DESCRIPTION_MAX_LINES;
  const desc = parseEmojis(description || "No description provided");
  const multiLineDescription = wrapTextMultiline(
    desc,
    DESCRIPTION_LINE_WIDTH,
    descriptionMaxLines
  );
  const descriptionLinesCount = description_lines_count ? clampValue(description_lines_count, 1, DESCRIPTION_MAX_LINES) : multiLineDescription.length;
  const descriptionSvg = multiLineDescription.map((line) => `<tspan dy="1.2em" x="25">${encodeHTML(line)}</tspan>`).join("");
  const height = (descriptionLinesCount > 1 ? 120 : 110) + descriptionLinesCount * lineHeight;
  const i18n = new I18n({
    locale,
    translations: repoCardLocales
  });
  const colors = getCardColors({
    title_color,
    icon_color,
    text_color,
    bg_color,
    border_color,
    theme
  });
  const svgLanguage = primaryLanguage ? createLanguageNode(langName, langColor) : "";
  const totalStars = kFormatter(starCount);
  const totalForks = kFormatter(forkCount);
  const svgStars = iconWithLabel(
    icons.star,
    totalStars,
    "stargazers",
    ICON_SIZE2
  );
  const svgForks = iconWithLabel(
    icons.fork,
    totalForks,
    "forkcount",
    ICON_SIZE2
  );
  const starAndForkCount = flexLayout({
    items: [svgLanguage, svgStars, svgForks],
    sizes: [
      measureText(langName, 12),
      ICON_SIZE2 + measureText(`${totalStars}`, 12),
      ICON_SIZE2 + measureText(`${totalForks}`, 12)
    ],
    gap: 25
  }).join("");
  const card = new Card({
    defaultTitle: header.length > 35 ? `${header.slice(0, 35)}...` : header,
    titlePrefixIcon: icons.contribs,
    width: 400,
    height,
    border_radius,
    colors
  });
  card.disableAnimations();
  card.setHideBorder(hide_border);
  card.setHideTitle(false);
  card.setCSS(`
		.description { font: 400 13px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.textColor} }
		.gray { font: 400 12px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${colors.textColor} }
		.icon { fill: ${colors.iconColor} }
		.badge { font: 600 11px 'Segoe UI', Ubuntu, Sans-Serif; }
		.badge rect { opacity: 0.2 }
	`);
  return card.render(`
		${isTemplate ? getBadgeSVG(String(i18n.t("repocard.template")), colors.textColor) : isArchived ? getBadgeSVG(String(i18n.t("repocard.archived")), colors.textColor) : ""}

		<text class="description" x="25" y="-5">
			${descriptionSvg}
		</text>

		<g transform="translate(30, ${height - 75})">
			${starAndForkCount}
		</g>
	`);
}

// stats/src/cards/stats.ts
var CARD_MIN_WIDTH = 287;
var CARD_DEFAULT_WIDTH2 = 287;
var RANK_CARD_MIN_WIDTH = 420;
var RANK_CARD_DEFAULT_WIDTH = 450;
var RANK_ONLY_CARD_MIN_WIDTH = 290;
var RANK_ONLY_CARD_DEFAULT_WIDTH = 290;
var createTextNode = ({
  icon,
  label,
  value,
  id,
  unitSymbol,
  index,
  showIcons,
  shiftValuePos,
  bold,
  number_format
}) => {
  const kValue = number_format.toLowerCase() === "long" ? value : kFormatter(Number(value));
  const staggerDelay = (index + 3) * 150;
  const labelOffset = showIcons ? `x="25"` : "";
  const iconSvg = showIcons ? `
        <svg data-testid="icon" class="icon" viewBox="0 0 16 16" version="1.1" width="16" height="16">
            ${icon}
        </svg>
    ` : "";
  return `
        <g class="stagger" style="animation-delay: ${staggerDelay}ms" transform="translate(25, 0)">
            ${iconSvg}
            <text class="stat ${bold ? " bold" : "not_bold"}" ${labelOffset} y="12.5">${label}:</text>
            <text
                class="stat ${bold ? " bold" : "not_bold"}"
                x="${(showIcons ? 140 : 120) + shiftValuePos}"
                y="12.5"
                data-testid="${id}"
            >${kValue}${unitSymbol ? ` ${unitSymbol}` : ""}</text>
        </g>
    `;
};
var calculateCircleProgress = (value) => {
  const radius = 40;
  const c = Math.PI * (radius * 2);
  if (value < 0) value = 0;
  if (value > 100) value = 100;
  return (100 - value) / 100 * c;
};
var getProgressAnimation = ({ progress }) => {
  return `
        @keyframes rankAnimation {
            from {
                stroke-dashoffset: ${calculateCircleProgress(0)};
            }
            to {
                stroke-dashoffset: ${calculateCircleProgress(progress)};
            }
        }
    `;
};
var getStyles = ({
  textColor,
  iconColor,
  ringColor,
  show_icons,
  progress
}) => {
  return `
        .stat {
            font: 600 14px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: ${textColor};
        }
        @supports(-moz-appearance: auto) {
            .stat { font-size:12px; }
        }
        .stagger { opacity: 0; animation: fadeInAnimation 0.3s ease-in-out forwards; }
        .rank-text { font: 800 24px 'Segoe UI', Ubuntu, Sans-Serif; fill: ${textColor}; animation: scaleInAnimation 0.3s ease-in-out forwards; }
        .rank-percentile-header { font-size: 14px; }
        .rank-percentile-text { font-size: 16px; }
        .not_bold { font-weight: 400 }
        .bold { font-weight: 700 }
        .icon { fill: ${iconColor}; display: ${show_icons ? "block" : "none"}; }
        .rank-circle-rim { stroke: ${ringColor}; fill: none; stroke-width: 6; opacity: 0.2; }
        .rank-circle { stroke: ${ringColor}; stroke-dasharray: 250; fill: none; stroke-width: 6; stroke-linecap: round; opacity: 0.8; transform-origin: -10px 8px; transform: rotate(-90deg); animation: rankAnimation 1s forwards ease-in-out; }
        ${process.env.NODE_ENV === "test" ? "" : getProgressAnimation({ progress })}
    `;
};
var getTotalCommitsYearLabel = (include_all_commits, commits_year, i18n) => include_all_commits ? "" : commits_year ? ` (${commits_year})` : ` (${i18n.t("statcard.lastyear")})`;
function renderStatsCard(stats, options = {}) {
  const {
    name,
    totalStars,
    totalCommits,
    totalIssues,
    totalPRs,
    totalPRsMerged,
    mergedPRsPercentage,
    totalReviews,
    totalDiscussionsStarted,
    totalDiscussionsAnswered,
    contributedTo,
    rank
  } = stats;
  const {
    hide = [],
    show_icons = false,
    hide_title = false,
    hide_border = false,
    card_width,
    hide_rank = false,
    include_all_commits = false,
    commits_year,
    line_height = 25,
    title_color,
    ring_color,
    icon_color,
    text_color,
    text_bold = true,
    bg_color,
    theme = "default",
    custom_title,
    border_radius,
    border_color,
    number_format = "short",
    locale,
    disable_animations = false,
    rank_icon = "default",
    show = []
  } = options;
  const lheight = parseInt(String(line_height), 10);
  const {
    titleColor,
    iconColor,
    textColor,
    bgColor,
    borderColor,
    ringColor: resolvedRingColor
  } = getCardColors({
    title_color,
    text_color,
    icon_color,
    bg_color,
    border_color,
    ring_color,
    theme
  });
  const apostrophe = /s$/i.test(name.trim()) ? "" : "s";
  const i18n = new I18n({
    locale,
    translations: statCardLocales({ name, apostrophe })
  });
  const STATS = {};
  STATS.stars = {
    icon: icons.star,
    label: i18n.t("statcard.totalstars"),
    value: totalStars,
    id: "stars"
  };
  STATS.commits = {
    icon: icons.commits,
    label: `${i18n.t("statcard.commits")}${getTotalCommitsYearLabel(include_all_commits, commits_year, i18n)}`,
    value: totalCommits,
    id: "commits"
  };
  STATS.prs = {
    icon: icons.prs,
    label: i18n.t("statcard.prs"),
    value: totalPRs,
    id: "prs"
  };
  if (show.includes("prs_merged")) {
    STATS.prs_merged = {
      icon: icons.prs_merged,
      label: i18n.t("statcard.prs-merged"),
      value: totalPRsMerged,
      id: "prs_merged"
    };
  }
  if (show.includes("prs_merged_percentage")) {
    STATS.prs_merged_percentage = {
      icon: icons.prs_merged_percentage,
      label: i18n.t("statcard.prs-merged-percentage"),
      value: mergedPRsPercentage.toFixed(2),
      id: "prs_merged_percentage",
      unitSymbol: "%"
    };
  }
  if (show.includes("reviews")) {
    STATS.reviews = {
      icon: icons.reviews,
      label: i18n.t("statcard.reviews"),
      value: totalReviews,
      id: "reviews"
    };
  }
  STATS.issues = {
    icon: icons.issues,
    label: i18n.t("statcard.issues"),
    value: totalIssues,
    id: "issues"
  };
  if (show.includes("discussions_started")) {
    STATS.discussions_started = {
      icon: icons.discussions_started,
      label: i18n.t("statcard.discussions-started"),
      value: totalDiscussionsStarted,
      id: "discussions_started"
    };
  }
  if (show.includes("discussions_answered")) {
    STATS.discussions_answered = {
      icon: icons.discussions_answered,
      label: i18n.t("statcard.discussions-answered"),
      value: totalDiscussionsAnswered,
      id: "discussions_answered"
    };
  }
  STATS.contribs = {
    icon: icons.contribs,
    label: i18n.t("statcard.contribs"),
    value: contributedTo,
    id: "contribs"
  };
  const longLocales = [
    "bg",
    "de",
    "es",
    "fil",
    "fr",
    "id",
    "ml",
    "my",
    "nl",
    "pl",
    "pt-br",
    "pt-pt",
    "ru",
    "sr",
    "sr-latn",
    "sw",
    "ta",
    "uk-ua",
    "uz",
    "zh-tw"
  ];
  const isLongLocale = locale ? longLocales.includes(locale) : false;
  const statItems = Object.keys(STATS).filter((key) => !hide.includes(key)).map((key, index) => {
    const stat = STATS[key];
    if (!stat) {
      throw new Error(`Invalid stat key: ${key}`);
    }
    return createTextNode({
      icon: stat.icon,
      label: stat.label,
      value: stat.value,
      id: stat.id,
      unitSymbol: stat.unitSymbol,
      index,
      showIcons: show_icons,
      shiftValuePos: 79.01 + (isLongLocale ? 50 : 0),
      bold: text_bold,
      number_format
    });
  });
  if (statItems.length === 0 && hide_rank) {
    throw new CustomError(
      "Could not render stats card.",
      "Either stats or rank are required."
    );
  }
  const height = Math.max(
    45 + (statItems.length + 1) * lheight,
    hide_rank ? 0 : statItems.length ? 150 : 180
  );
  const rankSafe = rank ?? { level: "A", percentile: 100 };
  const progress = 100 - (rankSafe.percentile ?? 100);
  const cssStyles = getStyles({
    ringColor: resolvedRingColor || ring_color || "",
    textColor,
    iconColor,
    show_icons,
    progress
  });
  const calculateTextWidth = () => measureText(
    custom_title ? custom_title : statItems.length ? i18n.t("statcard.title") : i18n.t("statcard.ranktitle")
  );
  const iconWidth = show_icons && statItems.length ? 16 + /* padding */
  1 : 0;
  const minCardWidth = (hide_rank ? clampValue(50 + calculateTextWidth() * 2, CARD_MIN_WIDTH, Infinity) : statItems.length ? RANK_CARD_MIN_WIDTH : RANK_ONLY_CARD_MIN_WIDTH) + iconWidth;
  const defaultCardWidth = (hide_rank ? CARD_DEFAULT_WIDTH2 : statItems.length ? RANK_CARD_DEFAULT_WIDTH : RANK_ONLY_CARD_DEFAULT_WIDTH) + iconWidth;
  let width = card_width ? Number.isNaN(Number(card_width)) ? defaultCardWidth : Number(card_width) : defaultCardWidth;
  if (width < minCardWidth) width = minCardWidth;
  const card = new Card({
    customTitle: custom_title,
    defaultTitle: statItems.length ? i18n.t("statcard.title") : i18n.t("statcard.ranktitle"),
    width,
    height,
    border_radius,
    colors: { titleColor, textColor, iconColor, bgColor, borderColor }
  });
  card.setHideBorder(hide_border);
  card.setHideTitle(hide_title);
  card.setCSS(cssStyles);
  if (disable_animations) card.disableAnimations();
  const calculateRankXTranslation = () => {
    if (statItems.length) {
      const minXTranslation = RANK_CARD_MIN_WIDTH + iconWidth - 70;
      if (width > RANK_CARD_DEFAULT_WIDTH) {
        const xMaxExpansion = minXTranslation + (450 - minCardWidth) / 2;
        return xMaxExpansion + width - RANK_CARD_DEFAULT_WIDTH;
      } else {
        return minXTranslation + (width - minCardWidth) / 2;
      }
    } else {
      return width / 2 + 20 - 10;
    }
  };
  const rankIconName = rank_icon ?? "default";
  const rankCircle = hide_rank ? "" : `<g data-testid="rank-circle" transform="translate(${calculateRankXTranslation()}, ${height / 2 - 50})">
                        <circle class="rank-circle-rim" cx="-10" cy="8" r="40" />
                        <circle class="rank-circle" cx="-10" cy="8" r="40" />
                        <g class="rank-text">
                            ${rankIcon(rankIconName, rank?.level, rank?.percentile)}
                        </g>
                    </g>`;
  const labels = Object.keys(STATS).filter((key) => !hide.includes(key)).map((key) => {
    const stat = STATS[key];
    if (!stat) {
      throw new Error(`Invalid stat key: ${key}`);
    }
    if (key === "commits") {
      return `${i18n.t("statcard.commits")} ${getTotalCommitsYearLabel(include_all_commits, commits_year, i18n)} : ${stat.value}`;
    }
    return `${stat.label}: ${stat.value}`;
  }).join(", ");
  card.setAccessibilityLabel({
    title: `${card.title}, Rank: ${rankSafe.level}`,
    desc: labels
  });
  return card.render(`
        ${rankCircle}
        <svg x="0" y="0">
            ${flexLayout({ items: statItems, gap: lheight, direction: "column" }).join("")}
        </svg>
    `);
}

// stats/src/common/createProgressNode.ts
var createProgressNode = ({
  x,
  y,
  width,
  color,
  progress,
  progressBarBackgroundColor,
  delay
}) => {
  const progressPercentage = clampValue(progress, 2, 100);
  return `
    <svg width="${width}" x="${x}" y="${y}">
      <rect rx="5" ry="5" x="0" y="0" width="${width}" height="8" fill="${progressBarBackgroundColor}"></rect>
      <svg data-testid="lang-progress" width="${progressPercentage}%">
        <rect
            height="8"
            fill="${color}"
            rx="5" ry="5" x="0" y="0"
            class="lang-progress"
            style="animation-delay: ${delay}ms;"
        />
      </svg>
    </svg>
  `;
};

// stats/src/cards/top-languages.ts
var DEFAULT_CARD_WIDTH = 300;
var MIN_CARD_WIDTH = 280;
var DEFAULT_LANG_COLOR = "#858585";
var CARD_PADDING = 25;
var COMPACT_LAYOUT_BASE_HEIGHT = 90;
var MAXIMUM_LANGS_COUNT = 20;
var NORMAL_LAYOUT_DEFAULT_LANGS_COUNT = 5;
var COMPACT_LAYOUT_DEFAULT_LANGS_COUNT = 6;
var DONUT_LAYOUT_DEFAULT_LANGS_COUNT = 5;
var PIE_LAYOUT_DEFAULT_LANGS_COUNT = 6;
var DONUT_VERTICAL_LAYOUT_DEFAULT_LANGS_COUNT = 6;
var getLongestLang = (arr) => arr.reduce(
  (savedLang, lang) => lang.name.length > savedLang.name.length ? lang : savedLang,
  { name: "", size: 0, color: "" }
);
var degreesToRadians = (angleInDegrees) => angleInDegrees * (Math.PI / 180);
var polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
  const rads = degreesToRadians(angleInDegrees);
  return {
    x: centerX + radius * Math.cos(rads),
    y: centerY + radius * Math.sin(rads)
  };
};
var getCircleLength = (radius) => 2 * Math.PI * radius;
var calculateCompactLayoutHeight = (totalLangs) => COMPACT_LAYOUT_BASE_HEIGHT + Math.round(totalLangs / 2) * 25;
var calculateNormalLayoutHeight = (totalLangs) => 45 + (totalLangs + 1) * 40;
var calculateDonutLayoutHeight = (totalLangs) => 215 + Math.max(totalLangs - 5, 0) * 32;
var calculateDonutVerticalLayoutHeight = (totalLangs) => 300 + Math.round(totalLangs / 2) * 25;
var calculatePieLayoutHeight = (totalLangs) => 300 + Math.round(totalLangs / 2) * 25;
var donutCenterTranslation = (totalLangs) => -45 + Math.max(totalLangs - 5, 0) * 16;
var trimTopLanguages = (topLangs, langs_count = NORMAL_LAYOUT_DEFAULT_LANGS_COUNT, hide) => {
  let langs = Array.isArray(topLangs) ? topLangs : Object.values(topLangs);
  const langsToHide = /* @__PURE__ */ Object.create(null);
  const langsCount = clampValue(langs_count, 1, MAXIMUM_LANGS_COUNT);
  if (hide) {
    for (const langName of hide) {
      langsToHide[lowercaseTrim(langName)] = true;
    }
  }
  langs = langs.sort((a, b) => b.size - a.size).filter((lang) => !langsToHide[lowercaseTrim(lang.name)]).slice(0, langsCount);
  const totalLanguageSize = langs.reduce((acc, curr) => acc + curr.size, 0);
  return { langs, totalLanguageSize };
};
var getDisplayValue = (size, percentages, format) => format === "bytes" ? formatBytes(size) : `${percentages.toFixed(2)}%`;
var createProgressTextNode = ({
  width,
  color,
  name,
  size,
  totalSize,
  statsFormat,
  index
}) => {
  const staggerDelay = (index + 3) * 150;
  const paddingRight = 95;
  const progressTextX = width - paddingRight + 10;
  const progressWidth = width - paddingRight;
  const progress = size / totalSize * 100;
  const displayValue = getDisplayValue(size, progress, statsFormat);
  return `
		<g class="stagger" style="animation-delay: ${staggerDelay}ms">
			<text data-testid="lang-name" x="2" y="15" class="lang-name">${name}</text>
			<text x="${progressTextX}" y="34" class="lang-name">${displayValue}</text>
			${createProgressNode({
    x: 0,
    y: 25,
    color,
    width: progressWidth,
    progress,
    progressBarBackgroundColor: "#ddd",
    delay: staggerDelay + 300
  })}
		</g>
	`;
};
var createCompactLangNode = ({
  lang,
  totalSize,
  hideProgress,
  statsFormat = "percentages",
  index
}) => {
  const percentages = lang.size / totalSize * 100;
  const displayValue = getDisplayValue(lang.size, percentages, statsFormat);
  const staggerDelay = (index + 3) * 150;
  const color = lang.color || "#858585";
  return `
		<g class="stagger" style="animation-delay: ${staggerDelay}ms">
			<circle cx="5" cy="6" r="5" fill="${color}" />
			<text data-testid="lang-name" x="15" y="10" class='lang-name'>
				${lang.name} ${hideProgress ? "" : displayValue}
			</text>
		</g>
	`;
};
var createLanguageTextNode = ({
  langs,
  totalSize,
  hideProgress,
  statsFormat
}) => {
  const longestLang = getLongestLang(langs);
  const chunked = chunkArray(langs, langs.length / 2);
  const layouts = chunked.map((array) => {
    const items = array.map(
      (lang, index) => createCompactLangNode({
        lang,
        totalSize,
        hideProgress,
        statsFormat,
        index
      })
    );
    return flexLayout({
      items,
      gap: 25,
      direction: "column"
    }).join("");
  });
  const percent = (longestLang.size / totalSize * 100).toFixed(2);
  const minGap = 150;
  const maxGap = 20 + measureText(`${longestLang.name} ${percent}%`, 11);
  return flexLayout({
    items: layouts,
    gap: maxGap < minGap ? minGap : maxGap
  }).join("");
};
var createDonutLanguagesNode = ({
  langs,
  totalSize,
  statsFormat
}) => {
  return flexLayout({
    items: langs.map((lang, index) => {
      return createCompactLangNode({
        lang,
        totalSize,
        hideProgress: false,
        statsFormat,
        index
      });
    }),
    gap: 32,
    direction: "column"
  }).join("");
};
var renderNormalLayout = (langs, width, totalLanguageSize, statsFormat) => {
  return flexLayout({
    items: langs.map((lang, index) => {
      return createProgressTextNode({
        width,
        name: lang.name,
        color: lang.color || DEFAULT_LANG_COLOR,
        size: lang.size,
        totalSize: totalLanguageSize,
        statsFormat,
        index
      });
    }),
    gap: 40,
    direction: "column"
  }).join("");
};
var renderCompactLayout = (langs, width, totalLanguageSize, hideProgress, statsFormat = "percentages") => {
  const paddingRight = 50;
  const offsetWidth = width - paddingRight;
  let progressOffset = 0;
  const compactProgressBar = langs.map((lang) => {
    const percentage = parseFloat(
      (lang.size / totalLanguageSize * offsetWidth).toFixed(2)
    );
    const progress = percentage < 10 ? percentage + 10 : percentage;
    const output = `
				<rect
					mask="url(#rect-mask)"
					data-testid="lang-progress"
					x="${progressOffset}"
					y="0"
					width="${progress}"
					height="8"
					fill="${lang.color || "#858585"}"
				/>
			`;
    progressOffset += percentage;
    return output;
  }).join("");
  return `
	${hideProgress ? "" : `
			<mask id="rect-mask">
					<rect x="0" y="0" width="${offsetWidth}" height="8" fill="white" rx="5"/>
				</mask>
				${compactProgressBar}
			`}
		<g transform="translate(0, ${hideProgress ? "0" : "25"})">
			${createLanguageTextNode({
    langs,
    totalSize: totalLanguageSize,
    hideProgress,
    statsFormat
  })}
		</g>
	`;
};
var renderDonutVerticalLayout = (langs, totalLanguageSize, statsFormat) => {
  const radius = 80;
  const totalCircleLength = getCircleLength(radius);
  const circles = [];
  let offset = 0;
  let startDelayCoefficient = 1;
  for (const lang of langs) {
    const percentage = lang.size / totalLanguageSize * 100;
    const delay = startDelayCoefficient * 100;
    const partLength = percentage / 100 * totalCircleLength;
    circles.push(`
      <g class="stagger" style="animation-delay: ${delay}ms">
        <circle 
          cx="150" cy="100" r="${radius}" fill="transparent"
          stroke="${lang.color}" stroke-width="25" stroke-dasharray="${totalCircleLength}"
          stroke-dashoffset="${offset}" size="${percentage}" data-testid="lang-donut" />
      </g>`);
    offset += partLength;
    startDelayCoefficient += 1;
  }
  return `
    <svg data-testid="lang-items">
      <g transform="translate(0, 0)"><svg data-testid="donut">${circles.join("")}</svg></g>
      <g transform="translate(0, 220)"><svg data-testid="lang-names" x="${CARD_PADDING}">${createLanguageTextNode(
    {
      langs,
      totalSize: totalLanguageSize,
      hideProgress: false,
      statsFormat
    }
  )}</svg></g>
    </svg>`;
};
var renderPieLayout = (langs, totalLanguageSize, statsFormat) => {
  const radius = 90;
  const centerX = 150;
  const centerY = 100;
  let startAngle = 0;
  let startDelayCoefficient = 1;
  const paths = [];
  for (const lang of langs) {
    if (langs.length === 1) {
      paths.push(
        `<circle cx="${centerX}" cy="${centerY}" r="${radius}" stroke="none" fill="${lang.color}" data-testid="lang-pie" size="100"/>`
      );
      break;
    }
    const langSizePart = lang.size / totalLanguageSize;
    const percentage = langSizePart * 100;
    const angle = langSizePart * 360;
    const endAngle = startAngle + angle;
    const startPoint = polarToCartesian(centerX, centerY, radius, startAngle);
    const endPoint = polarToCartesian(centerX, centerY, radius, endAngle);
    const largeArcFlag = angle > 180 ? 1 : 0;
    const delay = startDelayCoefficient * 100;
    paths.push(`<g class="stagger" style="animation-delay: ${delay}ms">
			<path data-testid="lang-pie" size="${percentage}" d="M ${centerX} ${centerY} L ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y} Z" fill="${lang.color}" />
		</g>`);
    startAngle = endAngle;
    startDelayCoefficient += 1;
  }
  return `
		<svg data-testid="lang-items">
			<g transform="translate(0, 0)"><svg data-testid="pie">${paths.join("")}</svg></g>
			<g transform="translate(0, 220)"><svg data-testid="lang-names" x="${CARD_PADDING}">${createLanguageTextNode(
    {
      langs,
      totalSize: totalLanguageSize,
      hideProgress: false,
      statsFormat
    }
  )}</svg></g>
		</svg>`;
};
var createDonutPaths = (cx, cy, radius, percentages) => {
  const pathsArr = [];
  let startAngle = 0;
  let endAngle = 0;
  const totalPercent = percentages.reduce((acc, curr) => acc + curr, 0);
  for (let i = 0; i < percentages.length; i++) {
    const percentage = percentages[i];
    if (percentage === void 0) continue;
    const percent = parseFloat((percentage / totalPercent * 100).toFixed(2));
    endAngle = 3.6 * percent + startAngle;
    const startPoint = polarToCartesian(cx, cy, radius, endAngle - 90);
    const endPoint = polarToCartesian(cx, cy, radius, startAngle - 90);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    const sx = Number(startPoint.x.toFixed(6));
    const sy = Number(startPoint.y.toFixed(6));
    const ex = Number(endPoint.x.toFixed(6));
    const ey = Number(endPoint.y.toFixed(6));
    pathsArr.push({
      percent,
      d: `M ${sx} ${sy} A ${Number(radius.toFixed(6))} ${Number(radius.toFixed(6))} 0 ${largeArc} 0 ${ex} ${ey}`
    });
    startAngle = endAngle;
  }
  return pathsArr;
};
var renderDonutLayout = (langs, width, totalLanguageSize, statsFormat) => {
  const centerX = width / 3;
  const centerY = width / 3;
  const radius = centerX - 60;
  const strokeWidth = 12;
  const colors = langs.map((l) => l.color);
  const langsPercents = langs.map(
    (lang) => parseFloat((lang.size / totalLanguageSize * 100).toFixed(2))
  );
  const langPaths = createDonutPaths(centerX, centerY, radius, langsPercents);
  const donutPaths = langs.length === 1 ? `<circle cx="${centerX}" cy="${centerY}" r="${radius}" stroke="${colors[0]}" fill="none" stroke-width="${strokeWidth}" data-testid="lang-donut" size="100"/>` : langPaths.map((section, index) => {
    const staggerDelay = (index + 3) * 100;
    const delay = staggerDelay + 300;
    return `<g class="stagger" style="animation-delay: ${delay}ms">
							<path data-testid="lang-donut" size="${section.percent}" d="${section.d}" stroke="${colors[index]}" fill="none" stroke-width="${strokeWidth}"></path>
						</g>`;
  }).join("");
  const donut = `<svg width="${width}" height="${width}">${donutPaths}</svg>`;
  return `<g transform="translate(0, 0)">
		<g transform="translate(0, 0)">${createDonutLanguagesNode({
    langs,
    totalSize: totalLanguageSize,
    statsFormat
  })}</g>
		<g transform="translate(125, ${donutCenterTranslation(langs.length)})">${donut}</g>
	</g>`;
};
var noLanguagesDataNode = ({ color, text, layout }) => `
  <text x="${layout === "pie" || layout === "donut-vertical" ? CARD_PADDING : 0}" y="11" class="stat bold" fill="${color}">${text}</text>
`;
var getDefaultLanguagesCountByLayout = ({
  layout,
  hide_progress
}) => {
  if (layout === "compact" || hide_progress === true) {
    return COMPACT_LAYOUT_DEFAULT_LANGS_COUNT;
  } else if (layout === "donut") {
    return DONUT_LAYOUT_DEFAULT_LANGS_COUNT;
  } else if (layout === "donut-vertical") {
    return DONUT_VERTICAL_LAYOUT_DEFAULT_LANGS_COUNT;
  } else if (layout === "pie") {
    return PIE_LAYOUT_DEFAULT_LANGS_COUNT;
  } else {
    return NORMAL_LAYOUT_DEFAULT_LANGS_COUNT;
  }
};
function renderTopLanguages(topLangs, options = {}) {
  const {
    hide_title = false,
    hide_border = false,
    card_width,
    title_color,
    text_color,
    bg_color,
    hide,
    hide_progress,
    theme,
    layout,
    custom_title,
    locale,
    langs_count = getDefaultLanguagesCountByLayout({ layout, hide_progress }),
    border_radius,
    border_color,
    disable_animations,
    stats_format = "percentages"
  } = options;
  const i18n = new I18n({ locale, translations: langCardLocales });
  const { langs, totalLanguageSize } = trimTopLanguages(
    topLangs,
    langs_count,
    hide
  );
  let width = card_width ? Number.isNaN(card_width) ? DEFAULT_CARD_WIDTH : card_width < MIN_CARD_WIDTH ? MIN_CARD_WIDTH : card_width : DEFAULT_CARD_WIDTH;
  let height = calculateNormalLayoutHeight(langs.length);
  const colors = getCardColors({
    title_color,
    text_color,
    bg_color,
    border_color,
    theme
  });
  let finalLayout = "";
  if (langs.length === 0) {
    height = COMPACT_LAYOUT_BASE_HEIGHT;
    finalLayout = noLanguagesDataNode({
      color: colors.textColor,
      text: i18n.t("langcard.nodata"),
      layout
    });
  } else if (layout === "pie") {
    height = calculatePieLayoutHeight(langs.length);
    finalLayout = renderPieLayout(langs, totalLanguageSize, stats_format);
  } else if (layout === "donut-vertical") {
    height = calculateDonutVerticalLayoutHeight(langs.length);
    finalLayout = renderDonutVerticalLayout(
      langs,
      totalLanguageSize,
      stats_format
    );
  } else if (layout === "compact" || hide_progress === true) {
    height = calculateCompactLayoutHeight(langs.length) + (hide_progress ? -25 : 0);
    finalLayout = renderCompactLayout(
      langs,
      width,
      totalLanguageSize,
      hide_progress,
      stats_format
    );
  } else if (layout === "donut") {
    height = calculateDonutLayoutHeight(langs.length);
    width = width + 50;
    finalLayout = renderDonutLayout(
      langs,
      width,
      totalLanguageSize,
      stats_format
    );
  } else {
    finalLayout = renderNormalLayout(
      langs,
      width,
      totalLanguageSize,
      stats_format
    );
  }
  const card = new Card({
    customTitle: custom_title,
    defaultTitle: i18n.t("langcard.title"),
    width,
    height,
    border_radius,
    colors
  });
  if (disable_animations) card.disableAnimations();
  card.setHideBorder(hide_border);
  card.setHideTitle(hide_title);
  card.setCSS(`
		@keyframes slideInAnimation { from { width:0; } to { width:calc(100%-100px);} }
		@keyframes growWidthAnimation { from { width:0; } to { width:100%; } }
		.stat { font: 600 14px 'Segoe UI', Ubuntu, "Helvetica Neue", Sans-Serif; fill: ${colors.textColor}; }
		@supports(-moz-appearance: auto){ .stat{ font-size:12px; } }
		.bold { font-weight:700 }
		.lang-name { font: 400 11px "Segoe UI", Ubuntu, Sans-Serif; fill: ${colors.textColor}; }
		.stagger { opacity:0; animation: fadeInAnimation 0.3s ease-in-out forwards; }
		#rect-mask rect { animation: slideInAnimation 1s ease-in-out forwards; }
		.lang-progress { animation: growWidthAnimation 0.6s ease-in-out forwards; }
	`);
  if (layout === "pie" || layout === "donut-vertical")
    return card.render(finalLayout);
  return card.render(
    `<svg data-testid="lang-items" x="${CARD_PADDING}">${finalLayout}</svg>`
  );
}

// stats/src/common/blacklist.ts
var blacklist = [
  "renovate-bot",
  "technote-space",
  "sw-yx",
  "YourUsername",
  "[YourUsername]"
];

// stats/src/common/retryer.ts
function getPatTokens() {
  return Object.keys(process.env).filter((key) => /^PAT_\d*$/.exec(key)).map((key) => process.env[key]).filter(
    (value) => Boolean(value && value.trim().length > 0)
  );
}
var RETRIES = process.env.NODE_ENV === "test" ? 7 : getPatTokens().length;
var retryer = async (fetcher, variables, retries = 0) => {
  if (!RETRIES) {
    throw new CustomError("No GitHub API tokens found", CustomError.NO_TOKENS);
  }
  if (retries >= RETRIES) {
    throw new CustomError(
      "Downtime due to GitHub API rate limiting",
      CustomError.MAX_RETRY
    );
  }
  try {
    const response = await fetcher(
      variables,
      getPatTokens()[retries] || "",
      // used in tests for faking rate limit
      retries
    );
    const errors = response?.data?.errors;
    const errorType = errors?.[0]?.type;
    const errorMsg = errors?.[0]?.message || "";
    const bodyMessage = String(
      response?.data?.message ?? response?.response?.data?.message ?? ""
    );
    const isRateLimited = errors && errorType === "RATE_LIMITED" || /rate limit/i.test(errorMsg) || /rate limit/i.test(bodyMessage);
    const isBadCredential = bodyMessage === "Bad credentials";
    const isAccountSuspended = bodyMessage === "Sorry. Your account was suspended.";
    if (isRateLimited || isBadCredential || isAccountSuspended) {
      logger.log(`PAT_${retries + 1} Failed`);
      retries++;
      return retryer(fetcher, variables, retries);
    }
    return response;
  } catch (err) {
    const isBadCredential = err && typeof err === "object" && "response" in err && err.response && typeof err.response === "object" && "data" in err.response && err.response.data && typeof err.response.data === "object" && "message" in err.response.data && err.response.data.message === "Bad credentials";
    const isAccountSuspended = err && typeof err === "object" && "response" in err && err.response && typeof err.response === "object" && "data" in err.response && err.response.data && typeof err.response.data === "object" && "message" in err.response.data && err.response.data.message === "Sorry. Your account was suspended.";
    if (isBadCredential || isAccountSuspended) {
      logger.log(`PAT_${retries + 1} Failed`);
      retries++;
      return retryer(fetcher, variables, retries);
    }
    throw err;
  }
};
export {
  Card,
  ERROR_CARD_LENGTH,
  I18n,
  blacklist,
  chunkArray,
  clampValue,
  createProgressNode,
  encodeHTML,
  fallbackColor,
  flexLayout,
  getCardColors,
  icons,
  isValidGradient,
  isValidHexColor,
  kFormatter,
  logger,
  lowercaseTrim,
  measureText,
  parseArray,
  parseBoolean,
  parseEmojis,
  renderError,
  renderGistCard,
  renderRepoCard,
  renderStatsCard,
  renderTopLanguages,
  renderTopLanguages as renderTopLanguagesCard,
  request,
  retryer,
  wrapTextMultiline
};
//# sourceMappingURL=index.js.map