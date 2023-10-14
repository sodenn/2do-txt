import {
  addKeyboardDidHideListener,
  addKeyboardDidShowListener,
  removeAllKeyboardListeners,
} from "@/native-api/keyboard";
import { useMobileScreen } from "@/utils/useMobileScreen";
import CloseIcon from "@mui/icons-material/Close";
import { Box, IconButton, ModalDialogProps, Stack, styled } from "@mui/joy";
import Modal, { ModalProps } from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Typography from "@mui/joy/Typography";
import {
  Children,
  PropsWithChildren,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
} from "react";
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

interface ResponsiveDialogChild extends PropsWithChildren {
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

type CloseButtonProps = Pick<ResponsiveDialogProps, "onClose"> &
  ResponsiveDialogChild;

const SafeArea = styled("div", {
  shouldForwardProp: (prop) => prop !== "fullWidth" && prop !== "fullScreen",
})<{ fullWidth?: boolean }>(({ fullWidth }) => ({
  paddingRight: "env(safe-area-inset-right)",
  paddingLeft: "env(safe-area-inset-left)",
  paddingBottom: "env(safe-area-inset-bottom)",
  paddingTop: "env(safe-area-inset-top)",
  overflow: "auto",
  width: fullWidth ? "100%" : "unset",
}));

function CloseButton({ onClose, fullScreen }: CloseButtonProps) {
  return (
    <IconButton
      size="sm"
      variant="soft"
      color="neutral"
      onClick={(event) => onClose?.(event, "closeClick")}
      aria-label="Close"
      sx={{
        gridArea: "close",
        ...(fullScreen && { ml: 1 }),
        ...(!fullScreen && { mr: 2, mt: 2 }),
      }}
    >
      <CloseIcon />
    </IconButton>
  );
}

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

export function ResponsiveDialogTitle({
  children,
  fullScreen,
}: ResponsiveDialogChild) {
  return (
    <Typography
      fontSize="lg"
      fontWeight="lg"
      sx={{
        ...(!fullScreen && { ml: 2, mt: 2 }),
        gridArea: "title",
      }}
    >
      {children}
    </Typography>
  );
}

export function ResponsiveDialogContent({ children }: ResponsiveDialogChild) {
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
        px: { xs: 1, sm: 2 },
        ...(mobileScreen && {
          height: "100%",
        }),
      }}
    >
      {children}
    </Box>
  );
}

export function ResponsiveDialogActions({
  children,
  fullScreen,
}: ResponsiveDialogChild) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        gridArea: "actions",
        ...(!fullScreen && {
          px: 2,
          pb: 2,
          pt: 1,
          justifyContent: "end",
        }),
        ...(fullScreen && {
          mr: 1,
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
        gridTemplateColumns: "1fr auto",
        gridTemplateRows: "auto 1fr auto",
        gridTemplateAreas: `
          "title close"
          "content content"
          "actions actions"
        `,
        gap: 1,
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
        gridTemplateColumns: "auto 1fr auto",
        gridTemplateRows: "auto 1fr",
        gridTemplateAreas: `
          "close title actions"
          "content content content"
        `,
        alignItems: "center",
        position: "relative",
        gap: 1,
        py: 1,
        px: 0.5,
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

  const childrenClone = Children.map(children, (child) => {
    if (!isValidElement<ResponsiveDialogChild>(child)) {
      return child;
    }
    return cloneElement(child, { fullScreen });
  });

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
              ...(!fullScreen && {
                width: (theme) =>
                  fullWidth ? `calc(100% - 2 * ${theme.spacing(2)})` : "unset",
                maxWidth: "600px",
              }),
              ...styles.dialog,
              ...styles.dialogTransition[state],
              ...sx,
            }}
            aria-hidden={state !== "entered"}
            {...other}
          >
            {renderModal && (
              <>
                {fullScreen && (
                  <SafeArea fullWidth={fullWidth}>
                    <FullScreenLayout>
                      <CloseButton onClose={onClose} fullScreen />
                      {childrenClone}
                    </FullScreenLayout>
                  </SafeArea>
                )}
                {!fullScreen && (
                  <CenterLayout>
                    <CloseButton onClose={onClose} fullScreen={false} />
                    {childrenClone}
                  </CenterLayout>
                )}
              </>
            )}
          </ModalDialog>
        </Modal>
      )}
    </Transition>
  );
}
