const branch = process.env.GITHUB_REF_NAME ?? "";

const config = {
  branches: [
    {
      name: "main",
    },
    {
      name: "beta",
      prerelease: true,
    },
    {
      name: "feat/*",
      // eslint-disable-next-line no-template-curly-in-string
      prerelease: '${name.replace(/^feat\\//g, "")}',
    },
  ],
};

if (branch === "main") {
  config.plugins = [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/github",
    [
      "@semantic-release/npm",
      {
        npmPublish: false,
      },
    ],
    "@semantic-release/git",
  ];
}

if (branch.startsWith("feat/")) {
  config.plugins = [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    [
      "@semantic-release/github",
      {
        labels: false,
        failTitle: false,
        failComment: false,
        successComment: false,
        releasedLabels: false,
      },
    ],
    [
      "@semantic-release/npm",
      {
        npmPublish: false,
      },
    ],
  ];
}

module.exports = config;
