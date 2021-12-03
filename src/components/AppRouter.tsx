import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useSearchParams,
} from "react-router-dom";
import { useFilter } from "../data/FilterContext";
import Page from "./Page";
import PrivacyPolicy from "./PrivacyPolicy";

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
  const [searchParams, setSearchParams] = useSearchParams();

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
    const term = searchParams.get("term");
    if (term) {
      setSearchTerm(term);
    }

    const priorities = searchParams.get("priorities");
    if (priorities) {
      setSelectedPriorities(priorities.split(","));
    }

    const projects = searchParams.get("projects");
    if (projects) {
      setSelectedProjects(projects.split(","));
    }

    const contexts = searchParams.get("contexts");
    if (contexts) {
      setSelectedContexts(contexts.split(","));
    }

    const tags = searchParams.get("tags");
    if (tags) {
      setSelectedTags(tags.split(","));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params: Partial<SearchParams & { platform?: string }> = {};
    const platform = searchParams.get("platform");

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
    if (platform) {
      params.platform = platform;
    }

    if (Object.keys(params).length > 0) {
      setSearchParams(params);
    } else if (searchParams.entries().next()) {
      setSearchParams({});
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
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
    </Routes>
  );
};

export default AppRouter;
