import {
  getPreferencesItem,
  setPreferencesItem,
} from "@/native-api/preferences";

interface Item {
  todoFileId: string;
  doneFileId?: string;
}

export async function getTodoFileIds(): Promise<Item[]> {
  const itemsStr = await getPreferencesItem("todo-files");
  try {
    return itemsStr ? JSON.parse(itemsStr) : [];
  } catch (e) {
    await setPreferencesItem("todo-files", JSON.stringify([]));
    return [];
  }
}

export async function getDoneFileId(
  todoFileId: string,
): Promise<string | undefined> {
  const itemsStr = await getPreferencesItem("todo-files");
  const items: Item[] = itemsStr ? JSON.parse(itemsStr) : [];
  return items.find((i) => i.todoFileId === todoFileId)?.doneFileId;
}

export async function addTodoFileId(id: string) {
  const itemsStr = await getPreferencesItem("todo-files");
  let items: Item[] = [];
  try {
    items = itemsStr ? JSON.parse(itemsStr) : [];
  } catch (e) {
    //
  }
  const newItems: Item[] = [...items, { todoFileId: id }];
  await setPreferencesItem("todo-files", JSON.stringify(newItems));
}

export async function addDoneFileId(todoFileId: string, doneFileId: string) {
  const itemsStr = await getPreferencesItem("todo-files");
  if (itemsStr) {
    try {
      const items: Item[] = JSON.parse(itemsStr);
      const newItems = items.map((item) => {
        if (item.todoFileId === todoFileId) {
          return {
            ...item,
            doneFileId,
          };
        } else {
          return item;
        }
      });
      await setPreferencesItem("todo-files", JSON.stringify(newItems));
    } catch (e) {
      //
    }
  }
}

export async function removeTodoFileId(id: string) {
  const itemsStr = await getPreferencesItem("todo-files");
  if (itemsStr) {
    try {
      const items: Item[] = JSON.parse(itemsStr);
      const newItems = items.filter((i) => i.todoFileId !== id);
      await setPreferencesItem("todo-files", JSON.stringify(newItems));
    } catch (e) {
      //
    }
  }
}

export async function removeDoneFileId(id: string) {
  const itemsStr = await getPreferencesItem("todo-files");
  if (itemsStr) {
    try {
      const items: Item[] = JSON.parse(itemsStr);
      const newItems = items.map((i) => {
        if (i.doneFileId !== id) {
          return {
            todoFileId: id,
          };
        } else {
          return i;
        }
      });
      await setPreferencesItem("todo-files", JSON.stringify(newItems));
    } catch (e) {
      //
    }
  }
}
