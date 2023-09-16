import {
  THEME_ID as MATERIAL_THEME_ID,
  Experimental_CssVarsProvider as MaterialCssVarsProvider,
  experimental_extendTheme as materialExtendTheme,
} from "@mui/material/styles";
import { PropsWithChildren } from "react";

const materialTheme = materialExtendTheme();

export function MaterialTheme({ children }: PropsWithChildren) {
  return (
    <MaterialCssVarsProvider theme={{ [MATERIAL_THEME_ID]: materialTheme }}>
      {children}
    </MaterialCssVarsProvider>
  );
}
