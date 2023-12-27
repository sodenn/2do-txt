import { Task, useFormatBody } from "@/utils/task";
import { styled } from "@mui/joy";

interface TaskBodyProps {
  task: Task;
}

const TextContainer = styled("span")(({ theme }) => ({
  [theme.breakpoints.only("xs")]: {
    fontSize: "0.9em",
  },
  hyphens: "auto",
}));

export function TaskBody({ task }: TaskBodyProps) {
  const formatBody = useFormatBody();
  return <TextContainer>{formatBody(task)}</TextContainer>;
}
