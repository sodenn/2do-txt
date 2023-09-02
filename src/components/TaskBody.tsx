import { Task, useFormatBody } from "@/utils/task";
import { styled } from "@mui/material";

interface TaskBodyProps {
  task: Task;
}

const TextContainer = styled("span")({
  fontSize: "0.9em",
  hyphens: "auto",
});

export function TaskBody({ task }: TaskBodyProps) {
  const formatBody = useFormatBody();
  return <TextContainer>{formatBody(task)}</TextContainer>;
}
