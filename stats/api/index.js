// stats/src/cards/gist.ts
import { createRequire } from "module";

// stats/src/common/utils.ts
import axios from "axios";
import toEmoji from "emoji-name-map";
import wrap from "word-wrap";

// stats/themes/index.js
var themes = {
  default: {
    title_color: "2f80ed",
    icon_color: "4c71f2",
    text_color: "434d58",
    bg_color: "fffefe",
    border_color: "e4e2e2"
  },
  default_repocard: {
    title_color: "2f80ed",
    icon_color: "586069",
    // icon color is different
    text_color: "434d58",
    bg_color: "fffefe"
  },
  transparent: {
    title_color: "006AFF",
    icon_color: "0579C3",
    text_color: "417E87",
    bg_color: "ffffff00"
  },
  shadow_red: {
    title_color: "9A0000",
    text_color: "444",
    icon_color: "4F0000",
    border_color: "4F0000",
    bg_color: "ffffff00"
  },
  shadow_green: {
    title_color: "007A00",
    text_color: "444",
    icon_color: "003D00",
    border_color: "003D00",
    bg_color: "ffffff00"
  },
  shadow_blue: {
    title_color: "00779A",
    text_color: "444",
    icon_color: "004450",
    border_color: "004490",
    bg_color: "ffffff00"
  },
  dark: {
    title_color: "fff",
    icon_color: "79ff97",
    text_color: "9f9f9f",
    bg_color: "151515"
  },
  radical: {
    title_color: "fe428e",
    icon_color: "f8d847",
    text_color: "a9fef7",
    bg_color: "141321"
  },
  merko: {
    title_color: "abd200",
    icon_color: "b7d364",
    text_color: "68b587",
    bg_color: "0a0f0b"
  },
  gruvbox: {
    title_color: "fabd2f",
    icon_color: "fe8019",
    text_color: "8ec07c",
    bg_color: "282828"
  },
  gruvbox_light: {
    title_color: "b57614",
    icon_color: "af3a03",
    text_color: "427b58",
    bg_color: "fbf1c7"
  },
  tokyonight: {
    title_color: "70a5fd",
    icon_color: "bf91f3",
    text_color: "38bdae",
    bg_color: "1a1b27"
  },
  onedark: {
    title_color: "e4bf7a",
    icon_color: "8eb573",
    text_color: "df6d74",
    bg_color: "282c34"
  },
  cobalt: {
    title_color: "e683d9",
    icon_color: "0480ef",
    text_color: "75eeb2",
    bg_color: "193549"
  },
  synthwave: {
    title_color: "e2e9ec",
    icon_color: "ef8539",
    text_color: "e5289e",
    bg_color: "2b213a"
  },
  highcontrast: {
    title_color: "e7f216",
    icon_color: "00ffff",
    text_color: "fff",
    bg_color: "000"
  },
  dracula: {
    title_color: "ff6e96",
    icon_color: "79dafa",
    text_color: "f8f8f2",
    bg_color: "282a36"
  },
  prussian: {
    title_color: "bddfff",
    icon_color: "38a0ff",
    text_color: "6e93b5",
    bg_color: "172f45"
  },
  monokai: {
    title_color: "eb1f6a",
    icon_color: "e28905",
    text_color: "f1f1eb",
    bg_color: "272822"
  },
  vue: {
    title_color: "41b883",
    icon_color: "41b883",
    text_color: "273849",
    bg_color: "fffefe"
  },
  "vue-dark": {
    title_color: "41b883",
    icon_color: "41b883",
    text_color: "fffefe",
    bg_color: "273849"
  },
  "shades-of-purple": {
    title_color: "fad000",
    icon_color: "b362ff",
    text_color: "a599e9",
    bg_color: "2d2b55"
  },
  nightowl: {
    title_color: "c792ea",
    icon_color: "ffeb95",
    text_color: "7fdbca",
    bg_color: "011627"
  },
  buefy: {
    title_color: "7957d5",
    icon_color: "ff3860",
    text_color: "363636",
    bg_color: "ffffff"
  },
  "blue-green": {
    title_color: "2f97c1",
    icon_color: "f5b700",
    text_color: "0cf574",
    bg_color: "040f0f"
  },
  algolia: {
    title_color: "00AEFF",
    icon_color: "2DDE98",
    text_color: "FFFFFF",
    bg_color: "050F2C"
  },
  "great-gatsby": {
    title_color: "ffa726",
    icon_color: "ffb74d",
    text_color: "ffd95b",
    bg_color: "000000"
  },
  darcula: {
    title_color: "BA5F17",
    icon_color: "84628F",
    text_color: "BEBEBE",
    bg_color: "242424"
  },
  bear: {
    title_color: "e03c8a",
    icon_color: "00AEFF",
    text_color: "bcb28d",
    bg_color: "1f2023"
  },
  "solarized-dark": {
    title_color: "268bd2",
    icon_color: "b58900",
    text_color: "859900",
    bg_color: "002b36"
  },
  "solarized-light": {
    title_color: "268bd2",
    icon_color: "b58900",
    text_color: "859900",
    bg_color: "fdf6e3"
  },
  "chartreuse-dark": {
    title_color: "7fff00",
    icon_color: "00AEFF",
    text_color: "fff",
    bg_color: "000"
  },
  nord: {
    title_color: "81a1c1",
    text_color: "d8dee9",
    icon_color: "88c0d0",
    bg_color: "2e3440"
  },
  gotham: {
    title_color: "2aa889",
    icon_color: "599cab",
    text_color: "99d1ce",
    bg_color: "0c1014"
  },
  "material-palenight": {
    title_color: "c792ea",
    icon_color: "89ddff",
    text_color: "a6accd",
    bg_color: "292d3e"
  },
  graywhite: {
    title_color: "24292e",
    icon_color: "24292e",
    text_color: "24292e",
    bg_color: "ffffff"
  },
  "vision-friendly-dark": {
    title_color: "ffb000",
    icon_color: "785ef0",
    text_color: "ffffff",
    bg_color: "000000"
  },
  "ayu-mirage": {
    title_color: "f4cd7c",
    icon_color: "73d0ff",
    text_color: "c7c8c2",
    bg_color: "1f2430"
  },
  "midnight-purple": {
    title_color: "9745f5",
    icon_color: "9f4bff",
    text_color: "ffffff",
    bg_color: "000000"
  },
  calm: {
    title_color: "e07a5f",
    icon_color: "edae49",
    text_color: "ebcfb2",
    bg_color: "373f51"
  },
  "flag-india": {
    title_color: "ff8f1c",
    icon_color: "250E62",
    text_color: "509E2F",
    bg_color: "ffffff"
  },
  omni: {
    title_color: "FF79C6",
    icon_color: "e7de79",
    text_color: "E1E1E6",
    bg_color: "191622"
  },
  react: {
    title_color: "61dafb",
    icon_color: "61dafb",
    text_color: "ffffff",
    bg_color: "20232a"
  },
  jolly: {
    title_color: "ff64da",
    icon_color: "a960ff",
    text_color: "ffffff",
    bg_color: "291B3E"
  },
  maroongold: {
    title_color: "F7EF8A",
    icon_color: "F7EF8A",
    text_color: "E0AA3E",
    bg_color: "260000"
  },
  yeblu: {
    title_color: "ffff00",
    icon_color: "ffff00",
    text_color: "ffffff",
    bg_color: "002046"
  },
  blueberry: {
    title_color: "82aaff",
    icon_color: "89ddff",
    text_color: "27e8a7",
    bg_color: "242938"
  },
  slateorange: {
    title_color: "faa627",
    icon_color: "faa627",
    text_color: "ffffff",
    bg_color: "36393f"
  },
  kacho_ga: {
    title_color: "bf4a3f",
    icon_color: "a64833",
    text_color: "d9c8a9",
    bg_color: "402b23"
  },
  outrun: {
    title_color: "ffcc00",
    icon_color: "ff1aff",
    text_color: "8080ff",
    bg_color: "141439"
  },
  ocean_dark: {
    title_color: "8957B2",
    icon_color: "FFFFFF",
    text_color: "92D534",
    bg_color: "151A28"
  },
  city_lights: {
    title_color: "5D8CB3",
    icon_color: "4798FF",
    text_color: "718CA1",
    bg_color: "1D252C"
  },
  github_dark: {
    title_color: "58A6FF",
    icon_color: "1F6FEB",
    text_color: "C3D1D9",
    bg_color: "0D1117"
  },
  github_dark_dimmed: {
    title_color: "539bf5",
    icon_color: "539bf5",
    text_color: "ADBAC7",
    bg_color: "24292F",
    border_color: "373E47"
  },
  discord_old_blurple: {
    title_color: "7289DA",
    icon_color: "7289DA",
    text_color: "FFFFFF",
    bg_color: "2C2F33"
  },
  aura_dark: {
    title_color: "ff7372",
    icon_color: "6cffd0",
    text_color: "dbdbdb",
    bg_color: "252334"
  },
  panda: {
    title_color: "19f9d899",
    icon_color: "19f9d899",
    text_color: "FF75B5",
    bg_color: "31353a"
  },
  noctis_minimus: {
    title_color: "d3b692",
    icon_color: "72b7c0",
    text_color: "c5cdd3",
    bg_color: "1b2932"
  },
  cobalt2: {
    title_color: "ffc600",
    icon_color: "ffffff",
    text_color: "0088ff",
    bg_color: "193549"
  },
  swift: {
    title_color: "000000",
    icon_color: "f05237",
    text_color: "000000",
    bg_color: "f7f7f7"
  },
  aura: {
    title_color: "a277ff",
    icon_color: "ffca85",
    text_color: "61ffca",
    bg_color: "15141b"
  },
  apprentice: {
    title_color: "ffffff",
    icon_color: "ffffaf",
    text_color: "bcbcbc",
    bg_color: "262626"
  },
  moltack: {
    title_color: "86092C",
    icon_color: "86092C",
    text_color: "574038",
    bg_color: "F5E1C0"
  },
  codeSTACKr: {
    title_color: "ff652f",
    icon_color: "FFE400",
    text_color: "ffffff",
    bg_color: "09131B",
    border_color: "0c1a25"
  },
  rose_pine: {
    title_color: "9ccfd8",
    icon_color: "ebbcba",
    text_color: "e0def4",
    bg_color: "191724"
  },
  catppuccin_latte: {
    title_color: "137980",
    icon_color: "8839ef",
    text_color: "4c4f69",
    bg_color: "eff1f5"
  },
  catppuccin_mocha: {
    title_color: "94e2d5",
    icon_color: "cba6f7",
    text_color: "cdd6f4",
    bg_color: "1e1e2e"
  },
  date_night: {
    title_color: "DA7885",
    text_color: "E1B2A2",
    icon_color: "BB8470",
    border_color: "170F0C",
    bg_color: "170F0C"
  },
  one_dark_pro: {
    title_color: "61AFEF",
    text_color: "E5C06E",
    icon_color: "C678DD",
    border_color: "3B4048",
    bg_color: "23272E"
  },
  rose: {
    title_color: "8d192b",
    text_color: "862931",
    icon_color: "B71F36",
    border_color: "e9d8d4",
    bg_color: "e9d8d4"
  },
  holi: {
    title_color: "5FABEE",
    text_color: "D6E7FF",
    icon_color: "5FABEE",
    border_color: "85A4C0",
    bg_color: "030314"
  },
  neon: {
    title_color: "00EAD3",
    text_color: "FF449F",
    icon_color: "00EAD3",
    border_color: "ffffff",
    bg_color: "000000"
  },
  blue_navy: {
    title_color: "82AAFF",
    text_color: "82AAFF",
    icon_color: "82AAFF",
    border_color: "ffffff",
    bg_color: "000000"
  },
  calm_pink: {
    title_color: "e07a5f",
    text_color: "edae49",
    icon_color: "ebcfb2",
    border_color: "e1bc29",
    bg_color: "2b2d40"
  },
  ambient_gradient: {
    title_color: "ffffff",
    text_color: "ffffff",
    icon_color: "ffffff",
    bg_color: "35,4158d0,c850c0,ffcc70"
  },
  watchdog: {
    title_color: "fe428e",
    icon_color: "f8d847",
    text_color: "a9fef7",
    bg_color: "45,520806,021D4A",
    border_color: "e4e2e2"
  }
};

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
  return axios({
    url: "https://api.github.com/graphql",
    method: "post",
    headers,
    data
  });
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
  const themesMap = themes;
  const defaultTheme = themesMap[fallbackTheme];
  if (!defaultTheme) {
    throw new Error(`Fallback theme '${fallbackTheme}' not found`);
  }
  const selectedTheme = themesMap[theme || ""] || defaultTheme;
  const defaultBorderColor = selectedTheme.border_color || defaultTheme.border_color;
  const titleColor = fallbackColor(
    title_color || selectedTheme.title_color,
    `#${defaultTheme.title_color}`
  );
  const ringColor = fallbackColor(
    ring_color || selectedTheme.ring_color,
    titleColor
  );
  const iconColor = fallbackColor(
    icon_color || selectedTheme.icon_color,
    `#${defaultTheme.icon_color}`
  );
  const textColor = fallbackColor(
    text_color || selectedTheme.text_color,
    `#${defaultTheme.text_color}`
  );
  const bgColor = fallbackColor(
    bg_color || selectedTheme.bg_color,
    `#${defaultTheme.bg_color}`
  );
  const borderColor = fallbackColor(
    border_color || defaultBorderColor,
    `#${defaultBorderColor}`
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
    wrapped = wrap(encoded, { width }).split("\n");
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
var parseEmojis = (str) => {
  if (!str) throw new Error("[parseEmoji]: str argument not provided");
  const emojiMap = toEmoji;
  return str.replace(/:\w+:/gm, (emoji) => {
    return emojiMap.get(emoji) || "";
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
var require2 = createRequire(import.meta.url);
var languageColors = require2("../common/languageColors.json");
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
      d: `M ${sx} ${sy} A ${Number(radius.toFixed(6))} ${Number(radius.toFixed(6))} 0 ${largeArc} 0 ${ex} ${ey} ${sx}`
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
var PATs = Object.keys(process.env).filter(
  (key) => /PAT_\d*$/.exec(key)
).length;
var RETRIES = process.env.NODE_ENV === "test" ? 7 : PATs;
var retryer = async (fetcher, variables, retries = 0) => {
  if (!RETRIES) {
    throw new CustomError("No GitHub API tokens found", CustomError.NO_TOKENS);
  }
  if (retries > RETRIES) {
    throw new CustomError(
      "Downtime due to GitHub API rate limiting",
      CustomError.MAX_RETRY
    );
  }
  try {
    const response = await fetcher(
      variables,
      process.env[`PAT_${retries + 1}`] || "",
      // used in tests for faking rate limit
      retries
    );
    const errors = response?.data?.errors;
    const errorType = errors?.[0]?.type;
    const errorMsg = errors?.[0]?.message || "";
    const isRateLimited = errors && errorType === "RATE_LIMITED" || /rate limit/i.test(errorMsg);
    if (isRateLimited) {
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