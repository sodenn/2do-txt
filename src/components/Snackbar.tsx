import { useMobileScreen } from "@/utils/useMobileScreen";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoIcon from "@mui/icons-material/Info";
import ReportIcon from "@mui/icons-material/Report";
import WarningIcon from "@mui/icons-material/Warning";
import {
  Alert,
  AlertProps,
  Box,
  IconButton,
  IconButtonProps,
  LinearProgress,
  Typography,
} from "@mui/joy";
import {
  PropsWithChildren,
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";
import { Toaster, toast } from "sonner";

interface SnackbarOptions {
  title?: ReactNode;
  message?: ReactNode;
  color?: AlertProps["color"];
  close?: boolean;
  loading?: boolean;
  preventDuplicate?: boolean;
  persistent?: boolean;
  renderAction?: (closeSnackbar: () => void) => ReactNode;
}

interface SnackbarItem
  extends Pick<SnackbarOptions, "title" | "message" | "loading" | "close"> {
  id: string | number;
}

const icons = {
  primary: <InfoIcon />,
  success: <CheckCircleIcon />,
  danger: <ReportIcon />,
  warning: <WarningIcon />,
  neutral: <InfoIcon />,
} as const;

const SnackbarContext = createContext<{
  openSnackbar: (options: SnackbarOptions) => string | number;
  closeSnackbar: (id: string | number) => void;
}>({
  openSnackbar: () => -1,
  closeSnackbar: () => void 0,
});

export function SnackbarActionButton(props: IconButtonProps) {
  return (
    <IconButton
      variant="plain"
      sx={{
        "--IconButton-size": "32px",
        transform: "translateX(5px)",
      }}
      {...props}
    />
  );
}

export function SnackbarProvider({ children }: PropsWithChildren) {
  const mobileScreen = useMobileScreen();
  const items = useRef<SnackbarItem[]>([]);

  const openSnackbar = useCallback(
    (options: SnackbarOptions = {}) => {
      const {
        title,
        message,
        renderAction,
        color = "neutral",
        close = true,
        loading = false,
        preventDuplicate = true,
        persistent = false,
      } = options;
      if (
        preventDuplicate &&
        items.current.some(
          (item) => item.title === title && item.message === message,
        )
      ) {
        return -1;
      }
      const icon = icons[color as keyof typeof icons];
      const newItem: SnackbarItem = { title, message, loading, close, id: -1 };
      items.current.push(newItem);
      toast.custom(
        (t) => {
          newItem.id = t;
          const handleDismiss = () => {
            toast.dismiss(newItem.id);
            items.current = items.current.filter((item) => item !== newItem);
          };
          return (
            <Alert
              variant="solid"
              color={color}
              invertedColors
              sx={{
                overflow: "hidden",
                minWidth: mobileScreen ? "100%" : 300,
              }}
              startDecorator={icon}
              endDecorator={
                <>
                  {renderAction && (
                    <Box sx={close ? { mr: 1 } : undefined}>
                      {renderAction(handleDismiss)}
                    </Box>
                  )}
                  {close && (
                    <SnackbarActionButton onClick={handleDismiss}>
                      <CloseRoundedIcon />
                    </SnackbarActionButton>
                  )}
                </>
              }
            >
              <div>
                {title && <Typography level="title-md">{title}</Typography>}
                {message && <Typography level="body-sm">{message}</Typography>}
                {loading && (
                  <LinearProgress
                    variant="soft"
                    sx={(theme) => ({
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      color: `rgb(${theme.vars.palette[color].lightChannel} / 0.72)`,
                      "--LinearProgress-radius": "0px",
                    })}
                  />
                )}
              </div>
            </Alert>
          );
        },
        {
          ...(persistent && { duration: Infinity }),
          onAutoClose: () => {
            items.current = items.current.filter((item) => item !== newItem);
          },
        },
      );
      return newItem.id;
    },
    [items, mobileScreen],
  );

  const closeSnackbar = useCallback((id: string | number) => {
    const item = items.current.find((item) => item.id === id);
    items.current = items.current.filter((item) => item.id !== id);
    const dismissTimeout = item?.loading && !item?.close;
    setTimeout(
      () => {
        toast.dismiss(id);
      },
      dismissTimeout ? 500 : 0,
    );
  }, []);

  const value = useMemo(
    () => ({
      openSnackbar,
      closeSnackbar,
    }),
    [closeSnackbar, openSnackbar],
  );

  return (
    <SnackbarContext.Provider value={value}>
      <Toaster position="bottom-center" expand offset={20} />
      {children}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  return useContext(SnackbarContext);
}
