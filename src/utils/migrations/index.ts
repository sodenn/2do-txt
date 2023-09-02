import { migrate1 } from "./migration1";
import { migrate2 } from "./migration2";

export async function migrate() {
  await migrate1().catch((error) => {
    console.error("Error while execute migration1", error);
  });
  await migrate2().catch((error) => {
    console.error("Error while execute migrate2", error);
  });
}
