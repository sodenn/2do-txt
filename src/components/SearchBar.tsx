import { CloseOutlined } from "@mui/icons-material";
import SearchIcon from "@mui/icons-material/Search";
import { alpha, IconButton, InputBase, styled } from "@mui/material";
import { ChangeEvent, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useFilter } from "../data/FilterContext";
import { useAddShortcutListener } from "../utils/shortcuts";

const Search = styled("div")(({ theme }) => {
  const backgroundColor =
    theme.palette.mode === "light"
      ? alpha(theme.palette.common.black, 0.1)
      : alpha(theme.palette.common.white, 0.15);
  const backgroundColorHover =
    theme.palette.mode === "light"
      ? alpha(theme.palette.common.black, 0.15)
      : alpha(theme.palette.common.white, 0.25);
  return {
    position: "relative",
    borderRadius: theme.shape.borderRadius,
    backgroundColor: backgroundColor,
    "&:hover": {
      backgroundColor: backgroundColorHover,
    },
    marginLeft: 0,
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing(1),
      width: "auto",
    },
  };
});

const SearchIconWrapper = styled("div")(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: "100%",
  position: "absolute",
  pointerEvents: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: "inherit",
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      width: "12ch",
      "&:focus": {
        width: "20ch",
      },
    },
  },
}));

const SearchBar = () => {
  const { t } = useTranslation();
  const { searchTerm, setSearchTerm } = useFilter();
  const searchInputRef = useRef<HTMLInputElement>(null);

  useAddShortcutListener(
    () => {
      searchInputRef.current?.focus();
    },
    "f",
    [searchInputRef.current]
  );

  const handleKeyDown = (event: any) => {
    if (event.key === "Escape") {
      searchInputRef.current?.blur();
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <Search>
      <SearchIconWrapper>
        <SearchIcon color="action" />
      </SearchIconWrapper>
      <StyledInputBase
        endAdornment={
          searchTerm && (
            <IconButton
              aria-label="Clear search term"
              size="small"
              sx={{ mr: 1 }}
              onClick={() => setSearchTerm("")}
            >
              <CloseOutlined fontSize="inherit" />
            </IconButton>
          )
        }
        inputRef={searchInputRef}
        value={searchTerm}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        placeholder={t("Search…")}
        inputProps={{
          "aria-label": "Search for tasks",
          tabIndex: -1,
          role: "search",
        }}
      />
    </Search>
  );
};

export default SearchBar;
