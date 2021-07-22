interface Inputs {
  readonly GithubToken: string;
  readonly ConfigFilePath: string;
}

interface RunContext {
  readonly ConfigFilePath: string;
  readonly LabelName: string;
  readonly LabelEvent: string;
  readonly EventName: string;
  readonly EventType: string;
}

interface Comment {
  Main: string;
  Header: string;
  Footer: string;
  FooterLinks: string;
}

export {Inputs, RunContext, Comment};
