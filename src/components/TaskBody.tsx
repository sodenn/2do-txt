import { styled } from "@mui/material";
import React from "react";
import { Task, useFormatBody } from "../utils/task";

interface TaskBodyProps {
  task: Task;
}

const TextContainer = styled("span")`
  font-size: 0.9em;
`;

const TaskBody = ({ task }: TaskBodyProps) => {
  const formatBody = useFormatBody();
  return <TextContainer>{formatBody(task)}</TextContainer>;
};

export default TaskBody;
