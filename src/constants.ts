const ActionInfo = {
  Version: '1.10.0',
  Name: 'actions-label-commenter',
  Owner: 'peaceiris'
} as const;

type ActionInfo = typeof ActionInfo[keyof typeof ActionInfo];

export {ActionInfo};
