<h2 align="center">
Label Commenter Action
</h2>

<div align="center">
  <img src="https://raw.githubusercontent.com/peaceiris/actions-label-commenter/main/images/ogp.jpg" alt="Label Commenter Action thumbnail" width="500px">
</div>

[![license](https://img.shields.io/github/license/peaceiris/actions-label-commenter.svg)](https://github.com/peaceiris/actions-label-commenter/blob/main/LICENSE)
[![release](https://img.shields.io/github/release/peaceiris/actions-label-commenter.svg)](https://github.com/peaceiris/actions-label-commenter/releases/latest)
[![GitHub release date](https://img.shields.io/github/release-date/peaceiris/actions-label-commenter.svg)](https://github.com/peaceiris/actions-label-commenter/releases)
[![Release Feed](https://img.shields.io/badge/release-feed-yellow)](https://github.com/peaceiris/actions-label-commenter/releases.atom)

This action is one of label triggered GitHub Actions for posting a template message. After commenting, it can automatically close or reopen issues. Of course, it also can manage pull requests.

This Action was submitted to the [GitHub Actions Hackathon] and featured by GitHub. ([Featured actions from the GitHub Actions Hackathon - The GitHub Blog])

[GitHub Actions Hackathon]: https://github.blog/2020-02-27-were-challenging-you-to-create-your-very-own-github-actions/
[Featured actions from the GitHub Actions Hackathon - The GitHub Blog]: https://github.blog/2020-04-09-featured-actions-from-the-github-actions-hackathon/



## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->


- [Getting Started](#getting-started)
  - [Workflow Setting](#workflow-setting)
  - [Action Setting](#action-setting)
- [Work with Other Auto Label Actions](#work-with-other-auto-label-actions)
- [Examples](#examples)
  - [Comment and Close Invalid Format Issue or Pull Request](#comment-and-close-invalid-format-issue-or-pull-request)
  - [Reopen Issue or Pull Request](#reopen-issue-or-pull-request)
  - [Comment and Close Wontfix Issue or Pull Request](#comment-and-close-wontfix-issue-or-pull-request)
  - [Comment and Close Duplicate Issue or Pull Request](#comment-and-close-duplicate-issue-or-pull-request)
  - [Comment Multiple Line](#comment-multiple-line)
  - [Comment and Close Multiple Issues or Pull Requests](#comment-and-close-multiple-issues-or-pull-requests)
- [Changelog](#changelog)
- [License](#license)
- [Maintainer](#maintainer)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

> Table of Contents are generated with [DocToc](https://github.com/thlorenz/doctoc)



## Getting Started

Create your GitHub Actions workflow file and Label Commenter Action setting file. Commit those and push to the remote default branch.

### Workflow Setting

```yaml
# .github/workflows/label-commenter.yml

name: Label Commenter

on:
  issues:
    types:
      - labeled
      - unlabeled
  pull_request_target:
    types:
      - labeled
      - unlabeled

jobs:
  comment:
    runs-on: ubuntu-18.04
    steps:
      - uses: actions/checkout@v2
        with:
          ref: main

      - name: Label Commenter
        uses: peaceiris/actions-label-commenter@v1
        # with:
          # config_file: .github/label-commenter-config.yml
```

### Action Setting

```yaml
# .github/label-commenter-config.yml

labels:
  - name: invalid
    labeled:
      issue:
        body: Please follow the issue templates.
        action: close
      pr:
        body: Thank you @{{ pull_request.user.login }} for suggesting this. Please follow the pull request templates.
        action: close
    unlabeled:
      issue:
        body: Thank you for following the template. The repository owner will reply.
        action: open
  - name: forum
    labeled:
      issue:
        body: |
          Please ask questions about GitHub Actions at the following forum.
          https://github.community/c/github-actions
        action: close
  - name: wontfix
    labeled:
      issue:
        body: This will not be worked on but we appreciate your contribution.
        action: close
    unlabeled:
      issue:
        body: This has become active again.
        action: open
  - name: duplicate
    labeled:
      issue:
        body: This issue already exists.
        action: close
  - name: good first issue
    labeled:
      issue:
        body: This issue is easy for contributing. Everyone can work on this.
  - name: proposal
    labeled:
      issue:
        body: Thank you @{{ issue.user.login }} for suggesting this.
```

<div align="right">
<a href="#table-of-contents">Back to TOC ☝️</a>
</div>



## Work with Other Auto Label Actions

> [Authenticating with the GITHUB_TOKEN - GitHub Docs](https://docs.github.com/en/actions/configuring-and-managing-workflows/authenticating-with-the-github_token#using-the-github_token-in-a-workflow)
>
> When you use the repository's `GITHUB_TOKEN` to perform tasks on behalf of the GitHub Actions app, events triggered by the `GITHUB_TOKEN` will not create a new workflow run. This prevents you from accidentally creating recursive workflow runs. For example, if a workflow run pushes code using the repository's `GITHUB_TOKEN`, a new workflow will not run even when the repository contains a workflow configured to run when push events occur.

You need to provide a personal access token to an auto label GitHub Actions or GitHub Bot like `actions/labeler`.

```yaml
- name: Label Commenter
  uses: peaceiris/actions-label-commenter@v1
  with:
    github_token: ${{ secrets.GH_PAT }}
```

<div align="right">
<a href="#table-of-contents">Back to TOC ☝️</a>
</div>



## Examples

### Comment and Close Invalid Format Issue or Pull Request

![](images/demo_1.jpg)

### Reopen Issue or Pull Request

![](images/demo_2.jpg)

### Comment and Close Wontfix Issue or Pull Request

![](images/demo_3.jpg)

### Comment and Close Duplicate Issue or Pull Request

![](images/demo_4.jpg)

### Comment Multiple Line

![](images/demo_5.jpg)

### Comment and Close Multiple Issues or Pull Requests

| Select Label | Labeled |
|---|---|
| ![](images/demo_6_1.jpg) | ![](images/demo_6_2.jpg) |

Multiple issues will be closed.

![](images/demo_6_3.jpg)

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
