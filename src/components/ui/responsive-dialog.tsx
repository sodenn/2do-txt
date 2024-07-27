import { useBreakpoint } from "@/components/Breakpoint";
import { SafeArea } from "@/components/SafeArea";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { DismissableLayerProps } from "@radix-ui/react-dismissable-layer";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { PropsWithChildren, useCallback, useEffect, useState } from "react";

interface ResponsiveDialogProps {
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
  onExit?: () => void;
  disablePreventScroll?: boolean;
}

export function ResponsiveDialog({
  children,
  onOpen,
  onClose,
  onExit,
  disablePreventScroll,
  ...props
}: PropsWithChildren<ResponsiveDialogProps>) {
  const [open, setOpen] = useState(!!props.open);
  const { isBreakpointActive } = useBreakpoint();

  const handleOpen = useCallback(() => {
    setOpen(true);
    onOpen?.();
  }, [onOpen]);

  const handleClose = useCallback(() => {
    setOpen(false);
    onClose?.();
    setTimeout(() => {
      onExit?.();
    }, 200);
  }, [onClose, onExit]);

  const handleOpenChange = (open: boolean) => {
    if (open) {
      handleOpen();
    } else {
      handleClose();
    }
  };

  useEffect(() => {
    if (props.open === true && open !== props.open) {
      handleOpen();
    }
    if (props.open === false && open !== props.open) {
      handleClose();
    }
  }, [open, handleOpen, handleClose, props.open]);

  if (isBreakpointActive("lg")) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {children}
      </Dialog>
    );
  }

  return (
    <Drawer
      disablePreventScroll={disablePreventScroll}
      shouldScaleBackground
      open={open}
      onOpenChange={handleOpenChange}
    >
      {children}
    </Drawer>
  );
}

export function ResponsiveDialogTrigger({ children }: PropsWithChildren) {
  const { isBreakpointActive } = useBreakpoint();
  if (isBreakpointActive("lg")) {
    return <DialogTrigger asChild>{children}</DialogTrigger>;
  }
  return <DrawerTrigger asChild>{children}</DrawerTrigger>;
}

export function ResponsiveDialogHeader({ children }: PropsWithChildren) {
  const { isBreakpointActive } = useBreakpoint();
  if (isBreakpointActive("lg")) {
    return <DialogHeader className="px-6">{children}</DialogHeader>;
  }
  return (
    <DrawerHeader className="text-left">
      <SafeArea left right>
        {children}
      </SafeArea>
    </DrawerHeader>
  );
}

export function ResponsiveDialogTitle({ children }: PropsWithChildren) {
  const { isBreakpointActive } = useBreakpoint();
  if (isBreakpointActive("lg")) {
    return <DialogTitle>{children}</DialogTitle>;
  }
  return <DrawerTitle>{children}</DrawerTitle>;
}

export function ResponsiveDialogHiddenTitle({ children }: PropsWithChildren) {
  return (
    <VisuallyHidden.Root>
      <ResponsiveDialogTitle>{children}</ResponsiveDialogTitle>
    </VisuallyHidden.Root>
  );
}

export function ResponsiveDialogDescription({ children }: PropsWithChildren) {
  const { isBreakpointActive } = useBreakpoint();
  if (isBreakpointActive("lg")) {
    return <DialogDescription>{children}</DialogDescription>;
  }
  return <DrawerDescription>{children}</DrawerDescription>;
}

export function ResponsiveDialogHiddenDescription({
  children,
}: PropsWithChildren) {
  return (
    <VisuallyHidden.Root>
      <ResponsiveDialogDescription>{children}</ResponsiveDialogDescription>
    </VisuallyHidden.Root>
  );
}

export function ResponsiveDialogContent({
  children,
  onEscapeKeyDown,
  ...props
}: PropsWithChildren<Pick<DismissableLayerProps, "onEscapeKeyDown">>) {
  const { isBreakpointActive } = useBreakpoint();

  if (isBreakpointActive("lg")) {
    return (
      <DialogContent
        onEscapeKeyDown={onEscapeKeyDown}
        className="flex max-h-[95%] flex-col overflow-hidden px-0"
        {...props}
      >
        {children}
      </DialogContent>
    );
  }

  return (
    <DrawerContent
      className="flex max-h-[95%] flex-col overflow-hidden px-0"
      {...props}
    >
      {children}
    </DrawerContent>
  );
}

export function ResponsiveDialogBody({ children }: PropsWithChildren) {
  const { isBreakpointActive } = useBreakpoint();
  if (isBreakpointActive("lg")) {
    return <div className="flex-1 overflow-y-auto px-6">{children}</div>;
  }
  return (
    <SafeArea left right>
      <div className="px-4">{children}</div>
    </SafeArea>
  );
}

export function ResponsiveDialogFooter({ children }: PropsWithChildren) {
  const { isBreakpointActive } = useBreakpoint();
  if (isBreakpointActive("lg")) {
    return <DialogFooter className="px-6">{children}</DialogFooter>;
  }
  return (
    <SafeArea left right>
      <DrawerFooter className="flex-row justify-end">{children}</DrawerFooter>
    </SafeArea>
  );
}

export function ResponsiveDialogClose({ children }: PropsWithChildren) {
  const { isBreakpointActive } = useBreakpoint();
  if (isBreakpointActive("lg")) {
    return <DialogClose asChild>{children}</DialogClose>;
  }
  return <DrawerClose asChild>{children}</DrawerClose>;
}
