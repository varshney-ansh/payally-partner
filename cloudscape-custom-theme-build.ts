import { join } from 'path';
import { writeFileSync } from 'fs';
import { generateThemeStylesheet } from '@cloudscape-design/components-themeable/theming';

const theme = {
    tokens: {
        fontFamilyBase: 'var(--font-google-sans-flex), Arial, Helvetica, sans-serif',
        // --- Border Radius Tokens (Global UI mapping) ---
        borderRadiusButton: "1000px",  // Maps to pill button style
        borderRadiusContainer: "30px", // Maps to card styling
        borderRadiusItem: "8px",       // Maps to tags/badges

        // --- Color Tokens (Mapped to Light & Dark modes) ---
        colorBackgroundLayoutMain: {
            light: "#FFFFFF",
            dark: "#002991"
        },
        colorBackgroundContainerContent: {
            light: "#FFFFFF",
            dark: "#002991"
        },
        colorTextAccent: {
            light: "#60CDFF",
            dark: "#B8E9FF"
        },
        colorTextInteractiveDefault: {
            light: "#002991",
            dark: "#60CDFF"
        },
        colorBorderButtonNormalDefault: {
            light: "#000000",
            dark: "#FFFFFF"
        },
        colorTextButtonNormalDefault: {
            light: "#000000",
            dark: "#FFFFFF"
        }
    }
};
const stylesheet = generateThemeStylesheet({ theme, selector: "body" });

writeFileSync(join(__dirname, './src/app/payally-theme.css'), stylesheet);