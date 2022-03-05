import { SvgIcon, SvgIconProps } from "@mui/material";
import React from "react";

// Source: https://www.dropbox.com/sh/42f8d4kq6yt5lte/AACqjH2o8fnQQ8pV1D70np_9a/Glyph/Dropbox/SVG?dl=0&preview=DropboxGlyph_Blue.svg&subfolder_nav_tracking=1

const DropboxIcon = (props: SvgIconProps) => {
  return (
    <SvgIcon {...props} viewBox="0 0 235.45 200">
      <path
        className="cls-1"
        d="M58.86 0 0 37.5 58.86 75l58.87-37.5L58.86 0zM176.59 0l-58.86 37.5L176.59 75l58.86-37.5L176.59 0zM0 112.5 58.86 150l58.87-37.5L58.86 75 0 112.5zM176.59 75l-58.86 37.5 58.86 37.5 58.86-37.5L176.59 75zM58.86 162.5l58.87 37.5 58.86-37.5-58.86-37.5-58.87 37.5z"
      />
    </SvgIcon>
  );
};

export default DropboxIcon;
