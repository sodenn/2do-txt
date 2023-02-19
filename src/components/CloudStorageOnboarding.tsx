import { useCloudStorage } from "../stores/CloudStorageContext";
import CloudFileImportButtons from "./CloudFileImportButtons";
import CloudStorageConnectionButtons from "./CloudStorageConnectionButtons";

const CloudStorageOnboarding = () => {
  const { cloudStoragesConnectionStatus } = useCloudStorage();
  const notConnected = Object.values(cloudStoragesConnectionStatus).every(
    (connected) => !connected
  );
  return (
    <>
      <CloudFileImportButtons />
      {notConnected && <CloudStorageConnectionButtons status="connect" />}
    </>
  );
};

export default CloudStorageOnboarding;
