import React, { ReactElement, ReactNode } from 'react';

export type IconParagraphProps = {
  children: ReactNode;
  icon: string;
  iconName: string;
};
const IconParagraph = ({
  children,
  icon,
  iconName,
}: IconParagraphProps): ReactElement => {
  return (
    <p>
      <span className="icon" role="img" aria-label={iconName}>
        {icon}
      </span>
      {children}
    </p>
  );
};

export default IconParagraph;
