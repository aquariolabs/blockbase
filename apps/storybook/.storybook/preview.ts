/// <reference types="vite/client" />

import type { Preview } from "@storybook/react-vite";
import { mswLoader } from "msw-storybook-addon/csf3";

import "@workspace/ui/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  loaders: [mswLoader()],
};

export default preview;
