import { Kbd } from "@/components/Kbd";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogTitle,
} from "@/components/ResponsiveDialog";
import { useShortcutsDialogStore } from "@/stores/shortcuts-dialog-store";
import { Table } from "@mui/joy";
import { useTranslation } from "react-i18next";

export function ShortcutsDialog() {
  const { t } = useTranslation();
  const { open: shortcutsDialogOpen, closeShortcutsDialog } =
    useShortcutsDialogStore();
  return (
    <ResponsiveDialog
      fullWidth
      fullScreen={false}
      open={shortcutsDialogOpen}
      onClose={closeShortcutsDialog}
    >
      <ResponsiveDialogTitle>{t("Keyboard Shortcuts")}</ResponsiveDialogTitle>
      <ResponsiveDialogContent>
        <Table>
          <thead>
            <tr>
              <td>{t("Key")}</td>
              <td>{t("Description")}</td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <Kbd>F</Kbd>
              </td>
              <td>{t("F")}</td>
            </tr>
            <tr>
              <td>
                <Kbd>X</Kbd>
              </td>
              <td>{t("X")}</td>
            </tr>
            <tr>
              <td>
                <Kbd>M</Kbd>
              </td>
              <td>{t("M")}</td>
            </tr>
            <tr>
              <td>
                <Kbd>N</Kbd>
              </td>
              <td>{t("N")}</td>
            </tr>
            <tr>
              <td>
                <Kbd>E</Kbd>
              </td>
              <td>{t("E")}</td>
            </tr>
            <tr>
              <td>
                <Kbd>D</Kbd>
              </td>
              <td>{t("D")}</td>
            </tr>
          </tbody>
        </Table>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
