import { Kbd } from "@/components/Kbd";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogContent,
  ResponsiveDialogHeader,
  ResponsiveDialogHiddenDescription,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useShortcutsDialogStore } from "@/stores/shortcuts-dialog-store";
import { useTranslation } from "react-i18next";

export function ShortcutsDialog() {
  const { t } = useTranslation();
  const { open: shortcutsDialogOpen, closeShortcutsDialog } =
    useShortcutsDialogStore();

  return (
    <ResponsiveDialog open={shortcutsDialogOpen} onClose={closeShortcutsDialog}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {t("Keyboard Shortcuts")}
          </ResponsiveDialogTitle>
          <ResponsiveDialogHiddenDescription>
            Available keyboard shortcuts
          </ResponsiveDialogHiddenDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Key")}</TableHead>
                <TableHead>{t("Description")}</TableHead>
              </TableRow>
            </TableHeader>
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
        </ResponsiveDialogBody>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
