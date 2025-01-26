import { Task, useFormatBody } from "@/utils/task";

interface TaskBodyProps {
  task: Task;
}

export function TaskBody({ task }: TaskBodyProps) {
  const formatBody = useFormatBody();
  return (
    <span className="text-[0.9em] hyphens-auto sm:text-[length:inherit]">
      {formatBody(task)}
    </span>
  );
}
