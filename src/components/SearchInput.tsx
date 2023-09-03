import { useForwardRef } from "@/utils/useForwardRef";
import CloseOutlined from "@mui/icons-material/CloseOutlined";
import SearchIcon from "@mui/icons-material/Search";
import { IconButton, Input, InputProps, styled } from "@mui/joy";
import { forwardRef } from "react";
import { useTranslation } from "react-i18next";

const Search = styled("div")(({ theme }) => {
  return {
    position: "relative",
    borderRadius: theme.radius.md,
    marginLeft: 0,
    width: "100%",
    [theme.breakpoints.up("sm")]: {
      marginLeft: theme.spacing(1),
      width: "auto",
    },
  };
});

const StyledInputBase = styled(Input)(({ theme }) => ({
  color: "inherit",
  [theme.breakpoints.down("lg")]: {
    width: "100%",
  },
  "& .MuiInput-input": {
    transition: "width 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
    width: "100%",
    [theme.breakpoints.up("md")]: {
      width: "12ch",
      "&:focus": {
        width: "20ch",
      },
    },
  },
  "& .MuiInput-endDecorator": {
    cursor: "text",
  },
}));

interface SearchInputProps extends InputProps {
  onReset?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (props, ref) => {
    const { value, onReset, onChange, ...rest } = props;
    const { t } = useTranslation();
    const forwardedRef = useForwardRef<HTMLInputElement>(ref);

    const handleKeyDown = (event: any) => {
      if (event.key === "Escape") {
        event.target.blur();
      }
    };

    const handleFocus = () => {
      if (!value) {
        forwardedRef.current?.focus();
      }
    };

    return (
      <Search>
        <StyledInputBase
          variant="soft"
          startDecorator={<SearchIcon />}
          endDecorator={
            <div onClick={handleFocus}>
              <IconButton
                variant="soft"
                aria-label="Clear search term"
                onClick={onReset}
                sx={{
                  visibility: value ? "visible" : "hidden",
                }}
              >
                <CloseOutlined fontSize="inherit" />
              </IconButton>
            </div>
          }
          value={value}
          onKeyDown={handleKeyDown}
          onChange={onChange}
          placeholder={t("Search…")}
          slotProps={{
            input: {
              "aria-label": "Search for tasks",
              autoCorrect: "off",
              autoCapitalize: "off",
              spellCheck: "false",
              tabIndex: -1,
              role: "search",
              ref: forwardedRef,
            },
          }}
          {...rest}
        />
      </Search>
    );
  },
);
