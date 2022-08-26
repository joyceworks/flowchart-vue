function isMouseDownOnAnyChildElement(parentSelector, event) {
    const parentElement = document.querySelector(parentSelector);
    const childrenNodes = Array.from(parentElement.childNodes);
    return childrenNodes.some((node) => node.contains(event.target));
}

export {
    isMouseDownOnAnyChildElement
};
