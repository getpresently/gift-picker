import { FC } from "react";

//This component is made to hold other different types of components such as
//questions and suggestions in order to implement page navigation
interface PropTypes {
  childComp?: React.ReactNode;
}

const ScrollablePage: FC<PropTypes> = ({ childComp }) => {
  return <div>{childComp}</div>;
};

export default ScrollablePage;
