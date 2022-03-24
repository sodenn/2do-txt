import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useSearchParams,
} from "react-router-dom";
import { useCloudStorage } from "../data/CloudStorageContext";
import { useFilter } from "../data/FilterContext";
import Page from "./Page";

interface SearchParams {
  term: string;
  projects: string;
  contexts: string;
  tags: string;
  priorities: string;
  active: string;
}

const AppRouter = () => {
  return (
    <Router basename={process.env.REACT_APP_BASE_PATH}>
      <AppRouters />
    </Router>
  );
};

export const AppRouters = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { requestTokens } = useCloudStorage();

  const {
    searchTerm,
    activeTaskListPath,
    activePriorities,
    activeProjects,
    activeContexts,
    activeTags,
    setSearchTerm,
    setActiveTaskListPath,
    setActivePriorities,
    setActiveProjects,
    setActiveContexts,
    setActiveTags,
  } = useFilter();

  useEffect(() => {
    const term = searchParams.get("term");
    if (term) {
      setSearchTerm(term);
    }

    const activeTaskListPath = searchParams.get("active");
    if (activeTaskListPath) {
      setActiveTaskListPath(decodeURIComponent(activeTaskListPath));
    }

    const priorities = searchParams.get("priorities");
    if (priorities) {
      setActivePriorities(priorities.split(","));
    }

    const projects = searchParams.get("projects");
    if (projects) {
      setActiveProjects(projects.split(","));
    }

    const contexts = searchParams.get("contexts");
    if (contexts) {
      setActiveContexts(contexts.split(","));
    }

    const tags = searchParams.get("tags");
    if (tags) {
      setActiveTags(tags.split(","));
    }

    const code = searchParams.get("code");
    if (code) {
      searchParams.delete("code");
      requestTokens({ cloudStorage: "Dropbox", authorizationCode: code });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params: Partial<SearchParams> = {};
    if (searchTerm) {
      params.term = searchTerm;
    }
    if (activeTaskListPath) {
      params.active = encodeURIComponent(activeTaskListPath);
    }
    if (activePriorities.length > 0) {
      params.priorities = activePriorities.join(",");
    }
    if (activeProjects.length > 0) {
      params.projects = activeProjects.join(",");
    }
    if (activeContexts.length > 0) {
      params.contexts = activeContexts.join(",");
    }
    if (activeTags.length > 0) {
      params.tags = activeTags.join(",");
    }
    setSearchParams(params);
  }, [
    searchTerm,
    activeTaskListPath,
    activePriorities,
    activeProjects,
    activeContexts,
    activeTags,
    setSearchParams,
  ]);

  return (
    <Routes>
      <Route path="/" element={<Page />} />
    </Routes>
  );
};

export default AppRouter;
