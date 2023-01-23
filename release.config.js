const branch = process.env.GITHUB_REF_NAME ?? "";

const branches = ["feat", "refactor"];

const config = {
  branches: [
    {
      name: "main",
    },
    {
      name: "beta",
      prerelease: true,
    },
    ...branches.map((name) => ({
      name: `${name}/*`,
      // eslint-disable-next-line no-template-curly-in-string
      prerelease: `\${name.replace(/^${name}\\//g, "")}`,
    })),
  ],
};

const exec = [
  "@semantic-release/exec",
  {
    verifyConditionsCmd: "echo ::set-output name=gitTag::${nextRelease.gitTag}",
  },
];

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
    exec,
  ];
}

if (branches.some((name) => branch.startsWith(`${name}/`))) {
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
    exec,
  ];
}

module.exports = config;
