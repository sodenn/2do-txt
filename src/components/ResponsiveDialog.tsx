import { useFullScreenDialog } from "@/utils/useFullScreenDialog";
import { Box, Stack } from "@mui/joy";
import Modal from "@mui/joy/Modal";
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
  > {
  open?: boolean;
  onClose?: () => void;
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
  const fullScreen = useFullScreenDialog();
  return (
    <Typography
      fontSize="lg"
      fontWeight="lg"
      sx={{
        flex: 1,
        marginLeft: fullScreen ? "35px" : undefined,
        marginRight: !fullScreen ? "35px" : undefined,
        gridArea: "title",
      }}
    >
      {children}
    </Typography>
  );
}

export function ResponsiveDialogContent(props: PropsWithChildren) {
  return (
    <Box
      sx={{
        gridArea: "content",
      }}
    >
      {props.children}
    </Box>
  );
}

export function ResponsiveDialogActions({ children }: PropsWithChildren) {
  return (
    <Stack
      direction="row"
      spacing={1}
      justifyContent="end"
      sx={{
        gridArea: "actions",
        position: "relative",
        top: "-3px",
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
        display: "grid",
        gridTemplateColumns: "1fr",
        gridTemplateRows: "auto 1fr auto",
        gridTemplateAreas: `
          "title"
          "content"
          "actions"
        `,
        position: "relative",
        top: "-4px",
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
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gridTemplateRows: "1fr auto",
        gridTemplateAreas: `
          "title actions"
          "content content"
        `,
        alignItems: "start",
        position: "relative",
        top: "-4px",
        gap: 2,
      }}
    >
      {children}
    </Box>
  );
}

export function ResponsiveDialog(
  props: PropsWithChildren<ResponsiveDialogProps>,
) {
  const {
    open,
    onClose,
    children,
    fullWidth,
    onExited,
    onExit,
    onEntered,
    onEnter,
  } = props;
  const _fullScreen = useFullScreenDialog();
  const fullScreen =
    typeof props.fullScreen === "boolean" ? props.fullScreen : _fullScreen;
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
              // @ts-ignore
              ...(!fullScreen && {
                width: fullWidth ? "100%" : "unset",
                maxWidth: "600px",
              }),
              ...styles.dialog,
              ...styles.dialogTransition[state],
            }}
          >
            {renderModal && (
              <>
                <ModalClose
                  sx={
                    fullScreen
                      ? { right: "unset", left: "var(--ModalClose-inset, 8px)" }
                      : undefined
                  }
                />
                {fullScreen && <FullScreenLayout>{children}</FullScreenLayout>}
                {!fullScreen && <CenterLayout>{children}</CenterLayout>}
              </>
            )}
          </ModalDialog>
        </Modal>
      )}
    </Transition>
  );
}
