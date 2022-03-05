<h2 align="center">
Label Commenter Action
</h2>

<div align="center">
  <img src="https://user-images.githubusercontent.com/30958501/125202658-75e49180-e2af-11eb-8825-153e34fb235f.jpg" alt="Label Commenter Action thumbnail" width="500px">

[![license](https://img.shields.io/github/license/peaceiris/actions-label-commenter.svg)](https://github.com/peaceiris/actions-label-commenter/blob/main/LICENSE)
[![release](https://img.shields.io/github/release/peaceiris/actions-label-commenter.svg)](https://github.com/peaceiris/actions-label-commenter/releases/latest)
[![GitHub release date](https://img.shields.io/github/release-date/peaceiris/actions-label-commenter.svg)](https://github.com/peaceiris/actions-label-commenter/releases)
[![Release Feed](https://img.shields.io/badge/release-feed-yellow)](https://github.com/peaceiris/actions-label-commenter/releases.atom)

[![Code Scanning](https://github.com/peaceiris/actions-label-commenter/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/peaceiris/actions-label-commenter/actions/workflows/codeql-analysis.yml)
[![CodeFactor](https://www.codefactor.io/repository/github/peaceiris/actions-label-commenter/badge)](https://www.codefactor.io/repository/github/peaceiris/actions-label-commenter)
[![codecov](https://codecov.io/gh/peaceiris/actions-label-commenter/branch/main/graph/badge.svg?token=WKTNMOY3SM)](https://codecov.io/gh/peaceiris/actions-label-commenter)

</div>

This action is one of label triggered GitHub Actions for posting a template comment, and automatically open/close/lock/unlock issues, pull-requests and discussions.

This Action was submitted to the [GitHub Actions Hackathon] and featured by GitHub. ([Featured actions from the GitHub Actions Hackathon - The GitHub Blog])

[GitHub Actions Hackathon]: https://github.blog/2020-02-27-were-challenging-you-to-create-your-very-own-github-actions/
[Featured actions from the GitHub Actions Hackathon - The GitHub Blog]: https://github.blog/2020-04-09-featured-actions-from-the-github-actions-hackathon/



## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Getting Started](#getting-started)
  - [Workflow Setting](#workflow-setting)
  - [Action Setting](#action-setting)
- [Action Configuration](#action-configuration)
  - [Issues](#issues)
  - [Pull-requests](#pull-requests)
  - [Discussions](#discussions)
  - [Comment Placeholders](#comment-placeholders)
- [Action Inputs](#action-inputs)
  - [Set a Path to Action Setting File](#set-a-path-to-action-setting-file)
  - [Set a Personal Access Token](#set-a-personal-access-token)
  - [Enable Debug Mode](#enable-debug-mode)
- [Work with Issue Template](#work-with-issue-template)
- [Work with Other Auto Label Actions](#work-with-other-auto-label-actions)
- [Examples](#examples)
  - [Comment and Close Invalid Format Issue or Pull Request](#comment-and-close-invalid-format-issue-or-pull-request)
  - [Reopen Issue or Pull Request](#reopen-issue-or-pull-request)
  - [Comment and Close Wontfix Issue or Pull Request](#comment-and-close-wontfix-issue-or-pull-request)
  - [Comment and Close Duplicate Issue or Pull Request](#comment-and-close-duplicate-issue-or-pull-request)
  - [Comment Multiple Line](#comment-multiple-line)
  - [Comment and Close Multiple Issues or Pull Requests](#comment-and-close-multiple-issues-or-pull-requests)
  - [Lock or Unlock issue or Pull Request](#lock-or-unlock-issue-or-pull-request)
- [Changelog](#changelog)
- [License](#license)
- [Maintainer](#maintainer)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->



## Getting Started

Create your GitHub Actions workflow file and Label Commenter Action setting file. Commit those and push to the remote default branch.

### Workflow Setting

Create your workflow file `.github/workflows/label-commenter.yml` as follows.

```yaml
name: Label Commenter

on:
  issues:
    types: [labeled, unlabeled]
  pull_request_target:
    types: [labeled, unlabeled]
  discussion:
    types: [labeled, unlabeled]

permissions:
  contents: read
  issues: write
  pull-requests: write
  discussions: write

jobs:
  comment:
    runs-on: ubuntu-20.04
    timeout-minutes: 1
    steps:
      - uses: peaceiris/actions-label-commenter@v2
```

### Action Setting

Create your action configuration file `.github/label-commenter-config.yml` as follows.

```yaml
labels:
  - name: locked (spam)
    labeled:
      issue:
        body: &locked_spam_body |
          This {{ eventName }} \#{{ number }} has been **LOCKED** with the label {{ labelName }}!

          Please do not spam messages on this project. You may get blocked from this repository for doing so.
        action: close
        locking: lock
        lock_reason: spam
      pr:
        body: *locked_spam_body
        action: close
        locking: lock
        lock_reason: spam
        draft: true
      discussion:
        body: *locked_spam_body
        locking: lock
        lock_reason: spam
        answer: true
```

<div align="right">
<a href="#table-of-contents">Back to TOC ☝️</a>
</div>



## Action Configuration

### Issues

### Pull-requests

### Discussions

### Comment Placeholders

<div align="right">
<a href="#table-of-contents">Back to TOC ☝️</a>
</div>



## Action Inputs

### Set a Path to Action Setting File

Default is `.github/label-commenter-config.yml`

```yaml
- uses: peaceiris/actions-label-commenter@v2
  with:
    config_file: ./path_to/your_config.yml
```

### Set a Personal Access Token

Default is `${{ github.token }}`

```yaml
- uses: peaceiris/actions-label-commenter@v2
  with:
    github_token: ${{ secrets.GH_PAT }}
```

### Enable Debug Mode

```yaml
- uses: peaceiris/actions-label-commenter@v2
  env:
    RUNNER_DEBUG: 1
```

<div align="right">
<a href="#table-of-contents">Back to TOC ☝️</a>
</div>



## Work with Issue Template

Here is a proposal issue template: [.github/ISSUE_TEMPLATE/3_proposal.yml](https://github.com/peaceiris/actions-label-commenter/blob/main/.github/ISSUE_TEMPLATE/3_proposal.yml)

```yaml
name: Proposal
description: Suggest an idea for this project
title: ''
labels: proposal
assignees: peaceiris
body:
  ...
```

Scenario:

1. When a user opens an issue with the proposal template, the proposal label will be added automatically.
1. This action can detect that `labeled` event and create a template comment of proposal.

<div align="right">
<a href="#table-of-contents">Back to TOC ☝️</a>
</div>



## Work with Other Auto Label Actions

> [Authenticating with the GITHUB_TOKEN - GitHub Docs](https://docs.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token#using-the-github_token-in-a-workflow)
>
> When you use the repository's `GITHUB_TOKEN` to perform tasks on behalf of the GitHub Actions app, events triggered by the `GITHUB_TOKEN` will not create a new workflow run. This prevents you from accidentally creating recursive workflow runs. For example, if a workflow run pushes code using the repository's `GITHUB_TOKEN`, a new workflow will not run even when the repository contains a workflow configured to run when push events occur.

You need to provide a personal access token (with `public_repo` for a public repository, `repo` for a private repository) to an auto label GitHub Actions or GitHub Bot like [actions/labeler](https://github.com/actions/labeler).

```yaml
# .github/workflows/labeler.yml
name: "Pull Request Labeler"

on:
  - pull_request_target

permissions:
  contents: read
  pull-requests: write

jobs:
  triage:
    runs-on: ubuntu-20.04
    steps:
      - uses: actions/labeler@v3
        with:
          repo-token: "${{ secrets.GH_PAT }}"
```

Scenario:

1. Someone updates the README.md and opens a pull-request.
1. actions/labeler adds the documentation label automatically.
1. peaceiris/actions-label-commenter creates the template comment automatically.

<div align="right">
<a href="#table-of-contents">Back to TOC ☝️</a>
</div>



## Examples

### Comment and Close Invalid Format Issue or Pull Request

[Source](https://github.com/peaceiris/actions-label-commenter/blob/v1.10.0/.github/label-commenter-config.yml#L11-L18)

![Comment and Close Invalid Format Issue or Pull Request - peaceiris/actions-label-commenter GitHub Action](https://user-images.githubusercontent.com/30958501/125202643-711fdd80-e2af-11eb-9277-3f58be5fb0b7.jpg)

### Reopen Issue or Pull Request

[Source](https://github.com/peaceiris/actions-label-commenter/blob/v1.10.0/.github/label-commenter-config.yml#L19-L25)

![Reopen Issue or Pull Request - peaceiris/actions-label-commenter GitHub Action](https://user-images.githubusercontent.com/30958501/125202646-73823780-e2af-11eb-9487-e7ab68d7e2dd.jpg)

### Comment and Close Wontfix Issue or Pull Request

[Source](https://github.com/peaceiris/actions-label-commenter/blob/v1.10.0/.github/label-commenter-config.yml#L33-L41)

![Comment and Close Wontfix Issue or Pull Request - peaceiris/actions-label-commenter GitHub Action](https://user-images.githubusercontent.com/30958501/125202647-73823780-e2af-11eb-96ba-3977c08ea8a7.jpg)

### Comment and Close Duplicate Issue or Pull Request

[Source](https://github.com/peaceiris/actions-label-commenter/blob/v1.10.0/.github/label-commenter-config.yml#L42-L46)

![Comment and Close Duplicate Issue or Pull Request - peaceiris/actions-label-commenter GitHub Action](https://user-images.githubusercontent.com/30958501/125202649-741ace00-e2af-11eb-9176-a35af80491b1.jpg)

### Comment Multiple Line

[Source](https://github.com/peaceiris/actions-label-commenter/blob/v1.10.0/.github/label-commenter-config.yml#L26-L32)

![Comment Multiple Line - peaceiris/actions-label-commenter GitHub Action](https://user-images.githubusercontent.com/30958501/125202650-74b36480-e2af-11eb-9e21-e9014087eed2.jpg)

### Comment and Close Multiple Issues or Pull Requests

| Select Label | Labeled |
|---|---|
| ![Comment and Close Multiple Issues or Pull Requests - peaceiris/actions-label-commenter GitHub Action](https://user-images.githubusercontent.com/30958501/125202653-74b36480-e2af-11eb-9395-422657cce37a.jpg) | ![Comment and Close Multiple Issues or Pull Requests - peaceiris/actions-label-commenter GitHub Action](https://user-images.githubusercontent.com/30958501/125202654-754bfb00-e2af-11eb-9d70-61dcc7096dd5.jpg) |

Multiple issues will be closed.

![Comment and Close Multiple Issues or Pull Requests - peaceiris/actions-label-commenter GitHub Action](https://user-images.githubusercontent.com/30958501/125202656-754bfb00-e2af-11eb-98e8-526e7a235fe0.jpg)

### Lock or Unlock issue or Pull Request

[Source](https://github.com/peaceiris/actions-label-commenter/blob/v1.10.0/.github/label-commenter-config.yml#L73-L97)

![Lock or Unlock issue or Pull Request - peaceiris/actions-label-commenter GitHub Action](https://user-images.githubusercontent.com/30958501/125202657-75e49180-e2af-11eb-8358-64aa65459a8d.jpg)

<div align="right">
<a href="#table-of-contents">Back to TOC ☝️</a>
</div>



## Changelog

- [CHANGELOG.md](./CHANGELOG.md)



## License

- [MIT License - peaceiris/actions-label-commenter](https://github.com/peaceiris/actions-label-commenter/blob/main/LICENSE)



## Maintainer

- [peaceiris homepage](https://peaceiris.com/)

<div align="right">
<a href="#table-of-contents">Back to TOC ☝️</a>
</div>
