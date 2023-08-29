import { styled } from "@mui/material";
import { Task, useFormatBody } from "@/utils/task";

interface TaskBodyProps {
  task: Task;
}

const TextContainer = styled("span")({
  fontSize: "0.9em",
  hyphens: "auto",
});

export default function TaskBody({ task }: TaskBodyProps) {
  const formatBody = useFormatBody();
  return <TextContainer>{formatBody(task)}</TextContainer>;
}
