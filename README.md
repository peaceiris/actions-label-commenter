## Label Commenter Action

Label triggered GitHub Actions for commenting on issues or pull requests, then close or reopen those.



## Getting Started

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
      - uses: peaceiris/actions-label-commenter@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          config_file: .github/commenter.yml
```

### Action Setting

```yaml
# .github/commenter.yml

labeled:
  - name: Invalid
    body: Please follow the issue (pull request) templates.
    action: close
  - name: Forum
    body: |
      Please ask questions about GitHub Actions at the following forum.
      https://github.community/t5/GitHub-Actions/bd-p/actions
    action: close
```



## Changelog

- [CHANGELOG.md](./CHANGELOG.md)



## License

- [MIT License - peaceiris/actions-label-commenter](https://github.com/peaceiris/actions-label-commenter/blob/master/LICENSE)



## Maintainer

- [peaceiris homepage](https://peaceiris.com/)
