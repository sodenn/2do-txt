import { createSvgIcon } from "@mui/material";
import * as React from "react";
import { SVGProps } from "react";

const Logo = (props: SVGProps<SVGSVGElement>) => {
  const { style, ...rest } = props;
  return (
    <svg
      viewBox="0 0 1024 1024"
      xmlns="http://www.w3.org/2000/svg"
      xmlSpace="preserve"
      style={{
        fillRule: "evenodd",
        clipRule: "evenodd",
        strokeLinejoin: "round",
        strokeMiterlimit: 2,
        ...style,
      }}
      {...rest}
    >
      <path
        d="M132.696 117.041a5.06 5.06 0 0 0-5.057-5.057H70.43a5.06 5.06 0 0 0-5.057 5.057v57.209a5.06 5.06 0 0 0 5.057 5.057h57.209a5.06 5.06 0 0 0 5.057-5.057v-57.209Z"
        style={{
          fill: "#90caf9",
        }}
        transform="translate(-994.322 -1703.28) scale(15.2101)"
      />
      <text
        x={183.83}
        y={35.183}
        style={{
          fontFamily: "'Arial-Black','Arial Black',sans-serif",
          fontWeight: 900,
          fontSize: 12,
          fill: "#162331",
        }}
        transform="translate(-10122.2 -1303.77) scale(56.6162)"
      >
        {"x"}
      </text>
      <text
        x={106.492}
        y={205.58}
        style={{
          fontFamily: "'Arial-Black','Arial Black',sans-serif",
          fontWeight: 900,
          fontSize: 96,
          fill: "#162331",
        }}
        transform="matrix(6.17101 0 0 8.07967 -573.279 -948.48)"
      >
        {"[ \xA0]"}
      </text>
    </svg>
  );
};

const LogoIcon = createSvgIcon(<Logo />, "Logo");

export default LogoIcon;
