import {
  addKeyboardDidHideListener,
  addKeyboardDidShowListener,
  removeAllKeyboardListeners,
} from "@/native-api/keyboard";
import { useMobileScreen } from "@/utils/useMobileScreen";
import { Box, ModalDialogProps, Stack, styled } from "@mui/joy";
import Modal, { ModalProps } from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import ModalDialog from "@mui/joy/ModalDialog";
import Typography from "@mui/joy/Typography";
import { PropsWithChildren, useEffect, useState } from "react";
import { Transition } from "react-transition-group";
import {
  TransitionProps,
  TransitionStatus,
} from "react-transition-group/Transition";

interface ResponsiveDialogProps
  extends Pick<
      TransitionProps,
      "onExited" | "onEnter" | "onEntered" | "onExit"
    >,
    Pick<ModalProps, "onClose">,
    ModalDialogProps {
  open?: boolean;
  fullWidth?: boolean;
  fullScreen?: boolean;
}

const timeout = 250;

type TransitionStyles = Record<
  TransitionStatus,
  Record<string, string | number>
>;

interface Styles {
  modal: Record<string, string | number>;
  modalTransition: TransitionStyles;
  dialog: Record<string, string | number>;
  dialogTransition: TransitionStyles;
}

interface DialogStyles {
  fade: Styles;
  slide: Styles;
}

const SafeArea = styled("div", {
  shouldForwardProp: (prop) => prop !== "fullWidth",
})<{ fullWidth?: boolean }>(({ fullWidth }) => ({
  paddingRight: "env(safe-area-inset-right)",
  paddingLeft: "env(safe-area-inset-left)",
  paddingBottom: "env(safe-area-inset-bottom)",
  paddingTop: "env(safe-area-inset-top)",
  width: fullWidth ? "100%" : "unset",
}));

const SafeModalClose = styled(ModalClose)({
  marginRight: "env(safe-area-inset-right)",
  marginLeft: "env(safe-area-inset-left)",
  marginBottom: "env(safe-area-inset-bottom)",
  marginTop: "env(safe-area-inset-top)",
});

const dialogStyles: DialogStyles = {
  fade: {
    modal: {
      opacity: 0,
      backdropFilter: "none",
      transition: `opacity ${timeout}ms, backdrop-filter ${timeout}ms`,
    },
    modalTransition: {
      entering: { opacity: 1, backdropFilter: "blur(8px)" },
      entered: { opacity: 1, backdropFilter: "blur(8px)" },
      exiting: {},
      exited: {},
      unmounted: {},
    },
    dialog: {
      opacity: 0,
      transition: `opacity ${timeout}ms`,
    },
    dialogTransition: {
      entering: { opacity: 1 },
      entered: { opacity: 1 },
      exiting: {},
      exited: {},
      unmounted: {},
    },
  },
  slide: {
    modal: {},
    modalTransition: {
      entering: {},
      entered: {},
      exiting: {},
      exited: {},
      unmounted: {},
    },
    dialog: {
      transition: `transform ${timeout}ms ease-in-out`,
      transform: "translateY(100%)",
    },
    dialogTransition: {
      entering: {
        transform: "translateY(100%)",
      },
      entered: {
        transform: "translateY(0)",
      },
      exiting: {},
      exited: {},
      unmounted: {},
    },
  },
};

export function ResponsiveDialogTitle({ children }: PropsWithChildren) {
  const mobileScreen = useMobileScreen();
  return (
    <Typography
      fontSize="lg"
      fontWeight="lg"
      sx={{
        flex: 1,
        pt: "20px",
        pl: mobileScreen ? "55px" : "20px",
        pr: !mobileScreen ? "55px" : undefined,
        gridArea: "title",
      }}
    >
      {children}
    </Typography>
  );
}

export function ResponsiveDialogContent(props: PropsWithChildren) {
  const mobileScreen = useMobileScreen();
  const [root, setRoot] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    addKeyboardDidShowListener((info) => {
      root?.style.setProperty("padding-bottom", info.keyboardHeight + "px");
    });
    addKeyboardDidHideListener(() => {
      root?.style.removeProperty("padding-bottom");
    });
    return () => {
      removeAllKeyboardListeners();
    };
  }, [root]);

  return (
    <Box
      ref={setRoot}
      sx={{
        overflowY: "auto",
        overflowX: "hidden",
        gridArea: "content",
        px: "20px",
        ...(mobileScreen && {
          height: "100%",
        }),
      }}
    >
      {props.children}
    </Box>
  );
}

export function ResponsiveDialogActions({ children }: PropsWithChildren) {
  const mobileScreen = useMobileScreen();
  return (
    <Stack
      direction="row"
      spacing={1}
      justifyContent="end"
      sx={{
        gridArea: "actions",
        ...(!mobileScreen && {
          px: "20px",
          pb: "20px",
        }),
        ...(mobileScreen && {
          position: "relative",
          top: "-3px", // align with modal close button
          pt: "20px",
          pr: "20px",
        }),
      }}
    >
      {children}
    </Stack>
  );
}

function CenterLayout({ children }: PropsWithChildren) {
  return (
    <Box
      sx={{
        height: "100%",
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "auto 1fr auto",
        gridTemplateAreas: `
          "title"
          "content"
          "actions"
        `,
        gap: 2,
      }}
    >
      {children}
    </Box>
  );
}

function FullScreenLayout({ children }: PropsWithChildren) {
  return (
    <Box
      sx={{
        height: "100%",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gridTemplateRows: "auto 1fr",
        gridTemplateAreas: `
          "title actions"
          "content content"
        `,
        alignItems: "start",
        position: "relative",
        top: "-4px", // align with modal close button
        gap: 1,
      }}
    >
      {children}
    </Box>
  );
}

export function ResponsiveDialog(props: ResponsiveDialogProps) {
  const {
    open,
    onClose,
    children,
    fullWidth,
    onExited,
    onExit,
    onEntered,
    onEnter,
    fullScreen: fullScreenProp,
    sx,
    ...other
  } = props;
  const mobileScreen = useMobileScreen();
  const fullScreen =
    typeof fullScreenProp === "boolean" ? fullScreenProp : mobileScreen;
  const [renderModal, setRenderModal] = useState(false);

  const styles = fullScreen ? dialogStyles.slide : dialogStyles.fade;

  const handleExited = (node: HTMLElement) => {
    setRenderModal(false);
    onExited?.(node);
  };

  useEffect(() => {
    if (open) {
      setRenderModal(true);
    }
  }, [open]);

  return (
    <Transition
      in={open}
      timeout={timeout}
      onEnter={onEnter}
      onEntered={onEntered}
      onExit={onExit}
      onExited={handleExited}
    >
      {(state: TransitionStatus) => (
        <Modal
          keepMounted
          open={!["exited", "exiting"].includes(state)}
          onClose={onClose}
          hideBackdrop={fullScreen}
          slotProps={{
            backdrop: {
              sx: {
                ...styles.modal,
                ...styles.modalTransition[state],
              },
            },
          }}
          sx={{
            visibility: state === "exited" ? "hidden" : "visible",
          }}
        >
          <ModalDialog
            layout={fullScreen ? "fullscreen" : "center"}
            sx={{
              p: 0, // define padding on title, content and action instead
              // @ts-ignore
              ...(!fullScreen && {
                width: fullWidth ? "100%" : "unset",
                maxWidth: "600px",
              }),
              ...styles.dialog,
              ...styles.dialogTransition[state],
              ...sx,
            }}
            {...other}
          >
            {renderModal && (
              <SafeArea fullWidth={fullWidth}>
                <SafeModalClose
                  aria-label="Close"
                  sx={
                    fullScreen
                      ? { right: "unset", left: "var(--ModalClose-inset, 8px)" }
                      : undefined
                  }
                />
                {fullScreen && <FullScreenLayout>{children}</FullScreenLayout>}
                {!fullScreen && <CenterLayout>{children}</CenterLayout>}
              </SafeArea>
            )}
          </ModalDialog>
        </Modal>
      )}
    </Transition>
  );
}
