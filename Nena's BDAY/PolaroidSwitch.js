console.log("JS is loaded!");

const stack = document.getElementById("stack");

stack.addEventListener("click", (e) => {
  const clicked = e.target.closest(".polaroid");
  if (!clicked) return;

  const top = stack.lastElementChild; // top card
  if (clicked !== top) return; // only respond if top was clicked

  // get its base angle from CSS custom property
  const angle = getComputedStyle(top).getPropertyValue("--angle") || "0deg";

  // Step 1: animate slide to the right
  top.style.transition = "transform 0.5s ease";
  top.style.transform = `translate(-50%, -50%) translateX(400px) rotate(${angle})`;

  // Step 2: after animation, move to the bottom of the stack
  setTimeout(() => {
    top.style.transition = "none";

    // move the element to the beginning of the stack (bottom layer)
    stack.insertBefore(top, stack.firstChild);

    // reset its transform so it only has the rotation again
    top.style.transform = `translate(-50%, -50%) rotate(${angle})`;

    // force reflow
    void top.offsetWidth;

    // re-enable transition for next time
    top.style.transition = "transform 0.5s ease";
  }, 500); // match CSS transition duration
});
