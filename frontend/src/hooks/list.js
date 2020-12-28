import { useRef, useState } from "react";

const useList = (initialList = []) => {
  const id = useRef(0);
  const [elements, setElements] = useState(
    Object.fromEntries(initialList.map((element) => [id.current++, element]))
  );
  const addElement = (element) => setElements({ ...elements, [id.current++]: element });
  const removeElement = (elementId) => {
    const newElements = { ...elements };
    delete newElements[elementId];
    setElements(newElements);
  };

  const alterElement = (elementId, value) => {
    const newElements = { ...elements };
    newElements[elementId] = value;
    setElements(newElements);
  };

  return [elements, addElement, removeElement, alterElement];
};

export { useList };
