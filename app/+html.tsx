import { type PropsWithChildren } from "react";
import { ScrollViewStyleReset } from "expo-router/html";

/**
 * Root HTML for static web export / `expo start --web`.
 * Keeps the page full-viewport and sets desktop typography.
 */
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
        <meta name="theme-color" content="#141310" />
        <title>money-money</title>
        <ScrollViewStyleReset />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;0,9..144,600;1,9..144,600&family=Source+Sans+3:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <style dangerouslySetInnerHTML={{ __html: RESPONSIVE_STYLE }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const RESPONSIVE_STYLE = `
html, body, #root {
  height: 100%;
  margin: 0;
  background: #141310;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
body {
  font-family: "Source Sans 3", "Segoe UI", sans-serif;
  overflow: hidden;
}
input, textarea, button {
  font-family: inherit;
}
[role="button"], button, a {
  cursor: pointer;
}
* {
  box-sizing: border-box;
}
/* Softer scrollbars inside the phone frame */
*::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
*::-webkit-scrollbar-thumb {
  background: #4A4836;
  border-radius: 8px;
}
*::-webkit-scrollbar-track {
  background: transparent;
}
@media (max-width: 520px) {
  body {
    overflow: auto;
  }
}
`;
