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
  readonly Main: string;
  readonly Header: string;
  readonly Footer: string;
  readonly FooterLinks: string;
}

interface IIssue {
  readonly number: number;
  readonly locked: boolean;
}

export {Inputs, RunContext, Comment, IIssue};
