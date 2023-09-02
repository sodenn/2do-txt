import CloseOutlined from "@mui/icons-material/CloseOutlined";
import SearchIcon from "@mui/icons-material/Search";
import {
  alpha,
  IconButton,
  InputBase,
  InputBaseProps,
  styled,
} from "@mui/material";
import { useTranslation } from "react-i18next";

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
  [theme.breakpoints.down("lg")]: {
    width: "100%",
  },
  "& .MuiInputBase-input": {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    transition: theme.transitions.create("width"),
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "12ch",
      "&:focus": {
        width: "20ch",
      },
    },
  },
}));

interface SearchInputProps extends InputBaseProps {
  onReset?: () => void;
}

export function SearchInput(props: SearchInputProps) {
  const { value, onReset, onChange, ...rest } = props;
  const { t } = useTranslation();

  const handleKeyDown = (event: any) => {
    if (event.key === "Escape") {
      event.target.blur();
    }
  };

  return (
    <Search>
      <SearchIconWrapper>
        <SearchIcon color="action" />
      </SearchIconWrapper>
      <StyledInputBase
        endAdornment={
          <IconButton
            aria-label="Clear search term"
            size="small"
            sx={{
              mr: 1,
              visibility: value && onReset ? "visible" : "hidden",
            }}
            onClick={onReset}
          >
            <CloseOutlined fontSize="inherit" />
          </IconButton>
        }
        value={value}
        onKeyDown={handleKeyDown}
        onChange={onChange}
        placeholder={t("Search…")}
        inputProps={{
          "aria-label": "Search for tasks",
          autoCorrect: "off",
          autoCapitalize: "off",
          spellCheck: "false",
          tabIndex: -1,
          role: "search",
        }}
        {...rest}
      />
    </Search>
  );
}
