import { Task, useFormatBody } from "@/utils/task";

interface TaskBodyProps {
  task: Task;
}

export function TaskBody({ task }: TaskBodyProps) {
  const formatBody = useFormatBody();
  return (
    <span className="hyphens-auto text-[0.9em] sm:text-[length:inherit]">
      {formatBody(task)}
    </span>
  );
}
