import { db } from "@/utils/db";
import { readFile } from "@/utils/filesystem";
import { parseTaskList, TaskList } from "@/utils/task-list";

interface Item {
  todoFileId: number;
  doneFileId?: number;
}

export async function getTodoFileIds(): Promise<Item[]> {
  const list = await db.fileIds.list();
  return list.length > 0 ? list[0].items : [];
}

export async function reorderTodoFileIds(todoFileIds: number[]): Promise<void> {
  const list = await db.fileIds.list();
  const firstEntry = list.length > 0 ? list[0] : null;
  if (firstEntry) {
    const itemMap = new Map<number, Item>();
    firstEntry.items.forEach((item) => {
      itemMap.set(item.todoFileId, item);
    });

    const reorderedItems: Item[] = todoFileIds
      .map((todoFileId) => itemMap.get(todoFileId))
      .filter((item) => item !== undefined);

    const newEntry = { ...firstEntry, items: reorderedItems };
    await db.fileIds.update(newEntry);
  }
}

export async function getDoneFileId(
  todoFileId: number,
): Promise<number | undefined> {
  const ids = await getTodoFileIds();
  return ids.find((i) => i.todoFileId === todoFileId)?.doneFileId;
}

export async function addTodoFileId(id: number) {
  const list = await db.fileIds.list();
  const firstEntry = list.length > 0 ? list[0] : null;
  if (firstEntry) {
    const newIds = {
      ...firstEntry,
      items: [...firstEntry.items, { todoFileId: id }],
    };
    await db.fileIds.update(newIds);
  } else {
    const newIds = { items: [{ todoFileId: id }] };
    await db.fileIds.create(newIds);
  }
}

export async function addDoneFileId(todoFileId: number, doneFileId: number) {
  const result = await db.fileIds.list();
  const firstEntry = result.length > 0 ? result[0] : null;
  if (!firstEntry) {
    console.debug("Missing id list");
    return;
  }

  const newItems = firstEntry.items.map((item) => {
    if (item.todoFileId === todoFileId) {
      return {
        ...item,
        doneFileId,
      };
    } else {
      return item;
    }
  });

  const newEntry = { ...firstEntry, items: newItems };
  await db.fileIds.update(newEntry);
}

export async function removeDoneFileId(id: number) {
  const result = await db.fileIds.list();
  const firstEntry = result.length > 0 ? result[0] : null;
  if (!firstEntry) {
    console.debug("Missing id list");
    return;
  }

  const newItems = firstEntry.items.map((item) => {
    if (item.doneFileId !== id) {
      return {
        todoFileId: id,
      };
    } else {
      return item;
    }
  });

  const newEntry = { ...firstEntry, items: newItems };
  await db.fileIds.update(newEntry);
}

export async function removeTodoFileId(id: number) {
  const result = await db.fileIds.list();
  const firstEntry = result.length > 0 ? result[0] : null;
  if (!firstEntry) {
    console.debug("Missing id list");
    return;
  }
  const newItems = firstEntry.items.filter((i) => i.todoFileId !== id);
  const newEntry = { ...firstEntry, items: newItems };
  await db.fileIds.update(newEntry);
}

export async function loadTodoFileFromDisk(id: number): Promise<TaskList> {
  const { content, filename } = await readFile(id);
  const parseResult = parseTaskList(content);
  return {
    ...parseResult,
    id,
    filename,
  };
}
