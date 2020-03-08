[![license](https://img.shields.io/github/license/peaceiris/actions-label-commenter.svg)](https://github.com/peaceiris/actions-label-commenter/blob/master/LICENSE)
[![release](https://img.shields.io/github/release/peaceiris/actions-label-commenter.svg)](https://github.com/peaceiris/actions-label-commenter/releases/latest)
[![GitHub release date](https://img.shields.io/github/release-date/peaceiris/actions-label-commenter.svg)](https://github.com/peaceiris/actions-label-commenter/releases)
[![Release Feed](https://img.shields.io/badge/release-feed-yellow)](https://github.com/peaceiris/actions-label-commenter/releases.atom)
[![Dependabot Status](https://api.dependabot.com/badges/status?host=github&repo=peaceiris/actions-label-commenter)](https://dependabot.com)

<img width="600" alt="Label Commenter GitHub Action" src="./images/ogp.jpg">



## Label Commenter Action

Label triggered GitHub Actions for commenting on issues or pull requests, then close or reopen those.

This Action was submitted to the [GitHub Actions Hackathon](https://github.blog/2020-02-27-were-challenging-you-to-create-your-very-own-github-actions/).



## Getting Started

Create your GitHub Actions workflow file and Label Commenter Action setting file. Commit those and push to the remote master branch.

### Workflow Setting

```yaml
# .github/workflows/commenter.yml

name: Label Commenter

on:
  issues:
    types:
      - labeled
      - unlabeled
  pull_request:
    types:
      - labeled
      - unlabeled

jobs:
  comment:
    runs-on: ubuntu-18.04
    steps:
      - uses: actions/checkout@v2
        with:
          ref: master

      - name: Commenter
        uses: peaceiris/actions-label-commenter@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          # config_file: .github/label-commenter-config.yml
```

### Action Setting

```yaml
# .github/commenter.yml

labels:
  - name: invalid
    labeled:
      issue:
        body: Please follow the issue templates.
        action: close
      pr:
        body: Please follow the pull request templates.
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
          https://github.community/t5/GitHub-Actions/bd-p/actions
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
        body: This issue or pull request already exists.
        action: close
  - name: good first issue
    labeled:
      issue:
        body: This issue is easy for contributing. Everyone can work on this.
```



## Examples

### Comment and Close Invalid Format Issue or Pull Request

![](images/demo_1.jpg)

### Reopen Issue or Pull Request

![](images/demo_2.jpg)

### Comment and Close Wontfix Issue or Pull Request

![](images/demo_3.jpg)

### Comment and Close Duplicate Issue or Pull Request

![](images/demo_4.jpg)

### Comment multiple line

![](images/demo_5.jpg)



## Changelog

- [CHANGELOG.md](./CHANGELOG.md)



## License

- [MIT License - peaceiris/actions-label-commenter](https://github.com/peaceiris/actions-label-commenter/blob/master/LICENSE)



## Maintainer

- [peaceiris homepage](https://peaceiris.com/)
