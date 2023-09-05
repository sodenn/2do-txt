import useMediaQuery from "@/utils/useMediaQuery";
import { Box, ButtonProps, Stack, useTheme } from "@mui/joy";
import Modal from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import ModalDialog from "@mui/joy/ModalDialog";
import Typography from "@mui/joy/Typography";
import React, { PropsWithChildren, useEffect, useState } from "react";
import { Transition } from "react-transition-group";
import { TransitionStatus } from "react-transition-group/Transition";

interface ResponsiveDialogProps {
  open?: boolean;
  onClose?: () => void;
  fullWidth?: boolean;
}

interface WithFullScreen {
  fullScreen?: boolean;
}

function getActionChildren(props: PropsWithChildren<WithFullScreen>) {
  return React.Children.map(props.children, (child) => {
    if (React.isValidElement<ButtonProps>(child)) {
      return React.cloneElement(child, {
        size: props.fullScreen ? "sm" : "md",
        ...(props.fullScreen && {
          sx: {
            //marginTop: "var(--ModalClose-inset, 8px)",
          },
        }),
      });
    }
    return child;
  });
}

function getLayoutChildren(
  props: PropsWithChildren<WithFullScreen>,
): React.ReactNode {
  return React.Children.map(props.children, (child) => {
    if (React.isValidElement<WithFullScreen>(child)) {
      return React.cloneElement(child, { fullScreen: props.fullScreen });
    }
    return child;
  });
}

export function ResponsiveDialogTitle({
  children,
  fullScreen,
}: PropsWithChildren<WithFullScreen>) {
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

export function ResponsiveDialogContent(
  props: PropsWithChildren<WithFullScreen>,
) {
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

export function ResponsiveDialogActions(
  props: PropsWithChildren<WithFullScreen>,
) {
  const children = getActionChildren(props);
  return (
    <Stack
      direction="row"
      spacing={1}
      justifyContent="end"
      sx={{
        gridArea: "actions",
      }}
    >
      {children}
    </Stack>
  );
}

function CenterLayout(props: PropsWithChildren<WithFullScreen>) {
  const children = getLayoutChildren(props);
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
        marginTop: "-4px",
        gap: 2,
      }}
    >
      {children}
    </Box>
  );
}

function FullScreenLayout(props: PropsWithChildren<WithFullScreen>) {
  const children = getLayoutChildren(props);
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
        alignItems: "baseline",
        marginTop: "-4px",
        gap: 1,
      }}
    >
      {children}
    </Box>
  );
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

export function ResponsiveDialog(
  props: PropsWithChildren<ResponsiveDialogProps>,
) {
  const { open, onClose, children, fullWidth } = props;
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("sm"));
  const [renderModal, setRenderModal] = useState(false);

  useEffect(() => {
    if (open) {
      setRenderModal(true);
    }
  }, [open]);

  const styles = fullScreen ? dialogStyles.slide : dialogStyles.fade;

  return (
    <Transition
      in={open}
      timeout={timeout}
      onExited={() => setRenderModal(false)}
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
                {fullScreen && (
                  <FullScreenLayout fullScreen={true}>
                    {children}
                  </FullScreenLayout>
                )}
                {!fullScreen && (
                  <CenterLayout fullScreen={false}>{children}</CenterLayout>
                )}
              </>
            )}
          </ModalDialog>
        </Modal>
      )}
    </Transition>
  );
}
