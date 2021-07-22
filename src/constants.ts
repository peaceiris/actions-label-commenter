const ActionInfo = {
  Version: '1.9.2',
  Name: 'actions-label-commenter',
  Owner: 'peaceiris'
} as const;

type ActionInfo = typeof ActionInfo[keyof typeof ActionInfo];

export {ActionInfo};
