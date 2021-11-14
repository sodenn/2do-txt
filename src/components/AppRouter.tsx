import { useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Switch,
  useHistory,
  useLocation,
} from "react-router-dom";
import { SortKey, useAppContext } from "../data/AppContext";
import Page from "./Page";

interface SearchParams {
  term: string;
  sort: string;
  projects: string;
  contexts: string;
  tags: string;
  priorities: string;
  hideCompletedTasks: "true";
}

const AppRouter = () => {
  return (
    <Router>
      <AppRouterSwitch />
    </Router>
  );
};

export const AppRouterSwitch = () => {
  const history = useHistory();
  const location = useLocation();
  const {
    searchTerm,
    sortBy,
    selectedPriorities,
    selectedProjects,
    selectedContexts,
    selectedTags,
    hideCompletedTasks,
    setSearchTerm,
    setSortBy,
    setSelectedPriorities,
    setSelectedProjects,
    setSelectedContexts,
    setSelectedTags,
    setHideCompletedTasks,
  } = useAppContext();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const term = params.get("term");
    if (term) {
      setSearchTerm(term);
    }

    const sortBy = params.get("sort") as SortKey;
    if (sortBy) {
      setSortBy(sortBy);
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

    const hideCompletedTasks = params.get("hideCompletedTasks");
    if (hideCompletedTasks === "true") {
      setHideCompletedTasks(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const params: Partial<SearchParams> = {};
    if (searchTerm) {
      params.term = searchTerm;
    }
    if (sortBy) {
      params.sort = sortBy;
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
    if (hideCompletedTasks) {
      params.hideCompletedTasks = "true";
    }
    if (Object.keys(params).length > 0) {
      history.push({
        pathname: location.pathname,
        search: "?" + new URLSearchParams(params),
      });
    } else if (location.search !== "") {
      history.push({
        pathname: location.pathname,
        search: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchTerm,
    sortBy,
    selectedPriorities,
    selectedProjects,
    selectedContexts,
    selectedTags,
    hideCompletedTasks,
  ]);

  return (
    <Switch>
      <Route path="/">
        <Page />
      </Route>
    </Switch>
  );
};

export default AppRouter;
