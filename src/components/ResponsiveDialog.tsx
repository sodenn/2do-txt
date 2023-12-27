import {
  addKeyboardDidHideListener,
  addKeyboardDidShowListener,
  removeAllKeyboardListeners,
} from "@/native-api/keyboard";
import { useMobileScreen } from "@/utils/useMobileScreen";
import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  ButtonProps,
  IconButton,
  ModalDialogProps,
  Stack,
  styled,
} from "@mui/joy";
import Modal, { ModalProps } from "@mui/joy/Modal";
import ModalDialog from "@mui/joy/ModalDialog";
import Typography from "@mui/joy/Typography";
import {
  Children,
  PropsWithChildren,
  cloneElement,
  forwardRef,
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
  disableFullscreen?: boolean;
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

const SafeArea = styled("div")({
  paddingRight: "env(safe-area-inset-right)",
  paddingLeft: "env(safe-area-inset-left)",
  paddingBottom: "env(safe-area-inset-bottom)",
  paddingTop: "env(safe-area-inset-top)",
  overflow: "auto",
});

function CloseButton({ onClose, fullScreen }: CloseButtonProps) {
  return (
    <div style={{ gridArea: "close", justifySelf: "end" }}>
      <IconButton
        size="sm"
        variant="soft"
        color="neutral"
        onClick={(event) => onClose?.(event, "closeClick")}
        aria-label="Close"
        sx={{
          ...(fullScreen && { ml: 1.5, mb: 1 }),
          ...(!fullScreen && { mr: 2, my: 2 }),
        }}
      >
        <CloseIcon />
      </IconButton>
    </div>
  );
}

export function ResponsiveDialogTitle({
  children,
  fullScreen,
}: ResponsiveDialogChild) {
  return (
    <Typography
      fontSize={fullScreen ? "md" : "lg"}
      fontWeight="lg"
      sx={{
        ...(!fullScreen && { ml: 2, my: 2 }),
        ...(fullScreen && { mb: 1, justifySelf: "center" }),
        gridArea: "title",
        alignSelf: "center",
      }}
    >
      {children}
    </Typography>
  );
}

export function ResponsiveDialogContent({
  children,
  fullScreen,
}: ResponsiveDialogChild) {
  const [root, setRoot] = useState<HTMLDivElement | null>(null);
  const [divider, setDivider] = useState(false);

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

  useEffect(() => {
    if (!root) {
      return;
    }
    const callback = () => {
      const hasScrollbar = root.scrollHeight > root.clientHeight;
      setDivider(hasScrollbar);
    };
    const resizeObserver = new ResizeObserver(callback);
    const mutationObserver = new MutationObserver(callback);
    resizeObserver.observe(root);
    mutationObserver.observe(root, {
      childList: true,
      subtree: true,
    });
    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [root]);

  return (
    <Box
      ref={setRoot}
      sx={(theme) => ({
        overflowY: "auto",
        overflowX: "hidden",
        gridArea: "content",
        pb: 1,
        borderTopStyle: "solid",
        borderTopWidth: 1,
        borderColor: divider ? "var(--joy-palette-divider)" : "transparent",
        ...(!fullScreen && {
          px: 2,
          borderBottomStyle: "solid",
          borderBottomWidth: 1,
        }),
        ...(fullScreen && {
          px: 1.5,
        }),
        [theme.breakpoints.only("xs")]: {
          height: "100%",
        },
      })}
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
          py: 2,
          justifyContent: "end",
        }),
        ...(fullScreen && {
          mr: 1.5,
          mb: 1,
        }),
      }}
    >
      {children}
    </Stack>
  );
}

export function ResponsiveDialogSecondaryActions({
  children,
  fullScreen,
}: ResponsiveDialogChild) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        gridArea: "secondaryactions",
        ...(!fullScreen && {
          px: 2,
          py: 2,
          justifyContent: "start",
        }),
        ...(fullScreen && {
          pt: 2,
          justifyContent: "center",
        }),
      }}
    >
      {children}
    </Stack>
  );
}

export const ResponsiveDialogButton = forwardRef<
  HTMLButtonElement,
  ButtonProps
>((props, ref) => {
  const isMobileScreen = useMobileScreen();
  return <Button {...props} size={isMobileScreen ? "sm" : "md"} ref={ref} />;
});

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
          "secondaryactions actions"
        `,
        columnGap: 1.5,
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
          "secondaryactions secondaryactions secondaryactions"
        `,
        alignItems: "center",
        position: "relative",
        columnGap: 1.5,
        py: 1,
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
    disableFullscreen,
    sx,
    maxWidth = "sm",
    ...other
  } = props;
  const isMobileScreen = useMobileScreen();
  const fullScreen = disableFullscreen ? false : isMobileScreen;
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
              }),
              ...styles.dialog,
              ...styles.dialogTransition[state],
              ...sx,
            }}
            aria-hidden={state !== "entered"}
            {...(!fullScreen && { maxWidth })}
            {...other}
          >
            {renderModal && (
              <>
                {fullScreen && (
                  <SafeArea>
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
