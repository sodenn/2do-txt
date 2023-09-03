import Box from "@mui/joy/Box";
import Divider from "@mui/joy/Divider";
import Modal, { ModalProps, modalClasses } from "@mui/joy/Modal";
import ModalClose from "@mui/joy/ModalClose";
import Sheet from "@mui/joy/Sheet";
import Typography from "@mui/joy/Typography";
import React from "react";

export interface DrawerProps extends Omit<ModalProps, "children"> {
  children: React.ReactNode;
  title: string;
  size?: number | string;
  position?: "left" | "right" | "top" | "bottom";
}

export function Drawer({
  children,
  title,
  position = "left",
  size = "clamp(256px, 30vw, 378px)",
  sx,
  ...props
}: DrawerProps) {
  return (
    <Modal
      keepMounted
      sx={[
        {
          transitionProperty: "visibility",
          transitionDelay: props.open ? "0s" : "300ms",
          [`& .${modalClasses.backdrop}`]: {
            opacity: props.open ? 1 : 0,
            transition: "opacity 0.3s ease",
          },
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...props}
    >
      <Sheet
        sx={{
          px: 2,
          py: 1.5,
          boxSizing: "border-box",
          position: "fixed",
          overflow: "auto",
          ...(position === "left" && {
            left: 0,
            transform: props.open ? "translateX(0)" : "translateX(-100%)",
          }),
          ...(position === "right" && {
            right: 0,
            transform: props.open ? "translateX(0)" : "translateX(100%)",
          }),
          ...(position === "top" && {
            top: 0,
            transform: props.open ? "translateY(0)" : "translateY(-100%)",
          }),
          ...(position === "bottom" && {
            bottom: 0,
            transform: props.open ? "translateY(0)" : "translateY(100%)",
          }),
          height: position.match(/(left|right)/) ? "100%" : size,
          width: position.match(/(top|bottom)/) ? "100vw" : size,
          boxShadow: "md",
          transition: "transform 0.3s ease",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography fontSize="lg" fontWeight="lg" sx={{ flex: 1 }}>
            {title}
          </Typography>
          <ModalClose sx={{ position: "initial" }} />
        </Box>
        <Divider sx={{ mt: 1, mb: 1.5 }} />
        {children}
      </Sheet>
    </Modal>
  );
}
