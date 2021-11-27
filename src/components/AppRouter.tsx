import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useFilter } from "../data/FilterContext";
import Page from "./Page";

interface SearchParams {
  term: string;
  projects: string;
  contexts: string;
  tags: string;
  priorities: string;
}

const AppRouter = () => {
  return (
    <Router basename={process.env.REACT_APP_BASE_PATH}>
      <AppRouters />
    </Router>
  );
};

export const AppRouters = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    searchTerm,
    selectedPriorities,
    selectedProjects,
    selectedContexts,
    selectedTags,
    hideCompletedTasks,
    setSearchTerm,
    setSelectedPriorities,
    setSelectedProjects,
    setSelectedContexts,
    setSelectedTags,
  } = useFilter();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const term = params.get("term");
    if (term) {
      setSearchTerm(term);
    }

    const priorities = params.get("priorities");
    if (priorities) {
      setSelectedPriorities(priorities.split(","));
    }

    const projects = params.get("projects");
    if (projects) {
      setSelectedProjects(projects.split(","));
    }

    const contexts = params.get("contexts");
    if (contexts) {
      setSelectedContexts(contexts.split(","));
    }

    const tags = params.get("tags");
    if (tags) {
      setSelectedTags(tags.split(","));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params: Partial<SearchParams> = {};
    if (searchTerm) {
      params.term = searchTerm;
    }
    if (selectedPriorities.length > 0) {
      params.priorities = selectedPriorities.join(",");
    }
    if (selectedProjects.length > 0) {
      params.projects = selectedProjects.join(",");
    }
    if (selectedContexts.length > 0) {
      params.contexts = selectedContexts.join(",");
    }
    if (selectedTags.length > 0) {
      params.tags = selectedTags.join(",");
    }
    if (Object.keys(params).length > 0) {
      navigate({
        pathname: location.pathname,
        search: "?" + new URLSearchParams(params),
      });
    } else if (location.search !== "") {
      navigate({
        pathname: location.pathname,
        search: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchTerm,
    selectedPriorities,
    selectedProjects,
    selectedContexts,
    selectedTags,
    hideCompletedTasks,
  ]);

  return (
    <Routes>
      <Route path="/" element={<Page />} />
    </Routes>
  );
};

export default AppRouter;
