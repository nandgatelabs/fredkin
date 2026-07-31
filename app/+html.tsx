import { type PropsWithChildren } from "react";
import { ScrollViewStyleReset } from "expo-router/html";

/** Root HTML for `expo start --web` / static export. */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta name="theme-color" content="#24231F" />
        <title>money-money</title>
        <ScrollViewStyleReset />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,600&family=Source+Sans+3:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: WEB_STYLE }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const WEB_STYLE = `
html, body, #root {
  height: 100%;
  margin: 0;
  background: #24231F;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
body {
  font-family: "Source Sans 3", "Segoe UI", sans-serif;
}
input, textarea, button {
  font-family: inherit;
}
input:focus, textarea:focus {
  outline: 2px solid rgba(232, 212, 138, 0.45);
  outline-offset: 1px;
}
[role="button"], button, a {
  cursor: pointer;
}
* {
  box-sizing: border-box;
}
*::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}
*::-webkit-scrollbar-thumb {
  background: #5C5748;
  border-radius: 8px;
}
*::-webkit-scrollbar-track {
  background: transparent;
}
`;
