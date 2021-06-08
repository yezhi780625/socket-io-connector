import { injectGlobal } from "@emotion/css";
import {
  AppBar,
  Box,
  createTheme,
  CssBaseline,
  IconButton,
  ThemeProvider,
  Toolbar,
  Typography,
  useMediaQuery,
} from "@material-ui/core";
import LightIcon from "@material-ui/icons/Brightness4";
import DarkIcon from "@material-ui/icons/Brightness7";
import { memo, useCallback, useMemo, useState } from "react";
import Connector from "./pages/Connector";

const MODE = {
  DARK: "dark",
  LIGHT: "light",
};

injectGlobal`
html, body, #root {
  width:100vw;
  height:100vh;
  position:relative
}
`;

const App = () => {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [mode, setMode] = useState(() =>
    prefersDarkMode ? MODE.DARK : MODE.LIGHT
  );

  const switchMode = useCallback(() => {
    setMode((prev) => (prev === MODE.DARK ? MODE.LIGHT : MODE.DARK));
  }, []);

  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: "#3d91c2",
          },
        },
      }),
    [mode]
  );

  const match600 = useMediaQuery("(min-width: 600px)");

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <AppBar>
        <Toolbar>
          <Box flex={1}>
            <Typography variant={match600 ? "h4" : "h6"}>
              Socket.IO Connector
            </Typography>
          </Box>
          <IconButton
            onClick={switchMode}
            sx={{ color: muiTheme.palette.primary.contrastText }}
          >
            {mode === MODE.DARK ? <DarkIcon /> : <LightIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box pt={match600 ? 8 : 6}>
        <Connector />
      </Box>
    </ThemeProvider>
  );
};

export default memo(App);
