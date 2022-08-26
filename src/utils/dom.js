function ifElementContainChildNode(parentSelector, checkedNode) {
    const parentElement = document.querySelector(parentSelector);
    const childrenNodes = Array.from(parentElement.childNodes);
    return childrenNodes.some((node) => node.contains(checkedNode));
}

export {
    ifElementContainChildNode
};
