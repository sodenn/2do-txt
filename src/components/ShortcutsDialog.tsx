import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import useShortcutsDialogStore from "@/stores/shortcuts-dialog-store";
import Kbd from "@/components/Kbd";

export default function ShortcutsDialog() {
  const { t } = useTranslation();
  const { open: shortcutsDialogOpen, closeShortcutsDialog } =
    useShortcutsDialogStore();
  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={shortcutsDialogOpen}
      onClose={closeShortcutsDialog}
    >
      <DialogTitle>{t("Keyboard Shortcuts")}</DialogTitle>
      <DialogContent>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("Key")}</TableCell>
              <TableCell>{t("Description")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                <Kbd>F</Kbd>
              </TableCell>
              <TableCell>{t("F")}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Kbd>X</Kbd>
              </TableCell>
              <TableCell>{t("X")}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Kbd>M</Kbd>
              </TableCell>
              <TableCell>{t("M")}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Kbd>N</Kbd>
              </TableCell>
              <TableCell>{t("N")}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Kbd>E</Kbd>
              </TableCell>
              <TableCell>{t("E")}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Kbd>D</Kbd>
              </TableCell>
              <TableCell>{t("D")}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={closeShortcutsDialog}>{t("Close")}</Button>
      </DialogActions>
    </Dialog>
  );
}
