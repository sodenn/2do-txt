import { Box, Container, Link, Toolbar, Typography } from "@mui/material";
import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import logo from "../images/logo.png";
import { StyledAppBar } from "./Header";

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const platform = searchParams.get("platform") || "other";
  return (
    <Box>
      <StyledAppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              alignItems: "center",
            }}
          >
            <img src={logo} alt="Logo" height={24} />
            <Typography variant="h6" noWrap component="div" sx={{ ml: 1 }}>
              2do.txt
            </Typography>
          </Box>
        </Toolbar>
      </StyledAppBar>
      <Container>
        <Typography variant="h4" gutterBottom>
          {t("Privacy Policy")}
        </Typography>
        <Typography variant="body1" gutterBottom>
          <Trans
            i18nKey={
              platform === "web"
                ? "privacy_policy_body_web"
                : "privacy_policy_body"
            }
            components={{ s: <strong /> }}
          />
        </Typography>
        {platform === "web" && (
          <>
            <Typography variant="h5" gutterBottom>
              {t("privacy_policy_hosting")}
            </Typography>
            <Typography variant="body1" gutterBottom>
              {t("privacy_policy_body_1")}
            </Typography>
            <Typography variant="body1">
              <Trans i18nKey="privacy_policy_body_2">
                You should therefore also note the&nbsp;
                <Link
                  href="https://docs.github.com/en/github/site-policy/github-privacy-statement"
                  target="_blank"
                >
                  GitHub Privacy Policy
                </Link>
                .
              </Trans>
            </Typography>
          </>
        )}
      </Container>
    </Box>
  );
};

export default PrivacyPolicy;
