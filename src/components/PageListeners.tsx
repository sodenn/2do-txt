import { useUpdateFilterSearchParams } from "../data/filter-store";
import { useUpdateLanguage } from "../data/settings-store";
import { useShortcuts } from "../utils/shortcuts";

const PageListeners = () => {
  useShortcuts();
  useUpdateFilterSearchParams();
  useUpdateLanguage();
  return null;
};

export default PageListeners;
