import { useCloudStorage } from "@/utils/CloudStorage";
import CloudFileImportButtons from "@/components/CloudFileImportButtons";
import CloudStorageConnectionButtons from "@/components/CloudStorageConnectionButtons";

export default function CloudStorageOnboarding() {
  const { cloudStorages } = useCloudStorage();
  return (
    <>
      <CloudFileImportButtons />
      {cloudStorages.length === 0 && (
        <CloudStorageConnectionButtons status="connect" />
      )}
    </>
  );
}
