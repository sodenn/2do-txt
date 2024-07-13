import { useBreakpoint } from "@/components/Breakpoint";
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
import { PropsWithChildren, useEffect, useState } from "react";

interface ResponsiveDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ResponsiveDialog({
  children,
  ...props
}: PropsWithChildren<ResponsiveDialogProps>) {
  const [open, setOpen] = useState(!!props.open);
  const { isBreakpointActive } = useBreakpoint();

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    props.onOpenChange?.(open);
  };

  useEffect(() => {
    if (typeof props.open === "boolean" && open !== props.open) {
      setOpen(props.open);
      props.onOpenChange?.(props.open);
    }
  }, [open, props]);

  if (isBreakpointActive("lg")) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {children}
      </Dialog>
    );
  }

  return (
    <Drawer shouldScaleBackground open={open} onOpenChange={handleOpenChange}>
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
  return <DrawerHeader className="text-left">{children}</DrawerHeader>;
}

export function ResponsiveDialogTitle({ children }: PropsWithChildren) {
  const { isBreakpointActive } = useBreakpoint();
  if (isBreakpointActive("lg")) {
    return <DialogTitle>{children}</DialogTitle>;
  }
  return <DrawerTitle>{children}</DrawerTitle>;
}

export function ResponsiveDialogDescription({ children }: PropsWithChildren) {
  const { isBreakpointActive } = useBreakpoint();
  if (isBreakpointActive("lg")) {
    return <DialogDescription>{children}</DialogDescription>;
  }
  return <DrawerDescription>{children}</DrawerDescription>;
}

export function ResponsiveDialogContent({ children }: PropsWithChildren) {
  const { isBreakpointActive } = useBreakpoint();

  if (isBreakpointActive("lg")) {
    return (
      <DialogContent className="flex max-h-[95%] flex-col overflow-hidden px-0">
        {children}
      </DialogContent>
    );
  }

  return (
    <DrawerContent className="flex max-h-[95%] flex-col overflow-hidden px-0">
      {children}
    </DrawerContent>
  );
}

export function ResponsiveDialogBody({ children }: PropsWithChildren) {
  const { isBreakpointActive } = useBreakpoint();
  if (isBreakpointActive("lg")) {
    return <div className="flex-1 overflow-y-auto px-6">{children}</div>;
  }
  return <div className="flex-1 overflow-y-auto px-4">{children}</div>;
}

export function ResponsiveDialogFooter({ children }: PropsWithChildren) {
  const { isBreakpointActive } = useBreakpoint();
  if (isBreakpointActive("lg")) {
    return <DialogFooter className="px-6">{children}</DialogFooter>;
  }
  return <DrawerFooter className="flex-row">{children}</DrawerFooter>;
}

export function ResponsiveDialogClose({ children }: PropsWithChildren) {
  const { isBreakpointActive } = useBreakpoint();
  if (isBreakpointActive("lg")) {
    return <DialogClose asChild>{children}</DialogClose>;
  }
  return <DrawerClose asChild>{children}</DrawerClose>;
}
