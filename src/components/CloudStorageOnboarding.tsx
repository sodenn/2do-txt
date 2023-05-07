import { useCloudStorage } from "../utils/CloudStorage";
import CloudFileImportButtons from "./CloudFileImportButtons";
import CloudStorageConnectionButtons from "./CloudStorageConnectionButtons";

const CloudStorageOnboarding = () => {
  const { cloudStorages } = useCloudStorage();
  return (
    <>
      <CloudFileImportButtons />
      {cloudStorages.length === 0 && (
        <CloudStorageConnectionButtons status="connect" />
      )}
    </>
  );
};

export default CloudStorageOnboarding;
